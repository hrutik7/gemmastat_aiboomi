import React from 'react';
import LiteratureReviewCalculator from '../components/LiteratureReviewCalculator';

const LiteratureReviewPage = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Literature Review Calculator</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Estimate the time and resources needed for your literature review.</p>
            </div>
            <LiteratureReviewCalculator />
        </div>
    );
};

export default LiteratureReviewPage;