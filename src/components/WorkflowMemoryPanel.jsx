import React from 'react';
import { FiTarget, FiTrendingUp, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

/**
 * WorkflowMemoryPanel
 * 
 * Displays accumulated context from all completed workflow phases.
 * Shows key decisions, data insights, assumptions, and concerns.
 */

const WorkflowMemoryPanel = ({ memory, isExpanded, onToggle }) => {
  if (!memory) return null;

  const keyDecisions = memory.key_decisions || [];
  const dataInsights = memory.data_insights || [];
  const concerns = memory.concerns || [];
  const timeline = memory.timeline || [];

  const hasContent = keyDecisions.length > 0 || dataInsights.length > 0 || concerns.length > 0;

  if (!hasContent) return null;

  return (
    <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FiTarget className="text-blue-600 dark:text-blue-400" size={20} />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Research Context</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {keyDecisions.length} decision{keyDecisions.length !== 1 ? 's' : ''}, 
              {' '}{dataInsights.length} insight{dataInsights.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-6">
          {/* Key Decisions */}
          {keyDecisions.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FiCheckCircle className="text-green-600" size={18} />
                Key Decisions
              </h4>
              <div className="space-y-2">
                {keyDecisions.map((decision, idx) => (
                  <div key={idx} className="p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {decision.decision}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Phase: {decision.phase}
                    </p>
                    {decision.rationale && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                        {decision.rationale}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Insights */}
          {dataInsights.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FiTrendingUp className="text-blue-600" size={18} />
                Data Insights
              </h4>
              <div className="space-y-2">
                {dataInsights.slice(0, 5).map((insight, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {insight.insight}
                    </p>
                    {insight.category && (
                      <span className="inline-block mt-2 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 text-xs rounded">
                        {insight.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concerns & Warnings */}
          {concerns.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FiAlertTriangle className="text-amber-600" size={18} />
                Considerations
              </h4>
              <div className="space-y-2">
                {concerns.map((concern, idx) => {
                  const bgClass = concern.severity === 'critical' 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
                  
                  return (
                    <div key={idx} className={`p-3 ${bgClass} rounded border`}>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {concern.concern}
                      </p>
                      <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                        concern.severity === 'critical'
                          ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300'
                          : 'bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300'
                      }`}>
                        {concern.severity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Workflow Timeline</h4>
              <div className="space-y-1 text-sm">
                {timeline.map((event, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                    <span className="text-gray-400 dark:text-gray-600 text-xs mt-1">→</span>
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{event.phase}</span>
                      {event.summary && <span className="text-gray-600 dark:text-gray-400">: {event.summary}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkflowMemoryPanel;
