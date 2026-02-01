import React from 'react';

function DataPreview({ dataProfile }) {
  if (!dataProfile || !dataProfile.data || dataProfile.data.length === 0) return null;

  const rows = dataProfile.data.slice(0, 10);
  const columns = Object.keys(rows[0] || {});

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Dataset Preview</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">Showing {rows.length} of {dataProfile.data.length} rows</span>
      </div>
      <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {columns.map(col => (
                <th key={col} className="px-4 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {columns.map(col => (
                  <td key={col} className="px-4 py-2 text-sm text-gray-800 dark:text-gray-100 whitespace-nowrap max-w-[320px] truncate" title={row[col] != null ? String(row[col]) : ''}>
                    {row[col] != null ? String(row[col]) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataPreview;
