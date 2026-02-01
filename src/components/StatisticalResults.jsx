import React, { useState, useRef } from 'react';
import api from '../services/api';
import { toPng } from 'html-to-image';

// --- Helper Components ---
const StatCard = ({ label, value, color }) => ( <div className={`${color} rounded-xl p-6 border shadow-lg`}><div className="text-center"><p className="text-sm font-medium opacity-80 mb-1">{label}</p><p className="text-3xl font-bold">{value}</p></div></div> );
const AIExplanation = ({ explanation, isLoading, error }) => { if (isLoading) return <div className="text-center p-4"><p className="text-gray-600 animate-pulse">🤖 Cerebras AI is thinking...</p></div>; if (error) return <p className="text-red-500 text-sm text-center mt-2">{error}</p>; if (!explanation) return null; return ( <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border animate-fade-in"><div className="flex items-center gap-2 mb-4"><span className="text-2xl">🤖</span><h3 className="text-lg font-bold">AI Data Interpretation</h3></div><div className="prose prose-sm max-w-none whitespace-pre-wrap">{explanation}</div></div> );};
const AnovaTable = ({ tableData }) => { if (!tableData || !tableData.columns || !tableData.data) return null; return (<div className="overflow-x-auto bg-white rounded-lg border"><table className="min-w-full divide-y"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium uppercase">Factor</th>{tableData.columns.map(col => <th key={col} className="px-6 py-3 text-left text-xs font-medium uppercase">{col}</th>)}</tr></thead><tbody className="bg-white divide-y">{tableData.data.map((row, rowIndex) => (<tr key={rowIndex}><td className="px-6 py-4 text-sm font-medium">{tableData.index[rowIndex]}</td>{row.map((cell, cellIndex) => <td key={cellIndex} className="px-6 py-4 text-sm">{cell !== null ? formatNumber(cell, 4) : 'N/A'}</td>)}</tr>))}</tbody></table></div>);};
const ScatterPlotNotification = ({ message, onSwitchTab }) => (<div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center space-y-4 animate-fade-in"><span className="text-4xl">📈</span><h3 className="text-lg font-bold text-gray-800">Scatter Plot Generated!</h3><p className="text-gray-600">{message}</p><button onClick={onSwitchTab} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700">Go to Data Visualization Tab</button></div>);

// --- Formatting Functions ---
const formatNumber = (num, digits = 2) => (typeof num !== 'number' || isNaN(num) ? 'N/A' : num.toFixed(digits));

// THE NEW, MORE DETAILED P-VALUE FORMATTER
const formatPValue = (p) => {
    if (typeof p !== 'number' || isNaN(p)) return 'N/A';
    if (p < 0.001) {
        // For very small p-values, show both the simplified and the exact scientific notation
        return (
            <>
                &lt; 0.001 <br />
                <span className="text-xs text-gray-500">({p.toExponential(2)})</span>
            </>
        );
    }
    return p.toFixed(3);
};

// --- THE MAIN COMPONENT ---
function StatisticalResults({ analysisResult, onSwitchTab }) {
  const [explanation, setExplanation] = useState('');
  const [isExplainLoading, setIsExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState('');
  const resultRef = useRef(null);

  if (!analysisResult || !analysisResult.results) { return null; }
  
  const { results } = analysisResult;
  const { analysis_type } = results;

  const handleDownloadImage = () => { if (!resultRef.current) return; toPng(resultRef.current, { cacheBust: true, backgroundColor: '#FFFFFF', pixelRatio: 2 }).then((dataUrl) => { const link = document.createElement('a'); link.download = `${analysis_type?.replace(/ /g, '_')}_results.png`; link.href = dataUrl; link.click(); }).catch((err) => console.error('Download failed', err)); };
  const handleExplainClick = async () => { setIsExplainLoading(true); setExplainError(''); setExplanation(''); try { const response = await api.post('/ai/explain', { test_name: analysis_type, results }); setExplanation(response.data.explanation); } catch (err) { setExplainError('AI service failed.'); } finally { setIsExplainLoading(false); } };
  
  const renderDescriptiveStatistics = () => {
    const { statistics, column_analyzed } = results;
    return (<div ref={resultRef} className="p-1 bg-white space-y-6"><div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border"><h2 className="text-2xl font-bold">Results: <span className="text-blue-600">{column_analyzed}</span></h2><p className="font-medium text-blue-700 mt-1">Descriptive Statistics</p></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"><StatCard label="Mean" value={formatNumber(statistics.mean)} color="bg-blue-50 text-blue-700" /><StatCard label="Median" value={formatNumber(statistics.median)} color="bg-green-50 text-green-700" /><StatCard label="Std Dev" value={formatNumber(statistics.std_dev)} color="bg-purple-50 text-purple-700" /><StatCard label="Count" value={String(statistics.count)} color="bg-orange-50 text-orange-700" /></div></div>);
  };

  const renderHypothesisTestTable = () => {
    const tableRows = [];
    if (results.before_treatment_stats) { tableRows.push({ label: `Mean, Before (${results.columns_analyzed[0]})`, value: formatNumber(results.before_treatment_stats.mean) }); tableRows.push({ label: `S.D. (±), Before`, value: formatNumber(results.before_treatment_stats.sd) }); tableRows.push({ label: `Mean, After (${results.columns_analyzed[1]})`, value: formatNumber(results.after_treatment_stats.mean) }); tableRows.push({ label: `S.D. (±), After`, value: formatNumber(results.after_treatment_stats.sd) }); }
    if (results.descriptives) { results.descriptives.forEach(group => { tableRows.push({ label: `Mean, ${group[results.categorical_column]}`, value: formatNumber(group.mean) }); tableRows.push({ label: `S.D. (±), ${group[results.categorical_column]}`, value: formatNumber(group.std) }); }); }
    if (results.test_statistics) { if (results.test_statistics.W !== undefined) tableRows.push({ label: 'W Statistic', value: formatNumber(results.test_statistics.W) }); if (results.test_statistics.Z !== undefined) tableRows.push({ label: 'Z Statistic', value: formatNumber(results.test_statistics.Z) }); if (results.test_statistics.t_statistic !== undefined) tableRows.push({ label: 't-statistic', value: formatNumber(results.test_statistics.t_statistic) }); if (results.test_statistics.f_statistic !== undefined) tableRows.push({ label: 'F-statistic', value: formatNumber(results.test_statistics.f_statistic) }); if (results.test_statistics.chi2_statistic !== undefined) tableRows.push({ label: 'Chi² Statistic', value: formatNumber(results.test_statistics.chi2_statistic) }); }
    if (results.p_value !== undefined && results.p_value !== null) tableRows.push({ label: 'p-value', value: formatPValue(results.p_value) });
    if (results.conclusion) tableRows.push({ label: 'Result', value: results.conclusion });
    return (<div ref={resultRef} className="bg-white rounded-2xl p-6 shadow-xl border"><h3 className="text-xl font-bold text-gray-800 mb-4">{analysis_type}</h3><div className="overflow-x-auto"><table className="min-w-full border"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-sm font-semibold">Parameter</th><th className="px-6 py-3 text-left text-sm font-semibold">Value</th></tr></thead><tbody>{tableRows.map((row) => (<tr key={row.label} className="hover:bg-gray-50"><td className="px-6 py-4 text-sm font-medium border-b">{row.label}</td><td className={`px-6 py-4 text-sm border-b ${row.label === 'Result' && row.value === 'Significant' ? 'font-bold text-green-600' : ''}`}>{row.value}</td></tr>))}</tbody></table></div>{results.test_statistics?.anova_table && (<div className="mt-4"><h4 className="font-semibold mb-2">ANOVA Table</h4><AnovaTable tableData={results.test_statistics.anova_table}/></div>)}</div>);
  };
  
 const renderCrosstabTable = () => {
    // THE FIX: Destructure the data based on your provided log
    const { row_variable, column_variable, table_data } = results;

    // THE FIX: The guard clause now checks the correct properties
    if (!table_data || table_data.length === 0) {
      return <p className="text-center p-6 text-red-500 font-semibold">Crosstabulation data is missing or invalid in the response.</p>;
    }
    
    // Intelligently derive the column headers from the first data row
    const headers = Object.keys(table_data[0]).filter(key => key !== 'category');
    const groupColumns = headers.filter(h => h !== 'Total');

    return (
      <div ref={resultRef} className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800">{analysis_type}</h3>
        <p className="text-sm text-gray-500 mb-4">{row_variable.replace(/_/g, ' ')} vs. {column_variable.replace(/_/g, ' ')}</p>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th rowSpan="2" className="p-2 border border-gray-300 text-left text-sm font-semibold text-gray-700">{row_variable.replace('_Group', '')}</th>
                {groupColumns.map(colName => (
                  <th key={colName} colSpan="2" className="p-2 border border-gray-300 text-center text-sm font-semibold text-gray-700">{colName}</th>
                ))}
                <th colSpan="2" className="p-2 border border-gray-300 text-center text-sm font-semibold text-gray-700">Total</th>
              </tr>
              <tr className="bg-gray-50">
                {headers.map(colName => (
                  <React.Fragment key={`${colName}-sub`}>
                    <th className="p-2 border border-gray-300 text-center text-xs font-medium text-gray-600">No.</th>
                    <th className="p-2 border border-gray-300 text-center text-xs font-medium text-gray-600">%</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {table_data.map((row, rowIndex) => (
                <tr key={rowIndex} className={`hover:bg-gray-50 ${String(row.category).includes('Total') ? 'bg-gray-100 font-bold' : ''}`}>
                  <td className="p-2 border border-gray-300 text-sm font-medium">{String(row.category)}</td>
                  {headers.map(colName => (
                    <React.Fragment key={`${colName}-${rowIndex}`}>
                      <td className="p-2 border border-gray-300 text-sm text-center">{row[colName]?.count}</td>
                      <td className="p-2 border border-gray-300 text-sm text-center">{formatNumber(row[colName]?.percent)}%</td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  
  // --- THE UPDATED BASELINE TABLE RENDERER ---
  const renderBaselineTable = () => {
    const { grouping_variable, groups, table_data } = results;
    if (!groups || !table_data) return <p>Baseline table data is missing.</p>;
    let lastVariable = null;
    return (
        <div ref={resultRef} className="bg-white rounded-2xl p-6 shadow-xl border">
            <h3 className="text-xl font-bold text-gray-800">Baseline Characteristics Table</h3>
            <p className="text-sm text-gray-500 mb-4">Distribution of variables by {grouping_variable?.replace(/_/g, ' ')}</p>
            <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 border-b-2 text-left text-sm font-semibold">Variables</th>
                            <th className="p-2 border-b-2 text-left text-sm font-semibold">Category</th>
                            {Object.entries(groups).map(([groupName, count]) => (
                                <th key={groupName} className="p-2 border-b-2 text-center text-sm font-semibold">{groupName}<br/><span className="font-normal text-xs">(N={count})</span></th>
                            ))}
                            <th className="p-2 border-b-2 text-center text-sm font-semibold">p-value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {table_data.map((row, index) => {
                            const showVariable = row.variable !== lastVariable;
                            if (showVariable) { lastVariable = row.variable; }
                            return (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className={`p-2 border-b text-sm font-medium ${showVariable ? 'pt-4 border-t-2' : ''}`}>{showVariable ? row.variable?.replace(/_/g, ' ') : ''}</td>
                                    <td className="p-2 border-b text-sm text-gray-600">{row.category}</td>
                                    {Object.keys(groups).map(groupName => (
                                        <td key={groupName} className="p-2 border-b text-sm text-center text-gray-600">{row[groupName]}</td>
                                    ))}
                                    <td className={`p-2 border-b text-sm text-center align-top ${showVariable ? 'pt-4 border-t-2' : ''} ${row.p_value < 0.05 ? 'font-bold text-green-600' : 'text-gray-600'}`}>
                                        {/* THE FIX IS HERE */}
                                        {showVariable && row.p_value !== null ? formatPValue(row.p_value) : ''}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
  };

  const renderContent = () => {
    switch (analysis_type) {
      case 'Descriptive Statistics': return renderDescriptiveStatistics();
      case 'Crosstabulation': return renderCrosstabTable();
      case 'Baseline Characteristics Table': return renderBaselineTable();
      case 'Scatter Plot Generated': return <ScatterPlotNotification message={results.message} onSwitchTab={onSwitchTab} />;
      default: return renderHypothesisTestTable();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
        {renderContent()}
        {analysis_type !== 'Scatter Plot Generated' && (
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                <button onClick={handleDownloadImage} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"><span>📥</span>Download PNG</button>
                <button onClick={handleExplainClick} disabled={isExplainLoading} className="w-full bg-gradient-to-r from-gray-700 to-gray-900 text-white font-bold py-3 px-4 rounded-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    🤖<span>{isExplainLoading ? 'Analyzing...' : 'Get AI Interpretation'}</span>
                </button>
                <div className="mt-4"><AIExplanation explanation={explanation} isLoading={isExplainLoading} error={explainError} /></div>
            </div>
        )}
    </div>
  );
}

export default StatisticalResults;