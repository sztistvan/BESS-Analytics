/**
 * Visualizer Module
 * Uses Plotly.js to render interactive energy data charts.
 */
const Visualizer = {
    /**
     * Renders an interactive time-series chart.
     * @param {Array} data - The merged dataset.
     * @param {string} aggregationLevel - '15min', 'daily', or 'monthly'
     * @param {string} viewMode - 'power' or 'energy'
     */
    renderChart(data, aggregationLevel = '15min', viewMode = 'energy') {
        document.getElementById('chartContainer').style.display = 'block';

        // Apply aggregation
        const aggregatedData = App.getAggregatedData(data, aggregationLevel, viewMode);

        const timestamps = aggregatedData.map(d => d.timestamp);
        
        // Prepare base data
        const solarPower = aggregatedData.map(d => d.productionKw);
        // For energy mode: convert kW to kWh for 15min data (multiply by 0.25), aggregated data already has kWh
        const solarEnergy = aggregatedData.map(d => aggregationLevel === '15min' ? d.productionKw * 0.25 : d.productionKw);
        const importData = aggregatedData.map(d => d.importKwh);
        const exportData = aggregatedData.map(d => d.exportKwh);

        // Determine which data to show based on view mode
        const solarData = viewMode === 'power' ? solarPower : solarEnergy;
        const solarName = viewMode === 'power' ? 'Solar Production (kW)' : 'Solar Energy (kWh)';
        const solarUnit = viewMode === 'power' ? 'kW' : 'kWh';
        const yAxisTitle = viewMode === 'power' ? 'Power (kW) / Energy (kWh)' : 'Energy (kWh)';

        // Use bar chart for aggregated data, line chart for 15min
        // Power mode is always 15min (not aggregated)
        const isAggregated = aggregationLevel !== '15min' && viewMode === 'energy';

        // Solar trace
        const solarTrace = isAggregated ? {
            x: timestamps,
            y: solarData,
            name: solarName,
            type: 'bar',
            marker: { color: '#fbbf24' },
            hovertemplate: `<b>${solarName}</b><br>%{y:.2f} ${solarUnit}<extra></extra>`
        } : {
            x: timestamps,
            y: solarData,
            name: solarName,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#fbbf24', width: 2 },
            fill: 'tozeroy',
            fillcolor: 'rgba(226, 203, 128, 0.2)',
            hovertemplate: `<b>${solarName}</b><br>%{y:.2f} ${solarUnit}<extra></extra>`
        };

        const importTrace = isAggregated ? {
            x: timestamps,
            y: importData,
            name: 'Grid Import (kWh)',
            type: 'bar',
            marker: { color: '#3b82f6' },
            hovertemplate: '<b>Grid Import</b><br>%{y:.2f} kWh<extra></extra>'
        } : {
            x: timestamps,
            y: importData,
            name: 'Grid Import (kWh)',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#3b82f6', width: 2 },
            hovertemplate: '<b>Grid Import</b><br>%{y:.2f} kWh<extra></extra>'
        };

        const exportTrace = isAggregated ? {
            x: timestamps,
            y: exportData,
            name: 'Grid Export (kWh)',
            type: 'bar',
            marker: { color: '#10b981' },
            hovertemplate: '<b>Grid Export</b><br>%{y:.2f} kWh<extra></extra>'
        } : {
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
                title: {
                    text: 'Time',
                    font: { color: '#e6edf3' }
                },
                gridcolor: '#495057',
                tickfont: { color: '#cbd5e1' }
            },
            yaxis: { 
                title: {
                    text: yAxisTitle,
                    font: { color: '#e6edf3' }
                },
                gridcolor: '#495057',
                tickfont: { color: '#cbd5e1' }
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

        // Add tick format for aggregated data
        if (aggregationLevel === 'daily') {
            layout.xaxis.tickformat = '%Y-%m-%d';
        } else if (aggregationLevel === 'monthly') {
            layout.xaxis.tickformat = '%Y-%m';
        }

        // Add barmode for aggregated data
        if (isAggregated) {
            layout.barmode = 'group';
        }

        const config = { responsive: true };

        Plotly.react('chartContainer', [solarTrace, importTrace, exportTrace], layout, config);

        // Show custom toggle buttons
        document.getElementById('viewToggleContainer').style.display = 'block';
    },

    /**
     * Renders an energy flow comparison chart showing original vs optimized data.
     * @param {Array} simulatedData - The simulation results with battery intervention
     * @param {String} startDate - Simulation start date (ISO format)
     * @param {String} endDate - Simulation end date (ISO format)
     * @param {Array} originalData - The filtered original merged data
     * @param {String} viewType - 'power' or 'energy' (default: 'energy')
     * @param {String} aggregationLevel - '15min', 'daily', or 'monthly'
     */
    renderEnergyFlowChart(simulatedData, startDate, endDate, originalData, viewType = 'energy', aggregationLevel = '15min') {
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

        // Apply aggregation
        const aggregatedSimData = App.getAggregatedData(filteredSimData, aggregationLevel, viewType);
        const aggregatedOrigData = App.getAggregatedData(filteredOrigData, aggregationLevel, viewType);

        // Prepare solar data (only solar switches between kW and kWh)
        const solarPower = aggregatedSimData.map(d => d.productionKw);
        // For aggregated data, productionKw already contains correct value based on view mode
        // For 15min data, we still need to convert kW to kWh by multiplying by 0.25
        const solarEnergy = aggregatedSimData.map(d => aggregationLevel === '15min' ? d.productionKw * 0.25 : d.productionKw);
        const solarData = viewType === 'power' ? solarPower : solarEnergy;
        const solarName = viewType === 'power' ? 'Solar Production (kW)' : 'Solar Energy (kWh)';
        const solarUnit = viewType === 'power' ? 'kW' : 'kWh';
        const yAxisTitle = viewType === 'power' ? 'Power (kW) / Energy (kWh)' : 'Energy (kWh)';

        const timestamps = aggregatedSimData.map(d => d.timestamp);

        // Use bar chart for aggregated data, line chart for 15min
        // Power mode is always 15min (not aggregated)
        const isAggregated = aggregationLevel !== '15min' && viewType === 'energy';

        // Trace 1: Solar Production/Energy (area fill for 15min, bars for aggregated)
        const solarTrace = isAggregated ? {
            x: timestamps,
            y: solarData,
            name: solarName,
            type: 'bar',
            marker: { color: '#fbbf24' },
            yaxis: 'y',
            hovertemplate: `<b>Solar</b><br>%{y:.2f} ${solarUnit}<extra></extra>`
        } : {
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
        const origImportTrace = isAggregated ? {
            x: timestamps,
            y: aggregatedOrigData.map(d => d.importKwh),
            name: 'Original Import (kWh)',
            type: 'bar',
            marker: { color: '#3b82f6' },
            yaxis: 'y',
            hovertemplate: '<b>Original Import</b><br>%{y:.2f} kWh<extra></extra>'
        } : {
            x: timestamps,
            y: aggregatedOrigData.map(d => d.importKwh),
            name: 'Original Import (kWh)',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#3b82f6', width: 2 },
            yaxis: 'y',
            hovertemplate: '<b>Original Import</b><br>%{y:.2f} kWh<extra></extra>'
        };

        // Trace 3: New Import (dashed/lighter for bars) - always kWh
        const newImportTrace = isAggregated ? {
            x: timestamps,
            y: aggregatedSimData.map(d => d.gridImportWithBattery),
            name: 'Optimized Import (kWh)',
            type: 'bar',
            marker: { color: '#93c5fd' },
            yaxis: 'y',
            hovertemplate: '<b>Optimized Import</b><br>%{y:.2f} kWh<extra></extra>'
        } : {
            x: timestamps,
            y: aggregatedSimData.map(d => d.gridImportWithBattery),
            name: 'Optimized Import (kWh)',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#93c5fd', width: 2, dash: '5,5' },
            yaxis: 'y',
            hovertemplate: '<b>Optimized Import</b><br>%{y:.2f} kWh<extra></extra>'
        };

        // Trace 4: Original Export (solid green) - always kWh
        const origExportTrace = isAggregated ? {
            x: timestamps,
            y: aggregatedOrigData.map(d => d.exportKwh),
            name: 'Original Export (kWh)',
            type: 'bar',
            marker: { color: '#10b981' },
            yaxis: 'y',
            hovertemplate: '<b>Original Export</b><br>%{y:.2f} kWh<extra></extra>'
        } : {
            x: timestamps,
            y: aggregatedOrigData.map(d => d.exportKwh),
            name: 'Original Export (kWh)',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#10b981', width: 2 },
            yaxis: 'y',
            hovertemplate: '<b>Original Export</b><br>%{y:.2f} kWh<extra></extra>'
        };

        // Trace 5: New Export (dashed/lighter for bars) - always kWh
        const newExportTrace = isAggregated ? {
            x: timestamps,
            y: aggregatedSimData.map(d => d.gridExportWithBattery),
            name: 'Optimized Export (kWh)',
            type: 'bar',
            marker: { color: '#6ee7b7' },
            yaxis: 'y',
            hovertemplate: '<b>Optimized Export</b><br>%{y:.2f} kWh<extra></extra>'
        } : {
            x: timestamps,
            y: aggregatedSimData.map(d => d.gridExportWithBattery),
            name: 'Optimized Export (kWh)',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#6ee7b7', width: 2, dash: '5,5' },
            yaxis: 'y',
            hovertemplate: '<b>Optimized Export</b><br>%{y:.2f} kWh<extra></extra>'
        };

        // Trace 6: Battery SOC (solid purple, right axis) - always line to avoid covering other bars
        const batterySocTrace = {
            x: timestamps,
            y: aggregatedSimData.map(d => d.batterySocKwh),
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

        // Add tick format for aggregated data
        if (aggregationLevel === 'daily') {
            layout.xaxis.tickformat = '%Y-%m-%d';
        } else if (aggregationLevel === 'monthly') {
            layout.xaxis.tickformat = '%Y-%m';
        }

        // Add barmode for aggregated data
        if (isAggregated) {
            layout.barmode = 'group';
        }

        const config = { responsive: true };

        Plotly.react('energyFlowChartContainer', 
            [solarTrace, origImportTrace, newImportTrace, origExportTrace, newExportTrace, batterySocTrace], 
            layout, 
            config
        ).then(() => {
            // Force resize to ensure proper width rendering
            setTimeout(() => {
                Plotly.Plots.resize('energyFlowChartContainer');
            }, 100);
        });
    },

    /**
     * Render battery optimization curve chart
     * @param {Array} results - Array of optimization results
     * @param {String} metricType - 'import' or 'export'
     */
    renderOptimizationCurve(results, metricType = 'import') {
        if (!results || results.length === 0) {
            console.warn('No optimization results to render');
            return;
        }

        // Extract data based on metric type
        const capacities = results.map(r => r.capacityKwh);
        const reductions = metricType === 'import' 
            ? results.map(r => r.gridImportReductionPercent)
            : results.map(r => r.gridExportReductionPercent);
        const savings = results.map(r => r.totalSavings);
        
        const currency = results[0].currency;
        const currencySymbol = currency === 'HUF' ? 'Ft' : '€';
        const decimals = currency === 'HUF' ? 0 : 2;

        // Build hover text with both reduction % and savings
        const hoverText = results.map((r, i) => 
            `${reductions[i].toFixed(1)}% / ${App.formatNumber(savings[i], decimals)} ${currencySymbol}`
        );

        // Chart title based on metric type
        const metricLabel = metricType === 'import' ? 'Grid Import Reduction' : 'Grid Export Reduction';
        const chartTitle = `Battery Optimization Curve - ${metricLabel} vs Battery Size`;

        // Create trace
        const trace = {
            x: capacities,
            y: reductions,
            name: metricLabel,
            type: 'scatter',
            mode: 'lines+markers+text',    // Added 'text' to show labels
            line: {
                color: '#a855f7',           // Purple/violet
                width: 3,
                shape: 'spline'             // Smooth curve
            },
            marker: {
                size: 10,
                color: '#a855f7',
                line: {
                    color: '#ffffff',       // White outline for better visibility
                    width: 2
                }
            },
            text: hoverText,
            textposition: 'top center',     // Position labels above markers
            textfont: {
                family: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
                size: 11,
                color: '#e6edf3'
            },
            hovertemplate: 
                '<b>Battery Size:</b> %{x} kWh<br>' +
                '<b>' + metricLabel + ':</b> %{y:.1f}%<br>' +
                '<b>Total Savings:</b> %{text}<br>' +
                '<extra></extra>'
        };

        // Layout configuration
        const layout = {
            title: {
                text: chartTitle,
                font: { 
                    color: '#e6edf3', 
                    size: 18 
                }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            template: 'plotly_dark',
            xaxis: {
                title: 'Battery Capacity (kWh)',
                gridcolor: '#495057',
                tickfont: { color: '#cbd5e1' },
                titlefont: { color: '#e6edf3' },
                type: 'linear',
                dtick: 20                   // Spacing between ticks
            },
            yaxis: {
                title: metricLabel + ' (%)',
                gridcolor: '#495057',
                tickfont: { color: '#cbd5e1' },
                titlefont: { color: '#e6edf3' },
                range: [0, Math.max(...reductions) * 1.15],  // Auto-scale with 15% padding
                zeroline: true,
                zerolinecolor: '#495057',
                zerolinewidth: 1
            },
            margin: { t: 80, b: 60, l: 70, r: 40 },
            hovermode: 'closest',
            hoverlabel: {
                bgcolor: '#1e293b',
                bordercolor: '#a855f7',
                font: {
                    family: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
                    size: 14,
                    color: '#e6edf3'
                }
            },
            annotations: [
                // Annotation for 0 kWh baseline
                {
                    x: 0,
                    y: 0,
                    text: 'No Battery<br>(Baseline)',
                    showarrow: true,
                    arrowhead: 2,
                    arrowsize: 1,
                    arrowwidth: 2,
                    arrowcolor: '#cbd5e1',
                    ax: 30,
                    ay: -40,
                    font: {
                        size: 11,
                        color: '#cbd5e1'
                    },
                    bgcolor: '#1e293b',
                    bordercolor: '#495057',
                    borderwidth: 1,
                    borderpad: 4
                }
            ]
        };

        const config = { 
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['lasso2d', 'select2d'],
            toImageButtonOptions: {
                format: 'png',
                filename: 'battery_optimization_curve',
                height: 600,
                width: 1200,
                scale: 2
            }
        };

        // Render chart
        Plotly.newPlot('optimizationCurveContainer', [trace], layout, config)
            .then(() => {
                // Force resize to ensure proper width (consistent with other charts)
                setTimeout(() => {
                    Plotly.Plots.resize('optimizationCurveContainer');
                }, 100);
            });
    }
};