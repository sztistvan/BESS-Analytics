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
            fillcolor: 'rgba(226, 203, 128, 0.2)'

        };

        const importTrace = {
            x: timestamps,
            y: importData,
            name: 'Grid Import (kWh)',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#3b82f6', width: 2 }
        };

        const exportTrace = {
            x: timestamps,
            y: exportData,
            name: 'Grid Export (kWh)',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#10b981', width: 2 }
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
                gridcolor: '#30363d',
                rangeslider: { visible: true, bgcolor: '#161b22' } 
            },
            yaxis: { 
                title: 'Energy (kWh)', //'Value (kW / kWh)',
                gridcolor: '#30363d'
            },
            // Add toggle buttons for switching between Power and Energy views
            updatemenus: [{
                active: 1, // Default to Energy view
                buttons: [
                    {
                        args: [
                            // 1st object: Updates for traces (data and legend names)
                            { 
                                'y': [solarPower, importData, exportData],
                                'name': ['Solar Production (kW)', 'Grid Import (kWh)', 'Grid Export (kWh)'] 
                            },
                            // 2nd object: Updates for layout (axis titles)
                            { 
                                'yaxis.title.text': 'Power (kW) / Energy (kWh)' 
                            }
                        ],
                        label: 'Show Power (kW)',
                        method: 'update'
                    },
                    {
                        args: [
                            // 1st object: Updates for traces (data and legend names)
                            { 
                                'y': [solarEnergy, importData, exportData],
                                'name': ['Solar Energy (kWh)', 'Grid Import (kWh)', 'Grid Export (kWh)'] 
                            },
                            // 2nd object: Updates for layout (axis titles)
                            { 
                                'yaxis.title.text': 'Energy (kWh)' 
                            }
                        ],
                        label: 'Show Energy (kWh)',
                        method: 'update'
                    }
                ],
                direction: 'left',
                pad: { 'r': 10, 't': 10 },
                showactive: true,
                type: 'buttons',
                x: 0.1,
                xanchor: 'left',
                y: 1.15,
                yanchor: 'top',
                font: { color: '#ffffff' },
                bgcolor: '#1f5a9e',
                bordercolor: '#30363d'
            }],
            margin: { t: 80, b: 50, l: 50, r: 20 },
            hovermode: 'x unified'
        };

        const config = { responsive: true };

        Plotly.newPlot('chartContainer', [solarTrace, importTrace, exportTrace], layout, config);
    }
};