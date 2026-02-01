import React from 'react';
import SampleSizeCalculator from '../components/SampleSizeCalculator';

const SampleSizePage = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Sample Size Calculator</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Determine the required sample size for your research.</p>
            </div>
            <SampleSizeCalculator />
        </div>
    );
};

export default SampleSizePage;