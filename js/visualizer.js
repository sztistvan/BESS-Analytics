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
        
        const solarTrace = {
            x: timestamps,
            y: data.map(d => d.productionKw),
            name: 'Solar Production (kW)',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#fbbf24', width: 1.5 }
        };

        const importTrace = {
            x: timestamps,
            y: data.map(d => d.importKwh),
            name: 'Grid Import (kWh)',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#3b82f6', width: 1 }
        };

        const exportTrace = {
            x: timestamps,
            y: data.map(d => d.exportKwh),
            name: 'Grid Export (kWh)',
            type: 'scatter',
            mode: 'lines',
            line: { color: '#10b981', width: 1 }
        };

        const layout = {
            title: {
                text: 'Energy Data Overview',
                font: { color: '#e6edf3' }
            },
            paper_bgcolor: 'rgba(0,0,0,0)', // Átlátszó háttér, hogy a CSS érvényesüljön
            plot_bgcolor: 'rgba(0,0,0,0)',
            template: 'plotly_dark',
            xaxis: { 
                title: 'Time', 
                gridcolor: '#30363d',
                rangeslider: { visible: true, bgcolor: '#161b22' } 
            },
            yaxis: { 
                title: 'Value (kW / kWh)',
                gridcolor: '#30363d'
            },
            margin: { t: 50, b: 50, l: 50, r: 20 },
            hovermode: 'x unified'
        };

        const config = { responsive: true };

        Plotly.newPlot('chartContainer', [solarTrace, importTrace, exportTrace], layout, config);
    }
};