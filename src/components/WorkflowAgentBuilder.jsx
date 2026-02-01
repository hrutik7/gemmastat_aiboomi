// src/components/WorkflowAgentBuilder.jsx
// n8n-style drag-and-drop workflow builder for AI Agents

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ReactFlow,
    Controls,
    Background,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
    MarkerType,
    Handle,
    Position,
    Panel,
    getBezierPath,
    BaseEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import api from '../services/api';

// ============================================
// ICONS
// ============================================

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
);

const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

const GripIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
        <circle cx="9" cy="6" r="1.5"></circle>
        <circle cx="15" cy="6" r="1.5"></circle>
        <circle cx="9" cy="12" r="1.5"></circle>
        <circle cx="15" cy="12" r="1.5"></circle>
        <circle cx="9" cy="18" r="1.5"></circle>
        <circle cx="15" cy="18" r="1.5"></circle>
    </svg>
);

// ============================================
// NODE DEFINITIONS
// ============================================

const NODE_TYPES = {
    trigger: {
        label: 'Trigger',
        icon: '⚡',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.15)',
        borderColor: 'rgba(245, 158, 11, 0.5)',
        description: 'Start the workflow',
        variants: [
            { id: 'schedule', label: 'Scheduled', icon: '⏰', description: 'Run at specific times' },
            { id: 'webhook', label: 'On Demand', icon: '🔔', description: 'Run when triggered manually' },
        ]
    },
    dataSource: {
        label: 'Data Source',
        icon: '🗄️',
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.15)',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        description: 'Connect to your data',
        variants: [
            { id: 'postgresql', label: 'PostgreSQL', icon: '🐘', description: 'Connect to PostgreSQL/Neon' },
            { id: 'mysql', label: 'MySQL', icon: '🐬', description: 'Connect to MySQL database' },
            { id: 'shopify', label: 'Shopify', icon: '🛒', description: 'Connect to Shopify store' },
        ]
    },
    analysis: {
        label: 'AI Analysis',
        icon: '🧠',
        color: '#8b5cf6',
        bgColor: 'rgba(139, 92, 246, 0.15)',
        borderColor: 'rgba(139, 92, 246, 0.5)',
        description: 'Process with AI',
        variants: [
            { id: 'stockout', label: 'Stock-Out Predictor', icon: '📦', description: 'Predict stock shortages' },
            { id: 'expiry', label: 'Expiry Watchdog', icon: '⏰', description: 'Monitor expiration dates' },
            { id: 'reorder', label: 'Smart Reorder', icon: '🛒', description: 'Optimal reorder timing' },
            { id: 'custom', label: 'Custom Analysis', icon: '✨', description: 'Custom AI prompt' },
        ]
    },
    output: {
        label: 'Output',
        icon: '📤',
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.15)',
        borderColor: 'rgba(16, 185, 129, 0.5)',
        description: 'Send results',
        variants: [
            { id: 'whatsapp', label: 'WhatsApp', icon: '💬', description: 'Send via WhatsApp' },
            { id: 'email', label: 'Email', icon: '📧', description: 'Send email notification' },
            { id: 'dashboard', label: 'Dashboard', icon: '📊', description: 'Show in dashboard' },
        ]
    },
    logic: {
        label: 'Logic',
        icon: '⚙️',
        color: '#ec4899',
        bgColor: 'rgba(236, 72, 153, 0.15)',
        borderColor: 'rgba(236, 72, 153, 0.5)',
        description: 'Add conditions',
        variants: [
            { id: 'filter', label: 'Filter', icon: '🔍', description: 'Filter data based on conditions' },
            { id: 'transform', label: 'Transform', icon: '🔄', description: 'Transform data format' },
            { id: 'condition', label: 'If/Else', icon: '🔀', description: 'Conditional branching' },
        ]
    }
};

// ============================================
// ANIMATED EDGE COMPONENT
// ============================================

const AnimatedEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd }) => {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
            <circle r="4" fill="#8b5cf6">
                <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
            </circle>
        </>
    );
};

// ============================================
// CUSTOM NODE COMPONENT
// ============================================

const CustomNode = ({ id, data, selected }) => {
    const nodeType = NODE_TYPES[data.nodeType];
    const variant = nodeType?.variants?.find(v => v.id === data.variant) || nodeType?.variants?.[0];

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`relative min-w-[220px] rounded-xl border-2 shadow-lg transition-all duration-200 ${selected ? 'ring-2 ring-offset-2 ring-offset-gray-900' : ''
                }`}
            style={{
                backgroundColor: nodeType?.bgColor || '#1f2937',
                borderColor: selected ? nodeType?.color : nodeType?.borderColor,
                boxShadow: selected ? `0 0 20px ${nodeType?.color}40` : '0 4px 12px rgba(0,0,0,0.3)',
            }}
        >
            {/* Input Handle */}
            {data.nodeType !== 'trigger' && (
                <Handle
                    type="target"
                    position={Position.Left}
                    className="!w-4 !h-4 !bg-gray-700 !border-2 hover:!bg-blue-500 transition-colors"
                    style={{ borderColor: nodeType?.color }}
                />
            )}

            {/* Node Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                <span className="text-xl">{variant?.icon || nodeType?.icon}</span>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm truncate">
                        {data.label || variant?.label || nodeType?.label}
                    </h4>
                    <p className="text-xs text-gray-400 truncate">
                        {variant?.description || nodeType?.description}
                    </p>
                </div>
                {/* Visual indicator for configuration */}
                {data.configured && (
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Configured" />
                )}
            </div>

            {/* Node Body - Configuration Preview */}
            <div className="px-4 py-3 text-xs text-gray-300">
                {data.nodeType === 'trigger' && data.config?.time && (
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">Time:</span>
                        <span className="font-mono bg-black/20 px-2 py-0.5 rounded">{data.config.time}</span>
                    </div>
                )}
                {data.nodeType === 'dataSource' && data.config?.connection && (
                    <div className="flex items-center gap-2 truncate">
                        <span className="text-gray-500">DB:</span>
                        <span className="font-mono bg-black/20 px-2 py-0.5 rounded truncate max-w-[140px]">
                            {data.config.connection.substring(0, 20)}...
                        </span>
                    </div>
                )}
                {data.nodeType === 'dataSource' && data.variant === 'shopify' && data.config?.storeUrl && (
                    <div className="flex items-center gap-2 truncate">
                        <span className="text-gray-500">Store:</span>
                        <span className="font-mono bg-green-900/30 text-green-300 px-2 py-0.5 rounded truncate max-w-[140px]">
                            {data.config.storeUrl}
                        </span>
                    </div>
                )}
                {data.nodeType === 'output' && data.variant === 'whatsapp' && data.config?.number && (
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">To:</span>
                        <span className="font-mono bg-black/20 px-2 py-0.5 rounded">{data.config.number}</span>
                    </div>
                )}
                {data.nodeType === 'analysis' && data.variant === 'custom' && data.config?.prompt && (
                    <div className="truncate">
                        <span className="text-gray-500">Prompt:</span>
                        <span className="ml-1 bg-black/20 px-2 py-0.5 rounded">
                            {data.config.prompt.substring(0, 25)}...
                        </span>
                    </div>
                )}
                {!data.configured && (
                    <div className="text-yellow-400/80 flex items-center gap-1">
                        <span>⚠️</span>
                        <span>Click to configure</span>
                    </div>
                )}
            </div>

            {/* Output Handle */}
            {data.nodeType !== 'output' && (
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!w-4 !h-4 !bg-gray-700 !border-2 hover:!bg-blue-500 transition-colors"
                    style={{ borderColor: nodeType?.color }}
                />
            )}
        </motion.div>
    );
};

// ============================================
// NODE CONFIGURATION PANEL
// ============================================

