import React, { useState, useEffect } from 'react';
import Select from 'react-select';

// A standard single-select dropdown component
const ColumnSelector = ({ label, options, value, onChange, placeholder = "-- Select a column --" }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <select
            value={value}
            onChange={onChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-gray-100"
        >
            <option value="">{placeholder}</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

// The multi-select component for Crosstabulation
const MultiColumnSelector = ({ label, options, value, onChange }) => {
    const selectOptions = options.map(opt => ({ value: opt, label: opt }));
    const selectedValues = selectOptions.filter(opt => value.includes(opt.value));

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <Select
                isMulti
                options={selectOptions}
                value={selectedValues}
                onChange={(selectedOptions) => onChange(selectedOptions.map(opt => opt.value))}
                className="mt-1"
                classNamePrefix="select"
                placeholder="Select 2 or more columns..."
                styles={{
                    control: (base) => ({
                        ...base,
                        backgroundColor: 'var(--select-bg, #f9fafb)',
                        borderColor: 'var(--select-border, #d1d5db)',
                        color: 'var(--select-text, #374151)'
                    }),
                    menu: (base) => ({
                        ...base,
                        backgroundColor: 'var(--select-menu-bg, #ffffff)',
                        color: 'var(--select-menu-text, #374151)'
                    }),
                    option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused ? 'var(--select-option-hover, #e5e7eb)' : 'transparent',
                        color: 'var(--select-option-text, #374151)'
                    })
                }}
            />
        </div>
    );
};


function DataAnalysisConfig({ onRunAnalysis, dataProfile, isLoading }) {
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [analysisParams, setAnalysisParams] = useState({});

  // THE COMPLETE, UNABRIDGED LIST OF ANALYSIS TYPES
  const analysisTypes = [
    { name: 'Crosstabulation', description: 'Create a multi-variable frequency table and graph.', params: [{ key: 'variables', label: 'Select 2 or more variables' }] },
    { name: 'Baseline Characteristics Table', description: 'Create a publication-ready summary (Table 1) of all variables by a grouping variable.', params: [{ type: 'categorical', key: 'grouping_variable', label: 'Primary Grouping Variable' }] },
    { name: 'Descriptive Statistics', description: 'Mean, median, mode, etc.', params: [{ type: 'numeric', key: 'column', label: 'Numeric Column' }] },
    { name: 'One-Sample T-Test', description: 'Test against a specific value', params: [{ type: 'numeric', key: 'column', label: 'Numeric Column' }] },
    { name: 'Paired T-Test', description: 'Compare two related samples', params: [{ type: 'numeric', key: 'numeric_col_1', label: 'Column 1' }, { type: 'numeric', key: 'numeric_col_2', label: 'Column 2' }] },
    { name: 'Unpaired T-Test', description: 'Compare two independent samples', params: [{ type: 'numeric', key: 'numeric_column', label: 'Numeric Variable' }, { type: 'categorical', key: 'categorical_column', label: 'Grouping Variable' }] },
    { name: 'One-Way ANOVA', description: 'Compare means across multiple groups', params: [{ type: 'numeric', key: 'numeric_column', label: 'Numeric Variable' }, { type: 'categorical', key: 'categorical_column', label: 'Grouping Factor' }] },
    { name: 'Two-Way ANOVA', description: 'Analyze effects of two factors', params: [{ type: 'numeric', key: 'numeric_column', label: 'Numeric Variable' }, { type: 'categorical', key: 'categorical_col_1', label: 'Factor 1' }, { type: 'categorical', key: 'categorical_col_2', label: 'Factor 2' }] },
    { name: 'Wilcoxon Signed-Rank Test', description: 'Non-parametric test for two related samples', params: [{ type: 'numeric', key: 'numeric_col_1', label: 'Column 1' }, { type: 'numeric', key: 'numeric_col_2', label: 'Column 2' }] },
    { name: 'Chi-Square Test', description: 'Test association between two categorical variables', params: [{ type: 'categorical', key: 'categorical_col_1', label: 'Variable 1' }, { type: 'categorical', key: 'categorical_col_2', label: 'Variable 2' }] },
  ];

  useEffect(() => {
    setAnalysisParams({});
  }, [selectedAnalysis]);
  
  const handleAnalysisClick = (analysis) => {
    if (isLoading) return;
    setSelectedAnalysis(analysis);
    try {
      window.__gemmaTour = window.__gemmaTour || {};
      window.__gemmaTour.analysisChosen = true;
      window.dispatchEvent(new CustomEvent('gemma:analysisChosen'));
    } catch (e) {}
  };
  
  const handleParamChange = (key, value) => {
    setAnalysisParams(prev => ({ ...prev, [key]: value }));
  };

  const handleRunAnalysis = () => {
    if (!selectedAnalysis) return;
    onRunAnalysis(selectedAnalysis.name, analysisParams);
    try {
      window.__gemmaTour = window.__gemmaTour || {};
      window.__gemmaTour.analysisRun = true;
      window.dispatchEvent(new CustomEvent('gemma:analysisRun'));
    } catch (e) {}
  };

  const isRunButtonDisabled = () => {
      if (isLoading || !selectedAnalysis) return true;
      if (selectedAnalysis.name === 'Crosstabulation') {
          // This logic is now correct for the multi-select
          return !analysisParams.variables || analysisParams.variables.length < 2;
      }
      // This is for all other single-select tests
      return selectedAnalysis.params.some(param => !analysisParams[param.key]);
  };

  const allColumns = [...(dataProfile?.numeric_columns || []), ...(dataProfile?.categorical_columns || [])];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">1. Choose Analysis Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analysisTypes.map((analysis) => (
            <div
              key={analysis.name}
              onClick={() => handleAnalysisClick(analysis)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${selectedAnalysis?.name === analysis.name ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg transform scale-105' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800 dark:text-gray-100">{analysis.name}</h4>
                {selectedAnalysis?.name === analysis.name && <span className="text-blue-600 dark:text-blue-400 text-lg">✓</span>}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{analysis.description}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedAnalysis && dataProfile && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg animate-fade-in">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">2. Select Columns for: <span className="text-blue-600 dark:text-blue-400">{selectedAnalysis.name}</span></h3>
          <div className="space-y-4">
            {/* THE FIX IS HERE: We now correctly render the MultiColumnSelector for Crosstabulation */}
            {selectedAnalysis.name === 'Crosstabulation' ? (
                <MultiColumnSelector
                    label="Select variables (first will be rows, others columns)"
                    options={allColumns}
                    value={analysisParams.variables || []}
                    onChange={(value) => handleParamChange('variables', value)}
                />
            ) : (
                selectedAnalysis.params.map(param => (
                    <ColumnSelector 
                        key={param.key} 
                        label={param.label} 
                        options={param.type ? (param.type === 'numeric' ? dataProfile.numeric_columns : dataProfile.categorical_columns) : allColumns}
                        value={analysisParams[param.key] || ''} 
                        onChange={(e) => handleParamChange(param.key, e.target.value)} 
                    />
                ))
            )}
          </div>
          <button
            onClick={handleRunAnalysis}
            disabled={isRunButtonDisabled()}
            className="mt-6 w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Running...' : 'Run Analysis'}
          </button>
        </div>
      )}
    </div>
  );
}

export default DataAnalysisConfig;