/**
 * Yearly Analysis Module
 * Handles year-based solar self-consumption analysis with monthly breakdowns
 */

const YearlyAnalysis = {
    currentResults: null,
    showFinancials: false,

    /**
     * Extract unique years from merged data and populate dropdown
     * Only includes years with complete data (Jan 1 - Dec 31) AND both solar and grid data
     */
    populateYearDropdown(mergedData) {
        console.log('Populating year dropdown with', mergedData?.length, 'data points');
        
        if (!mergedData || mergedData.length === 0) {
            return;
        }

        const yearSelect = document.getElementById('yearSelect');
        const yearDataCoverage = new Map();
        
        // Analyze data coverage for each year
        mergedData.forEach(row => {
            const date = new Date(row.timestampMs);
            const year = date.getFullYear();
            
            if (!yearDataCoverage.has(year)) {
                yearDataCoverage.set(year, {
                    minDate: date,
                    maxDate: date,
                    dataPoints: 0,
                    hasSolar: 0,
                    hasGrid: 0,
                    suspiciousRows: 0 // Rows with solar but no grid activity
                });
            }
            
            const yearData = yearDataCoverage.get(year);
            if (date < yearData.minDate) yearData.minDate = date;
            if (date > yearData.maxDate) yearData.maxDate = date;
            yearData.dataPoints++;
            
            // Check if solar data exists (actual production, not just zeros)
            if (row.productionKw > 0) yearData.hasSolar++;
            
            // Check if grid data exists (any import or export activity)
            if (row.importKwh > 0 || row.exportKwh > 0) yearData.hasGrid++;
            
            // Flag suspicious pattern: solar production but NO grid activity
            // This indicates missing grid data (merged default zeros)
            if (row.productionKw > 0 && row.importKwh === 0 && row.exportKwh === 0) {
                yearData.suspiciousRows++;
            }
        });
        
        // Filter years with complete data (Jan 1 - Dec 31) AND both solar and grid data
        const completeYears = [];
        yearDataCoverage.forEach((data, year) => {
            const yearStart = new Date(year, 0, 1);
            const yearEnd = new Date(year, 11, 31);
            
            // Check if data covers full year (within 1 day tolerance)
            const hasYearStart = (data.minDate - yearStart) / (1000 * 60 * 60 * 24) <= 1;
            const hasYearEnd = (yearEnd - data.maxDate) / (1000 * 60 * 60 * 24) <= 1;
            
            // Should have at least 35,000 data points for a full year (15-min intervals = 35,040)
            const hasEnoughData = data.dataPoints >= 35000;
            
            // Both solar and grid data should be present
            // Solar: at least 8000 rows with actual production (sunny hours ~8h/day * 4 intervals/h * 250 sunny days)
            // Grid: at least 30000 rows with activity (most of the time there's import/export)
            const hasSufficientSolar = data.hasSolar >= 8000;
            const hasSufficientGrid = data.hasGrid >= 30000;
            
            // Reject if too many suspicious rows (>5% indicates missing grid data)
            const suspiciousPercentage = (data.suspiciousRows / data.dataPoints) * 100;
            const hasValidGridCoverage = suspiciousPercentage < 5;
            
            console.log(`Year ${year}: dataPoints=${data.dataPoints}, hasSolar=${data.hasSolar}, hasGrid=${data.hasGrid}, suspicious=${data.suspiciousRows}(${suspiciousPercentage.toFixed(1)}%)`);
            
            if (hasYearStart && hasYearEnd && hasEnoughData && hasSufficientSolar && hasSufficientGrid && hasValidGridCoverage) {
                completeYears.push(year);
            }
        });
        
        const sortedYears = completeYears.sort((a, b) => b - a);
        
        console.log('Complete years found:', sortedYears);
        
        yearSelect.innerHTML = '<option value="">-- Select Year --</option>';
        sortedYears.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });
        
        // Show the section only if there are complete years
        if (sortedYears.length > 0) {
            document.getElementById('yearlyAnalysisSection').style.display = 'block';
        }
    },

    /**
     * Main orchestrator: run full year analysis
     */
    runYearlyAnalysis(year, capacityKwh, mergedData) {
        console.log('Running yearly analysis:', { year, capacityKwh, dataLength: mergedData?.length });
        
        if (!year || !mergedData || mergedData.length === 0) {
            alert('Please select a valid year and ensure data is loaded.');
            return;
        }
        
        // Filter data for the selected year
        const yearData = this.filterDataForYear(mergedData, year);
        
        if (yearData.length === 0) {
            alert(`No data available for year ${year}`);
            return;
        }
        
        // Store original capacity
        const originalCapacity = BatterySimulation.config.capacityKwh;
        
        // Update capacity temporarily
        BatterySimulation.config.capacityKwh = parseFloat(capacityKwh);
        
        // Run battery simulation (this already includes baseline and simulated metrics)
        const simulationResults = BatterySimulation.simulate(yearData);
        const simulatedData = simulationResults.simulatedData;
        const baselineMetrics = simulationResults.metrics.before;
        const simulatedMetrics = simulationResults.metrics.after;
        const financialMetrics = simulationResults.metrics.financials;
        
        console.log('Simulation complete:', { 
            dataPoints: simulatedData.length, 
            baseline: baselineMetrics,
            simulated: simulatedMetrics 
        });
        
        // Aggregate by month
        const monthlyResults = this.aggregateToMonthly(
            yearData,
            simulatedData,
            baselineMetrics,
            simulatedMetrics,
            financialMetrics
        );
        
        // Calculate yearly totals
        const yearlyTotals = this.calculateYearlyTotals(monthlyResults, year, capacityKwh);
        
        // Store results
        this.currentResults = yearlyTotals;
        
        // Render UI
        this.renderSummaryCards(yearlyTotals);
        this.renderMonthlyTable(yearlyTotals.monthlyResults);
        this.renderAbsoluteChart(yearlyTotals);
        this.renderPercentageChart(yearlyTotals);
        
        // Show containers
        document.getElementById('yearlySummaryCards').style.display = 'grid';
        document.getElementById('monthlyBreakdownContainer').style.display = 'block';
        
        // Restore original capacity
        BatterySimulation.config.capacityKwh = originalCapacity;
    },

    /**
     * Filter merged data for specific year (Jan 1 - Dec 31)
     */
    filterDataForYear(mergedData, year) {
        const startMs = new Date(year, 0, 1, 0, 0, 0).getTime();
        const endMs = new Date(year, 11, 31, 23, 59, 59).getTime();
        
        return mergedData.filter(row => 
            row.timestampMs >= startMs && row.timestampMs <= endMs
        );
    },

    /**
     * Aggregate data by month using existing DataMerger function
     */
    aggregateToMonthly(yearData, simulatedData, baselineMetrics, simulatedMetrics, financialMetrics) {
        // Use existing DataMerger.aggregateDataToMonthly for consistency
        const monthlyOriginal = DataMerger.aggregateDataToMonthly(yearData, {
            sum: ['productionKw', 'importKwh', 'exportKwh'],
            average: []
        });
        
        const monthlySimulated = DataMerger.aggregateDataToMonthly(simulatedData, {
            sum: ['gridImportWithBattery', 'gridExportWithBattery'],
            average: []
        });
        
        // Create monthly buckets with data from aggregation
        const monthlyBuckets = Array.from({ length: 12 }, (_, i) => ({
            monthIndex: i,
            month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
            solarProduction: 0,
            gridExportOriginal: 0,
            gridExportOptimized: 0,
            gridImportOriginal: 0,
            gridImportOptimized: 0,
            dataPoints: 0
        }));
        
        // Map aggregated data to monthly buckets
        monthlyOriginal.forEach(row => {
            const month = new Date(row.timestampMs).getMonth();
            monthlyBuckets[month].solarProduction = (row.productionKw || 0) * 0.25; // Convert kW to kWh
            monthlyBuckets[month].gridExportOriginal = row.exportKwh || 0;
            monthlyBuckets[month].gridImportOriginal = row.importKwh || 0;
        });
        
        monthlySimulated.forEach(row => {
            const month = new Date(row.timestampMs).getMonth();
            monthlyBuckets[month].gridExportOptimized = row.gridExportWithBattery || 0;
            monthlyBuckets[month].gridImportOptimized = row.gridImportWithBattery || 0;
        });
        
        // Count data points per month
        yearData.forEach(row => {
            const month = new Date(row.timestampMs).getMonth();
            monthlyBuckets[month].dataPoints++;
        });
        
        // Calculate metrics for each month
        const monthlyResults = monthlyBuckets.map(bucket => {
            const selfConsumptionBefore = bucket.solarProduction - bucket.gridExportOriginal;
            const selfConsumptionAfter = bucket.solarProduction - bucket.gridExportOptimized;
            const gridExportReduction = bucket.gridExportOriginal - bucket.gridExportOptimized;
            
            const selfConsumptionBeforePct = bucket.solarProduction > 0 
                ? (selfConsumptionBefore / bucket.solarProduction * 100)
                : 0;
            const selfConsumptionAfterPct = bucket.solarProduction > 0
                ? (selfConsumptionAfter / bucket.solarProduction * 100)
                : 0;
            const gridExportReductionPct = bucket.gridExportOriginal > 0
                ? (gridExportReduction / bucket.gridExportOriginal * 100)
                : 0;
            
            // Calculate monthly financial metrics (proportional to data points)
            let baselineCost = 0;
            let batteryCost = 0;
            
            if (financialMetrics && yearData.length > 0) {
                const monthFraction = bucket.dataPoints / yearData.length;
                baselineCost = financialMetrics.baselineCost * monthFraction;
                batteryCost = financialMetrics.batteryCost * monthFraction;
            }
            
            const savings = baselineCost - batteryCost;
            const savingsPct = baselineCost > 0 ? (savings / baselineCost * 100) : 0;
            
            return {
                ...bucket,
                selfConsumptionBefore,
                selfConsumptionAfter,
                gridExportReduction,
                selfConsumptionBeforePct,
                selfConsumptionAfterPct,
                gridExportReductionPct,
                baselineCost,
                batteryCost,
                savings,
                savingsPct
            };
        });
        
        return monthlyResults;
    },

    /**
     * Calculate yearly totals from monthly results
     */
    calculateYearlyTotals(monthlyResults, year, capacityKwh) {
        const totals = monthlyResults.reduce((acc, month) => {
            acc.solarProduction += month.solarProduction;
            acc.selfConsumptionBefore += month.selfConsumptionBefore;
            acc.selfConsumptionAfter += month.selfConsumptionAfter;
            acc.gridExportReduction += month.gridExportReduction;
            acc.baselineCost += month.baselineCost;
            acc.batteryCost += month.batteryCost;
            acc.savings += month.savings;
            return acc;
        }, {
            solarProduction: 0,
            selfConsumptionBefore: 0,
            selfConsumptionAfter: 0,
            gridExportReduction: 0,
            baselineCost: 0,
            batteryCost: 0,
            savings: 0
        });
        
        return {
            year,
            batteryCapacity: capacityKwh,
            ...totals,
            selfConsumptionBeforePct: totals.solarProduction > 0 
                ? (totals.selfConsumptionBefore / totals.solarProduction * 100)
                : 0,
            selfConsumptionAfterPct: totals.solarProduction > 0
                ? (totals.selfConsumptionAfter / totals.solarProduction * 100)
                : 0,
            gridExportReductionPct: totals.gridExportReduction > 0 && (totals.selfConsumptionBefore + totals.gridExportReduction) > 0
                ? (totals.gridExportReduction / (totals.selfConsumptionBefore + totals.gridExportReduction) * 100)
                : 0,
            savingsPct: totals.baselineCost > 0
                ? (totals.savings / totals.baselineCost * 100)
                : 0,
            monthlyResults
        };
    },

    /**
     * Render summary KPI cards
     */
    renderSummaryCards(yearlyTotals) {
        const formatValue = (kwh, pct) => 
            `${App.formatNumber(kwh, 1)} kWh (${App.formatNumber(pct, 1)}%)`;
        
        document.getElementById('yearlySelfConsumptionBefore').innerHTML = 
            `<span style="color: #FFA726; font-size: 1.5rem; font-weight: 700;">${formatValue(
                yearlyTotals.selfConsumptionBefore, 
                yearlyTotals.selfConsumptionBeforePct
            )}</span>`;
        
        document.getElementById('yearlySelfConsumptionAfter').innerHTML = 
            `<span style="color: #66BB6A; font-size: 1.5rem; font-weight: 700;">${formatValue(
                yearlyTotals.selfConsumptionAfter, 
                yearlyTotals.selfConsumptionAfterPct
            )}</span>`;
        
        document.getElementById('yearlyGridExportReduction').innerHTML = 
            `<span style="color: #42A5F5; font-size: 1.5rem; font-weight: 700;">${formatValue(
                yearlyTotals.gridExportReduction, 
                yearlyTotals.gridExportReductionPct
            )}</span>`;
    },

    /**
     * Render monthly breakdown table
     */
    renderMonthlyTable(monthlyResults) {
        const tbody = document.getElementById('monthlyTableBody');
        const showFinancials = this.showFinancials;
        
        // Toggle financial column visibility
        document.querySelectorAll('.financial-col').forEach(col => {
            col.style.display = showFinancials ? 'table-cell' : 'none';
        });
        
        // Clear existing rows
        tbody.innerHTML = '';
        
        // Add monthly rows
        monthlyResults.forEach(month => {
            const row = tbody.insertRow();
            
            let rowHTML = `
                <td><strong>${month.month}</strong></td>
                <td>${App.formatNumber(month.selfConsumptionBefore, 1)} kWh (${App.formatNumber(month.selfConsumptionBeforePct, 1)}%)</td>
                <td>${App.formatNumber(month.selfConsumptionAfter, 1)} kWh (${App.formatNumber(month.selfConsumptionAfterPct, 1)}%)</td>
                <td>${App.formatNumber(month.gridExportReduction, 1)} kWh (${App.formatNumber(month.gridExportReductionPct, 1)}%)</td>
            `;
            
            if (showFinancials) {
                const currency = BatterySimulation.config.currency === 'HUF' ? 'Ft' : '€';
                rowHTML += `
                    <td class="financial-col">${App.formatNumber(month.baselineCost, 0)} ${currency}</td>
                    <td class="financial-col">${App.formatNumber(month.batteryCost, 0)} ${currency}</td>
                    <td class="financial-col">${App.formatNumber(month.savings, 0)} ${currency} (${App.formatNumber(month.savingsPct, 1)}%)</td>
                `;
            }
            
            row.innerHTML = rowHTML;
        });
        
        // Add TOTAL row
        const totals = this.currentResults;
        const totalRow = tbody.insertRow();
        
        let totalHTML = `
            <td><strong>TOTAL (Year ${totals.year}, Battery ${totals.batteryCapacity} kWh)</strong></td>
            <td><strong>${App.formatNumber(totals.selfConsumptionBefore, 1)} kWh (${App.formatNumber(totals.selfConsumptionBeforePct, 1)}%)</strong></td>
            <td><strong>${App.formatNumber(totals.selfConsumptionAfter, 1)} kWh (${App.formatNumber(totals.selfConsumptionAfterPct, 1)}%)</strong></td>
            <td><strong>${App.formatNumber(totals.gridExportReduction, 1)} kWh (${App.formatNumber(totals.gridExportReductionPct, 1)}%)</strong></td>
        `;
        
        if (showFinancials) {
            const currency = BatterySimulation.config.currency === 'HUF' ? 'Ft' : '€';
            totalHTML += `
                <td class="financial-col"><strong>${App.formatNumber(totals.baselineCost, 0)} ${currency}</strong></td>
                <td class="financial-col"><strong>${App.formatNumber(totals.batteryCost, 0)} ${currency}</strong></td>
                <td class="financial-col"><strong>${App.formatNumber(totals.savings, 0)} ${currency} (${App.formatNumber(totals.savingsPct, 1)}%)</strong></td>
            `;
        }
        
        totalRow.innerHTML = totalHTML;
    },

    /**
     * Render absolute values chart (kWh) - matching existing chart styling
     */
    renderAbsoluteChart(yearlyTotals) {
        const months = yearlyTotals.monthlyResults.map(m => m.month);
        
        const traces = [
            {
                x: months,
                y: yearlyTotals.monthlyResults.map(m => m.selfConsumptionBefore),
                name: 'Solar Self-Consumption (No Battery)',
                type: 'bar',
                marker: { color: '#FFA726' },
                text: yearlyTotals.monthlyResults.map(m => `${App.formatNumber(m.selfConsumptionBeforePct, 1)}%`),
                textposition: 'outside',
                textfont: { color: '#cbd5e1', size: 11 },
                hovertemplate: '<b>No Battery</b><br>%{y:.1f} kWh<extra></extra>'
            },
            {
                x: months,
                y: yearlyTotals.monthlyResults.map(m => m.selfConsumptionAfter),
                name: 'Solar Self-Consumption (With Battery)',
                type: 'bar',
                marker: { color: '#66BB6A' },
                text: yearlyTotals.monthlyResults.map(m => `${App.formatNumber(m.selfConsumptionAfterPct, 1)}%`),
                textposition: 'outside',
                textfont: { color: '#cbd5e1', size: 11 },
                hovertemplate: '<b>With Battery</b><br>%{y:.1f} kWh<extra></extra>'
            },
            {
                x: months,
                y: yearlyTotals.monthlyResults.map(m => m.gridExportReduction),
                name: 'Grid Export Reduction',
                type: 'bar',
                marker: { color: '#42A5F5' },
                text: yearlyTotals.monthlyResults.map(m => `${App.formatNumber(m.gridExportReductionPct, 1)}%`),
                textposition: 'outside',
                textfont: { color: '#cbd5e1', size: 11 },
                hovertemplate: '<b>Export Reduction</b><br>%{y:.1f} kWh<extra></extra>'
            }
        ];
        
        const layout = {
            title: {
                text: `Solar Self-Consumption Analysis - Year ${yearlyTotals.year}, Battery ${yearlyTotals.batteryCapacity} kWh<br><sub>Yearly: Before ${App.formatNumber(yearlyTotals.selfConsumptionBefore, 0)} kWh (${App.formatNumber(yearlyTotals.selfConsumptionBeforePct, 1)}%) | After ${App.formatNumber(yearlyTotals.selfConsumptionAfter, 0)} kWh (${App.formatNumber(yearlyTotals.selfConsumptionAfterPct, 1)}%) | Export Reduction ${App.formatNumber(yearlyTotals.gridExportReduction, 0)} kWh (${App.formatNumber(yearlyTotals.gridExportReductionPct, 1)}%)</sub>`,
                font: { color: '#e6edf3' }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            template: 'plotly_dark',
            xaxis: { 
                title: {
                    text: 'Month',
                    font: { color: '#e6edf3' }
                },
                gridcolor: '#495057',
                tickfont: { color: '#cbd5e1' }
            },
            yaxis: { 
                title: {
                    text: 'Energy (kWh)',
                    font: { color: '#e6edf3' }
                },
                gridcolor: '#495057',
                tickfont: { color: '#cbd5e1' }
            },
            barmode: 'group',
            hovermode: 'x unified',
            hoverlabel: {
                bgcolor: '#1a1a1a',
                font: { color: '#e6edf3' }
            },
            legend: { 
                orientation: 'h', 
                y: -0.2,
                font: { color: '#cbd5e1' }
            },
            margin: { t: 80, b: 80, l: 70, r: 20 }
        };
        
        Plotly.newPlot('yearlyChartAbsolute', traces, layout, { responsive: true });
        
        // Force resize after a short delay to fix width issue on first render
        setTimeout(() => {
            Plotly.Plots.resize('yearlyChartAbsolute');
        }, 100);
    },

    /**
     * Render percentage chart (%) - matching existing chart styling
     */
    renderPercentageChart(yearlyTotals) {
        const months = yearlyTotals.monthlyResults.map(m => m.month);
        
        const traces = [
            {
                x: months,
                y: yearlyTotals.monthlyResults.map(m => m.selfConsumptionBeforePct),
                name: 'Solar Self-Consumption (No Battery)',
                type: 'bar',
                marker: { color: '#FFA726' },
                text: yearlyTotals.monthlyResults.map(m => `${App.formatNumber(m.selfConsumptionBeforePct, 1)}%`),
                textposition: 'outside',
                textfont: { color: '#cbd5e1', size: 11 },
                hovertemplate: '<b>No Battery</b><br>%{y:.1f}%<extra></extra>'
            },
            {
                x: months,
                y: yearlyTotals.monthlyResults.map(m => m.selfConsumptionAfterPct),
                name: 'Solar Self-Consumption (With Battery)',
                type: 'bar',
                marker: { color: '#66BB6A' },
                text: yearlyTotals.monthlyResults.map(m => `${App.formatNumber(m.selfConsumptionAfterPct, 1)}%`),
                textposition: 'outside',
                textfont: { color: '#cbd5e1', size: 11 },
                hovertemplate: '<b>With Battery</b><br>%{y:.1f}%<extra></extra>'
            },
            {
                x: months,
                y: yearlyTotals.monthlyResults.map(m => m.gridExportReductionPct),
                name: 'Grid Export Reduction',
                type: 'bar',
                marker: { color: '#42A5F5' },
                text: yearlyTotals.monthlyResults.map(m => `${App.formatNumber(m.gridExportReductionPct, 1)}%`),
                textposition: 'outside',
                textfont: { color: '#cbd5e1', size: 11 },
                hovertemplate: '<b>Export Reduction</b><br>%{y:.1f}%<extra></extra>'
            }
        ];
        
        const layout = {
            title: {
                text: `Solar Self-Consumption Analysis (Percentage) - Year ${yearlyTotals.year}, Battery ${yearlyTotals.batteryCapacity} kWh<br><sub>Yearly: Before ${App.formatNumber(yearlyTotals.selfConsumptionBeforePct, 1)}% | After ${App.formatNumber(yearlyTotals.selfConsumptionAfterPct, 1)}% | Export Reduction ${App.formatNumber(yearlyTotals.gridExportReductionPct, 1)}%</sub>`,
                font: { color: '#e6edf3' }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            template: 'plotly_dark',
            xaxis: { 
                title: {
                    text: 'Month',
                    font: { color: '#e6edf3' }
                },
                gridcolor: '#495057',
                tickfont: { color: '#cbd5e1' }
            },
            yaxis: { 
                title: {
                    text: 'Percentage (%)',
                    font: { color: '#e6edf3' }
                },
                range: [0, 110],
                gridcolor: '#495057',
                tickfont: { color: '#cbd5e1' }
            },
            barmode: 'group',
            hovermode: 'x unified',
            hoverlabel: {
                bgcolor: '#1a1a1a',
                font: { color: '#e6edf3' }
            },
            legend: { 
                orientation: 'h', 
                y: -0.2,
                font: { color: '#cbd5e1' }
            },
            margin: { t: 80, b: 80, l: 70, r: 20 }
        };
        
        Plotly.newPlot('yearlyChartPercentage', traces, layout, { responsive: true });
        
        // Force resize after a short delay to fix width issue on first render
        setTimeout(() => {
            Plotly.Plots.resize('yearlyChartPercentage');
        }, 100);
    },

    /**
     * Export to clipboard as TSV
     */
    exportToClipboard() {
        if (!this.currentResults) {
            alert('No data to export. Please run analysis first.');
            return;
        }
        
        const results = this.currentResults;
        const showFinancials = this.showFinancials;
        const currency = BatterySimulation.config.currency === 'HUF' ? 'Ft' : '€';
        
        // Build TSV content
        let tsv = '';
        
        // Header
        tsv += 'MONTH\t';
        tsv += 'SOLAR SELF-CONSUMPTION (NO BATTERY)\t';
        tsv += 'SOLAR SELF-CONSUMPTION (WITH BATTERY)\t';
        tsv += 'GRID EXPORT REDUCTION';
        
        if (showFinancials) {
            tsv += '\tBASELINE COST\tBATTERY COST\tTOTAL SAVINGS';
        }
        tsv += '\n';
        
        // Monthly rows
        results.monthlyResults.forEach(month => {
            tsv += `${month.month}\t`;
            tsv += `${App.formatNumber(month.selfConsumptionBefore, 1)} kWh (${App.formatNumber(month.selfConsumptionBeforePct, 1)}%)\t`;
            tsv += `${App.formatNumber(month.selfConsumptionAfter, 1)} kWh (${App.formatNumber(month.selfConsumptionAfterPct, 1)}%)\t`;
            tsv += `${App.formatNumber(month.gridExportReduction, 1)} kWh (${App.formatNumber(month.gridExportReductionPct, 1)}%)`;
            
            if (showFinancials) {
                tsv += `\t${App.formatNumber(month.baselineCost, 0)} ${currency}`;
                tsv += `\t${App.formatNumber(month.batteryCost, 0)} ${currency}`;
                tsv += `\t${App.formatNumber(month.savings, 0)} ${currency} (${App.formatNumber(month.savingsPct, 1)}%)`;
            }
            tsv += '\n';
        });
        
        // Total row
        tsv += `TOTAL (Year ${results.year}, Battery ${results.batteryCapacity} kWh)\t`;
        tsv += `${App.formatNumber(results.selfConsumptionBefore, 1)} kWh (${App.formatNumber(results.selfConsumptionBeforePct, 1)}%)\t`;
        tsv += `${App.formatNumber(results.selfConsumptionAfter, 1)} kWh (${App.formatNumber(results.selfConsumptionAfterPct, 1)}%)\t`;
        tsv += `${App.formatNumber(results.gridExportReduction, 1)} kWh (${App.formatNumber(results.gridExportReductionPct, 1)}%)`;
        
        if (showFinancials) {
            tsv += `\t${App.formatNumber(results.baselineCost, 0)} ${currency}`;
            tsv += `\t${App.formatNumber(results.batteryCost, 0)} ${currency}`;
            tsv += `\t${App.formatNumber(results.savings, 0)} ${currency} (${App.formatNumber(results.savingsPct, 1)}%)`;
        }
        
        // Copy to clipboard
        navigator.clipboard.writeText(tsv).then(() => {
            alert('Data copied to clipboard! You can now paste it into Excel or Google Sheets.');
        }).catch(err => {
            alert('Failed to copy to clipboard: ' + err);
        });
    },

    /**
     * Export to CSV file
     */
    exportToCSV() {
        if (!this.currentResults) {
            alert('No data to export. Please run analysis first.');
            return;
        }
        
        const results = this.currentResults;
        const showFinancials = this.showFinancials;
        const currency = BatterySimulation.config.currency === 'HUF' ? 'Ft' : '€';
        
        // Build CSV content
        let csv = '';
        
        // Metadata
        csv += `Solar Self-Consumption Analysis\n`;
        csv += `Year,${results.year}\n`;
        csv += `Battery Capacity,${results.batteryCapacity} kWh\n`;
        csv += `Export Date,${new Date().toISOString().split('T')[0]}\n`;
        csv += `\n`;
        
        // Header
        csv += 'Month,';
        csv += 'Self-Consumption Before (kWh),Self-Consumption Before (%),';
        csv += 'Self-Consumption After (kWh),Self-Consumption After (%),';
        csv += 'Grid Export Reduction (kWh),Grid Export Reduction (%)';
        
        if (showFinancials) {
            csv += `,Baseline Cost (${currency}),Battery Cost (${currency}),Total Savings (${currency}),Savings (%)`;
        }
        csv += '\n';
        
        // Monthly rows
        results.monthlyResults.forEach(month => {
            csv += `${month.month},`;
            csv += `${month.selfConsumptionBefore.toFixed(1)},${month.selfConsumptionBeforePct.toFixed(1)},`;
            csv += `${month.selfConsumptionAfter.toFixed(1)},${month.selfConsumptionAfterPct.toFixed(1)},`;
            csv += `${month.gridExportReduction.toFixed(1)},${month.gridExportReductionPct.toFixed(1)}`;
            
            if (showFinancials) {
                csv += `,${month.baselineCost.toFixed(0)},${month.batteryCost.toFixed(0)},${month.savings.toFixed(0)},${month.savingsPct.toFixed(1)}`;
            }
            csv += '\n';
        });
        
        // Total row
        csv += `TOTAL,`;
        csv += `${results.selfConsumptionBefore.toFixed(1)},${results.selfConsumptionBeforePct.toFixed(1)},`;
        csv += `${results.selfConsumptionAfter.toFixed(1)},${results.selfConsumptionAfterPct.toFixed(1)},`;
        csv += `${results.gridExportReduction.toFixed(1)},${results.gridExportReductionPct.toFixed(1)}`;
        
        if (showFinancials) {
            csv += `,${results.baselineCost.toFixed(0)},${results.batteryCost.toFixed(0)},${results.savings.toFixed(0)},${results.savingsPct.toFixed(1)}`;
        }
        csv += '\n';
        
        // Yearly summary
        csv += `\n`;
        csv += `Yearly Summary\n`;
        csv += `Total Solar Production,${results.solarProduction.toFixed(1)} kWh\n`;
        csv += `Self-Consumption Improvement,${(results.selfConsumptionAfter - results.selfConsumptionBefore).toFixed(1)} kWh\n`;
        csv += `Self-Consumption Rate Improvement,${(results.selfConsumptionAfterPct - results.selfConsumptionBeforePct).toFixed(1)} percentage points\n`;
        
        // Create blob and download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().split('T')[0];
        
        link.setAttribute('href', url);
        link.setAttribute('download', `solar_self_consumption_analysis_${results.year}_${results.batteryCapacity}kWh_${timestamp}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    /**
     * Toggle financial data visibility
     */
    toggleFinancials() {
        this.showFinancials = !this.showFinancials;
        
        // Update button state
        const btn = document.getElementById('btnToggleFinancials');
        if (this.showFinancials) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
        
        // Re-render table
        if (this.currentResults) {
            this.renderMonthlyTable(this.currentResults.monthlyResults);
        }
    }
};
