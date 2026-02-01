import { useState, useEffect } from 'react';
import api from '../services/api';
import { FiPlus, FiMessageSquare, FiClock } from 'react-icons/fi';

const ChatHistorySidebar = ({ onSelectConversation, activeConversationId, isCollapsed }) => {
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        const fetchConversations = async () => {
            setIsLoading(true);
            try {
                const response = await api.get('/conversation/history', {
                    signal: controller.signal
                });
                const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
                setConversations(data);
            } catch (error) {
                if (error.name !== 'CanceledError') {
                    console.error("Failed to fetch chat history:", error);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchConversations();

        return () => {
            controller.abort();
        };
    }, []);

    // Collapsed state - show only icons
    if (isCollapsed) {
        return (
            <div className="flex flex-col flex-grow items-center py-2 overflow-hidden">
                {/* New chat button */}
                <button
                    onClick={() => onSelectConversation(null)}
                    className="p-2.5 mb-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    title="New Chat"
                >
                    <FiPlus size={18} />
                </button>

                {/* Recent conversations as icons */}
                <div className="flex-1 overflow-y-auto w-full px-2 space-y-1">
                    {conversations.slice(0, 10).map((convo) => (
                        <button
                            key={convo.id}
                            onClick={() => onSelectConversation(convo.id)}
                            title={convo.dataset_filename || "Untitled"}
                            className={`w-full p-2 rounded-lg flex items-center justify-center ${
                                activeConversationId === convo.id
                                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            <FiMessageSquare size={16} />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Expanded state
    return (
        <div className="flex flex-col flex-grow overflow-hidden">
            {/* New chat button */}
            <div className="p-3 flex-shrink-0">
                <button
                    onClick={() => onSelectConversation(null)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl px-4 py-2.5 hover:bg-blue-700 transition-colors font-medium"
                >
                    <FiPlus size={18} />
                    New Chat
                </button>
            </div>

            {/* History label */}
            <div className="px-4 py-2 flex-shrink-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <FiClock size={12} />
                    Recent
                </div>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto px-3 pb-3">
                {isLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="animate-pulse">
                                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                            </div>
                        ))}
                    </div>
                ) : Array.isArray(conversations) && conversations.length > 0 ? (
                    <ul className="space-y-1">
                        {conversations.map((convo) => (
                            <li key={convo.id}>
                                <button
                                    onClick={() => onSelectConversation(convo.id)}
                                    title={convo.dataset_filename || "Untitled Conversation"}
                                    className={`w-full text-left p-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                                        activeConversationId === convo.id
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                    }`}
                                >
                                    <FiMessageSquare size={14} className="flex-shrink-0 opacity-60" />
                                    <span className="truncate">
                                        {convo.dataset_filename || "Untitled Conversation"}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-8">
                        <FiMessageSquare size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No conversations yet</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start a new chat to begin</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatHistorySidebar;