const NodeConfigPanel = ({ node, onUpdate, onClose, onDelete }) => {
    const [config, setConfig] = useState(node?.data?.config || {});
    const [label, setLabel] = useState(node?.data?.label || '');
    const nodeType = NODE_TYPES[node?.data?.nodeType];
    const variant = nodeType?.variants?.find(v => v.id === node?.data?.variant);

    const handleSave = () => {
        const configured = validateConfig();
        onUpdate(node.id, {
            ...node.data,
            config,
            label: label || variant?.label,
            configured
        });
        onClose();
    };

    const validateConfig = () => {
        switch (node?.data?.nodeType) {
            case 'trigger':
                return config.type && (config.type !== 'schedule' || config.time);
            case 'dataSource':
                // For Shopify, check storeUrl and accessToken
                if (node?.data?.variant === 'shopify') {
                    return !!(config.storeUrl && config.accessToken);
                }
                // For PostgreSQL/MySQL, check connection string
                return !!config.connection;
            case 'output':
                if (node?.data?.variant === 'whatsapp') return !!config.number;
                return true;
            case 'analysis':
                return true;
            default:
                return true;
        }
    };

    if (!node) return null;

    return (
        <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute top-0 right-0 w-80 h-full bg-gray-800/95 backdrop-blur-md border-l border-gray-700 z-10 overflow-y-auto"
        >
            {/* Header */}
            <div className="sticky top-0 bg-gray-800/95 backdrop-blur-md border-b border-gray-700 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{variant?.icon || nodeType?.icon}</span>
                        <div>
                            <h3 className="font-semibold text-white">{variant?.label || nodeType?.label}</h3>
                            <p className="text-xs text-gray-400">Configure this node</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-lg transition-colors text-gray-400">
                        <CloseIcon />
                    </button>
                </div>
            </div>

            {/* Config Form */}
            <div className="p-4 space-y-4">
                {/* Custom Label */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Node Label</label>
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder={variant?.label || nodeType?.label}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Trigger Configuration */}
                {node.data.nodeType === 'trigger' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Trigger Type</label>
                            <select
                                value={config.type || 'schedule'}
                                onChange={(e) => setConfig({ ...config, type: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="schedule">Scheduled</option>
                                <option value="manual">Manual / On Demand</option>
                            </select>
                        </div>
                        {config.type === 'schedule' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Run At (Daily)</label>
                                <input
                                    type="time"
                                    value={config.time || '09:00'}
                                    onChange={(e) => setConfig({ ...config, time: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}
                    </>
                )}

                {/* Data Source Configuration */}
                {node.data.nodeType === 'dataSource' && (
                    <>
                        {/* PostgreSQL Configuration */}
                        {(node.data.variant === 'postgresql' || node.data.variant === 'mysql') && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Connection String *</label>
                                    <textarea
                                        value={config.connection || ''}
                                        onChange={(e) => setConfig({ ...config, connection: e.target.value })}
                                        placeholder="postgresql://user:password@host/database?sslmode=require"
                                        rows={3}
                                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-xs placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">🔒 Encrypted and stored securely</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Tables to Monitor</label>
                                    <input
                                        type="text"
                                        value={config.tables || ''}
                                        onChange={(e) => setConfig({ ...config, tables: e.target.value })}
                                        placeholder="inventory, products, orders"
                                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Comma-separated. Leave empty for all tables.</p>
                                </div>
                            </>
                        )}

                        {/* Shopify Configuration */}
                        {node.data.variant === 'shopify' && (
                            <>
                                <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3 mb-3">
                                    <p className="text-green-300 font-medium mb-1 text-sm">🛒 Shopify Store Connection</p>
                                    <p className="text-green-200/70 text-xs">
                                        Connect to your Shopify store to analyze orders, inventory, and customer data.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Store URL *</label>
                                    <input
                                        type="text"
                                        value={config.storeUrl || ''}
                                        onChange={(e) => setConfig({ ...config, storeUrl: e.target.value })}
                                        placeholder="your-store.myshopify.com"
                                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Your Shopify store URL (e.g., mystore.myshopify.com)</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Access Token *</label>
                                    <input
                                        type="password"
                                        value={config.accessToken || ''}
                                        onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                                        placeholder="shpat_xxxxxxxxxxxxxxxxx"
                                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-xs placeholder-gray-500 focus:ring-2 focus:ring-green-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">🔒 Your Shopify Admin API access token</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Data to Fetch</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['orders', 'products', 'inventory', 'customers'].map((dataType) => (
                                            <label key={dataType} className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-800">
                                                <input
                                                    type="checkbox"
                                                    checked={(config.dataTypes || ['orders', 'products', 'inventory']).includes(dataType)}
                                                    onChange={(e) => {
                                                        const current = config.dataTypes || ['orders', 'products', 'inventory'];
                                                        if (e.target.checked) {
                                                            setConfig({ ...config, dataTypes: [...current, dataType] });
                                                        } else {
                                                            setConfig({ ...config, dataTypes: current.filter(t => t !== dataType) });
                                                        }
                                                    }}
                                                    className="rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                                                />
                                                <span className="text-sm text-gray-300 capitalize">{dataType}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Analysis Configuration */}
                {node.data.nodeType === 'analysis' && (
                    <>
                        {node.data.variant === 'custom' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Analysis Prompt</label>
                                <textarea
                                    value={config.prompt || ''}
                                    onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
                                    placeholder="Describe what the AI should analyze..."
                                    rows={4}
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Threshold Settings</label>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-500">Alert Days</label>
                                    <input
                                        type="number"
                                        value={config.alertDays || 7}
                                        onChange={(e) => setConfig({ ...config, alertDays: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Min Stock %</label>
                                    <input
                                        type="number"
                                        value={config.minStockPercent || 20}
                                        onChange={(e) => setConfig({ ...config, minStockPercent: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Output Configuration */}
                {node.data.nodeType === 'output' && node.data.variant === 'whatsapp' && (
                    <>
                        <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3 text-xs">
                            <p className="text-green-300 font-medium mb-1">📱 WhatsApp Sandbox</p>
                            <p className="text-green-200/70">
                                Send <strong>"join &lt;sandbox-word&gt;"</strong> to <strong>+1 415 523 8886</strong> first.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">WhatsApp Number *</label>
                            <input
                                type="tel"
                                value={config.number || ''}
                                onChange={(e) => setConfig({ ...config, number: e.target.value })}
                                placeholder="+917620836742"
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +91)</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Message Template</label>
                            <textarea
                                value={config.template || ''}
                                onChange={(e) => setConfig({ ...config, template: e.target.value })}
                                placeholder="Use {agent_name}, {timestamp}, {findings} as placeholders..."
                                rows={3}
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </>
                )}

                {node.data.nodeType === 'output' && node.data.variant === 'email' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email Address *</label>
                        <input
                            type="email"
                            value={config.email || ''}
                            onChange={(e) => setConfig({ ...config, email: e.target.value })}
                            placeholder="your@email.com"
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )}

                {/* Logic Configuration */}
                {node.data.nodeType === 'logic' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Condition</label>
                        <textarea
                            value={config.condition || ''}
                            onChange={(e) => setConfig({ ...config, condition: e.target.value })}
                            placeholder="e.g., stock_level < 10"
                            rows={2}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-xs placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-gray-800/95 backdrop-blur-md border-t border-gray-700 p-4 flex gap-2">
                <button
                    onClick={() => onDelete(node.id)}
                    className="flex-1 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <TrashIcon /> Delete
                </button>
                <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <SaveIcon /> Save
                </button>
            </div>
        </motion.div>
    );
};

// ============================================
// NODE PALETTE COMPONENT
// ============================================

const NodePalette = ({ onDragStart }) => {
    const [expandedCategory, setExpandedCategory] = useState(null);

    return (
        <div className="w-64 bg-gray-800/90 backdrop-blur-md border-r border-gray-700 overflow-y-auto">
            <div className="p-4 border-b border-gray-700">
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <span className="text-lg">🧩</span> Components
                </h3>
                <p className="text-xs text-gray-400 mt-1">Drag nodes to the canvas</p>
            </div>

            <div className="p-2 space-y-1">
                {Object.entries(NODE_TYPES).map(([key, nodeType]) => (
                    <div key={key} className="rounded-lg overflow-hidden">
                        <button
                            onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-700/50 transition-colors text-left"
                        >
                            <span className="text-xl">{nodeType.icon}</span>
                            <div className="flex-1">
                                <p className="font-medium text-white text-sm">{nodeType.label}</p>
                                <p className="text-xs text-gray-500">{nodeType.description}</p>
                            </div>
                            <span className={`text-gray-500 transition-transform ${expandedCategory === key ? 'rotate-90' : ''}`}>
                                ▶
                            </span>
                        </button>

                        <AnimatePresence>
                            {expandedCategory === key && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pl-4 pr-2 pb-2 space-y-1">
                                        {nodeType.variants.map((variant) => (
                                            <div
                                                key={variant.id}
                                                draggable
                                                onDragStart={(e) => onDragStart(e, key, variant.id)}
                                                className="flex items-center gap-2 p-2 bg-gray-700/30 hover:bg-gray-700/60 rounded-lg cursor-grab active:cursor-grabbing transition-all hover:translate-x-1 border border-transparent hover:border-gray-600"
                                                style={{ borderLeftColor: nodeType.color, borderLeftWidth: '3px' }}
                                            >
                                                <GripIcon />
                                                <span className="text-base">{variant.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-white truncate">{variant.label}</p>
                                                    <p className="text-[10px] text-gray-500 truncate">{variant.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================
// TEMPLATES PANEL
// ============================================

const TemplatesPanel = ({ onSelectTemplate }) => {
    const templates = [
        {
            id: 'stock_monitor',
            name: 'Stock Monitor',
            description: 'Complete stock-out prediction workflow',
            icon: '📦',
            nodes: [
                { type: 'trigger', variant: 'schedule', position: { x: 100, y: 200 }, config: { type: 'schedule', time: '09:00' }, configured: true },
                { type: 'dataSource', variant: 'postgresql', position: { x: 350, y: 200 } },
                { type: 'analysis', variant: 'stockout', position: { x: 600, y: 200 }, configured: true },
                { type: 'output', variant: 'whatsapp', position: { x: 850, y: 200 } },
            ],
            edges: [
                { source: 0, target: 1 },
                { source: 1, target: 2 },
                { source: 2, target: 3 },
            ]
        },
        {
            id: 'expiry_alert',
            name: 'Expiry Alert System',
            description: 'Monitor and alert on expiring items',
            icon: '⏰',
            nodes: [
                { type: 'trigger', variant: 'schedule', position: { x: 100, y: 200 }, config: { type: 'schedule', time: '08:00' }, configured: true },
                { type: 'dataSource', variant: 'postgresql', position: { x: 350, y: 200 } },
                { type: 'analysis', variant: 'expiry', position: { x: 600, y: 200 }, configured: true },
                { type: 'output', variant: 'whatsapp', position: { x: 850, y: 200 } },
            ],
            edges: [
                { source: 0, target: 1 },
                { source: 1, target: 2 },
                { source: 2, target: 3 },
            ]
        },
        {
            id: 'daily_brief',
            name: 'Daily Supply Brief',
            description: 'Morning summary of all supply chain insights',
            icon: '☕',
            nodes: [
                { type: 'trigger', variant: 'schedule', position: { x: 100, y: 200 }, config: { type: 'schedule', time: '07:00' }, configured: true },
                { type: 'dataSource', variant: 'postgresql', position: { x: 350, y: 100 } },
                { type: 'analysis', variant: 'stockout', position: { x: 600, y: 50 }, configured: true },
                { type: 'analysis', variant: 'expiry', position: { x: 600, y: 200 }, configured: true },
                { type: 'analysis', variant: 'reorder', position: { x: 600, y: 350 }, configured: true },
                { type: 'output', variant: 'whatsapp', position: { x: 850, y: 200 } },
            ],
            edges: [
                { source: 0, target: 1 },
                { source: 1, target: 2 },
                { source: 1, target: 3 },
                { source: 1, target: 4 },
                { source: 2, target: 5 },
                { source: 3, target: 5 },
                { source: 4, target: 5 },
            ]
        }
    ];

    return (
        <div className="p-4 space-y-3">
            <div className="text-center mb-4">
                <h4 className="text-white font-semibold">Quick Start Templates</h4>
                <p className="text-xs text-gray-400">Click to load a pre-built workflow</p>
            </div>
            {templates.map(template => (
                <motion.button
                    key={template.id}
                    onClick={() => onSelectTemplate(template)}
                    className="w-full p-3 bg-gray-700/40 hover:bg-gray-700/70 rounded-xl border border-gray-600 hover:border-blue-500/50 transition-all text-left group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{template.icon}</span>
                        <div>
                            <h5 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                                {template.name}
                            </h5>
                            <p className="text-xs text-gray-400">{template.description}</p>
                        </div>
                    </div>
                </motion.button>
            ))}
        </div>
    );
};

// ============================================
// MAIN WORKFLOW BUILDER COMPONENT
// ============================================

export default function WorkflowAgentBuilder({ isOpen, onClose, onAgentCreated }) {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [agentName, setAgentName] = useState('');
    const [showTemplates, setShowTemplates] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);

    // AI Chat State
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    // Chain of Thought Modal State
    const [showAIModal, setShowAIModal] = useState(false);
    const [showAIPromptPanel, setShowAIPromptPanel] = useState(false); // Controls the AI generator popup
    const [generationPhase, setGenerationPhase] = useState('idle'); // idle, analyzing, building, configuring, complete
    const [thoughtSteps, setThoughtSteps] = useState([]);
    const [currentThoughtIndex, setCurrentThoughtIndex] = useState(-1);
    const [generatedWorkflow, setGeneratedWorkflow] = useState(null);

    // Configuration gathering during chain of thought
    const [configInputs, setConfigInputs] = useState({
        dataSourceType: 'postgresql', // 'postgresql' or 'shopify'
        databaseUrl: '',
        shopifyStoreUrl: '',
        shopifyAccessToken: '',
        whatsappNumber: '',
        email: '',
    });
    const [needsConfig, setNeedsConfig] = useState({ database: false, whatsapp: false, email: false });
    const [pendingWorkflowConfig, setPendingWorkflowConfig] = useState(null);
    const [detectedIntents, setDetectedIntents] = useState({});

    // Generate workflow from AI prompt with Chain of Thought
    const generateWorkflowFromPrompt = async () => {
        if (!aiPrompt.trim()) return;

        // Open the modal and start the generation process
        setShowAIModal(true);
        setGenerationPhase('analyzing');
        setThoughtSteps([]);
        setCurrentThoughtIndex(-1);
        setGeneratedWorkflow(null);
        setPendingWorkflowConfig(null);
        setConfigInputs({ dataSourceType: 'postgresql', databaseUrl: '', shopifyStoreUrl: '', shopifyAccessToken: '', whatsappNumber: '', email: '' });
        setNeedsConfig({ database: false, whatsapp: false, email: false });
        setError('');

        try {
            // Analyze the prompt
            const prompt = aiPrompt.toLowerCase();

            // Step 1: Analyzing user intent
            await addThoughtStep({
                icon: '🔍',
                title: 'Analyzing your request...',
                detail: `Understanding: "${aiPrompt}"`,
                status: 'processing'
            });

            await delay(800);

            // Detect intent
            const hasStock = prompt.includes('stock') || prompt.includes('inventory') || prompt.includes('low');
            const hasExpiry = prompt.includes('expir') || prompt.includes('expire') || prompt.includes('shelf') || prompt.includes('date');
            const hasReorder = prompt.includes('reorder') || prompt.includes('order') || prompt.includes('buy');
            const hasWhatsApp = prompt.includes('whatsapp') || prompt.includes('message') || prompt.includes('alert') || prompt.includes('notify');
            const hasEmail = prompt.includes('email');
            const hasSchedule = prompt.includes('daily') || prompt.includes('morning') || prompt.includes('evening') || prompt.includes('schedule') || prompt.includes('every');
            const hasReport = prompt.includes('report') || prompt.includes('summary') || prompt.includes('brief');

            // Store detected intents for later use
            const intents = { hasStock, hasExpiry, hasReorder, hasWhatsApp, hasEmail, hasSchedule, hasReport };
            setDetectedIntents(intents);

            updateLastThoughtStep({ status: 'complete' });

            // Step 2: Identifying required components
            await addThoughtStep({
                icon: '🧩',
                title: 'Identifying components...',
                detail: 'Detecting workflow elements needed',
                status: 'processing'
            });

            await delay(600);

            const detectedComponents = [];
            if (hasSchedule) detectedComponents.push('⏰ Scheduled Trigger');
            else detectedComponents.push('🔔 On-Demand Trigger');
            detectedComponents.push('🗄️ Database Connection');
            if (hasStock || hasReport) detectedComponents.push('📦 Stock Analysis');
            if (hasExpiry || hasReport) detectedComponents.push('⏰ Expiry Monitoring');
            if (hasReorder) detectedComponents.push('🛒 Reorder Intelligence');
            if (hasWhatsApp) detectedComponents.push('💬 WhatsApp Notification');
            if (hasEmail) detectedComponents.push('📧 Email Notification');
            if (!hasWhatsApp && !hasEmail) detectedComponents.push('💬 WhatsApp Notification');

            updateLastThoughtStep({
                status: 'complete',
                detail: `Found ${detectedComponents.length} components: ${detectedComponents.slice(0, 3).join(', ')}${detectedComponents.length > 3 ? '...' : ''}`
            });

            // Step 3: Configuring trigger
            await addThoughtStep({
                icon: '⚡',
                title: 'Setting up trigger...',
                detail: hasSchedule ? 'Configuring scheduled execution' : 'Setting up on-demand trigger',
                status: 'processing'
            });

            await delay(500);

            let scheduleTime = '09:00';
            if (prompt.includes('morning')) scheduleTime = '08:00';
            if (prompt.includes('evening')) scheduleTime = '18:00';
            if (prompt.includes('night')) scheduleTime = '21:00';

            updateLastThoughtStep({
                status: 'complete',
                detail: hasSchedule ? `Scheduled for ${scheduleTime} daily` : 'Manual trigger configured'
            });

            setGenerationPhase('building');

            // Step 4: Configuration required - ask for inputs
            await addThoughtStep({
                icon: '⚙️',
                title: 'Configuration required...',
                detail: 'I need some details to complete your workflow',
                status: 'input-required'
            });

            await delay(300);

            // Determine what config we need
            const configNeeded = {
                database: true, // Always need database
                whatsapp: hasWhatsApp || (!hasEmail),
                email: hasEmail,
            };
            setNeedsConfig(configNeeded);

            // Store pending workflow info
            setPendingWorkflowConfig({
                scheduleTime,
                intents,
            });

            // Switch to configuring phase - user needs to input values
            setGenerationPhase('configuring');

        } catch (err) {
            setError('Failed to generate workflow. Please try again.');
            console.error('AI workflow generation error:', err);
            setShowAIModal(false);
        }
    };

    // Continue workflow generation after user provides configuration
    const continueWithConfig = async () => {
        if (!pendingWorkflowConfig) return;

        const { scheduleTime, intents } = pendingWorkflowConfig;
        const { hasStock, hasExpiry, hasReorder, hasWhatsApp, hasEmail, hasSchedule, hasReport } = intents;

        // Update the config step to complete
        updateLastThoughtStep({
            status: 'complete',
            detail: 'Configuration received ✓'
        });

        setGenerationPhase('building');

        await delay(300);

        // Step 5: Building data pipeline
        await addThoughtStep({
            icon: '🔗',
            title: 'Designing data pipeline...',
            detail: 'Connecting data sources to analysis',
            status: 'processing'
        });

        await delay(700);

        updateLastThoughtStep({
            status: 'complete',
            detail: 'PostgreSQL → AI Analysis → Output'
        });

        // Step 6: Configuring AI analysis
        const analysisTypes = [];
        if (hasStock || hasReport) analysisTypes.push('Stock-Out Prediction');
        if (hasExpiry || hasReport) analysisTypes.push('Expiry Watchdog');
        if (hasReorder) analysisTypes.push('Smart Reorder');

        if (analysisTypes.length > 0) {
            await addThoughtStep({
                icon: '🧠',
                title: 'Adding AI analysis modules...',
                detail: analysisTypes.join(' + '),
                status: 'processing'
            });

            await delay(600);

            updateLastThoughtStep({ status: 'complete' });
        }

        // Step 7: Setting up notifications with provided config
        await addThoughtStep({
            icon: '📣',
            title: 'Configuring notifications...',
            detail: hasEmail
                ? `Setting up email alerts to ${configInputs.email}`
                : `Setting up WhatsApp alerts to ${configInputs.whatsappNumber}`,
            status: 'processing'
        });

        await delay(500);

        updateLastThoughtStep({ status: 'complete' });

        // Now build the actual workflow with configuration
        let workflowConfig = {
            name: '',
            nodes: [],
            edges: []
        };

        let nodeIndex = 0;

        // Always start with a trigger
        workflowConfig.nodes.push({
            id: `trigger-${Date.now()}-${nodeIndex}`,
            type: 'custom',
            position: { x: 100, y: 200 },
            data: {
                nodeType: 'trigger',
                variant: hasSchedule ? 'schedule' : 'webhook',
                config: hasSchedule ? { type: 'schedule', time: scheduleTime } : { type: 'webhook' },
                configured: true, // Now fully configured!
            }
        });
        const triggerIndex = nodeIndex++;

        // Add data source WITH configuration (PostgreSQL or Shopify)
        const dataSourceVariant = configInputs.dataSourceType === 'shopify' ? 'shopify' : 'postgresql';
        const dataSourceConfig = configInputs.dataSourceType === 'shopify'
            ? { storeUrl: configInputs.shopifyStoreUrl, accessToken: configInputs.shopifyAccessToken }
            : { connectionString: configInputs.databaseUrl };

        workflowConfig.nodes.push({
            id: `dataSource-${Date.now()}-${nodeIndex}`,
            type: 'custom',
            position: { x: 350, y: 200 },
            data: {
                nodeType: 'dataSource',
                variant: dataSourceVariant,
                config: dataSourceConfig,
                configured: true, // Now fully configured!
            }
        });
        const dataSourceIndex = nodeIndex++;
        workflowConfig.edges.push({ source: workflowConfig.nodes[triggerIndex].id, target: workflowConfig.nodes[dataSourceIndex].id });

        // Add analysis nodes
        const analysisNodes = [];
        let yOffset = 100;

        if (hasStock || hasReport) {
            workflowConfig.nodes.push({
                id: `analysis-${Date.now()}-${nodeIndex}`,
                type: 'custom',
                position: { x: 600, y: yOffset },
                data: {
                    nodeType: 'analysis',
                    variant: 'stockout',
                    config: {},
                    configured: true,
                }
            });
            analysisNodes.push(nodeIndex++);
            yOffset += 150;
            workflowConfig.name = 'Stock Alert Agent';
        }

        if (hasExpiry || hasReport) {
            workflowConfig.nodes.push({
                id: `analysis-${Date.now()}-${nodeIndex}`,
                type: 'custom',
                position: { x: 600, y: yOffset },
                data: {
                    nodeType: 'analysis',
                    variant: 'expiry',
                    config: {},
                    configured: true,
                }
            });
            analysisNodes.push(nodeIndex++);
            yOffset += 150;
            if (!workflowConfig.name) workflowConfig.name = 'Expiry Watchdog';
        }

        if (hasReorder) {
            workflowConfig.nodes.push({
                id: `analysis-${Date.now()}-${nodeIndex}`,
                type: 'custom',
                position: { x: 600, y: yOffset },
                data: {
                    nodeType: 'analysis',
                    variant: 'reorder',
                    config: {},
                    configured: true,
                }
            });
            analysisNodes.push(nodeIndex++);
            if (!workflowConfig.name) workflowConfig.name = 'Smart Reorder Agent';
        }

        // If no specific analysis, add custom
        if (analysisNodes.length === 0) {
            workflowConfig.nodes.push({
                id: `analysis-${Date.now()}-${nodeIndex}`,
                type: 'custom',
                position: { x: 600, y: 200 },
                data: {
                    nodeType: 'analysis',
                    variant: 'custom',
                    config: { prompt: aiPrompt },
                    configured: true,
                }
            });
            analysisNodes.push(nodeIndex++);
            workflowConfig.name = 'Custom AI Agent';
        }

        // Connect data source to all analysis nodes
        analysisNodes.forEach(idx => {
            workflowConfig.edges.push({ source: workflowConfig.nodes[dataSourceIndex].id, target: workflowConfig.nodes[idx].id });
        });

        // Add output node WITH configuration
        const outputVariant = hasEmail ? 'email' : 'whatsapp';
        const outputYPos = analysisNodes.length > 1 ? 200 : workflowConfig.nodes[workflowConfig.nodes.length - 1].position.y;

        workflowConfig.nodes.push({
            id: `output-${Date.now()}-${nodeIndex}`,
            type: 'custom',
            position: { x: 850, y: outputYPos },
            data: {
                nodeType: 'output',
                variant: outputVariant,
                config: hasEmail
                    ? { email: configInputs.email }
                    : { number: configInputs.whatsappNumber },  // Use 'number' to match handleDeploy
                configured: true, // Now fully configured!
            }
        });
        const outputIndex = nodeIndex;

        // Connect all analysis nodes to output
        analysisNodes.forEach(idx => {
            workflowConfig.edges.push({ source: workflowConfig.nodes[idx].id, target: workflowConfig.nodes[outputIndex].id });
        });

        // Set the workflow name if still empty
        if (!workflowConfig.name) {
            workflowConfig.name = hasReport ? 'Daily Report Agent' : 'Custom Agent';
        }

        // Step 8: Finalizing
        await addThoughtStep({
            icon: '✨',
            title: 'Finalizing workflow...',
            detail: `Created "${workflowConfig.name}" with ${workflowConfig.nodes.length} fully configured nodes`,
            status: 'processing'
        });

        await delay(400);

        updateLastThoughtStep({ status: 'complete' });

        // Store the generated workflow
        setGeneratedWorkflow(workflowConfig);
        setGenerationPhase('complete');
    };

    // Helper function to add a thought step with animation
    const addThoughtStep = (step) => {
        return new Promise((resolve) => {
            setThoughtSteps(prev => [...prev, step]);
            setCurrentThoughtIndex(prev => prev + 1);
            setTimeout(resolve, 100);
        });
    };

    // Helper function to update the last thought step
    const updateLastThoughtStep = (updates) => {
        setThoughtSteps(prev => {
            const newSteps = [...prev];
            if (newSteps.length > 0) {
                newSteps[newSteps.length - 1] = { ...newSteps[newSteps.length - 1], ...updates };
            }
            return newSteps;
        });
    };

    // Helper delay function
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Apply the generated workflow to the canvas
    const applyGeneratedWorkflow = () => {
        if (!generatedWorkflow) return;

        setNodes(generatedWorkflow.nodes);
        setEdges(generatedWorkflow.edges.map((e, i) => ({
            id: `edge-${Date.now()}-${i}`,
            source: e.source,
            target: e.target,
            type: 'animated',
            style: { stroke: '#6366f1', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
        })));
        setAgentName(generatedWorkflow.name);
        setShowTemplates(false);
        setAiPrompt('');
        setShowAIModal(false);
        setGenerationPhase('idle');
        setThoughtSteps([]);
        setCurrentThoughtIndex(-1);
        setGeneratedWorkflow(null);
        setShowAIPromptPanel(false); // Close the AI prompt panel

        // Show success feedback
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
    };

    // Close the AI modal
    const closeAIModal = () => {
        setShowAIModal(false);
        setGenerationPhase('idle');
        setThoughtSteps([]);
        setCurrentThoughtIndex(-1);
        setGeneratedWorkflow(null);
    };

    // Custom node types
    const nodeTypes = useMemo(() => ({
        custom: CustomNode,
    }), []);

    // Custom edge types
    const edgeTypes = useMemo(() => ({
        animated: AnimatedEdge,
    }), []);

    // Default edge options
    const defaultEdgeOptions = {
        type: 'animated',
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#6366f1',
        },
    };

    // Handle edge connections
    const onConnect = useCallback((params) => {
        setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds));
    }, [setEdges]);

    // Handle node click for configuration
    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
        setShowTemplates(false);
    }, []);

    // Handle drag over
    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    // Handle drop
    const onDrop = useCallback((event) => {
        event.preventDefault();

        const nodeType = event.dataTransfer.getData('application/nodeType');
        const variant = event.dataTransfer.getData('application/variant');

        if (!nodeType || !reactFlowInstance) return;

        const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        const newNode = {
            id: `${nodeType}-${Date.now()}`,
            type: 'custom',
            position,
            data: {
                nodeType,
                variant,
                label: '',
                config: {},
                configured: false,
            },
        };

        setNodes((nds) => nds.concat(newNode));
        setShowTemplates(false);
    }, [reactFlowInstance, setNodes]);

    // Handle drag start from palette
    const onDragStart = (event, nodeType, variant) => {
        event.dataTransfer.setData('application/nodeType', nodeType);
        event.dataTransfer.setData('application/variant', variant);
        event.dataTransfer.effectAllowed = 'move';
    };

    // Update node data
    const updateNodeData = useCallback((nodeId, data) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data };
                }
                return node;
            })
        );
    }, [setNodes]);

    // Delete node
    const deleteNode = useCallback((nodeId) => {
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
        setSelectedNode(null);
    }, [setNodes, setEdges]);

    // Load template
    const loadTemplate = useCallback((template) => {
        const newNodes = template.nodes.map((n, i) => ({
            id: `${n.type}-${Date.now()}-${i}`,
            type: 'custom',
            position: n.position,
            data: {
                nodeType: n.type,
                variant: n.variant,
                label: '',
                config: n.config || {},
                configured: n.configured || false,
            },
        }));

        const newEdges = template.edges.map((e, i) => ({
            id: `edge-${Date.now()}-${i}`,
            source: newNodes[e.source].id,
            target: newNodes[e.target].id,
            ...defaultEdgeOptions,
        }));

        setNodes(newNodes);
        setEdges(newEdges);
        setAgentName(template.name);
        setShowTemplates(false);
    }, [setNodes, setEdges]);

    // Validate workflow
    const validateWorkflow = () => {
        if (!agentName.trim()) {
            setError('Please give your agent a name');
            return false;
        }
        if (nodes.length === 0) {
            setError('Please add at least one node to your workflow');
            return false;
        }

        // Check for required nodes
        const hasTrigger = nodes.some(n => n.data.nodeType === 'trigger');
        const hasDataSource = nodes.some(n => n.data.nodeType === 'dataSource');
        const hasOutput = nodes.some(n => n.data.nodeType === 'output');

        if (!hasTrigger) {
            setError('Please add a Trigger node to start your workflow');
            return false;
        }
        if (!hasDataSource) {
            setError('Please add a Data Source node to connect your data');
            return false;
        }
        if (!hasOutput) {
            setError('Please add an Output node to send results');
            return false;
        }

        // Check for unconfigured critical nodes
        const unconfiguredDataSource = nodes.find(n => {
            if (n.data.nodeType !== 'dataSource') return false;
            // For Shopify, check storeUrl and accessToken
            if (n.data.variant === 'shopify') {
                return !(n.data.config?.storeUrl && n.data.config?.accessToken);
            }
            // For PostgreSQL/MySQL, check connection string
            return !n.data.config?.connection;
        });
        if (unconfiguredDataSource) {
            if (unconfiguredDataSource.data.variant === 'shopify') {
                setError('Please configure your Shopify node with store URL and access token');
            } else {
                setError('Please configure your Data Source node with a connection string');
            }
            return false;
        }

        const unconfiguredWhatsApp = nodes.find(n => n.data.nodeType === 'output' && n.data.variant === 'whatsapp' && !n.data.config?.number);
        if (unconfiguredWhatsApp) {
            setError('Please configure your WhatsApp node with a phone number');
            return false;
        }

        return true;
    };

    // Save and deploy agent
    const handleDeploy = async () => {
        setError('');

        if (!validateWorkflow()) return;

        setLoading(true);

        try {
            // Build agent configuration from nodes
            const triggerNode = nodes.find(n => n.data.nodeType === 'trigger');
            const dataSourceNode = nodes.find(n => n.data.nodeType === 'dataSource');
            const analysisNodes = nodes.filter(n => n.data.nodeType === 'analysis');
            const outputNode = nodes.find(n => n.data.nodeType === 'output');

            // Check if using Shopify data source
            const isShopify = dataSourceNode?.data?.variant === 'shopify';

            const agentConfig = {
                name: agentName,
                description: `Workflow agent with ${analysisNodes.length} analysis step(s)`,
                icon: '🔄',
                whatsapp_number: outputNode?.data?.config?.number || '',
                // For Shopify, we don't use db_connection_string - we use separate Shopify fields
                db_connection_string: isShopify ? '' : (dataSourceNode?.data?.config?.connection || ''),
                // Add Shopify-specific config
                datasource_type: isShopify ? 'shopify' : 'postgresql',
                shopify_store_url: isShopify ? dataSourceNode?.data?.config?.storeUrl : null,
                shopify_access_token: isShopify ? dataSourceNode?.data?.config?.accessToken : null,
                shopify_data_types: isShopify ? dataSourceNode?.data?.config?.dataTypes : null,
                selected_tables: dataSourceNode?.data?.config?.tables
                    ? dataSourceNode.data.config.tables.split(',').map(t => t.trim()).filter(Boolean)
                    : null,
                notification_time: triggerNode?.data?.config?.time || '09:00',
                analysis_prompt: analysisNodes.find(n => n.data.variant === 'custom')?.data?.config?.prompt || null,
                notification_template: outputNode?.data?.config?.template || null,
                workflow_config: {
                    nodes: nodes.map(n => ({
                        id: n.id,
                        type: n.data.nodeType,
                        variant: n.data.variant,
                        config: n.data.config,
                        position: n.position,
                    })),
                    edges: edges.map(e => ({
                        source: e.source,
                        target: e.target,
                    })),
                }
            };

            const response = await api.post('/agents/custom', agentConfig);

            setSuccess(true);
            onAgentCreated?.(response.data);

            setTimeout(() => {
                handleClose();
            }, 2000);

        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to deploy agent. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle close
    const handleClose = () => {
        setNodes([]);
        setEdges([]);
        setSelectedNode(null);
        setAgentName('');
        setShowTemplates(true);
        setError('');
        setSuccess(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="relative bg-gray-900 rounded-2xl shadow-2xl w-[95vw] h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-gray-800/80 border-b border-gray-700">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                                <span className="text-xl">⚡</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Workflow Agent Builder</h2>
                                <p className="text-xs text-gray-400">Design your AI agent visually</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Agent Name Input */}
                            <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2">
                                <span className="text-gray-400 text-sm">Agent:</span>
                                <input
                                    type="text"
                                    value={agentName}
                                    onChange={(e) => setAgentName(e.target.value)}
                                    placeholder="My Supply Chain Agent"
                                    className="bg-transparent border-none outline-none text-white placeholder-gray-500 w-48"
                                />
                            </div>

                            {/* Actions */}
                            <button
                                onClick={() => setShowTemplates(!showTemplates)}
                                className={`px-4 py-2 rounded-lg transition-colors ${showTemplates ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                Templates
                            </button>

                            <button
                                onClick={handleDeploy}
                                disabled={loading}
                                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <PlayIcon />
                                )}
                                Deploy Agent
                            </button>

                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                    </div>

                    {/* Error/Success Messages */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-red-900/50 border-b border-red-700 px-6 py-3 text-red-300 text-sm"
                            >
                                ⚠️ {error}
                            </motion.div>
                        )}
                        {success && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="bg-green-900/50 border-b border-green-700 px-6 py-3 text-green-300 text-sm flex items-center gap-2"
                            >
                                <span className="text-xl">🎉</span> Agent deployed successfully! Sending test notification...
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main Content */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Node Palette */}
                        <NodePalette onDragStart={onDragStart} />

                        {/* Canvas */}
                        <div ref={reactFlowWrapper} className="flex-1 relative">
                            {/* AI Generate Badge - Top Right Corner of Canvas */}
                            <button
                                onClick={() => setShowAIPromptPanel(!showAIPromptPanel)}
                                className="absolute top-4 right-4 z-30 group flex items-center gap-2 px-4 py-2 rounded-full transition-all hover:scale-105"
                                style={{
                                    background: showAIPromptPanel
                                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(236, 72, 153, 0.25))'
                                        : 'rgba(17, 24, 39, 0.95)',
                                }}
                            >
                                {/* Animated gradient border */}
                                <div
                                    className="absolute inset-0 rounded-full p-[2px] overflow-hidden"
                                    style={{
                                        background: 'linear-gradient(90deg, #8b5cf6, #ec4899, #8b5cf6, #ec4899)',
                                        backgroundSize: '300% 100%',
                                        animation: 'shimmer-border 3s linear infinite',
                                    }}
                                >
                                    <div
                                        className="w-full h-full rounded-full"
                                        style={{
                                            background: showAIPromptPanel
                                                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3))'
                                                : '#111827',
                                        }}
                                    />
                                </div>

                                {/* Glow effect */}
                                <div
                                    className="absolute inset-0 rounded-full opacity-60 blur-lg -z-10"
                                    style={{
                                        background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
                                    }}
                                />

                                {/* Content */}
                                <span className="relative z-10 text-lg">✨</span>
                                <span className="relative z-10 font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 text-sm">
                                    AI Generate
                                </span>
                            </button>

                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                onNodeClick={onNodeClick}
                                onDrop={onDrop}
                                onDragOver={onDragOver}
                                onInit={setReactFlowInstance}
                                nodeTypes={nodeTypes}
                                edgeTypes={edgeTypes}
                                defaultEdgeOptions={defaultEdgeOptions}
                                fitView
                                proOptions={{ hideAttribution: true }}
                                className="bg-gray-900"
                            >
                                <Background color="#374151" gap={20} size={1} />
                                <Controls className="!bg-gray-800 !border-gray-700 !rounded-xl !shadow-lg" />
                                <MiniMap
                                    className="!bg-gray-800 !border-gray-700 !rounded-xl"
                                    nodeColor={(n) => NODE_TYPES[n.data?.nodeType]?.color || '#6b7280'}
                                    maskColor="rgba(0, 0, 0, 0.7)"
                                />

                                {/* Empty State */}
                                {nodes.length === 0 && (
                                    <Panel position="top-center">
                                        <div className="mt-20 text-center">
                                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-800 rounded-2xl mb-4">
                                                <span className="text-4xl">🎨</span>
                                            </div>
                                            <h3 className="text-xl font-semibold text-white mb-2">
                                                Start Building Your Agent
                                            </h3>
                                            <p className="text-gray-400 max-w-md">
                                                Drag components from the left panel or choose a template to get started.
                                                Connect nodes to define your workflow.
                                            </p>
                                        </div>
                                    </Panel>
                                )}
                            </ReactFlow>

                            {/* Templates Panel */}
                            <AnimatePresence>
                                {showTemplates && nodes.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-96 bg-gray-800/95 backdrop-blur-md rounded-2xl border border-gray-700 shadow-2xl"
                                    >
                                        <TemplatesPanel onSelectTemplate={loadTemplate} />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* AI Chat Panel - Prompt to generate workflow - Now a modal popup */}
                            <AnimatePresence>
                                {showAIPromptPanel && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                        className="absolute top-16 right-4 w-[420px] z-20"
                                    >
                                        <div
                                            className="bg-gray-800/98 backdrop-blur-xl rounded-2xl border border-violet-500/30 shadow-2xl overflow-hidden"
                                            style={{
                                                boxShadow: '0 0 40px rgba(139, 92, 246, 0.2), 0 20px 40px rgba(0, 0, 0, 0.4)'
                                            }}
                                        >
                                            {/* Panel Header */}
                                            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-b border-gray-700/50">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
                                                        <span className="text-sm">✨</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-white text-sm">AI Workflow Generator</h4>
                                                        <p className="text-xs text-gray-400">Describe what you want</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setShowAIPromptPanel(false)}
                                                    className="p-1.5 hover:bg-gray-700/50 rounded-lg transition-colors text-gray-400 hover:text-white"
                                                >
                                                    <CloseIcon />
                                                </button>
                                            </div>

                                            {/* Panel Body */}
                                            <div className="p-4">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={aiPrompt}
                                                        onChange={(e) => setAiPrompt(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && generateWorkflowFromPrompt()}
                                                        placeholder="e.g., Alert me about expiring inventory..."
                                                        className="flex-1 px-4 py-3 bg-gray-900/80 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                                                        disabled={showAIModal}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={generateWorkflowFromPrompt}
                                                        disabled={showAIModal || !aiPrompt.trim()}
                                                        className="group relative px-5 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-xl transition-all shadow-lg shadow-violet-500/30 disabled:opacity-50 flex items-center gap-2 overflow-hidden"
                                                    >
                                                        {/* Shimmer effect */}
                                                        <div
                                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                                            style={{
                                                                animation: !showAIModal && aiPrompt.trim() ? 'shimmer 2s infinite' : 'none'
                                                            }}
                                                        />
                                                        <span className="relative z-10">🪄</span>
                                                        <span className="relative z-10 font-medium">Generate</span>
                                                    </button>
                                                </div>

                                                {/* Quick suggestions */}
                                                <div className="mt-3">
                                                    <p className="text-xs text-gray-500 mb-2">Quick suggestions:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            onClick={() => setAiPrompt('Send me daily stock alerts on WhatsApp')}
                                                            className="text-xs px-3 py-1.5 bg-gray-700/50 hover:bg-violet-500/20 hover:border-violet-500/50 border border-transparent rounded-full text-gray-300 transition-all"
                                                        >
                                                            📦 Stock alerts
                                                        </button>
                                                        <button
                                                            onClick={() => setAiPrompt('Notify me about expiring products every morning')}
                                                            className="text-xs px-3 py-1.5 bg-gray-700/50 hover:bg-violet-500/20 hover:border-violet-500/50 border border-transparent rounded-full text-gray-300 transition-all"
                                                        >
                                                            ⏰ Expiry alerts
                                                        </button>
                                                        <button
                                                            onClick={() => setAiPrompt('Daily inventory report with reorder suggestions')}
                                                            className="text-xs px-3 py-1.5 bg-gray-700/50 hover:bg-violet-500/20 hover:border-violet-500/50 border border-transparent rounded-full text-gray-300 transition-all"
                                                        >
                                                            📊 Daily report
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Node Configuration Panel */}
                        <AnimatePresence>
                            {selectedNode && (
                                <NodeConfigPanel
                                    node={selectedNode}
                                    onUpdate={updateNodeData}
                                    onClose={() => setSelectedNode(null)}
                                    onDelete={deleteNode}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Chain of Thought AI Generation Modal */}
                    <AnimatePresence>
                        {showAIModal && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                                onClick={(e) => e.target === e.currentTarget && generationPhase === 'complete' && closeAIModal()}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                    className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl border border-gray-700/50 shadow-2xl w-[520px] overflow-hidden"
                                    style={{
                                        boxShadow: generationPhase === 'complete'
                                            ? '0 0 60px rgba(139, 92, 246, 0.3), 0 0 100px rgba(236, 72, 153, 0.15)'
                                            : '0 25px 50px rgba(0, 0, 0, 0.5)'
                                    }}
                                >
                                    {/* Modal Header */}
                                    <div className="relative px-6 py-5 border-b border-gray-700/50 overflow-hidden">
                                        {/* Animated background gradient */}
                                        <div
                                            className="absolute inset-0 opacity-30"
                                            style={{
                                                background: generationPhase === 'complete'
                                                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.2))'
                                                    : generationPhase === 'configuring'
                                                        ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.2))'
                                                        : 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.2))'
                                            }}
                                        />

                                        <div className="relative flex items-center gap-4">
                                            <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center ${generationPhase === 'complete'
                                                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                                : generationPhase === 'configuring'
                                                    ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                                                    : 'bg-gradient-to-br from-violet-500 to-fuchsia-500'
                                                }`}>
                                                {generationPhase !== 'complete' && generationPhase !== 'configuring' && (
                                                    <div className="absolute inset-0 rounded-2xl animate-ping opacity-30 bg-violet-500" />
                                                )}
                                                <span className="text-2xl relative z-10">
                                                    {generationPhase === 'complete' ? '✓' : generationPhase === 'configuring' ? '⚙️' : '🧠'}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-white">
                                                    {generationPhase === 'complete' ? 'Workflow Ready!' : generationPhase === 'configuring' ? 'Configuration Needed' : 'AI is Thinking...'}
                                                </h3>
                                                <p className="text-sm text-gray-400 mt-0.5">
                                                    {generationPhase === 'analyzing' && 'Understanding your requirements'}
                                                    {generationPhase === 'building' && 'Constructing your workflow'}
                                                    {generationPhase === 'configuring' && 'Please provide the required details'}
                                                    {generationPhase === 'complete' && 'Your agent is ready to deploy'}
                                                </p>
                                            </div>

                                            {/* Phase indicator */}
                                            <div className="flex items-center gap-1.5">
                                                {['analyzing', 'building', 'configuring', 'complete'].map((phase, idx) => (
                                                    <div
                                                        key={phase}
                                                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${generationPhase === phase
                                                            ? (phase === 'complete' ? 'bg-green-500 scale-125' : phase === 'configuring' ? 'bg-amber-500 scale-125' : 'bg-violet-500 scale-125 animate-pulse')
                                                            : (idx < ['analyzing', 'building', 'configuring', 'complete'].indexOf(generationPhase)
                                                                ? (phase === 'configuring' ? 'bg-amber-500' : 'bg-violet-500')
                                                                : 'bg-gray-600')
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Thought Steps */}
                                    <div className="p-6 max-h-[400px] overflow-y-auto">
                                        <div className="space-y-3">
                                            {thoughtSteps.map((step, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 ${step.status === 'processing'
                                                        ? 'bg-violet-500/10 border-violet-500/30'
                                                        : step.status === 'complete'
                                                            ? 'bg-green-500/10 border-green-500/30'
                                                            : step.status === 'input-required'
                                                                ? 'bg-amber-500/10 border-amber-500/30'
                                                                : 'bg-gray-800/50 border-gray-700/50'
                                                        }`}
                                                >
                                                    {/* Step Icon */}
                                                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg ${step.status === 'processing'
                                                        ? 'bg-violet-500/20'
                                                        : step.status === 'complete'
                                                            ? 'bg-green-500/20'
                                                            : step.status === 'input-required'
                                                                ? 'bg-amber-500/20'
                                                                : 'bg-gray-700/50'
                                                        }`}>
                                                        {step.status === 'processing' ? (
                                                            <div className="relative">
                                                                <span className="animate-pulse">{step.icon}</span>
                                                            </div>
                                                        ) : step.status === 'complete' ? (
                                                            <span className="text-green-400">✓</span>
                                                        ) : step.status === 'input-required' ? (
                                                            <span className="text-amber-400">{step.icon}</span>
                                                        ) : (
                                                            step.icon
                                                        )}
                                                    </div>

                                                    {/* Step Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className={`font-medium ${step.status === 'complete'
                                                                ? 'text-green-300'
                                                                : step.status === 'input-required'
                                                                    ? 'text-amber-300'
                                                                    : 'text-white'
                                                                }`}>
                                                                {step.title}
                                                            </h4>
                                                            {step.status === 'processing' && (
                                                                <div className="flex gap-1">
                                                                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        {step.detail && (
                                                            <p className="text-sm text-gray-400 mt-0.5 truncate">
                                                                {step.detail}
                                                            </p>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Configuration Input Form - Shows during configuring phase */}
                                        {generationPhase === 'configuring' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                                className="mt-6 p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/30"
                                            >
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                                                        <span className="text-lg">📝</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-white">Complete Your Configuration</h4>
                                                        <p className="text-xs text-gray-400">Fill in the details below to configure your workflow</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    {/* Data Source Selection */}
                                                    {needsConfig.database && (
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                                <span className="flex items-center gap-2">
                                                                    <span>🗄️</span>
                                                                    Choose Data Source
                                                                </span>
                                                            </label>

                                                            {/* Data Source Toggle */}
                                                            <div className="flex gap-2 mb-4">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setConfigInputs(prev => ({ ...prev, dataSourceType: 'postgresql' }))}
                                                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${configInputs.dataSourceType === 'postgresql'
                                                                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                                                                        : 'bg-gray-800/50 border-gray-600 text-gray-400 hover:border-gray-500'
                                                                        }`}
                                                                >
                                                                    <span className="text-xl">🐘</span>
                                                                    <span className="font-medium">PostgreSQL</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setConfigInputs(prev => ({ ...prev, dataSourceType: 'shopify' }))}
                                                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${configInputs.dataSourceType === 'shopify'
                                                                        ? 'bg-green-500/20 border-green-500 text-green-300'
                                                                        : 'bg-gray-800/50 border-gray-600 text-gray-400 hover:border-gray-500'
                                                                        }`}
                                                                >
                                                                    <span className="text-xl">🛒</span>
                                                                    <span className="font-medium">Shopify</span>
                                                                </button>
                                                            </div>

                                                            {/* PostgreSQL Fields */}
                                                            {configInputs.dataSourceType === 'postgresql' && (
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                                                        Database Connection String
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={configInputs.databaseUrl}
                                                                        onChange={(e) => setConfigInputs(prev => ({ ...prev, databaseUrl: e.target.value }))}
                                                                        placeholder="postgresql://user:pass@host:5432/db"
                                                                        className="w-full px-4 py-3 bg-gray-900/80 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                                                                    />
                                                                    <p className="text-xs text-gray-500 mt-1">Your PostgreSQL/Neon connection URL</p>
                                                                </div>
                                                            )}

                                                            {/* Shopify Fields */}
                                                            {configInputs.dataSourceType === 'shopify' && (
                                                                <div className="space-y-3">
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                                                            Shopify Store URL
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={configInputs.shopifyStoreUrl}
                                                                            onChange={(e) => setConfigInputs(prev => ({ ...prev, shopifyStoreUrl: e.target.value }))}
                                                                            placeholder="your-store.myshopify.com"
                                                                            className="w-full px-4 py-3 bg-gray-900/80 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                                                        />
                                                                        <p className="text-xs text-gray-500 mt-1">e.g., mystore.myshopify.com</p>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                                                            Access Token
                                                                        </label>
                                                                        <input
                                                                            type="password"
                                                                            value={configInputs.shopifyAccessToken}
                                                                            onChange={(e) => setConfigInputs(prev => ({ ...prev, shopifyAccessToken: e.target.value }))}
                                                                            placeholder="shpat_xxxxxxxxxxxxxxxxxxxx"
                                                                            className="w-full px-4 py-3 bg-gray-900/80 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-mono"
                                                                        />
                                                                        <p className="text-xs text-gray-500 mt-1">🔒 Your Shopify Admin API access token</p>
                                                                    </div>
                                                                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                                                                        <p className="text-xs text-green-300">
                                                                            <strong>💡 Tip:</strong> Create an access token in Shopify Admin → Settings → Apps → Develop apps
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* WhatsApp Number */}
                                                    {needsConfig.whatsapp && (
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                                                <span className="flex items-center gap-2">
                                                                    <span>💬</span>
                                                                    WhatsApp Phone Number
                                                                </span>
                                                            </label>
                                                            <input
                                                                type="tel"
                                                                value={configInputs.whatsappNumber}
                                                                onChange={(e) => setConfigInputs(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                                                                placeholder="+91 98765 43210"
                                                                className="w-full px-4 py-3 bg-gray-900/80 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                                                            />
                                                            <p className="text-xs text-gray-500 mt-1">Include country code for WhatsApp alerts</p>
                                                        </div>
                                                    )}

                                                    {/* Email */}
                                                    {needsConfig.email && (
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                                                <span className="flex items-center gap-2">
                                                                    <span>📧</span>
                                                                    Email Address
                                                                </span>
                                                            </label>
                                                            <input
                                                                type="email"
                                                                value={configInputs.email}
                                                                onChange={(e) => setConfigInputs(prev => ({ ...prev, email: e.target.value }))}
                                                                placeholder="alerts@yourcompany.com"
                                                                className="w-full px-4 py-3 bg-gray-900/80 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                                                            />
                                                            <p className="text-xs text-gray-500 mt-1">Where you want to receive email alerts</p>
                                                        </div>
                                                    )}

                                                    {/* Continue Button */}
                                                    <button
                                                        onClick={continueWithConfig}
                                                        disabled={
                                                            (needsConfig.database && (
                                                                configInputs.dataSourceType === 'shopify'
                                                                    ? (!configInputs.shopifyStoreUrl.trim() || !configInputs.shopifyAccessToken.trim())
                                                                    : !configInputs.databaseUrl.trim()
                                                            )) ||
                                                            (needsConfig.whatsapp && !configInputs.whatsappNumber.trim()) ||
                                                            (needsConfig.email && !configInputs.email.trim())
                                                        }
                                                        className="w-full mt-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:shadow-none flex items-center justify-center gap-2"
                                                    >
                                                        <span>Continue Building</span>
                                                        <span>→</span>
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Generated Workflow Preview */}
                                        {generationPhase === 'complete' && generatedWorkflow && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                                className="mt-6 p-4 bg-gradient-to-br from-gray-800/80 to-gray-800/40 rounded-2xl border border-gray-700/50"
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
                                                        <span className="text-lg">🔄</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-white">{generatedWorkflow.name}</h4>
                                                        <p className="text-xs text-gray-400">{generatedWorkflow.nodes.length} nodes • {generatedWorkflow.edges.length} connections</p>
                                                    </div>
                                                </div>

                                                {/* Node badges */}
                                                <div className="flex flex-wrap gap-2">
                                                    {generatedWorkflow.nodes.map((node, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                                                            style={{
                                                                backgroundColor: `${NODE_TYPES[node.data.nodeType]?.color}15`,
                                                                border: `1px solid ${NODE_TYPES[node.data.nodeType]?.color}40`
                                                            }}
                                                        >
                                                            <span>{NODE_TYPES[node.data.nodeType]?.icon}</span>
                                                            <span className="text-gray-300">{NODE_TYPES[node.data.nodeType]?.label}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="px-6 py-4 border-t border-gray-700/50 bg-gray-900/50">
                                        {generationPhase === 'complete' ? (
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={closeAIModal}
                                                    className="flex-1 px-4 py-3 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors font-medium"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={applyGeneratedWorkflow}
                                                    className="flex-[2] px-4 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-xl transition-all font-medium shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
                                                >
                                                    <span>✨</span>
                                                    Apply Workflow
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center gap-3 text-gray-400 py-2">
                                                <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                                                <span className="text-sm">Building your intelligent agent...</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
