import React, { useState } from 'react';
import api from '../services/api';

const SearchStage = ({ onSearch, isLoading }) => {
    const [title, setTitle] = useState('');
    return (
        <div className="space-y-3">
            <p className="font-medium text-gray-700 dark:text-gray-300">Step 1: Enter your research title</p>
            <textarea
                rows="2" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., The effect of Vitamin D supplementation on depression scores"
            />
            <button onClick={() => onSearch(title)} disabled={isLoading || !title} className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md disabled:bg-gray-400">
                {isLoading ? 'Searching...' : 'Find Related Articles'}
            </button>
        </div>
    );
};

const SelectionStage = ({ articles, onCalculate, isLoading, onBack }) => {
    const [selected, setSelected] = useState(new Set());
    
    // State for user-defined alpha and power
    const [alpha, setAlpha] = useState(0.05);
    const [power, setPower] = useState(0.80);

    const toggleSelection = (articleId) => {
        const newSelection = new Set(selected);
        if (newSelection.has(articleId)) newSelection.delete(articleId);
        else newSelection.add(articleId);
        setSelected(newSelection);
    };
    
    const handleCalculate = () => {
        const selectedArticles = articles.filter(art => selected.has(art.paperId));
        // Pass the user-defined alpha and power to the handler
        onCalculate(selectedArticles, alpha, power);
    };

    return (
        <div className="space-y-4">
            <p className="font-medium text-gray-700 dark:text-gray-300">Step 2: Select relevant articles and set parameters</p>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-gray-50 dark:bg-gray-700">
                {articles.map(art => (
                    <div key={art.paperId} className="p-3 border border-gray-200 dark:border-gray-600 rounded-md cursor-pointer flex gap-3 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => toggleSelection(art.paperId)}>
                        <input type="checkbox" checked={selected.has(art.paperId)} readOnly className="mt-1 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{art.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{art.authors.map(a => a.name).join(', ')} ({art.year})</p>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* New section for Alpha and Power inputs */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="alpha" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alpha (α)</label>
                    <input type="number" id="alpha" value={alpha} onChange={e => setAlpha(parseFloat(e.target.value))}
                           className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                           step="0.01" min="0.001" max="0.5" />
                </div>
                <div>
                    <label htmlFor="power" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Power (1-β)</label>
                    <input type="number" id="power" value={power} onChange={e => setPower(parseFloat(e.target.value))}
                           className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-gray-100"
                           step="0.05" min="0.5" max="0.99" />
                </div>
            </div>

            <div className="flex gap-3">
                <button onClick={onBack} className="w-1/3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Back</button>
                <button onClick={handleCalculate} disabled={isLoading || selected.size === 0} className="w-2/3 bg-green-600 text-white font-semibold py-2 rounded-md disabled:bg-gray-400">
                    {isLoading ? 'Extracting & Calculating...' : `Calculate from ${selected.size} Selected`}
                </button>
            </div>
        </div>
    );
};

const ResultStage = ({ result, onReset }) => (
    // This component remains unchanged
    <div className="space-y-4">
         <p className="font-medium text-gray-700 dark:text-gray-300">Step 3: Evidence-Based Result</p>
         <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg border border-green-200 dark:border-green-700 space-y-3">
            <div className="text-center">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Required Sample Size</p>
                <p className="font-bold text-4xl text-green-800 dark:text-green-200">{result.total_sample_size}</p>
                <p className="text-sm text-green-600 dark:text-green-400">({result.sample_size_per_group} in each group)</p>
            </div>
            <div className="text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-800/30 p-3 rounded-md">
                <p className="font-semibold mb-2">Calculation Summary (Based on Your Inputs)</p>
                <ul className="list-disc list-inside ml-4">
                    {Object.entries(result.inputs).map(([key, value]) => (
                        <li key={key}>{key}: {typeof value === 'number' ? value.toFixed(3) : value}</li>
                    ))}
                </ul>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300"><span className="font-semibold">Explanation:</span> {result.explanation}</p>
        </div>
        <button onClick={onReset} className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md">Start a New Calculation</button>
    </div>
);

function LiteratureReviewCalculator() {
    const [stage, setStage] = useState('search');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [articles, setArticles] = useState([]);
    const [finalResult, setFinalResult] = useState(null);

    const handleSearch = async (title) => {
        setIsLoading(true); setError(''); setArticles([]);
        try {
            const response = await api.post('/tools/search-articles', { research_title: title });
            if (response.data && response.data.length > 0) {
                setArticles(response.data);
                setStage('select');
            } else {
                setError("No relevant articles found. Please try a different or more specific research title.");
            }
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to search for articles.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCalculate = async (selectedArticles, alpha, power) => {
        setIsLoading(true); setError(''); setFinalResult(null);
        try {
            // Include alpha and power in the request payload
            const response = await api.post('/tools/calculate-from-articles', {
                articles: selectedArticles,
                alpha: alpha,
                power: power
            });
            setFinalResult(response.data);
            setStage('result');
        } catch (err) {
            setError(err.response?.data?.detail || "Could not calculate sample size from selected articles.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setStage('search'); setArticles([]); setFinalResult(null); setError('');
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 space-y-4">
            <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <span className="text-2xl">📚</span> AI-Powered Literature Review Calculator
            </h3>
            {error && <p className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">{error}</p>}
            
            {stage === 'search' && <SearchStage onSearch={handleSearch} isLoading={isLoading} />}
            {stage === 'select' && <SelectionStage articles={articles} onCalculate={handleCalculate} isLoading={isLoading} onBack={() => setStage('search')} />}
            {stage === 'result' && finalResult && <ResultStage result={finalResult} onReset={handleReset} />}
        </div>
    );
}

export default LiteratureReviewCalculator;