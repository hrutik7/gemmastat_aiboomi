// Test Recommendation Component
// Shows AI-powered test recommendations from Moat Layer 1

import { motion } from 'framer-motion';

const TestRecommendation = ({ recommendation, onAccept, onReject, onSelectAlternative }) => {
  if (!recommendation) return null;
  
  const {
    test_name,
    confidence,
    reasoning,
    assumptions_met,
    assumptions_violated,
    warnings,
    alternative_tests,
    adjustment_note
  } = recommendation;
  
  const confidenceColor = confidence >= 0.8 
    ? 'text-green-600' 
    : confidence >= 0.6 
      ? 'text-yellow-600'
      : 'text-red-600';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-blue-200 dark:border-blue-800 p-6 mb-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <span className="text-xl">🧠</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Recommended: {test_name}
            </h3>
            <p className={`text-sm ${confidenceColor}`}>
              {Math.round(confidence * 100)}% confidence
            </p>
          </div>
        </div>
        <button
          onClick={() => onAccept(test_name)}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          Use This Test
        </button>
      </div>
      
      {reasoning?.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Why this test?</h4>
          <ul className="space-y-1">
            {reasoning.map((reason, idx) => (
              <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">• {reason}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        {assumptions_met?.length > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">✓ Assumptions Met</h4>
            <ul className="space-y-1">
              {assumptions_met.map((a, idx) => (
                <li key={idx} className="text-sm text-green-600 dark:text-green-400">{a}</li>
              ))}
            </ul>
          </div>
        )}
        
        {assumptions_violated?.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">✗ Assumptions Violated</h4>
            <ul className="space-y-1">
              {assumptions_violated.map((a, idx) => (
                <li key={idx} className="text-sm text-red-600 dark:text-red-400">{a}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {warnings?.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-2">⚠️ Warnings</h4>
          <ul className="space-y-1">
            {warnings.map((w, idx) => (
              <li key={idx} className="text-sm text-yellow-600 dark:text-yellow-400">{w}</li>
            ))}
          </ul>
        </div>
      )}
      
      {adjustment_note && (
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 mb-4">
          <p className="text-sm text-purple-700 dark:text-purple-400">{adjustment_note}</p>
        </div>
      )}
      
      {alternative_tests?.length > 0 && (
        <div className="border-t border-blue-200 dark:border-blue-800 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Alternatives</h4>
          <div className="flex flex-wrap gap-2">
            {alternative_tests.map((test, idx) => (
              <button
                key={idx}
                onClick={() => onSelectAlternative(test)}
                className="px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border rounded-lg hover:bg-gray-50"
              >
                {test}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TestRecommendation;
