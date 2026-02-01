import React, { useState } from 'react';
import api from '../services/api';

// A new, dedicated component to display the detailed results
const ResultDisplay = ({ result }) => (
    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg border border-green-200 dark:border-green-700 animate-fade-in space-y-4">
        <div className="text-center">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Sample Size Needed</p>
            <p className="font-bold text-4xl text-green-800 dark:text-green-200">{result.total_sample_size}</p>
            <p className="text-sm text-green-600 dark:text-green-400">
                ({result.sample_size_per_group} in each of your two groups)
            </p>
        </div>
        
        {/* New section for transparency */}
        <div className="text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-800/30 p-3 rounded-md">
            <p className="font-semibold mb-2">Calculation Summary</p>
            <p><span className="font-medium">Method Used:</span> {result.formula_used}</p>
            <div className="mt-2">
                <p className="font-medium">Parameters Used:</p>
                <ul className="list-disc list-inside">
                    {result.inputs && Object.entries(result.inputs).map(([key, value]) => (
                        <li key={key}>{key}: {value}</li>
                    ))}
                </ul>
            </div>
        </div>

        <p className="text-sm text-green-700 dark:text-green-300">
            <span className="font-semibold">AI Interpretation:</span> {result.explanation}
        </p>
    </div>
);

function SampleSizeCalculator() {
    const [description, setDescription] = useState('');
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCalculate = async () => {
        if (!description.trim()) {
            setError('Please provide a description of the effect you expect to find.');
            return;
        }
        setIsLoading(true);
        setError('');
        setResult(null);
        try {
            const response = await api.post('/tools/sample-size-calculator', {
                description: description,
            });
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'An error occurred while calculating. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 w-[100%] p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 space-y-4">
            <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <span className="text-2xl">🔬</span>
                AI-Powered Sample Size Calculator
            </h3>
            
            <div>
                <label htmlFor="effect-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Describe the effect you hope to find in plain English:
                </label>
                <textarea
                    id="effect-description"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition dark:bg-gray-700 dark:text-gray-100"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="e.g., 'A small but important improvement in student test scores' or 'A very strong link between diet and health.'"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Our AI will translate this into the necessary statistical parameters.</p>
            </div>

            <button
                onClick={handleCalculate}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? '🤖 AI is Calculating...' : 'Calculate with AI'}
            </button>
            
            {error && <p className="text-red-600 dark:text-red-400 text-sm text-center font-medium">{error}</p>}

            {result && !error && <ResultDisplay result={result} />}
        </div>
    );
}

export default SampleSizeCalculator;