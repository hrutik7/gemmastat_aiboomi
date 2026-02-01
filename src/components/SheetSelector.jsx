import React from 'react';

const SheetSelector = ({ sheetNames, onSelectSheet, isLoading }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 animate-fade-in max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-100">Multiple Sheets Found</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
                Your Excel file contains multiple sheets. Please choose which one you would like to analyze.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {sheetNames.map(name => (
                    <button
                        key={name}
                        onClick={() => onSelectSheet(name)}
                        disabled={isLoading}
                        className="p-4 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors disabled:opacity-50"
                    >
                        {name}
                    </button>
                ))}
            </div>
            {isLoading && <p className="text-center mt-4 animate-pulse text-gray-600 dark:text-gray-300">Loading sheet...</p>}
        </div>
    );
};

export default SheetSelector;