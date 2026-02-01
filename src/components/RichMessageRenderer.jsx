import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { Bar, Line, Pie, Scatter, Doughnut } from 'react-chartjs-2';
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
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Color palettes for charts
const COLOR_SCHEMES = {
  default: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#6366F1'],
  vibrant: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'],
  pastel: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#E0BBE4', '#FEC8D8', '#D4F1F4', '#C9E4DE'],
  professional: ['#2E4057', '#048A81', '#54C6EB', '#F18F01', '#C73E1D', '#6A994E', '#BC4749', '#A7C957'],
  monochrome: ['#1F2937', '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6'],
};

function RichMessageRenderer({ content, analysisData }) {
  const parts = parseContentParts(content, analysisData);

  return (
    <div className="rich-message-content space-y-3">
      {parts.map((part, idx) => {
        if (part.type === 'text') {
          return (
            <ReactMarkdown
              key={idx}
              remarkPlugins={[remarkMath, remarkGfm]}
              rehypePlugins={[rehypeKatex, rehypeRaw]}
              components={{
                code: ({node, inline, className, children, ...props}) => {
                  return inline ? (
                    <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-sm font-mono text-pink-600 dark:text-pink-400" {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className="block p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-mono overflow-x-auto" {...props}>
                      {children}
                    </code>
                  );
                },
                table: ({children}) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({children}) => (
                  <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>
                ),
                th: ({children}) => (
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {children}
                  </th>
                ),
                td: ({children}) => (
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 border-t border-gray-200 dark:border-gray-700">
                    {children}
                  </td>
                ),
                ul: ({children}) => (
                  <ul className="list-disc list-inside space-y-1 ml-2">{children}</ul>
                ),
                ol: ({children}) => (
                  <ol className="list-decimal list-inside space-y-1 ml-2">{children}</ol>
                ),
                h3: ({children}) => (
                  <h3 className="text-lg font-bold mt-4 mb-2 text-gray-800 dark:text-gray-100">{children}</h3>
                ),
                h4: ({children}) => (
                  <h4 className="text-md font-semibold mt-3 mb-2 text-gray-800 dark:text-gray-100">{children}</h4>
                ),
                p: ({children}) => (
                  <p className="text-sm leading-relaxed mb-2">{children}</p>
                ),
                blockquote: ({children}) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 italic my-3 text-gray-700 dark:text-gray-300">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {part.content}
            </ReactMarkdown>
          );
        } else if (part.type === 'chart') {
          return <MiniChart key={idx} data={part.data} />;
        } else if (part.type === 'formula') {
          return <FormulaCard key={idx} data={part.data} />;
        } else if (part.type === 'stats-table') {
          return <StatsTable key={idx} data={part.data} />;
        }
        return null;
      })}
    </div>
  );
}

function parseContentParts(content, analysisData) {
  const parts = [];
  
  if (content.includes('[CHART]') && analysisData?.visualization_data) {
    const [before, after] = content.split('[CHART]');
    if (before) parts.push({ type: 'text', content: before });
    parts.push({ type: 'chart', data: analysisData.visualization_data });
    if (after) parts.push({ type: 'text', content: after });
  } else if (content.includes('[FORMULA]') && analysisData) {
    const [before, after] = content.split('[FORMULA]');
    if (before) parts.push({ type: 'text', content: before });
    parts.push({ type: 'formula', data: analysisData.results });
    if (after) parts.push({ type: 'text', content: after });
  } else if (content.includes('[STATS-TABLE]') && analysisData) {
    const [before, after] = content.split('[STATS-TABLE]');
    if (before) parts.push({ type: 'text', content: before });
    parts.push({ type: 'stats-table', data: analysisData.results });
    if (after) parts.push({ type: 'text', content: after });
  } else {
    parts.push({ type: 'text', content });
  }
  
  return parts;
}

function MiniChart({ data }) {
  const [chartType, setChartType] = useState(data?.chart_type || 'bar_chart');
  const [colorScheme, setColorScheme] = useState('default');
  const [showLegend, setShowLegend] = useState(true);
  const chartRef = useRef(null);

  if (!data) return null;

  const colors = COLOR_SCHEMES[colorScheme];
  const chartData = buildChartData(data, chartType, colors);
  const availableCharts = getAvailableChartTypes(data);

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { 
        display: showLegend,
        position: 'top',
        labels: {
          font: { size: 11 },
          padding: 10,
          usePointStyle: true,
        }
      },
      title: { 
        display: true, 
        text: data.title || 'Visualization', 
        font: { size: 13, weight: 'bold' },
        padding: { bottom: 15 }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        cornerRadius: 6,
      }
    },
    scales: ['pie_chart', 'doughnut'].includes(chartType) ? undefined : {
      x: { 
        ticks: { font: { size: 10 } },
        grid: { display: chartType !== 'scatter_plot' }
      },
      y: { 
        ticks: { font: { size: 10 } },
        grid: { color: 'rgba(0, 0, 0, 0.05)' }
      }
    }
  };

  const handleExport = () => {
    const chart = chartRef.current;
    if (!chart) return;

    const canvas = chart.canvas;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d');
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    const dataUrl = tempCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `chart_${chartType}_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-4 my-3 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex flex-wrap items-center gap-3 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Chart:</label>
          <select 
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          >
            {availableCharts.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Colors:</label>
          <select 
            value={colorScheme}
            onChange={(e) => setColorScheme(e.target.value)}
            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
          >
            <option value="default">Default</option>
            <option value="vibrant">Vibrant</option>
            <option value="pastel">Pastel</option>
            <option value="professional">Professional</option>
            <option value="monochrome">Monochrome</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input 
            type="checkbox" 
            checked={showLegend}
            onChange={(e) => setShowLegend(e.target.checked)}
            className="rounded"
          />
          <span className="text-gray-600 dark:text-gray-400">Show Legend</span>
        </label>

        <button
          onClick={handleExport}
          className="ml-auto px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
        >
          <span>📥</span>
          <span>Export PNG</span>
        </button>
      </div>

      <div className="h-64 ">
        {renderChart(chartType, chartData, options, chartRef)}
      </div>
    </div>
  );
}

function renderChart(type, data, options, ref) {
  switch (type) {
    case 'bar_chart':
    case 'histogram':
      return <Bar ref={ref} data={data} options={options} />;
    case 'line_chart':
      return <Line ref={ref} data={data} options={options} />;
    case 'pie_chart':
      return <Pie ref={ref} data={data} options={options} />;
    case 'doughnut':
      return <Doughnut ref={ref} data={data} options={options} />;
    case 'scatter_plot':
      return <Scatter ref={ref} data={data} options={options} />;
    default:
      return <Bar ref={ref} data={data} options={options} />;
  }
}

function buildChartData(data, chartType, colors) {
  if (chartType === 'scatter_plot' && data.points) {
    return {
      datasets: [{
        label: data.title || 'Data',
        data: data.points.map(p => ({ x: p[0], y: p[1] })),
        backgroundColor: colors[0] + '80',
        borderColor: colors[0],
        borderWidth: 2,
      }]
    };
  }

  return {
    labels: data.labels || [],
    datasets: data.datasets || [{
      label: data.title || 'Data',
      data: data.values || [],
      backgroundColor: colors.map(c => c + '50'),
      borderColor: colors,
      borderWidth: 2,
    }]
  };
}

function getAvailableChartTypes(data) {
  const types = [
    { value: 'bar_chart', label: '📊 Bar Chart' },
    { value: 'line_chart', label: '📈 Line Chart' },
    { value: 'pie_chart', label: '🥧 Pie Chart' },
    { value: 'doughnut', label: '🍩 Doughnut' },
  ];

  if (data.chart_type === 'histogram') {
    types.unshift({ value: 'histogram', label: '📊 Histogram' });
  }

  if (data.points || data.chart_type === 'scatter_plot') {
    types.push({ value: 'scatter_plot', label: '⚫ Scatter Plot' });
  }

  return types;
}

function FormulaCard({ data }) {
  if (!data) return null;

  const formulaInfo = getFormulaForAnalysis(data);
  if (!formulaInfo) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 my-3 border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-3">
        <span className="text-2xl">📐</span>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
            {formulaInfo.title}
          </h4>
          <div className="bg-white dark:bg-gray-800 rounded p-3 overflow-x-auto">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {formulaInfo.formula}
            </ReactMarkdown>
          </div>
          {formulaInfo.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {formulaInfo.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsTable({ data }) {
  if (!data) return null;

  const tableData = buildStatsTableData(data);
  if (!tableData) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 my-3 border border-gray-200 dark:border-gray-700 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            {tableData.headers.map((header, idx) => (
              <th key={idx} className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {tableData.rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getFormulaForAnalysis(results) {
  const type = results?.analysis_type;

  if (type === 'Descriptive Statistics') {
    return {
      title: 'Descriptive Statistics Formulas',
      formula: `Mean: $\\bar{x} = \\frac{1}{n}\\sum_{i=1}^{n} x_i$

Standard Deviation: $s = \\sqrt{\\frac{1}{n-1}\\sum_{i=1}^{n}(x_i - \\bar{x})^2}$

Variance: $s^2 = \\frac{1}{n-1}\\sum_{i=1}^{n}(x_i - \\bar{x})^2$`,
      description: 'These formulas calculate central tendency and spread of the data.'
    };
  } else if (type === 'Unpaired T-Test') {
    return {
      title: 'Independent Samples T-Test Formula',
      formula: `$t = \\frac{\\bar{x}_1 - \\bar{x}_2}{\\sqrt{\\frac{s_1^2}{n_1} + \\frac{s_2^2}{n_2}}}$

Where $\\bar{x}_1, \\bar{x}_2$ are group means, $s_1^2, s_2^2$ are variances, $n_1, n_2$ are sizes`,
      description: 'This test compares means between two independent groups.'
    };
  } else if (type === 'Paired T-Test') {
    return {
      title: 'Paired Samples T-Test Formula',
      formula: `$t = \\frac{\\bar{d}}{\\frac{s_d}{\\sqrt{n}}}$

Where $\\bar{d}$ is mean difference, $s_d$ is std dev of differences, $n$ is number of pairs`,
      description: 'This test compares means between two related groups.'
    };
  } else if (type === 'One-Way ANOVA') {
    return {
      title: 'One-Way ANOVA Formula',
      formula: `$F = \\frac{MS_{between}}{MS_{within}} = \\frac{\\frac{SS_{between}}{df_{between}}}{\\frac{SS_{within}}{df_{within}}}$

Where $SS$ = sum of squares, $MS$ = mean square, $df$ = degrees of freedom`,
      description: 'ANOVA tests if means differ across three or more groups.'
    };
  } else if (type === 'Chi-Square Test') {
    return {
      title: 'Chi-Square Test Formula',
      formula: `$\\chi^2 = \\sum \\frac{(O_i - E_i)^2}{E_i}$

Where $O_i$ = observed frequency, $E_i$ = expected frequency`,
      description: 'Tests association between categorical variables.'
    };
  }

  return null;
}

function buildStatsTableData(results) {
  const type = results?.analysis_type;

  if (type === 'Descriptive Statistics') {
    const stats = results.statistics || {};
    return {
      headers: ['Statistic', 'Value'],
      rows: [
        ['Mean', formatValue(stats.mean)],
        ['Median', formatValue(stats.median)],
        ['Std Dev', formatValue(stats.std_dev)],
        ['Min', formatValue(stats.min)],
        ['Max', formatValue(stats.max)],
        ['Count', formatValue(stats.count)],
      ].filter(row => row[1] !== 'N/A')
    };
  } else if (type === 'Unpaired T-Test' || type === 'Paired T-Test') {
    return {
      headers: ['Metric', 'Value'],
      rows: [
        ['t-statistic', formatValue(results.t_statistic)],
        ['p-value', formatValue(results.p_value)],
        ['Degrees of Freedom', formatValue(results.degrees_of_freedom)],
        ['Significance', results.p_value < 0.05 ? '✓ Significant' : '✗ Not Significant'],
      ].filter(row => row[1] !== 'N/A')
    };
  } else if (type === 'One-Way ANOVA') {
    return {
      headers: ['Metric', 'Value'],
      rows: [
        ['F-statistic', formatValue(results.f_statistic)],
        ['p-value', formatValue(results.p_value)],
        ['Between Groups df', formatValue(results.df_between)],
        ['Within Groups df', formatValue(results.df_within)],
        ['Significance', results.p_value < 0.05 ? '✓ Significant' : '✗ Not Significant'],
      ].filter(row => row[1] !== 'N/A')
    };
  } else if (type === 'Chi-Square Test') {
    return {
      headers: ['Metric', 'Value'],
      rows: [
        ['Chi-Square', formatValue(results.chi_square)],
        ['p-value', formatValue(results.p_value)],
        ['Degrees of Freedom', formatValue(results.degrees_of_freedom)],
        ['Significance', results.p_value < 0.05 ? '✓ Significant' : '✗ Not Significant'],
      ].filter(row => row[1] !== 'N/A')
    };
  }

  return null;
}

function formatValue(val) {
  if (val == null || val === undefined) return 'N/A';
  if (typeof val === 'number') {
    return val < 0.0001 && val > 0 ? val.toExponential(4) : val.toFixed(4);
  }
  return String(val);
}

export default RichMessageRenderer;
