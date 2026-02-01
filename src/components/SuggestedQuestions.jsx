import React, { useMemo } from 'react';

function SuggestedQuestions({ dataProfile, onSelect }) {
  const { numeric_columns = [], categorical_columns = [], categorical_values = {} } = dataProfile || {};

  const suggestions = useMemo(() => {
    const items = [];

    if (numeric_columns.length > 0) {
      // Descriptive suggestions
      numeric_columns.slice(0, 3).forEach(col => {
        items.push({
          label: `What are the descriptive stats for ${col}?`,
          analysis: 'Descriptive Statistics',
          params: { column: col },
        });
      });
    }

    if (numeric_columns.length >= 2) {
      // Paired tests suggestions (use first two)
      const [c1, c2] = numeric_columns;
      items.push({
        label: `Compare ${c1} before vs after ${c2} (paired)?`,
        analysis: 'Paired T-Test',
        params: { numeric_col_1: c1, numeric_col_2: c2 },
      });
    }

    // Group comparisons if any categorical with 2+ levels
    const groupable = categorical_columns.find(c => (categorical_values[c] || []).length >= 2);
    if (groupable && numeric_columns.length > 0) {
      const num = numeric_columns[0];
      items.push({
        label: `Is ${num} different across ${groupable}?`,
        analysis: 'Unpaired T-Test',
        params: { numeric_column: num, categorical_column: groupable },
      });
    }

    // Chi-square for first two categoricals with levels
    const cats = categorical_columns.filter(c => (categorical_values[c] || []).length >= 2);
    if (cats.length >= 2) {
      items.push({
        label: `Is there association between ${cats[0]} and ${cats[1]}?`,
        analysis: 'Chi-Square Test',
        params: { categorical_col_1: cats[0], categorical_col_2: cats[1] },
      });
    }

    // Crosstab recommendation
    const anyCols = [...numeric_columns, ...categorical_columns];
    if (anyCols.length >= 2) {
      items.push({
        label: `Show a crosstab of ${anyCols[0]} by ${anyCols[1]}`,
        analysis: 'Crosstabulation',
        params: { variables: [anyCols[0], anyCols[1]] },
      });
    }

    return items.slice(0, 8);
  }, [numeric_columns, categorical_columns, categorical_values]);

  if (!dataProfile) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">Suggested Questions</h3>
      {suggestions.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No suggestions available. Upload a dataset to get started.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => onSelect && onSelect(s)}
              className="px-3 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SuggestedQuestions;
