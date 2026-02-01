import React, { useRef, useEffect } from 'react';

// Plotly Partial Bundle Setup
import Plotly from 'plotly.js/lib/core';
import Box from 'plotly.js/lib/box';
import Heatmap from 'plotly.js/lib/heatmap';
Plotly.register([Box, Heatmap]);
import Plot from 'react-plotly.js';

// Chart.js imports for standard charts
import {
    Chart,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { FiDownload } from 'react-icons/fi';

// Simple registration for standard Chart.js components
Chart.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

// Helper function to generate an array of distinct colors for Chart.js
const generateChartJSColors = (numColors) => {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        const hue = (i * 137.508) % 360;
        colors.push(`hsla(${hue}, 75%, 60%, 0.8)`);
    }
    return colors;
};


export default function ChartRenderer({ result }) {
    const canvasRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const plotlyRef = useRef(null);

    const { type } = result.visualization;
    const resolveChartJSType = (t) => {
        const name = String(t || '').toLowerCase();
        if (name === 'line_plot' || name === 'line') return 'line';
        if (name === 'scatter_plot' || name === 'scatter') return 'scatter';
        if (name === 'grouped_bar_chart' || name === 'histogram' || name === 'bar') return 'bar';
        if (name === 'pie' || name === 'doughnut') return 'pie';
        if (name === 'table' || name === 'boxplot' || name === 'heatmap') return name; // handled elsewhere
        return 'bar'; // safe fallback for unknown/custom types
    };
    const chartDataJSON = result.chart_data;

    // This robust useEffect hook correctly handles the Chart.js lifecycle.
    useEffect(() => {
        const isPlotlyChart = ['boxplot', 'heatmap'].includes(type);

        // Always clean up any existing Chart.js instance when switching away
        if (isPlotlyChart || type === 'table' || !canvasRef.current) {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
            return;
        }

        // Proactively destroy any chart bound to this canvas (handles StrictMode double-mounts)
        try {
            const existing = Chart.getChart(canvasRef.current);
            if (existing) existing.destroy();
        } catch (_) {}

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
            chartInstanceRef.current = null;
        }

        const labels = chartDataJSON.data.map(row => row[0]);
        const datasets = chartDataJSON.columns.slice(1).map((col, i) => {
            const data = chartDataJSON.data.map(row => row[i + 1]);
            const baseColor = generateChartJSColors(chartDataJSON.columns.length - 1)[i];
            
            return {
                label: col,
                data: type === 'scatter' ? data.map((val, index) => ({ x: labels[index], y: val })) : data,
                backgroundColor: type === 'pie' ? generateChartJSColors(data.length) : baseColor,
                borderColor: type === 'pie' ? '#ffffff' : baseColor,
                borderWidth: type === 'pie' ? 2 : 1.5,
                fill: type !== 'line_plot',
            };
        });
        
        const chartConfig = {
            type: resolveChartJSType(type),
            data: {
                labels: resolveChartJSType(type) === 'scatter' ? undefined : labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        display: !['pie'].includes(type) && (datasets.length > 1)
                    },
                    title: { display: true, text: result.visualization.title, font: { size: 16 } },
                },
                scales: {
                    x: {
                        display: !['pie'].includes(type),
                        title: { display: !!result.visualization.x_label, text: result.visualization.x_label },
                    },
                    y: {
                        display: !['pie'].includes(type),
                        title: { display: !!result.visualization.y_label, text: result.visualization.y_label || 'Value' }
                    },
                },
            }
        };

        const ctx = canvasRef.current.getContext('2d');
        chartInstanceRef.current = new Chart(ctx, chartConfig);

        return () => {
            if (chartInstanceRef.current) {
                try { chartInstanceRef.current.destroy(); } catch (_) {}
                chartInstanceRef.current = null;
            }
            // Secondary safety: ensure the canvas has no lingering chart association
            try {
                const existing = Chart.getChart(canvasRef.current);
                if (existing) existing.destroy();
            } catch (_) {}
        };
    }, [result]); 

    const handleExport = async () => {
        const fileName = (result.visualization.title || 'chart').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const isPlotlyChart = ['boxplot', 'heatmap'].includes(type);
        if (isPlotlyChart && plotlyRef.current) {
            const plotlyInstance = await plotlyRef.current.getPlotly();
            Plotly.downloadImage(plotlyInstance, { format: 'png', width: 800, height: 600, filename: fileName });
        } else if (chartInstanceRef.current) {
            const image = chartInstanceRef.current.toBase64Image('image/png', 1);
            const link = document.createElement('a');
            link.href = image;
            link.download = `${fileName}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const rawOutput = result.python_code.execution_result;

    if (!chartDataJSON || chartDataJSON.data.length === 0) {
        if (type === 'single_value' || (rawOutput && !rawOutput.toLowerCase().includes('error'))) {
            return (
                <div className="text-center p-6 flex flex-col justify-center items-center h-full">
                    <h4 className="text-lg text-gray-500 dark:text-gray-400">{result.visualization.title}</h4>
                    <p className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-100 mt-2 whitespace-pre-wrap">{rawOutput.trim()}</p>
                </div>
            );
        }
        return <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto h-full"><code>{rawOutput || "No output to display."}</code></pre>;
    }


    const renderChart = () => {
        const isPlotlyChart = ['boxplot', 'heatmap'].includes(type);

        if (isPlotlyChart) {
            let plotlyData;
            let plotlyLayout;

            if (type === 'boxplot') {
                const labels = chartDataJSON.data.map(row => row[0]);
                const categories = [...new Set(labels)];
                plotlyData = categories.map(cat => ({
                    y: chartDataJSON.data.filter(row => row[0] === cat).map(row => row[1]),
                    name: cat,
                    type: 'box',
                    boxpoints: 'Outliers'
                }));
                plotlyLayout = {
                    title: result.visualization.title,
                    xaxis: { title: result.visualization.x_label || 'Category' },
                    yaxis: { title: result.visualization.y_label || 'Value' },
                    showlegend: categories.length > 1 && categories.length < 20,
                    autosize: true
                };
            } else if (type === 'heatmap') {
                const xLabels = chartDataJSON.columns.slice(1);
                const yLabels = chartDataJSON.data.map(row => row[0]);
                const zValues = chartDataJSON.data.map(row => row.slice(1));
                
                plotlyData = [{
                    x: xLabels,
                    y: yLabels,
                    z: zValues,
                    type: 'heatmap',
                    colorscale: 'Viridis',
                    reversescale: true
                }];
                plotlyLayout = {
                    title: result.visualization.title,
                    xaxis: { title: result.visualization.x_label || chartDataJSON.columns[0] },
                    yaxis: { title: result.visualization.y_label },
                    autosize: true
                };
            }

            return (
                <Plot
                    ref={plotlyRef}
                    data={plotlyData}
                    layout={plotlyLayout}
                    style={{ width: '100%', height: '100%' }}
                    useResizeHandler={true}
                />
            );
        } 
        
        // --- NEW: TABLE RENDERING LOGIC ---
        else if (type === 'table') {
            return (
                <div className="overflow-auto w-full h-full">
                    <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                            <tr>
                                {chartDataJSON.columns.map((col, index) => (
                                    <th key={index} scope="col" className="px-6 py-3">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {chartDataJSON.data.map((row, rowIndex) => (
                                <tr key={rowIndex} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                    {row.map((val, cellIndex) => (
                                        <td key={cellIndex} className="px-6 py-4 whitespace-pre-wrap">{String(val)}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
        
        else {
            // For all other Chart.js types, render the canvas for the useEffect to manage.
            return <canvas ref={canvasRef}></canvas>;
        }
    };

    return (
        <div className="relative w-full h-full group bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="w-full h-full p-4">
                {renderChart()}
            </div>
            <div className="absolute top-2 right-2">
                {/* Hide export button for tables */}
                {type !== 'table' && (
                    <button
                        onClick={handleExport}
                        className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-blue-600 transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Export as PNG"
                    >
                        <FiDownload size={18} />
                    </button>
                )}
            </div>
        </div>
    );
}