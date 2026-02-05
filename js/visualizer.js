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
    }
};