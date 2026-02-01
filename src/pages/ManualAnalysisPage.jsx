import React, { useState } from 'react';
import FileUpload from '../components/FileUpload';
import AnalyticsSection from '../components/AnalyticsSection'; // <-- Reusing your old component

const ManualAnalysisPage = () => {
    const [activeDataset, setActiveDataset] = useState(null);

    // This function will be called by FileUpload when a dataset is successfully uploaded.
    const handleUploadSuccess = (dataset) => {
        // The old FileUpload component returns a JSON object with dataset info.
        // We set this as the active dataset for the AnalyticsSection.
        console.log("Dataset selected for manual analysis:", dataset);
        setActiveDataset(dataset);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Manual Statistical Analysis</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Upload a dataset and choose from a list of statistical tests to perform.
                </p>
            </div>

            {/* Step 1: File Upload */}
            {/* We use the old FileUpload logic here (isStandalone={false}) so it handles the upload itself */}
            <FileUpload onUploadSuccess={handleUploadSuccess} isStandalone={false} />

            {/* Step 2: Analytics Section */}
            {/* This section will only appear after a file has been successfully uploaded. */}
            {activeDataset && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Run Analysis</h2>
                    <AnalyticsSection dataset={activeDataset} />
                </div>
            )}
        </div>
    );
};

export default ManualAnalysisPage;