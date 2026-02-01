// Analysis Validation Component
// Shows pre-analysis warnings from Moat Layer 3

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AnalysisValidation = ({ validation, onProceed, onCancel }) => {
  const [acknowledged, setAcknowledged] = useState(false);
  
  if (!validation) return null;
  
  const { can_proceed, errors } = validation;
  
  const blockers = errors?.filter(e => e.severity === 'blocker') || [];
  const warnings = errors?.filter(e => e.severity === 'warning') || [];
  const infos = errors?.filter(e => e.severity === 'info') || [];
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6 shadow-lg"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="text-2xl">{can_proceed ? '⚠️' : '🚫'}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {can_proceed ? 'Pre-Analysis Warnings' : 'Cannot Proceed'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {can_proceed 
                ? 'Review these warnings before proceeding'
                : 'Critical issues must be resolved first'
              }
            </p>
          </div>
        </div>
        
        {blockers.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">🚫 Critical Issues</h4>
            {blockers.map((error, idx) => (
              <div key={idx} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-2">
                <p className="font-medium text-red-800 dark:text-red-300">{error.title}</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error.description}</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-2">→ {error.recommendation}</p>
              </div>
            ))}
          </div>
        )}
        
        {warnings.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-2">⚠️ Warnings</h4>
            {warnings.map((error, idx) => (
              <div key={idx} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-2">
                <p className="font-medium text-yellow-800 dark:text-yellow-300">{error.title}</p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">{error.description}</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">→ {error.recommendation}</p>
              </div>
            ))}
          </div>
        )}
        
        {infos.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">ℹ️ Notes</h4>
            {infos.map((error, idx) => (
              <p key={idx} className="text-sm text-blue-600 dark:text-blue-400">• {error.description}</p>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          {can_proceed ? (
            <>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="rounded border-gray-300"
                />
                I understand and want to proceed
              </label>
              <div className="flex gap-3">
                <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                <button
                  onClick={onProceed}
                  disabled={!acknowledged}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  Proceed
                </button>
              </div>
            </>
          ) : (
            <button onClick={onCancel} className="ml-auto px-4 py-2 text-sm bg-gray-600 text-white rounded-lg">
              Go Back
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnalysisValidation;
