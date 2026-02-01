// Viva Preparation Component
// Shows defense/viva preparation material from Moat Layers 2 + 4

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const VivaPreparation = ({ preparation, testName, onClose }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(preparation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎓</span>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Viva Preparation</h2>
                <p className="text-sm text-gray-500">{testName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg"
              >
                {copied ? '✓ Copied' : '📋 Copy'}
              </button>
              <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown>{preparation}</ReactMarkdown>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-purple-50 dark:bg-purple-900/20 border-t">
            <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2">💡 Viva Tips</h4>
            <ul className="text-sm text-purple-600 dark:text-purple-400 space-y-1">
              <li>• Be prepared to explain why you chose this test</li>
              <li>• Know the assumptions and limitations</li>
              <li>• Understand statistical vs practical significance</li>
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VivaPreparation;
