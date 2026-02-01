import React, { useState, useRef } from 'react';

// --- STEP 1: IMPORT CHART.JS AND THE REACT WRAPPER ---
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie, Scatter } from 'react-chartjs-2';

// --- STEP 2: REGISTER THE COMPONENTS YOU WILL USE ---
ChartJS.register(
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

// --- A simple color palette for our charts ---
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#6366F1'];
const BORDER_COLORS = COLORS.map(color => `${color}B3`);
const BACKGROUND_COLORS = COLORS.map(color => `${color}33`);


// --- The Main Dynamic Visualization Component ---

function DataVisualization({ analysisResult }) {
  const [selectedChart, setSelectedChart] = useState('auto');
  // This ref will hold the Chart.js instance
  const chartRef = useRef(null);
  const vizData = analysisResult?.visualization_data;

  // --- THE NEW, DEFINITIVE DOWNLOAD HANDLER FOR TRANSPARENT PNG ---
  const handleDownload = () => {
    const chart = chartRef.current;
    if (chart === null) {
      alert('Could not export chart. Please wait for it to render.');
      return;
    }

    // --- THE FIX IS HERE ---
    // 1. Get the original canvas from the chart instance.
    const originalCanvas = chart.canvas;

    // 2. Create a new, temporary canvas in memory.
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = originalCanvas.width;
    offscreenCanvas.height = originalCanvas.height;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    
    // 3. This is the crucial step. Before drawing, we fill our temporary
    //    canvas with a transparent background.
    offscreenCtx.fillStyle = 'rgba(0, 0, 0, 0)'; // Fully transparent
    offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    
    // 4. Now, we draw the existing (potentially non-transparent) chart image
    //    ONTO our new transparent canvas.
    offscreenCtx.drawImage(originalCanvas, 0, 0);

    // 5. We get the data URL from our new, transparent canvas.
    const dataUrl = offscreenCanvas.toDataURL('image/png');

    // 6. Trigger the download.
    const link = document.createElement('a');
    const fileName = `${vizData?.title?.replace(/ /g, '_') || 'chart'}_${selectedChart}.png`;
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  };

  // --- The render logic using Chart.js ---
  const renderChart = () => {
    if (!vizData) {
      return <div className="p-10 bg-gray-50 rounded-lg"><p className="text-gray-500 text-center">No visualization available for this analysis.</p></div>;
    }

    const chartToRender = selectedChart === 'auto' ? vizData.chart_type : selectedChart;
    
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { color: '#374151' } },
            title: { display: true, text: vizData.title, font: { size: 16 }, color: '#111827' },
        },
        scales: {
            x: { ticks: { color: '#4B5563' }, grid: { color: '#E5E7EB' } },
            y: { ticks: { color: '#4B5563' }, grid: { color: '#E5E7EB' } },
        }
    };

    switch (chartToRender) {
      case 'histogram':
      case 'bar_chart': {
        if (!vizData.labels || !vizData.values) return null;
        const data = { labels: vizData.labels, datasets: [{ label: vizData.title || 'Count', data: vizData.values, backgroundColor: BACKGROUND_COLORS, borderColor: BORDER_COLORS, borderWidth: 1 }] };
        return <Bar ref={chartRef} options={commonOptions} data={data} />;
      }
      case 'line_chart': {
        if (!vizData.labels || !vizData.values) return null;
        const data = { labels: vizData.labels, datasets: [{ label: vizData.title || 'Value', data: vizData.values, fill: false, borderColor: COLORS[0], backgroundColor: COLORS[0], tension: 0.1 }] };
        return <Line ref={chartRef} options={commonOptions} data={data} />;
      }
      case 'pie_chart': {
        if (!vizData.labels || !vizData.values) return null;
        const data = { labels: vizData.labels, datasets: [{ label: 'Count', data: vizData.values, backgroundColor: COLORS, borderColor: '#FFFFFF', borderWidth: 2 }] };
        const pieOptions = { ...commonOptions, plugins: { ...commonOptions.plugins, legend: { position: 'right' } } };
        return <Pie ref={chartRef} options={pieOptions} data={data} />;
      }
      case 'grouped_bar_chart': {
        if (!vizData.labels || !vizData.datasets) return null;
        const data = { labels: vizData.labels, datasets: vizData.datasets.map((ds, index) => ({ ...ds, backgroundColor: BACKGROUND_COLORS[index % COLORS.length], borderColor: BORDER_COLORS[index % COLORS.length], borderWidth: 1 })) };
        return <Bar ref={chartRef} options={commonOptions} data={data} />;
      }
      case 'scatter_plot': {
        if (!vizData.points || !vizData.x_label || !vizData.y_label) return null;
        const data = { datasets: [{ label: vizData.title, data: vizData.points.map(p => ({ x: p[0], y: p[1] })), backgroundColor: BACKGROUND_COLORS[0], borderColor: BORDER_COLORS[0] }] };
        const scatterOptions = { ...commonOptions, scales: { x: { title: { display: true, text: vizData.x_label, color: '#374151' } }, y: { title: { display: true, text: vizData.y_label, color: '#374151' } } } };
        return <Scatter ref={chartRef} options={scatterOptions} data={data} />;
      }
    }
    return <div className="p-10 bg-gray-50 rounded-lg"><p className="text-gray-600 text-center">The selected chart type is not compatible with this analysis data.</p></div>;
  };

  const getCompatibleCharts = () => {
    if (!vizData) return [];
    const options = [{ value: 'auto', label: 'Auto (Recommended)' }];
    if (vizData.labels && vizData.values) { options.push({ value: 'bar_chart', label: 'Bar Chart' }); options.push({ value: 'line_chart', label: 'Line Chart' }); options.push({ value: 'pie_chart', label: 'Pie Chart' }); }
    if (vizData.labels && vizData.datasets) { options.push({ value: 'grouped_bar_chart', label: 'Grouped Bar Chart' }); }
    if (vizData.points) { options.push({ value: 'scatter_plot', label: 'Scatter Plot' }); }
    return options;
  };
  const compatibleCharts = getCompatibleCharts();

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
                <div className="flex items-center gap-2"><span className="text-2xl">📊</span><h2 className="text-2xl font-bold">Analysis Visualization</h2></div>
                <p className="text-gray-600 mt-1">Visualizing: '{analysisResult?.results?.analysis_type}'</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
                <select value={selectedChart} onChange={(e) => setSelectedChart(e.target.value)} className="block w-44 sm:w-56 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                    {compatibleCharts.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <button onClick={handleDownload} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2">
                    <span>📥</span><span>Export Chart</span>
                </button>
            </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl border">
          <div className="relative h-[320px] sm:h-96">
            {renderChart()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataVisualization;