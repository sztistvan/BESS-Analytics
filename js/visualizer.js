/**
 * Visualizer Module
 * Uses Plotly.js to render interactive energy data charts.
 */
const Visualizer = {
    /**
     * Renders an interactive time-series chart.
     * @param {Array} data - The merged dataset.
     */
    renderChart(data) {
        document.getElementById('chartContainer').style.display = 'block';

        const timestamps = data.map(d => d.timestamp);
        
        // Prepare base data
        const solarPower = data.map(d => d.productionKw);
        const solarEnergy = data.map(d => d.productionKw * 0.25); // 15 min -> 0.25h
        const importData = data.map(d => d.importKwh);
        const exportData = data.map(d => d.exportKwh);

        // Solar trace shows Power (kW) by default, but can switch to Energy (kWh) with buttons
        const solarTrace = {
            x: timestamps,
            y: solarEnergy,
            name: 'Solar Energy (kWh)',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#fbbf24', width: 2 },
            fill: 'tozeroy',
            fillcolor: 'rgba(226, 203, 128, 0.2)',
            hovertemplate: '<b>Solar Energy</b><br>%{y:.2f} kWh<extra></extra>'
        };

        const importTrace = {
            x: timestamps,
            y: importData,
            name: 'Grid Import (kWh)',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#3b82f6', width: 2 },
            hovertemplate: '<b>Grid Import</b><br>%{y:.2f} kWh<extra></extra>'
        };

        const exportTrace = {
            x: timestamps,
            y: exportData,
            name: 'Grid Export (kWh)',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#10b981', width: 2 },
            hovertemplate: '<b>Grid Export</b><br>%{y:.2f} kWh<extra></extra>'
        };

        const layout = {
            title: {
                text: 'Energy Data Overview',
                font: { color: '#e6edf3' }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            template: 'plotly_dark',
            xaxis: { 
                title: 'Time', 
                gridcolor: '#495057',
                tickfont: { color: '#cbd5e1' },
                title: { font: { color: '#e6edf3' } }
            },
            yaxis: { 
                title: 'Energy (kWh)',
                gridcolor: '#495057',
                tickfont: { color: '#cbd5e1' },
                title: { font: { color: '#e6edf3' } }
            },
            legend: {
                font: { color: '#cbd5e1' }
            },
            margin: { t: 50, b: 50, l: 50, r: 20 },
            hovermode: 'x unified',
            hoverlabel: {
                bgcolor: '#1e293b',
                bordercolor: '#2f81f7',
                font: { 
                    family: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
                    size: 13,
                    color: '#e6edf3'
                }
            }
        };

        const config = { responsive: true };

        Plotly.newPlot('chartContainer', [solarTrace, importTrace, exportTrace], layout, config);

        // Show custom toggle buttons
        document.getElementById('viewToggleContainer').style.display = 'block';

        // Custom button handlers for view switching
        const btnPower = document.getElementById('btnShowPower');
        const btnEnergy = document.getElementById('btnShowEnergy');

        btnPower.addEventListener('click', function() {
            Plotly.update('chartContainer', 
                {
                    'y': [solarPower, importData, exportData],
                    'name': ['Solar Production (kW)', 'Grid Import (kWh)', 'Grid Export (kWh)'],
                    'hovertemplate': [
                        '<b>Solar Power</b><br>%{y:.2f} kW<extra></extra>',
                        '<b>Grid Import</b><br>%{y:.2f} kWh<extra></extra>',
                        '<b>Grid Export</b><br>%{y:.2f} kWh<extra></extra>'
                    ]
                },
                {
                    'yaxis.title.text': 'Power (kW) / Energy (kWh)'
                }
            );
            btnPower.classList.add('active');
            btnEnergy.classList.remove('active');
        });

        btnEnergy.addEventListener('click', function() {
            Plotly.update('chartContainer',
                {
                    'y': [solarEnergy, importData, exportData],
                    'name': ['Solar Energy (kWh)', 'Grid Import (kWh)', 'Grid Export (kWh)'],
                    'hovertemplate': [
                        '<b>Solar Energy</b><br>%{y:.2f} kWh<extra></extra>',
                        '<b>Grid Import</b><br>%{y:.2f} kWh<extra></extra>',
                        '<b>Grid Export</b><br>%{y:.2f} kWh<extra></extra>'
                    ]
                },
                {
                    'yaxis.title.text': 'Energy (kWh)'
                }
            );
            btnEnergy.classList.add('active');
            btnPower.classList.remove('active');
        });
    },

    /**
     * Renders an energy flow comparison chart showing original vs optimized data.
     * @param {Array} simulatedData - The simulation results with battery intervention
     * @param {String} startDate - Simulation start date (ISO format)
     * @param {String} endDate - Simulation end date (ISO format)
     * @param {Array} originalData - The filtered original merged data
     * @param {String} viewType - 'power' or 'energy' (default: 'energy')
     */
    renderEnergyFlowChart(simulatedData, startDate, endDate, originalData, viewType = 'energy') {
        // Filter data to exact simulation range
        const startMs = new Date(startDate).getTime();
        const endMs = new Date(endDate).getTime();
        
        const filteredSimData = simulatedData.filter(d => {
            const ts = new Date(d.timestamp).getTime();
            return ts >= startMs && ts <= endMs;
        });
        
        const filteredOrigData = originalData.filter(d => {
            const ts = new Date(d.timestamp).getTime();
            return ts >= startMs && ts <= endMs;
        });

        if (filteredSimData.length === 0 || filteredOrigData.length === 0) {
            console.warn('No data in simulation range');
            return;
        }

        // Prepare solar data (only solar switches between kW and kWh)
        const solarPower = filteredSimData.map(d => d.productionKw); // Already in kW
        const solarEnergy = filteredSimData.map(d => d.productionKw * 0.25); // 15 min -> kWh
        const solarData = viewType === 'power' ? solarPower : solarEnergy;
        const solarName = viewType === 'power' ? 'Solar Production (kW)' : 'Solar Energy (kWh)';
        const solarUnit = viewType === 'power' ? 'kW' : 'kWh';
        const yAxisTitle = viewType === 'power' ? 'Power (kW) / Energy (kWh)' : 'Energy (kWh)';

        const timestamps = filteredSimData.map(d => d.timestamp);

        // Trace 1: Solar Production/Energy (area fill)
        const solarTrace = {
            x: timestamps,
            y: solarData,
            name: solarName,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#fbbf24', width: 2 },
            fill: 'tozeroy',
            fillcolor: 'rgba(251, 191, 36, 0.2)',
            yaxis: 'y',
            hovertemplate: `<b>Solar</b><br>%{y:.2f} ${solarUnit}<extra></extra>`
        };

        // Trace 2: Original Import (solid blue) - always kWh
        const origImportTrace = {
            x: timestamps,
            y: filteredOrigData.map(d => d.importKwh),
            name: 'Original Import (kWh)',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#3b82f6', width: 2 },
            yaxis: 'y',
            hovertemplate: '<b>Original Import</b><br>%{y:.2f} kWh<extra></extra>'
        };

        // Trace 3: New Import (dashed light blue) - always kWh
        const newImportTrace = {
            x: timestamps,
            y: filteredSimData.map(d => d.gridImportWithBattery),
            name: 'Optimized Import (kWh)',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#93c5fd', width: 2, dash: '5,5' },
            yaxis: 'y',
            hovertemplate: '<b>Optimized Import</b><br>%{y:.2f} kWh<extra></extra>'
        };

        // Trace 4: Original Export (solid green) - always kWh
        const origExportTrace = {
            x: timestamps,
            y: filteredOrigData.map(d => d.exportKwh),
            name: 'Original Export (kWh)',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#10b981', width: 2 },
            yaxis: 'y',
            hovertemplate: '<b>Original Export</b><br>%{y:.2f} kWh<extra></extra>'
        };

        // Trace 5: New Export (dashed light green) - always kWh
        const newExportTrace = {
            x: timestamps,
            y: filteredSimData.map(d => d.gridExportWithBattery),
            name: 'Optimized Export (kWh)',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#6ee7b7', width: 2, dash: '5,5' },
            yaxis: 'y',
            hovertemplate: '<b>Optimized Export</b><br>%{y:.2f} kWh<extra></extra>'
        };

        // Trace 6: Battery SOC (solid purple, right axis)
        const batterySocTrace = {
            x: timestamps,
            y: filteredSimData.map(d => d.batterySocKwh),
            name: 'Battery SOC',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#a855f7', width: 2 },
            yaxis: 'y2',
            hovertemplate: '<b>Battery SOC</b><br>%{y:.2f} kWh<extra></extra>'
        };

        const layout = {
            title: {
                text: 'Energy Flow: Original vs Optimized',
                font: { color: '#e6edf3' }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            template: 'plotly_dark',
            xaxis: {
                title: 'Time',
                gridcolor: '#495057',
                tickfont: { color: '#cbd5e1' },
                titlefont: { color: '#e6edf3' }
            },
            yaxis: {
                title: yAxisTitle,
                gridcolor: '#495057',
                tickfont: { color: '#cbd5e1' },
                titlefont: { color: '#e6edf3' },
                side: 'left'
            },
            yaxis2: {
                title: 'Battery SOC (kWh)',
                overlaying: 'y',
                side: 'right',
                gridcolor: 'transparent',
                tickfont: { color: '#cbd5e1' },
                titlefont: { color: '#a855f7' }
            },
            legend: {
                font: { color: '#cbd5e1' },
                orientation: 'h',
                yanchor: 'bottom',
                y: 1.02,
                xanchor: 'right',
                x: 1
            },
            margin: { t: 80, b: 50, l: 60, r: 70 },
            hovermode: 'x unified',
            hoverlabel: {
                bgcolor: '#1e293b',
                bordercolor: '#2f81f7',
                font: {
                    family: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
                    size: 13,
                    color: '#e6edf3'
                }
            }
        };

        const config = { responsive: true };

        Plotly.newPlot('energyFlowChartContainer', 
            [solarTrace, origImportTrace, newImportTrace, origExportTrace, newExportTrace, batterySocTrace], 
            layout, 
            config
        ).then(() => {
            // Force resize to ensure proper width rendering
            setTimeout(() => {
                Plotly.Plots.resize('energyFlowChartContainer');
            }, 100);
        });
    }
};