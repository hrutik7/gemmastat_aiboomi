import React, { useState, useEffect } from 'react';
import DataAnalysisConfig from './DataAnalysisConfig.jsx';
import StatisticalResults from './StatisticalResults.jsx';
import DataVisualization from './DataVisualization.jsx';
import VariableClassifier from './VariableClassifier.jsx';
import DataPreview from './DataPreview.jsx';
import SuggestedQuestions from './SuggestedQuestions.jsx';
import ChatAnalysis from './ChatAnalysis.jsx';
import api from '../services/api';

function AnalyticsSection({ dataset }) {
  const [activeTab, setActiveTab] = useState('chat');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [dataProfile, setDataProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // --- NEW STATE for the upgrade button loading state ---
  const [isUpgradeLoading, setIsUpgradeLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!dataset) return;
      setIsLoading(true);
      setError('');
      try {
        const response = await api.get(`/datasets/${dataset.id}/profile`);
        setDataProfile(response.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Could not load data profile.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [dataset]);

  // Auto-run a simple default analysis when profile becomes available
  useEffect(() => {
    if (!dataProfile || !dataset) return;
    // Prefer Descriptive Statistics on first numeric column; fallback to Crosstabulation of first two columns
    const numCols = dataProfile.numeric_columns || [];
    const catCols = dataProfile.categorical_columns || [];
    if (numCols.length > 0) {
      handleRunAnalysis('Descriptive Statistics', { column: numCols[0] });
    } else if ((numCols.length + catCols.length) >= 2) {
      const anyCols = [...numCols, ...catCols];
      handleRunAnalysis('Crosstabulation', { variables: [anyCols[0], anyCols[1]] });
    }
    // Run only on first load per dataset id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataProfile?.numeric_columns, dataProfile?.categorical_columns, dataset?.id]);

  const handleRunAnalysis = async (analysisType, parameters) => {
    if (!dataset || !parameters) return;
    setIsLoading(true);
    setError('');
    setAnalysisResult(null);
    try {
      const response = await api.post('/analyses/', {
        dataset_id: dataset.id,
        test_type: analysisType,
        parameters: parameters,
      });
      setAnalysisResult(response.data);
    } catch (err) {
      // Set the specific error message from the backend
      setError(err.response?.data?.detail || 'Analysis failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW HANDLER to trigger the subscription flow when the user wants to upgrade ---
  const handleUpgradeClick = async () => {
    setIsUpgradeLoading(true);
    setError(''); // Clear the limit error to avoid showing both
    try {
        const response = await api.post('/payments/create-subscription');
        if (response.data.checkout_url) {
            // Redirect to Razorpay
            window.location.href = response.data.checkout_url;
        } else {
            setError('Could not retrieve checkout URL. Please try again.');
        }
    } catch (err) {
        setError(err.response?.data?.detail || 'An error occurred. Please ensure you are logged in and try again.');
    } finally {
        setIsUpgradeLoading(false);
    }
  };

  const switchToVizTab = () => setActiveTab('visualization');

  const handleSuggestionSelect = (suggestion) => {
    if (!suggestion) return;
    handleRunAnalysis(suggestion.analysis, suggestion.params);
  };

  return (
    <div className="space-y-8">
      {/* The Variable Classifier is now a separate step, rendered above the main section */}
      {/* {dataProfile && <VariableClassifier dataset={dataset} dataProfile={dataProfile} />} */}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 p-6 border-b dark:border-gray-600">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-4"><span>🔬</span>Explore & Analyze</h3>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('chat')} className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'chat' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}><span>💬</span>Chat</button>
            <button onClick={() => setActiveTab('statistical')} className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'statistical' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}><span>🛠️</span>Advanced</button>
            <button id="visualization-tab-button" onClick={() => setActiveTab('visualization')} className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'visualization' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}><span>📊</span>Visualization</button>
          </div>
        </div>

        <div className="p-6" id="analysis-config-area">
          {isLoading && !dataProfile && <div className="text-center p-6"><p className="text-gray-700 dark:text-gray-300">Loading Data Profile...</p></div>}
          
          {/* --- THE NEW, INTELLIGENT ERROR DISPLAY --- */}
          {error ? (
            // Check if the error is the specific "limit reached" message from your backend
            error.includes('limit') ? (
              <div className="p-6 my-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-2xl border-2 border-yellow-200 dark:border-yellow-700 text-center animate-fade-in">
                <span className="text-4xl">⭐</span>
                <h3 className="text-xl font-bold mt-2">Free Plan Limit Reached</h3>
                <p className="mt-2 text-yellow-700 dark:text-yellow-400">{error}</p>
                <button
                  onClick={handleUpgradeClick}
                  disabled={isUpgradeLoading}
                  className="mt-4 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                >
                  {isUpgradeLoading ? 'Redirecting to Checkout...' : 'Upgrade to Pro Now'}
                </button>
              </div>
            ) : (
              // Otherwise, show the standard red error message
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl flex items-center gap-2">
                <span>❌</span>
                <span className="font-medium">{error}</span>
              </div>
            )
          ) : null}

          {/* This block only renders if there are NO errors and the profile is loaded */}
          {!error && dataProfile && (
            <>
              {/* Preview and Suggested Questions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                  <DataPreview dataProfile={dataProfile} />
                </div>
                <div className="lg:col-span-1">
                  <SuggestedQuestions dataProfile={dataProfile} onSelect={handleSuggestionSelect} />
                </div>
              </div>
              {activeTab === 'chat' && (
                <div className="space-y-6">
                  <ChatAnalysis dataProfile={dataProfile} onRunAnalysis={handleRunAnalysis} isLoading={isLoading} analysisResult={analysisResult} />
                  {isLoading && analysisResult === null && <div className="text-center p-6"><p className="text-gray-700 dark:text-gray-300">🧠 Running Analysis...</p></div>}
                  {analysisResult && <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600" id="statistical-results-area"><StatisticalResults analysisResult={analysisResult} onSwitchTab={switchToVizTab} /></div>}
                </div>
              )}
              {activeTab === 'statistical' && (
                <div className="space-y-6">
                  <DataAnalysisConfig onRunAnalysis={handleRunAnalysis} dataProfile={dataProfile} isLoading={isLoading} />
                  {isLoading && analysisResult === null && <div className="text-center p-6"><p className="text-gray-700 dark:text-gray-300">🧠 Running Analysis...</p></div>}
                  {analysisResult && <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600" id="statistical-results-area"><StatisticalResults analysisResult={analysisResult} onSwitchTab={switchToVizTab} /></div>}
                </div>
              )}
              {activeTab === 'visualization' && analysisResult && <DataVisualization analysisResult={analysisResult} />}
              {activeTab === 'visualization' && !analysisResult && <div className="text-center p-6"><p className="text-gray-700 dark:text-gray-300">Please run an analysis first to generate its visualization.</p></div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsSection;