import { useState } from 'react';
import AnalysisWorkspace from '../components/AnalysisWorkspace';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FiChevronLeft, FiChevronRight, FiDatabase, FiColumns, FiInfo } from 'react-icons/fi';
import { useConversation } from '../context/ConversationContext';

// Collapsible Dataset Overview Sidebar
const ContextSidebar = ({ conversationData, isCollapsed, onToggle }) => {
    const [activeSection, setActiveSection] = useState('overview');

    if (isCollapsed) {
        return (
            <div className="w-12 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 gap-3 flex-shrink-0">
                <button
                    onClick={onToggle}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                    title="Expand Details"
                >
                    <FiChevronLeft size={18} />
                </button>
                {conversationData && (
                    <>
                        <button
                            onClick={onToggle}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-500"
                            title="Dataset Info"
                        >
                            <FiDatabase size={16} />
                        </button>
                        <button
                            onClick={onToggle}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-purple-500"
                            title="Columns"
                        >
                            <FiColumns size={16} />
                        </button>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="w-72 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
            {/* Header with collapse button */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">Dataset Details</h2>
                <button
                    onClick={onToggle}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                    title="Collapse"
                >
                    <FiChevronRight size={18} />
                </button>
            </div>

            {conversationData ? (
                <>
                    {/* Tab buttons */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <button
                            onClick={() => setActiveSection('overview')}
                            className={`flex-1 px-3 py-2 text-xs font-medium ${
                                activeSection === 'overview'
                                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                        >
                            <FiInfo className="inline mr-1" size={12} />
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveSection('columns')}
                            className={`flex-1 px-3 py-2 text-xs font-medium ${
                                activeSection === 'columns'
                                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400'
                                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                        >
                            <FiColumns className="inline mr-1" size={12} />
                            Columns
                        </button>
                    </div>

                    {/* Content area */}
                    <div className="flex-1 overflow-y-auto p-3">
                        {activeSection === 'overview' && (
                            <div className="space-y-3">
                                {/* Stats cards */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                            {conversationData.initial_summary?.shape?.rows || 0}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Rows</div>
                                    </div>
                                    <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                                        <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                                            {conversationData.initial_summary?.shape?.columns || 0}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Columns</div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</h4>
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {conversationData.dataset_description || "No description available."}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'columns' && (
                            <div className="space-y-1.5">
                                {conversationData.initial_summary?.columns?.map(col => (
                                    <div 
                                        key={col.name} 
                                        className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                                    >
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="font-medium text-xs text-gray-800 dark:text-gray-200 truncate" title={col.name}>
                                                {col.name}
                                            </span>
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                col.type === 'numeric' 
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
                                            }`}>
                                                {col.type}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {col.missing_percentage}% missing
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Upload a file to see dataset details
                    </p>
                </div>
            )}
        </div>
    );
};

const AiAnalystPage = () => {
    const [isDetailsSidebarCollapsed, setIsDetailsSidebarCollapsed] = useState(false);
    const [conversationData, setConversationData] = useState(null);
    const { selectedConversationId } = useConversation();

    return (
        <div className="flex h-full overflow-hidden">
            {/* Main content area - takes remaining space */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <AnalysisWorkspace
                    key={selectedConversationId}
                    conversationId={selectedConversationId}
                    onConversationUpdate={setConversationData}
                />
            </div>

            {/* Collapsible Details Sidebar - only show when there's data */}
            {conversationData && (
                <ContextSidebar
                    conversationData={conversationData}
                    isCollapsed={isDetailsSidebarCollapsed}
                    onToggle={() => setIsDetailsSidebarCollapsed(!isDetailsSidebarCollapsed)}
                />
            )}
        </div>
    );
};

export default AiAnalystPage;
