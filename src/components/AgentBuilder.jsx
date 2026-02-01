// src/components/AgentBuilder.jsx
// Custom Agent Builder for Healthcare Supply Chain Optimization

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

// Icons
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14"></path>
        <path d="m12 5 7 7-7 7"></path>
    </svg>
);

const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5"></path>
        <path d="m12 19-7-7 7-7"></path>
    </svg>
);

const DatabaseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
        <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
        <path d="M3 12A9 3 0 0 0 21 12"></path>
    </svg>
);

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
);

const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14"></path>
        <path d="M5 12h14"></path>
    </svg>
);

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
    </svg>
);

// Predefined templates data (fallback if API fails)
const PREDEFINED_TEMPLATES = [
    {
        id: 'stock_out_predictor',
        name: 'Stock-Out Predictor',
        description: 'Predicts which items will run out of stock. Answers: "What will I run out of?"',
        icon: '📦',
        category: 'supply_chain',
        question: 'What will I run out of?'
    },
    {
        id: 'expiry_watchdog',
        name: 'Expiry Watchdog',
        description: 'Monitors expiration dates and alerts before items expire unused.',
        icon: '⏰',
        category: 'supply_chain',
        question: 'What will expire before use?'
    },
    {
        id: 'smart_reorder',
        name: 'Smart Reorder Advisor',
        description: 'Calculates optimal reorder timing and quantities based on demand.',
        icon: '🛒',
        category: 'supply_chain',
        question: 'When & how much should I reorder?'
    },
    {
        id: 'daily_supply_brief',
        name: 'Daily Supply Brief',
        description: 'Morning summary combining all three key questions for supply chain management.',
        icon: '☕',
        category: 'supply_chain',
        question: 'All-in-one morning brief'
    }
];

// Step indicator component
const StepIndicator = ({ currentStep, totalSteps }) => (
    <div className="flex items-center justify-center gap-2 mb-6">
        {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${i < currentStep
                    ? 'bg-green-500 text-white'
                    : i === currentStep
                        ? 'bg-blue-600 text-white ring-4 ring-blue-600/20'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                    {i < currentStep ? <CheckIcon /> : i + 1}
                </div>
                {i < totalSteps - 1 && (
                    <div className={`w-12 h-0.5 mx-1 transition-all duration-300 ${i < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`} />
                )}
            </div>
        ))}
    </div>
);

// Template Card Component
const TemplateCard = ({ template, isSelected, onSelect }) => (
    <motion.button
        onClick={() => onSelect(template)}
        className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
            }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
    >
        <div className="flex items-start gap-3">
            <span className="text-3xl">{template.icon}</span>
            <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">{template.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
                {template.question && (
                    <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                        💡 {template.question}
                    </div>
                )}
            </div>
            {isSelected && (
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">
                    <CheckIcon />
                </div>
            )}
        </div>
    </motion.button>
);

