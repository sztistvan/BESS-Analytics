/**
 * Main Application Logic
 * Coordinates data loading, merging, and UI updates.
 */
const App = {
    solarData: [],
    gridData: [],
    mergedData: [],
    currentPreset: 'custom',
    customStartDate: null,
    customEndDate: null,
    // Locked simulation time range (set when Apply Range is clicked)
    simulationStartDate: null,
    simulationEndDate: null,
    // Store current simulation results for energy flow chart
    currentSimulationResults: null,
    // Track if energy flow toggle listeners are attached
    energyFlowListenersAttached: false,
    // Track if overview toggle listeners are attached
    overviewListenersAttached: false,
    // Store optimization results for CSV export
    optimizationResults: null,
    optimizationMetricType: 'import', // 'import' | 'export'
    // Time aggregation state for each chart
    currentAggregationOverview: '15min',  // Options: '15min', 'daily', 'monthly'
    currentAggregationFlow: '15min',      // Options: '15min', 'daily', 'monthly'
    currentViewModeOverview: 'energy',    // Track for smart aggregation: 'power' | 'energy'
    currentViewModeFlow: 'energy',        // Track for smart aggregation: 'power' | 'energy'

    /**
     * Format number with space as thousand separator
     * @param {number} value - Number to format
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted number string
     */
    formatNumber(value, decimals = 0) {
        const fixed = value.toFixed(decimals);
        const parts = fixed.split('.');
        // Add space as thousand separator
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        return parts.join('.');
    },

    /**
     * Get aggregated data based on aggregation level and view mode
     * @param {Array} data - Source data to aggregate
     * @param {string} aggregationLevel - '15min', 'daily', or 'monthly'
     * @param {string} viewMode - 'power' or 'energy'
     * @returns {Array} Aggregated data or original data if no aggregation
     */
    getAggregatedData(data, aggregationLevel, viewMode) {
        if (!data || data.length === 0 || aggregationLevel === '15min') {
            return data; // No aggregation needed
        }

        // Aggregation only works in energy mode
        if (viewMode === 'power') {
            console.warn('Aggregation not supported in power mode, returning original data');
            return data;
        }

        // For aggregation in energy mode, convert solar kW to kWh first (multiply by 0.25 for 15-min intervals)
        const dataWithEnergy = data.map(d => ({
            ...d,
            productionKwh: d.productionKw * 0.25  // Convert 15-min kW reading to kWh
        }));

        // For energy mode: sum all energy fields, average battery SOC
        const fields = {
            sum: ['importKwh', 'exportKwh', 'productionKwh', 'gridImportWithBattery', 'gridExportWithBattery'],
            average: ['batterySocPercent', 'batterySocKwh']
        };

        // Apply aggregation
        let aggregated;
        if (aggregationLevel === 'daily') {
            aggregated = DataMerger.aggregateDataToDaily(dataWithEnergy, fields);
        } else if (aggregationLevel === 'monthly') {
            aggregated = DataMerger.aggregateDataToMonthly(dataWithEnergy, fields);
        } else {
            return data;
        }

        // For aggregated data, productionKw field should contain the summed kWh
        aggregated = aggregated.map(d => ({
            ...d,
            productionKw: d.productionKwh || 0  // Use summed kWh value in productionKw field
        }));

        return aggregated;
    },

    /**
     * Initializes the application by attaching event listeners.
     */
    init() {
        console.log("App initializing...");
        
        // Listen for Solar file selection
        const solarInput = document.getElementById('solarInput');
        if (solarInput) {
            solarInput.addEventListener('change', (e) => this.loadFile(e.target.files[0], 'solar'));
        }

        // Listen for Grid file selection
        const gridInput = document.getElementById('gridInput');
        if (gridInput) {
            gridInput.addEventListener('change', (e) => this.loadFile(e.target.files[0], 'grid'));
        }

        // Listen for the Apply Range button click
        const updateBtn = document.getElementById('runSimulation');
        if (updateBtn) {
            updateBtn.addEventListener('click', () => {
                console.log("Apply Range button clicked");
                // Lock the simulation time range
                this.lockSimulationRange();
                this.filterAndRender();
            });
        }

        // Listen for preset button clicks
        const presetBtns = document.querySelectorAll('.preset-btn');
        presetBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.target.getAttribute('data-preset');
                this.selectPreset(preset);
            });
        });

        // Listen for navigation buttons
        const btnPrev = document.getElementById('btnPrevRange');
        const btnNext = document.getElementById('btnNextRange');
        if (btnPrev) btnPrev.addEventListener('click', () => this.navigateRange(-1));
        if (btnNext) btnNext.addEventListener('click', () => this.navigateRange(1));

        // Listen for Current button
        const btnCurrent = document.getElementById('btnCurrent');
        if (btnCurrent) btnCurrent.addEventListener('click', () => this.goToCurrent());

        // Listen for manual date changes (to switch to Custom preset)
        const startInput = document.getElementById('startDate');
        const endInput = document.getElementById('endDate');
        if (startInput) {
            startInput.addEventListener('change', () => {
                this.selectPreset('custom');
            });
        }
        if (endInput) {
            endInput.addEventListener('change', () => {
                this.selectPreset('custom');
            });
        }

        // Listen for Battery Simulation button
        const btnRunBatterySimulation = document.getElementById('btnRunBatterySimulation');
        if (btnRunBatterySimulation) {
            btnRunBatterySimulation.addEventListener('click', () => this.runBatterySimulation());
        }

        // Listen for Optimization Curve button
        const btnRunOptimizationCurve = document.getElementById('btnRunOptimizationCurve');
        if (btnRunOptimizationCurve) {
            btnRunOptimizationCurve.addEventListener('click', () => this.runOptimizationCurve());
        }

        // Listen for Optimization Curve metric toggle buttons
        const btnOptimCurveImport = document.getElementById('btnOptimCurveImport');
        const btnOptimCurveExport = document.getElementById('btnOptimCurveExport');
        if (btnOptimCurveImport) {
            btnOptimCurveImport.addEventListener('click', () => this.toggleOptimizationMetric('import'));
        }
        if (btnOptimCurveExport) {
            btnOptimCurveExport.addEventListener('click', () => this.toggleOptimizationMetric('export'));
        }

        // Listen for CSV Export button
        const btnExportOptimizationCSV = document.getElementById('btnExportOptimizationCSV');
        if (btnExportOptimizationCSV) {
            btnExportOptimizationCSV.addEventListener('click', () => this.exportOptimizationCSV());
        }

        // Listen for Load Demo button
        const btnLoadDemo = document.getElementById('loadDemoBtn');
        if (btnLoadDemo) {
            btnLoadDemo.addEventListener('click', () => this.loadDemoScenarios());
        }

        // Listen for Energy Data Overview - Time Aggregation Controls
        const aggOverview15min = document.getElementById('agg-overview-15min');
        const aggOverviewDaily = document.getElementById('agg-overview-daily');
        const aggOverviewMonthly = document.getElementById('agg-overview-monthly');
        if (aggOverview15min) {
            aggOverview15min.addEventListener('click', () => this.setOverviewAggregation('15min'));
        }
        if (aggOverviewDaily) {
            aggOverviewDaily.addEventListener('click', () => this.setOverviewAggregation('daily'));
        }
        if (aggOverviewMonthly) {
            aggOverviewMonthly.addEventListener('click', () => this.setOverviewAggregation('monthly'));
        }

        // Listen for Energy Flow - Time Aggregation Controls
        const aggFlow15min = document.getElementById('agg-flow-15min');
        const aggFlowDaily = document.getElementById('agg-flow-daily');
        const aggFlowMonthly = document.getElementById('agg-flow-monthly');
        if (aggFlow15min) {
            aggFlow15min.addEventListener('click', () => this.setFlowAggregation('15min'));
        }
        if (aggFlowDaily) {
            aggFlowDaily.addEventListener('click', () => this.setFlowAggregation('daily'));
        }
        if (aggFlowMonthly) {
            aggFlowMonthly.addEventListener('click', () => this.setFlowAggregation('monthly'));
        }

        // Listen for Yearly Analysis events
        const btnCalculateYearlyAnalysis = document.getElementById('btnCalculateYearlyAnalysis');
        if (btnCalculateYearlyAnalysis) {
            console.log('Yearly Analysis button found, attaching event listener');
            btnCalculateYearlyAnalysis.addEventListener('click', () => {
                console.log('Yearly Analysis button clicked');
                const year = parseInt(document.getElementById('yearSelect').value);
                const capacity = parseFloat(document.getElementById('yearlyBatteryCapacity').value);
                
                console.log('Year:', year, 'Capacity:', capacity);
                
                if (!year || isNaN(capacity) || capacity <= 0) {
                    alert('Please select a valid year and enter a positive battery capacity.');
                    return;
                }
                
                YearlyAnalysis.runYearlyAnalysis(year, capacity, this.mergedData);
            });
        } else {
            console.error('Yearly Analysis button NOT found!');
        }

        const btnToggleFinancials = document.getElementById('btnToggleFinancials');
        if (btnToggleFinancials) {
            btnToggleFinancials.addEventListener('click', () => YearlyAnalysis.toggleFinancials());
        }

        const btnCopyMonthlyData = document.getElementById('btnCopyMonthlyData');
        if (btnCopyMonthlyData) {
            btnCopyMonthlyData.addEventListener('click', () => YearlyAnalysis.exportToClipboard());
        }

        const btnDownloadMonthlyCSV = document.getElementById('btnDownloadMonthlyCSV');
        if (btnDownloadMonthlyCSV) {
            btnDownloadMonthlyCSV.addEventListener('click', () => YearlyAnalysis.exportToCSV());
        }
    },

    /**
     * Handles preset selection and updates UI
     */
    selectPreset(preset) {
        this.currentPreset = preset;
        
        // Update button states
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-preset') === preset) {
                btn.classList.add('active');
            }
        });

        // Show/hide custom date inputs
        const customInputs = document.getElementById('customDateInputs');
        if (preset === 'custom') {
            customInputs.style.display = 'grid';
        } else {
            customInputs.style.display = 'none';
            this.applyPreset(preset);
        }
    },

    /**
     * Apply preset date range
     */
    applyPreset(preset) {
        if (!this.mergedData || this.mergedData.length === 0) return;

        const lastEntry = this.mergedData[this.mergedData.length - 1].timestamp;
        const firstEntry = this.mergedData[0].timestamp;
        let startDate, endDate;

        switch(preset) {
            case 'week':
                // Current week: Monday 00:00 to Sunday 23:59:59
                let refDate = new Date(lastEntry);
                const dayOfWeek = refDate.getDay();
                const daysToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
                startDate = new Date(refDate);
                startDate.setDate(startDate.getDate() - daysToMonday);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'month':
                // Current month: 1st to last day
                let refMonth = new Date(lastEntry);
                startDate = new Date(refMonth.getFullYear(), refMonth.getMonth(), 1, 0, 0, 0, 0);
                endDate = new Date(refMonth.getFullYear(), refMonth.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'year':
                // Current year: Jan 1 to Dec 31
                let refYear = new Date(lastEntry);
                startDate = new Date(refYear.getFullYear(), 0, 1, 0, 0, 0, 0);
                endDate = new Date(refYear.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
            case 'full':
                startDate = new Date(firstEntry);
                endDate = new Date(lastEntry);
                break;
            default:
                return;
        }

        // Only ensure start isn't before data begins
        if (startDate < firstEntry) {
            startDate = new Date(firstEntry);
        }
        
        // Don't clip end date - show full period boundaries even if data is partial

        // Update date inputs
        this.setDateInputs(startDate, endDate);
        this.filterAndRender();
    },

    /**
     * Navigate forward or backward by current preset interval
     */
    navigateRange(direction) {
        if (!this.mergedData || this.mergedData.length === 0) return;

        const startInput = document.getElementById('startDate').value;
        const endInput = document.getElementById('endDate').value;
        if (!startInput || !endInput) return;

        let startDate = new Date(startInput);
        let endDate = new Date(endInput);
        const firstEntry = this.mergedData[0].timestamp;
        const lastEntry = this.mergedData[this.mergedData.length - 1].timestamp;

        // Navigate based on current preset type
        switch(this.currentPreset) {
            case 'week':
                // Move by 7 days, maintain Mon-Sun boundaries
                startDate.setDate(startDate.getDate() + (direction * 7));
                endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'month':
                // Move by 1 month, maintain 1st-last day boundaries
                startDate.setMonth(startDate.getMonth() + direction);
                endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'year':
                // Move by 1 year, maintain Jan 1-Dec 31 boundaries
                startDate.setFullYear(startDate.getFullYear() + direction);
                endDate = new Date(startDate.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
            case 'custom':
            case 'full':
            default:
                // For custom, move by the current range duration
                const diffMs = endDate - startDate;
                startDate = new Date(startDate.getTime() + (direction * diffMs));
                endDate = new Date(endDate.getTime() + (direction * diffMs));
                break;
        }

        // Only prevent navigation before first data point
        if (startDate < firstEntry) {
            startDate = new Date(firstEntry);
            // Recalculate end based on preset
            switch(this.currentPreset) {
                case 'week':
                    endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + 6);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                case 'month':
                    endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
                    break;
                case 'year':
                    endDate = new Date(startDate.getFullYear(), 11, 31, 23, 59, 59, 999);
                    break;
            }
        }

        this.setDateInputs(startDate, endDate);
        // Keep current preset active - don't switch to custom
        this.filterAndRender();
    },

    /**
     * Jump to the most recent data (current)
     */
    goToCurrent() {
        if (!this.mergedData || this.mergedData.length === 0) return;

        const currentPreset = this.currentPreset;

        if (currentPreset === 'custom' || currentPreset === 'full') {
            // Go to full range
            this.selectPreset('full');
        } else {
            // Apply current preset from the end
            this.applyPreset(currentPreset);
        }
    },

    /**
     * Set aggregation level for Energy Data Overview chart
     * @param {string} level - '15min', 'daily', or 'monthly'
     */
    setOverviewAggregation(level) {
        // Only allow aggregation in energy mode
        if (this.currentViewModeOverview === 'power' && level !== '15min') {
            console.warn('Aggregation only available in energy mode');
            return;
        }

        // Update state
        this.currentAggregationOverview = level;

        // Update button active states
        document.querySelectorAll('#agg-overview-15min, #agg-overview-daily, #agg-overview-monthly')
            .forEach(btn => btn.classList.remove('active'));
        const targetBtn = document.getElementById(`agg-overview-${level}`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }

        // Re-render chart if data exists
        if (this.mergedData && this.mergedData.length > 0) {
            const filteredData = this.getFilteredData();
            Visualizer.renderChart(filteredData, level, this.currentViewModeOverview);
        }
    },

    /**
     * Set aggregation level for Energy Flow chart
     * @param {string} level - '15min', 'daily', or 'monthly'
     */
    setFlowAggregation(level) {
        // Only allow aggregation in energy mode
        if (this.currentViewModeFlow === 'power' && level !== '15min') {
            console.warn('Aggregation only available in energy mode');
            return;
        }

        // Update state
        this.currentAggregationFlow = level;

        // Update button active states
        document.querySelectorAll('#agg-flow-15min, #agg-flow-daily, #agg-flow-monthly')
            .forEach(btn => btn.classList.remove('active'));
        const targetBtn = document.getElementById(`agg-flow-${level}`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }

        // Re-render chart if simulation results exist
        if (this.currentSimulationResults) {
            const startTimestamp = new Date(this.simulationStartDate).getTime();
            const endTimestamp = new Date(this.simulationEndDate).getTime();

            const filteredData = this.mergedData.filter(row => {
                return row.timestampMs >= startTimestamp && row.timestampMs <= endTimestamp;
            });

            Visualizer.renderEnergyFlowChart(
                this.currentSimulationResults.simulatedData,
                this.simulationStartDate,
                this.simulationEndDate,
                filteredData,
                this.currentViewModeFlow,
                level
            );
        }
    },

    /**
     * Helper to set date input values
     */
    setDateInputs(startDate, endDate) {
        const formatForInput = (date) => {
            if (!date) return "";
            const tzOffset = date.getTimezoneOffset() * 60000; 
            return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
        };

        document.getElementById('startDate').value = formatForInput(startDate);
        document.getElementById('endDate').value = formatForInput(endDate);
    },

    /**
     * Loads demo data from the data folder
     */
    async loadDemoScenarios() {
        const btn = document.getElementById('loadDemoBtn');
        const originalText = btn.textContent;
        
        try {
            // Update button state
            btn.disabled = true;
            btn.textContent = 'Loading...';
            
            // Fetch both demo files in parallel
            const [solarResponse, gridResponse] = await Promise.all([
                fetch('data/solar_power_15min.csv'),
                fetch('data/grid_meter_energy_15_min.csv')
            ]);
            
            if (!solarResponse.ok || !gridResponse.ok) {
                throw new Error('Failed to fetch demo files');
            }
            
            const solarText = await solarResponse.text();
            const gridText = await gridResponse.text();
            
            // Process demo data
            this.loadDemoData(solarText, 'solar');
            this.loadDemoData(gridText, 'grid');
            
            document.getElementById('output').textContent = 
                'Last action: Loaded demo scenarios (Solar + Grid data)';
            
        } catch (error) {
            console.error('Failed to load demo data:', error);
            alert('Failed to load demo scenarios. Please make sure you are running this page on a local server.');
            document.getElementById('output').textContent = 
                'Error: Failed to load demo data. Use a local server (e.g., Live Server extension).';
        } finally {
            // Restore button state
            btn.disabled = false;
            btn.textContent = originalText;
        }
    },

    /**
     * Processes demo data directly from text content
     */
    loadDemoData(content, type) {
        // Validate CSV structure
        const validation = CSVHandler.validateStructure(content, type);
        if (!validation.valid) {
            alert(`Error loading demo ${type} data:\n${validation.error}`);
            document.getElementById('output').textContent = 
                `Error: ${validation.error}`;
            return;
        }
        
        // Process dataset
        const processed = CSVHandler.processDataset(content, type);
        
        if (type === 'solar') this.solarData = processed;
        if (type === 'grid') this.gridData = processed;

        // Trigger data processing and visualization
        this.handleDataProcessing();
    },

    /**
     * Reads the file content and triggers processing.
     */
    loadFile(file, type) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            
            // Validate CSV structure before processing
            const validation = CSVHandler.validateStructure(content, type);
            if (!validation.valid) {
                alert(`Error loading ${type} file:\n${validation.error}`);
                document.getElementById('output').textContent = 
                    `Error: ${validation.error}`;
                return;
            }
            
            // Using processDataset from CSVHandler
            const processed = CSVHandler.processDataset(content, type);
            
            if (type === 'solar') this.solarData = processed;
            if (type === 'grid') this.gridData = processed;

            document.getElementById('output').textContent = 
                `Last action: Loaded ${type} data (${processed.length} rows)`;

            this.handleDataProcessing();
        };
        reader.readAsText(file);
    },

    /**
     * Orchestrates the merging and subsequent UI steps.
     */
    handleDataProcessing() {
        // We proceed if at least one dataset is available
        if (this.solarData.length > 0 || this.gridData.length > 0) {
            this.mergedData = DataMerger.mergeDatasets(this.solarData, this.gridData);
            this.updateDateRangeUI();
            
            // Initial render with the full range detected
            this.filterAndRender();
            console.log("Data merged and visualized.");
            
            // Populate year dropdown for yearly analysis
            console.log("Calling YearlyAnalysis.populateYearDropdown...");
            YearlyAnalysis.populateYearDropdown(this.mergedData);
        }
    },

    /**
     * Locks the current date range for simulation
     * This range will be used for battery simulation and won't change with chart zoom/pan
     */
    lockSimulationRange() {
        const startInput = document.getElementById('startDate').value;
        const endInput = document.getElementById('endDate').value;
        
        if (startInput && endInput) {
            this.simulationStartDate = startInput;
            this.simulationEndDate = endInput;
            console.log(`Simulation range locked: ${startInput} to ${endInput}`);
            
            // Update the display in Battery Configuration section
            this.updateSimulationRangeDisplay();
        }
    },

    /**
     * Updates the simulation time range display
     */
    updateSimulationRangeDisplay() {
        const displayEl = document.getElementById('simPeriodDisplay');
        const containerEl = document.getElementById('simulationTimeRange');
        
        if (this.simulationStartDate && this.simulationEndDate) {
            const start = new Date(this.simulationStartDate);
            const end = new Date(this.simulationEndDate);
            
            const formatDate = (date) => {
                return date.toLocaleString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            };
            
            displayEl.textContent = `${formatDate(start)} → ${formatDate(end)}`;
            containerEl.style.display = 'block';
        } else {
            displayEl.textContent = 'Not set';
            containerEl.style.display = 'none';
        }
    },

    /**
     * Filters mergedData based on UI date inputs and updates the chart.
     */
    filterAndRender() {
        if (!this.mergedData || this.mergedData.length === 0) {
            console.warn("No data available to filter.");
            return;
        }

        const startInput = document.getElementById('startDate').value;
        const endInput = document.getElementById('endDate').value;

        if (!startInput || !endInput) {
            Visualizer.renderChart(this.mergedData, this.currentAggregationOverview, this.currentViewModeOverview);
            this.updateDataStatus(this.mergedData.length);
            // Setup overview toggle listeners (only once)
            if (!this.overviewListenersAttached) {
                this.setupOverviewToggleListeners();
                this.overviewListenersAttached = true;
            }
            return;
        }

        const startTimestamp = new Date(startInput).getTime();
        const endTimestamp = new Date(endInput).getTime();

        // Debugging logs to verify data integrity
        console.log("Selection Start (ms):", startTimestamp);
        console.log("First Data Point (ms):", this.mergedData[0].timestampMs);

        const filtered = this.mergedData.filter(row => {
            // Now row.timestampMs is guaranteed by the fixed data_merger.js
            return row.timestampMs >= startTimestamp && row.timestampMs <= endTimestamp;
        });

        console.log(`Filtered results: ${filtered.length} points.`);

        if (filtered.length > 0) {
            Visualizer.renderChart(filtered, this.currentAggregationOverview, this.currentViewModeOverview);
            this.updateDataStatus(filtered.length, startInput, endInput);
            // Setup overview toggle listeners (only once)
            if (!this.overviewListenersAttached) {
                this.setupOverviewToggleListeners();
                this.overviewListenersAttached = true;
            }
        } else {
            console.error("Zero points found in range.");
            document.getElementById('output').textContent = "Warning: No data in this range.";
            this.updateDataStatus(0);
        }
    },

    /**
     * Get filtered data based on current date range selection
     * @returns {Array} Filtered data array
     */
    getFilteredData() {
        if (!this.mergedData || this.mergedData.length === 0) {
            return [];
        }

        const startInput = document.getElementById('startDate').value;
        const endInput = document.getElementById('endDate').value;

        if (!startInput || !endInput) {
            return this.mergedData;
        }

        const startTimestamp = new Date(startInput).getTime();
        const endTimestamp = new Date(endInput).getTime();

        return this.mergedData.filter(row => {
            return row.timestampMs >= startTimestamp && row.timestampMs <= endTimestamp;
        });
    },

    /**
     * Updates the data status display
     */
    updateDataStatus(dataPoints, startDate, endDate) {
        const statusEl = document.getElementById('dataStatus');
        if (!statusEl) return;

        if (dataPoints > 0) {
            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const d = new Date(dateStr);
                return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            };

            let statusText = `Loaded`;
            if (startDate && this.currentPreset !== 'full') {
                statusText += ` ${formatDate(startDate)}`;
            }
            statusText += `    ${dataPoints.toLocaleString()} data points`;
            
            statusEl.textContent = statusText;
            statusEl.style.display = 'block';
        } else {
            statusEl.style.display = 'none';
        }
    },

    /**
     * Updates the date input fields based on the full range of merged data.
     */
    updateDateRangeUI() {
        if (this.mergedData.length === 0) return;

        const firstEntry = this.mergedData[0].timestamp;
        const lastEntry = this.mergedData[this.mergedData.length - 1].timestamp;

        this.setDateInputs(firstEntry, lastEntry);
        document.getElementById('datePickerSection').style.display = 'block';
        document.getElementById('batteryConfigSection').style.display = 'block';
        
        // Set initial preset to "Full Range"
        this.selectPreset('full');
    },

    /**
     * Run battery simulation with current configuration
     */
    runBatterySimulation() {
        if (!this.mergedData || this.mergedData.length === 0) {
            alert('Please load data files first');
            return;
        }

        // Check if simulation time range is locked
        if (!this.simulationStartDate || !this.simulationEndDate) {
            alert('Please select a time range and click "Apply Range for Simulation" first');
            return;
        }

        const startTimestamp = new Date(this.simulationStartDate).getTime();
        const endTimestamp = new Date(this.simulationEndDate).getTime();

        const filtered = this.mergedData.filter(row => {
            return row.timestampMs >= startTimestamp && row.timestampMs <= endTimestamp;
        });

        if (filtered.length === 0) {
            alert('No data in selected range');
            return;
        }

        // Read battery configuration from UI
        const config = {
            capacityKwh: parseFloat(document.getElementById('batteryCapacity').value),
            chargeEfficiency: parseFloat(document.getElementById('chargeEfficiency').value) / 100,
            dischargeEfficiency: parseFloat(document.getElementById('dischargeEfficiency').value) / 100,
            maxChargeRateKw: parseFloat(document.getElementById('maxChargeRate').value),
            maxDischargeRateKw: parseFloat(document.getElementById('maxDischargeRate').value),
            minSocPercent: parseFloat(document.getElementById('minSoc').value),
            maxSocPercent: parseFloat(document.getElementById('maxSoc').value),
            inverterMode: document.getElementById('inverterMode').value,
            currency: document.getElementById('currency').value
        };

        // Update simulation configuration
        BatterySimulation.setConfig(config);

        // Run simulation
        const results = BatterySimulation.simulate(filtered);

        // Store simulation results for energy flow chart
        this.currentSimulationResults = results;

        // Display results
        this.displaySimulationResults(results.metrics);
        this.renderComparisonChart(results.metrics);
        
        // Render energy flow chart
        this.renderEnergyFlowChart(results.simulatedData, filtered);

        // Show results section
        document.getElementById('simulationResults').style.display = 'block';
        
        // Scroll to results
        document.getElementById('simulationResults').scrollIntoView({ behavior: 'smooth' });
    },

    /**
     * Display simulation results in KPI cards
     */
    displaySimulationResults(metrics) {
        const { before, after, improvements, financials } = metrics;

        // Update energy KPI cards
        document.getElementById('kpiImportReduction').textContent = 
            `${improvements.gridImportReduction.toFixed(1)} kWh`;
        document.getElementById('kpiImportPercent').textContent = 
            `${improvements.gridImportReductionPercent.toFixed(1)}%`;

        document.getElementById('kpiExportReduction').textContent = 
            `${improvements.gridExportReduction.toFixed(1)} kWh`;
        document.getElementById('kpiExportPercent').textContent = 
            `${improvements.gridExportReductionPercent.toFixed(1)}%`;

        document.getElementById('kpiBatterySelfConsumption').textContent = 
            `${after.batterySelfConsumption.toFixed(1)} kWh`;

        document.getElementById('kpiBatteryLosses').textContent = 
            `${after.batteryLosses.toFixed(1)} kWh`;
        const lossPercent = before.solarProduction > 0 
            ? (after.batteryLosses / before.solarProduction * 100) 
            : 0;
        document.getElementById('kpiLossPercent').textContent = 
            `${lossPercent.toFixed(1)}%`;

        // Update financial KPI cards
        const currencySymbol = financials.currency === 'HUF' ? 'Ft' : '€';
        const decimals = financials.currency === 'HUF' ? 0 : 2;

        document.getElementById('kpiBaselineCost').textContent = 
            `${this.formatNumber(financials.baselineCost, decimals)} ${currencySymbol}`;
        
        document.getElementById('kpiBatteryCost').textContent = 
            `${this.formatNumber(financials.batteryCost, decimals)} ${currencySymbol}`;
        
        document.getElementById('kpiTotalSavings').textContent = 
            `${this.formatNumber(financials.totalSavings, decimals)} ${currencySymbol}`;
        document.getElementById('kpiSavingsPercent').textContent = 
            `${financials.savingsPercent.toFixed(1)}%`;
        
        // Display tier1 limit information
        const tier1LimitEl = document.getElementById('tier1LimitInfo');
        if (tier1LimitEl && financials.proportionalTier1Limit !== undefined) {
            const limitFormatted = this.formatNumber(financials.proportionalTier1Limit, 0);
            const daysFormatted = Math.round(financials.durationDays);
            tier1LimitEl.textContent = 
                `Applied Tier1 Limit: ${limitFormatted} kWh (${daysFormatted} days) | ` +
                `Alkalmazott Tier1 limit: ${limitFormatted} kWh (${daysFormatted} nap)`;
        }

        // Update comparison cards
        document.getElementById('beforeSelfConsumption').textContent = 
            `${before.solarSelfConsumption.toFixed(1)} kWh`;
        document.getElementById('beforeSelfConsumptionRate').textContent = 
            `${before.selfConsumptionRate.toFixed(1)}%`;

        document.getElementById('afterSelfConsumption').textContent = 
            `${after.solarSelfConsumption.toFixed(1)} kWh`;
        document.getElementById('afterSelfConsumptionRate').textContent = 
            `${after.selfConsumptionRate.toFixed(1)}%`;

        document.getElementById('improvementSelfConsumption').textContent = 
            `+${improvements.selfConsumptionImprovement.toFixed(1)} kWh`;
        document.getElementById('improvementSelfConsumptionRate').textContent = 
            `+${improvements.selfConsumptionImprovementPercent.toFixed(1)}%`;
    },

    /**
     * Render comparison chart (before vs after)
     */
    renderComparisonChart(metrics) {
        const { before, after } = metrics;

        const categories = ['Grid Import', 'Grid Export', 'Battery Self-Consumption', 'Solar Self-Consumption'];
        const beforeValues = [before.gridImport, before.gridExport, before.batterySelfConsumption, before.solarSelfConsumption];
        const afterValues = [after.gridImport, after.gridExport, after.batterySelfConsumption, after.solarSelfConsumption];

        const trace1 = {
            x: categories,
            y: beforeValues,
            name: 'Before (No Battery)',
            type: 'bar',
            marker: {
                color: '#6b7280'
            },
            hovertemplate: '<b>%{x}</b><br>' +
                           'Before: %{y:.2f} kWh<br>' +
                           'After: %{customdata:.2f} kWh<br>' +
                           '<extra></extra>',
            customdata: afterValues
        };

        const trace2 = {
            x: categories,
            y: afterValues,
            name: 'After (With Battery)',
            type: 'bar',
            marker: {
                color: '#2f81f7'
            },
            hovertemplate: '<b>%{x}</b><br>' +
                           'Before: %{customdata:.2f} kWh<br>' +
                           'After: %{y:.2f} kWh<br>' +
                           '<extra></extra>',
            customdata: beforeValues
        };

        const layout = {
            title: 'Energy Flow Comparison',
            barmode: 'group',
            template: 'plotly_dark',
            paper_bgcolor: '#161b22',
            plot_bgcolor: '#161b22',
            width: 1200,
            height: 500,
            xaxis: {
                title: 'Energy Flow Category',
                gridcolor: '#495057',
                tickfont: { color: '#cbd5e1' }
            },
            yaxis: {
                title: 'Energy (kWh)',
                gridcolor: '#495057',
                tickfont: { color: '#cbd5e1' }
            },
            font: {
                color: '#e6edf3'
            },
            showlegend: true,
            legend: {
                bgcolor: 'rgba(22, 27, 34, 0.8)',
                bordercolor: '#30363d',
                borderwidth: 1
            }
        };

        Plotly.newPlot('comparisonChart', [trace1, trace2], layout, {
            responsive: true,
            displayModeBar: true
        });
    },

    /**
     * Render energy flow comparison chart
     * @param {Array} simulatedData - Simulation results with battery intervention
     * @param {Array} originalData - Filtered original merged data
     */
    renderEnergyFlowChart(simulatedData, originalData) {
        if (!this.simulationStartDate || !this.simulationEndDate) {
            console.warn('Simulation range not set');
            return;
        }

        // Get current view type from active button (default: energy)
        const energyBtn = document.getElementById('btnEnergyFlowEnergy');
        const viewType = energyBtn && energyBtn.classList.contains('active') ? 'energy' : 'power';

        // Render chart with current aggregation level
        Visualizer.renderEnergyFlowChart(
            simulatedData,
            this.simulationStartDate,
            this.simulationEndDate,
            originalData,
            viewType,
            this.currentAggregationFlow
        );

        // Show container
        const section = document.getElementById('energyFlowChartSection');
        if (section) {
            section.style.display = 'block';
        }

        // Setup toggle event listeners (only once)
        if (!this.energyFlowListenersAttached) {
            this.setupEnergyFlowToggleListeners();
            this.energyFlowListenersAttached = true;
        }
    },

    /**
     * Setup event listeners for energy flow chart toggle buttons
     */
    setupEnergyFlowToggleListeners() {
        const powerBtn = document.getElementById('btnEnergyFlowPower');
        const energyBtn = document.getElementById('btnEnergyFlowEnergy');

        if (powerBtn) {
            powerBtn.addEventListener('click', () => {
                this.toggleEnergyFlowView('power');
            });
        }

        if (energyBtn) {
            energyBtn.addEventListener('click', () => {
                this.toggleEnergyFlowView('energy');
            });
        }
    },

    /**
     * Toggle energy flow chart view between power and energy
     * @param {String} viewType - 'power' or 'energy'
     */
    toggleEnergyFlowView(viewType) {
        // Preserve current zoom state BEFORE any changes
        const chartDiv = document.getElementById('energyFlowChartContainer');
        let currentXRange = null;
        if (chartDiv && chartDiv.layout && chartDiv.layout.xaxis && chartDiv.layout.xaxis.range) {
            currentXRange = chartDiv.layout.xaxis.range.slice(); // Copy the range
        }

        // Update view mode state
        this.currentViewModeFlow = viewType;

        // Update button styles
        const powerBtn = document.getElementById('btnEnergyFlowPower');
        const energyBtn = document.getElementById('btnEnergyFlowEnergy');

        if (viewType === 'power') {
            powerBtn.classList.add('active');
            energyBtn.classList.remove('active');
            // Force 15min mode and disable daily/monthly buttons
            this.currentAggregationFlow = '15min';
            // Update aggregation button states manually (don't call setFlowAggregation to avoid double render)
            document.querySelectorAll('#agg-flow-15min, #agg-flow-daily, #agg-flow-monthly')
                .forEach(btn => btn.classList.remove('active'));
            document.getElementById('agg-flow-15min').classList.add('active');
            // Disable daily/monthly buttons
            document.getElementById('agg-flow-daily').disabled = true;
            document.getElementById('agg-flow-monthly').disabled = true;
        } else {
            energyBtn.classList.add('active');
            powerBtn.classList.remove('active');
            // Enable daily/monthly buttons
            document.getElementById('agg-flow-daily').disabled = false;
            document.getElementById('agg-flow-monthly').disabled = false;
        }

        // Re-render chart if simulation exists
        if (this.currentSimulationResults) {
            const startTimestamp = new Date(this.simulationStartDate).getTime();
            const endTimestamp = new Date(this.simulationEndDate).getTime();

            const filteredData = this.mergedData.filter(row => {
                return row.timestampMs >= startTimestamp && row.timestampMs <= endTimestamp;
            });

            Visualizer.renderEnergyFlowChart(
                this.currentSimulationResults.simulatedData,
                this.simulationStartDate,
                this.simulationEndDate,
                filteredData,
                viewType,
                this.currentAggregationFlow
            );

            // Restore zoom state after rendering
            if (currentXRange) {
                Plotly.relayout('energyFlowChartContainer', {
                    'xaxis.range': currentXRange
                });
            }
        }
    },

    /**
     * Setup event listeners for overview chart toggle buttons
     */
    setupOverviewToggleListeners() {
        const powerBtn = document.getElementById('btnShowPower');
        const energyBtn = document.getElementById('btnShowEnergy');

        if (powerBtn) {
            powerBtn.addEventListener('click', () => {
                this.toggleOverviewView('power');
            });
        }

        if (energyBtn) {
            energyBtn.addEventListener('click', () => {
                this.toggleOverviewView('energy');
            });
        }
    },

    /**
     * Toggle overview chart view between power and energy
     * @param {String} viewType - 'power' or 'energy'
     */
    toggleOverviewView(viewType) {
        // Preserve current zoom state BEFORE any changes
        const chartDiv = document.getElementById('chartContainer');
        let currentXRange = null;
        if (chartDiv && chartDiv.layout && chartDiv.layout.xaxis && chartDiv.layout.xaxis.range) {
            currentXRange = chartDiv.layout.xaxis.range.slice(); // Copy the range
        }

        // Update view mode state
        this.currentViewModeOverview = viewType;

        // Update button styles
        const powerBtn = document.getElementById('btnShowPower');
        const energyBtn = document.getElementById('btnShowEnergy');

        if (viewType === 'power') {
            powerBtn.classList.add('active');
            energyBtn.classList.remove('active');
            // Force 15min mode and disable daily/monthly buttons
            this.currentAggregationOverview = '15min';
            // Update aggregation button states manually (don't call setOverviewAggregation to avoid double render)
            document.querySelectorAll('#agg-overview-15min, #agg-overview-daily, #agg-overview-monthly')
                .forEach(btn => btn.classList.remove('active'));
            document.getElementById('agg-overview-15min').classList.add('active');
            // Disable daily/monthly buttons
            document.getElementById('agg-overview-daily').disabled = true;
            document.getElementById('agg-overview-monthly').disabled = true;
        } else {
            energyBtn.classList.add('active');
            powerBtn.classList.remove('active');
            // Enable daily/monthly buttons
            document.getElementById('agg-overview-daily').disabled = false;
            document.getElementById('agg-overview-monthly').disabled = false;
        }

        // Re-render chart if data exists
        if (this.mergedData && this.mergedData.length > 0) {
            const filteredData = this.getFilteredData();
            Visualizer.renderChart(filteredData, this.currentAggregationOverview, viewType);

            // Restore zoom state after rendering
            if (currentXRange) {
                Plotly.relayout('chartContainer', {
                    'xaxis.range': currentXRange
                });
            }
        }
    },

    /**
     * Run battery optimization curve across multiple capacity values
     */
    runOptimizationCurve() {
        try {
            // 1. Validate prerequisites
            if (!this.simulationStartDate || !this.simulationEndDate) {
                alert('Please select a time range and click "Apply Range for Simulation" first');
                return;
            }

            if (!this.mergedData || this.mergedData.length === 0) {
                alert('Please load data files first');
                return;
            }

            // 2. Filter data to simulation range
            const startMs = new Date(this.simulationStartDate).getTime();
            const endMs = new Date(this.simulationEndDate).getTime();

            const filteredData = this.mergedData.filter(row => {
                return row.timestampMs >= startMs && row.timestampMs <= endMs;
            });

            if (filteredData.length === 0) {
                alert('No data in selected simulation range');
                return;
            }

            // 3. Show progress container and disable button
            const btn = document.getElementById('btnRunOptimizationCurve');
            const progressContainer = document.getElementById('optimizationProgressContainer');
            
            btn.disabled = true;
            btn.textContent = '⏳ Calculating...';
            progressContainer.style.display = 'block';

            // 4. Read fixed configuration (everything except capacity)
            const fixedConfig = {
                chargeEfficiency: parseFloat(document.getElementById('chargeEfficiency').value) / 100,
                dischargeEfficiency: parseFloat(document.getElementById('dischargeEfficiency').value) / 100,
                maxChargeRateKw: parseFloat(document.getElementById('maxChargeRate').value),
                maxDischargeRateKw: parseFloat(document.getElementById('maxDischargeRate').value),
                minSocPercent: parseFloat(document.getElementById('minSoc').value),
                maxSocPercent: parseFloat(document.getElementById('maxSoc').value),
                inverterMode: document.getElementById('inverterMode').value,
                currency: document.getElementById('currency').value
            };

            // 5. Define capacity points
            const capacityPoints = [0, 1, 2, 5, 10, 15, 20, 40, 50, 100, 200];
            const results = [];

            // 6. Run simulations sequentially with progress updates
            let currentIndex = 0;

            const runNextSimulation = () => {
                if (currentIndex >= capacityPoints.length) {
                    // All simulations complete
                    this.optimizationResults = results;
                    this.renderOptimizationCurve(results, this.optimizationMetricType);
                    
                    // Show results section
                    const section = document.getElementById('optimizationCurveSection');
                    section.style.display = 'block';
                    section.scrollIntoView({ behavior: 'smooth' });

                    // Reset button and hide progress
                    btn.disabled = false;
                    btn.textContent = '📊 Calculate Battery Optimization Curve';
                    progressContainer.style.display = 'none';
                    
                    return;
                }

                const capacity = capacityPoints[currentIndex];

                // Update config with current capacity
                BatterySimulation.setConfig({
                    ...fixedConfig,
                    capacityKwh: capacity
                });

                // Run simulation
                const simResult = BatterySimulation.simulate(filteredData);

                // Store results
                results.push({
                    capacityKwh: capacity,
                    gridImportReductionPercent: simResult.metrics.improvements.gridImportReductionPercent || 0,
                    gridExportReductionPercent: simResult.metrics.improvements.gridExportReductionPercent || 0,
                    gridImportReduction: simResult.metrics.improvements.gridImportReduction || 0,
                    gridExportReduction: simResult.metrics.improvements.gridExportReduction || 0,
                    totalSavings: simResult.metrics.financials.totalSavings || 0,
                    savingsPercent: simResult.metrics.financials.savingsPercent || 0,
                    currency: simResult.metrics.financials.currency,
                    baselineCost: simResult.metrics.financials.baselineCost || 0,
                    batteryCost: simResult.metrics.financials.batteryCost || 0
                });

                // Update progress
                currentIndex++;
                this.updateOptimizationProgress(currentIndex, capacityPoints.length);

                // Schedule next simulation (allows UI to update)
                setTimeout(runNextSimulation, 10);
            };

            // Start first simulation
            runNextSimulation();

        } catch (error) {
            console.error('Optimization curve calculation failed:', error);
            alert(`Error: ${error.message}`);
            
            // Reset UI state
            const btn = document.getElementById('btnRunOptimizationCurve');
            btn.disabled = false;
            btn.textContent = '📊 Calculate Battery Optimization Curve';
            document.getElementById('optimizationProgressContainer').style.display = 'none';
        }
    },

    /**
     * Update progress bar during optimization calculation
     */
    updateOptimizationProgress(current, total) {
        const percent = Math.round((current / total) * 100);
        const progressBar = document.getElementById('optimizationProgressBar');
        const progressText = document.getElementById('optimizationProgressText');

        if (progressBar && progressText) {
            progressBar.style.width = `${percent}%`;
            progressText.textContent = `Calculating: ${current}/${total} simulations (${percent}%)`;
        }
    },

    /**
     * Render optimization curve chart
     */
    renderOptimizationCurve(results, metricType) {
        // Delegate to Visualizer module
        Visualizer.renderOptimizationCurve(results, metricType);
    },

    /**
     * Toggle between Import and Export metric views
     */
    toggleOptimizationMetric(metricType) {
        this.optimizationMetricType = metricType;

        // Update button styles
        const importBtn = document.getElementById('btnOptimCurveImport');
        const exportBtn = document.getElementById('btnOptimCurveExport');

        if (metricType === 'import') {
            importBtn.classList.add('active');
            exportBtn.classList.remove('active');
        } else {
            exportBtn.classList.add('active');
            importBtn.classList.remove('active');
        }

        // Re-render chart if results exist
        if (this.optimizationResults) {
            this.renderOptimizationCurve(this.optimizationResults, metricType);
        }
    },

    /**
     * Export optimization results as CSV
     */
    exportOptimizationCSV() {
        if (!this.optimizationResults || this.optimizationResults.length === 0) {
            alert('No optimization data to export');
            return;
        }

        const results = this.optimizationResults;
        const currency = results[0].currency;
        const currencySymbol = currency === 'HUF' ? 'Ft' : '€';

        // Build CSV content
        let csv = 'Battery Capacity (kWh),Grid Import Reduction (%),Grid Import Reduction (kWh),Grid Export Reduction (%),Grid Export Reduction (kWh),Total Savings (' + currencySymbol + '),Savings (%),Baseline Cost (' + currencySymbol + '),Battery Cost (' + currencySymbol + ')\n';

        results.forEach(r => {
            csv += `${r.capacityKwh},${r.gridImportReductionPercent.toFixed(2)},${r.gridImportReduction.toFixed(2)},${r.gridExportReductionPercent.toFixed(2)},${r.gridExportReduction.toFixed(2)},${r.totalSavings.toFixed(currency === 'HUF' ? 0 : 2)},${r.savingsPercent.toFixed(2)},${r.baselineCost.toFixed(currency === 'HUF' ? 0 : 2)},${r.batteryCost.toFixed(currency === 'HUF' ? 0 : 2)}\n`;
        });

        // Create download link
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().slice(0, 10);
        link.setAttribute('href', url);
        link.setAttribute('download', `battery_optimization_curve_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// CRITICAL: Start the app
App.init();