export default function AgentBuilder({ isOpen, onClose, onAgentCreated }) {
    const [step, setStep] = useState(0);
    const [mode, setMode] = useState(null); // 'template' or 'custom'
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templates, setTemplates] = useState(PREDEFINED_TEMPLATES);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [testResult, setTestResult] = useState(null);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon: '🤖',
        whatsappNumber: '',
        dbConnectionString: '',
        selectedTables: [],
        notificationTime: '09:00',
        analysisPrompt: '',
        notificationTemplate: ''
    });

    // Existing agents
    const [existingAgents, setExistingAgents] = useState([]);

    // Fetch templates on mount
    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
            fetchExistingAgents();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/agents/templates');
            if (response.data && Array.isArray(response.data)) {
                setTemplates(response.data.map(t => ({
                    ...t,
                    question: t.description.match(/Answers: ['"](.+?)['"]/)?.[1] || null
                })));
            }
        } catch (err) {
            console.log('Using default templates');
        }
    };

    const fetchExistingAgents = async () => {
        try {
            const response = await api.get('/agents/');
            setExistingAgents(response.data || []);
        } catch (err) {
            console.log('No existing agents');
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCreateAgent = async () => {
        setLoading(true);
        setError('');

        try {
            let response;

            if (mode === 'template' && selectedTemplate) {
                // Create from template
                response = await api.post('/agents/from-template', {
                    template_id: selectedTemplate.id,
                    whatsapp_number: formData.whatsappNumber,
                    db_connection_string: formData.dbConnectionString,
                    selected_tables: formData.selectedTables.length > 0 ? formData.selectedTables : null,
                    notification_time: formData.notificationTime,
                    custom_name: formData.name || null
                });
            } else {
                // Create custom agent
                response = await api.post('/agents/custom', {
                    name: formData.name,
                    description: formData.description,
                    icon: formData.icon,
                    whatsapp_number: formData.whatsappNumber,
                    db_connection_string: formData.dbConnectionString,
                    selected_tables: formData.selectedTables.length > 0 ? formData.selectedTables : null,
                    analysis_prompt: formData.analysisPrompt || null,
                    notification_template: formData.notificationTemplate || null,
                    notification_time: formData.notificationTime
                });
            }

            setSuccess(true);
            onAgentCreated?.(response.data);

            // Auto close after success
            setTimeout(() => {
                handleClose();
            }, 2000);

        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create agent. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleTestConnection = async (agentId) => {
        setLoading(true);
        setTestResult(null);

        try {
            const response = await api.post(`/agents/${agentId}/test`);
            setTestResult(response.data);
        } catch (err) {
            setTestResult({
                success: false,
                error: err.response?.data?.detail || 'Test failed'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(0);
        setMode(null);
        setSelectedTemplate(null);
        setFormData({
            name: '',
            description: '',
            icon: '🤖',
            whatsappNumber: '',
            dbConnectionString: '',
            selectedTables: [],
            notificationTime: '09:00',
            analysisPrompt: '',
            notificationTemplate: ''
        });
        setError('');
        setSuccess(false);
        setTestResult(null);
        onClose();
    };

    const canProceed = () => {
        switch (step) {
            case 0:
                return mode !== null;
            case 1:
                if (mode === 'template') return selectedTemplate !== null;
                return formData.name.trim() !== '';
            case 2:
                return formData.whatsappNumber.trim() !== '';
            case 3:
                return formData.dbConnectionString.trim() !== '';
            default:
                return true;
        }
    };

    const getTotalSteps = () => {
        return mode === 'template' ? 4 : 5;
    };

    if (!isOpen) return null;

    // Step content
    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Create Your Agent
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                Choose how you'd like to build your supply chain agent
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.button
                                onClick={() => setMode('template')}
                                className={`p-6 rounded-2xl border-2 text-left transition-all ${mode === 'template'
                                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/10'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                    }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="text-4xl mb-3">🏥</div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Healthcare Templates
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Pre-built agents for supply chain optimization in hospitals & labs
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                                        Stock-Out Prediction
                                    </span>
                                    <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-full">
                                        Expiry Alerts
                                    </span>
                                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">
                                        Smart Reorder
                                    </span>
                                </div>
                            </motion.button>

                            <motion.button
                                onClick={() => setMode('custom')}
                                className={`p-6 rounded-2xl border-2 text-left transition-all ${mode === 'custom'
                                    ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-900/10'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                                    }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="text-4xl mb-3">🛠️</div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Build Custom Agent
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Create your own agent with custom analysis logic and templates
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full">
                                        Custom Queries
                                    </span>
                                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full">
                                        Custom Templates
                                    </span>
                                </div>
                            </motion.button>
                        </div>

                        {/* Existing Agents Preview */}
                        {existingAgents.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Your Active Agents ({existingAgents.length})
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {existingAgents.slice(0, 3).map(agent => (
                                        <div key={agent.id} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full text-sm">
                                            <span>{agent.icon}</span>
                                            <span className="text-gray-700 dark:text-gray-300">{agent.name}</span>
                                            <span className={`w-2 h-2 rounded-full ${agent.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                                        </div>
                                    ))}
                                    {existingAgents.length > 3 && (
                                        <span className="text-sm text-gray-500">+{existingAgents.length - 3} more</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 1:
                if (mode === 'template') {
                    return (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    Select a Template
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Choose an agent that answers your daily supply chain questions
                                </p>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                    💡 These agents answer your 3 daily questions:
                                </h4>
                                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                    <li>❌ What will I run out of?</li>
                                    <li>❌ What will expire before use?</li>
                                    <li>❌ When & how much should I reorder?</li>
                                </ul>
                            </div>

                            <div className="grid gap-3">
                                {templates.map(template => (
                                    <TemplateCard
                                        key={template.id}
                                        template={template}
                                        isSelected={selectedTemplate?.id === template.id}
                                        onSelect={setSelectedTemplate}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                } else {
                    return (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    Name Your Agent
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Give your custom agent an identity
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Agent Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="e.g., My Inventory Monitor"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description (optional)
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        placeholder="What does this agent do?"
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Icon
                                    </label>
                                    <div className="flex gap-2 flex-wrap">
                                        {['🤖', '📊', '📦', '🔔', '⚡', '🎯', '💡', '🏥'].map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => handleInputChange('icon', emoji)}
                                                className={`w-12 h-12 rounded-lg text-2xl transition-all ${formData.icon === emoji
                                                    ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500'
                                                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                    }`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                WhatsApp Setup
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                Where should we send your daily notifications?
                            </p>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                            <div className="flex items-start gap-3">
                                <div className="text-green-600 mt-0.5">
                                    <WhatsAppIcon />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-green-900 dark:text-green-100">
                                        Sandbox Mode Required
                                    </h4>
                                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                        Before receiving notifications, send <strong>"join &lt;sandbox-word&gt;"</strong> to <strong>+1 415 523 8886</strong> on WhatsApp.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Your WhatsApp Number *
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="tel"
                                    value={formData.whatsappNumber}
                                    onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                                    placeholder="+917620836742"
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Include country code (e.g., +91 for India)
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Daily Notification Time
                            </label>
                            <input
                                type="time"
                                value={formData.notificationTime}
                                onChange={(e) => handleInputChange('notificationTime', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                You'll receive your daily supply brief at this time (IST)
                            </p>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Connect Data Source
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                Connect your Neon DB or PostgreSQL database
                            </p>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-start gap-3">
                                <div className="text-blue-600 mt-0.5">
                                    <DatabaseIcon />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                                        Supported Databases
                                    </h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                        Neon DB, PostgreSQL, MySQL, and other SQL databases
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Connection String *
                            </label>
                            <textarea
                                value={formData.dbConnectionString}
                                onChange={(e) => handleInputChange('dbConnectionString', e.target.value)}
                                placeholder="postgresql://user:password@host/database?sslmode=require"
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                🔒 Your connection string is encrypted and stored securely
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tables to Monitor (optional)
                            </label>
                            <input
                                type="text"
                                value={formData.selectedTables.join(', ')}
                                onChange={(e) => handleInputChange('selectedTables', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                                placeholder="inventory, products, orders"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Comma-separated table names. Leave empty to scan all tables.
                            </p>
                        </div>
                    </div>
                );

            case 4:
                if (mode === 'custom') {
                    return (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    Customize Analysis
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Define what your agent should analyze
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Analysis Prompt (optional)
                                </label>
                                <textarea
                                    value={formData.analysisPrompt}
                                    onChange={(e) => handleInputChange('analysisPrompt', e.target.value)}
                                    placeholder="Describe what the AI should analyze in your data. E.g., 'Find all items that will run out within 7 days based on daily consumption rate...'"
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Notification Template (optional)
                                </label>
                                <textarea
                                    value={formData.notificationTemplate}
                                    onChange={(e) => handleInputChange('notificationTemplate', e.target.value)}
                                    placeholder="Custom message template. Use {agent_name}, {timestamp}, {findings} as placeholders..."
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    );
                }
                // For template mode, step 4 is confirmation
                return renderConfirmation();

            default:
                return renderConfirmation();
        }
    };

    const renderConfirmation = () => (
        <div className="space-y-6">
            <div className="text-center">
                {success ? (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                            <span className="text-3xl">🎉</span>
                        </motion.div>
                        <h3 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">
                            Agent Created Successfully!
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            A test notification has been sent to your WhatsApp
                        </p>
                    </>
                ) : (
                    <>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Review & Create
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Confirm your agent configuration
                        </p>
                    </>
                )}
            </div>

            {!success && (
                <>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">
                                {mode === 'template' ? selectedTemplate?.icon : formData.icon}
                            </span>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {mode === 'template' ? (formData.name || selectedTemplate?.name) : formData.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {mode === 'template' ? selectedTemplate?.description : formData.description}
                                </p>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-gray-500">WhatsApp</span>
                                <p className="font-medium text-gray-900 dark:text-white">{formData.whatsappNumber}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Notification Time</span>
                                <p className="font-medium text-gray-900 dark:text-white">{formData.notificationTime}</p>
                            </div>
                            <div className="col-span-2">
                                <span className="text-gray-500">Database</span>
                                <p className="font-medium text-gray-900 dark:text-white font-mono text-xs truncate">
                                    {formData.dbConnectionString.substring(0, 50)}...
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl p-4 text-sm">
                            {error}
                        </div>
                    )}
                </>
            )}
        </div>
    );

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                                <span className="text-xl">🤖</span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Agent Builder
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Healthcare Supply Chain Optimization
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    {/* Step Indicator */}
                    {mode && !success && (
                        <div className="px-6 pt-4">
                            <StepIndicator currentStep={step} totalSteps={getTotalSteps()} />
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[60vh]">
                        {renderStep()}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <button
                            onClick={() => step > 0 ? setStep(step - 1) : handleClose()}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            disabled={success}
                        >
                            <ArrowLeftIcon />
                            <span>{step === 0 ? 'Cancel' : 'Back'}</span>
                        </button>

                        {success ? (
                            <button
                                onClick={handleClose}
                                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
                            >
                                Done
                            </button>
                        ) : step < getTotalSteps() - 1 ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                disabled={!canProceed()}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>Continue</span>
                                <ArrowRightIcon />
                            </button>
                        ) : (
                            <button
                                onClick={handleCreateAgent}
                                disabled={loading || !canProceed()}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Creating...</span>
                                    </>
                                ) : (
                                    <>
                                        <PlusIcon />
                                        <span>Create Agent</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
