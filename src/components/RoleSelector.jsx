// Role Selector Component
// Allows users to select their role/persona for customized analysis

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const PREDEFINED_ROLES = [
    {
        id: 'inventory_manager',
        name: 'Inventory Manager',
        icon: '📦',
        description: 'Stock levels, reorder points, inventory turnover',
        keywords: ['stock', 'inventory', 'quantity', 'sku', 'product', 'warehouse']
    },
    {
        id: 'sales_manager',
        name: 'Sales Manager',
        icon: '💰',
        description: 'Revenue, sales trends, customer segments',
        keywords: ['sales', 'revenue', 'price', 'customer', 'order', 'transaction']
    },
    {
        id: 'marketing_analyst',
        name: 'Marketing Analyst',
        icon: '📊',
        description: 'Campaign performance, customer behavior, ROI',
        keywords: ['campaign', 'marketing', 'conversion', 'click', 'impression', 'channel']
    },
    {
        id: 'hr_manager',
        name: 'HR Manager',
        icon: '👥',
        description: 'Employee metrics, retention, performance',
        keywords: ['employee', 'salary', 'department', 'hire', 'performance', 'attendance']
    },
    {
        id: 'healthcare_analyst',
        name: 'Healthcare Analyst',
        icon: '🏥',
        description: 'Patient outcomes, treatment efficacy, clinical metrics',
        keywords: ['patient', 'diagnosis', 'treatment', 'hospital', 'medical', 'clinical']
    },
    {
        id: 'financial_analyst',
        name: 'Financial Analyst',
        icon: '📈',
        description: 'Financial metrics, budgets, forecasting',
        keywords: ['budget', 'expense', 'profit', 'cost', 'financial', 'account']
    },
    {
        id: 'researcher',
        name: 'Academic Researcher',
        icon: '🎓',
        description: 'Statistical analysis, hypothesis testing, publications',
        keywords: ['study', 'experiment', 'sample', 'control', 'variable', 'hypothesis']
    },
    {
        id: 'operations_manager',
        name: 'Operations Manager',
        icon: '⚙️',
        description: 'Efficiency, processes, resource allocation',
        keywords: ['process', 'efficiency', 'time', 'resource', 'operation', 'workflow']
    },
    {
        id: 'custom',
        name: 'Custom Role',
        icon: '✨',
        description: 'Define your own role and context',
        keywords: []
    }
];

const RoleSelector = ({ columns, onRoleSelect, onSkip }) => {
    const [selectedRole, setSelectedRole] = useState(null);
    const [customRole, setCustomRole] = useState('');
    const [suggestedRoles, setSuggestedRoles] = useState([]);
    const [showAllRoles, setShowAllRoles] = useState(false);

    // Auto-detect relevant roles based on column names
    useEffect(() => {
        if (!columns || columns.length === 0) {
            setSuggestedRoles(PREDEFINED_ROLES.slice(0, 4));
            return;
        }

        const columnLower = columns.map(c => c.toLowerCase());
        const scores = PREDEFINED_ROLES.map(role => {
            const matchCount = role.keywords.filter(keyword =>
                columnLower.some(col => col.includes(keyword))
            ).length;
            return { ...role, score: matchCount };
        });

        // Sort by score and take top 4
        const sorted = scores
            .filter(r => r.id !== 'custom')
            .sort((a, b) => b.score - a.score);
        
        const suggested = sorted.slice(0, 3);
        // Always add custom option
        suggested.push(PREDEFINED_ROLES.find(r => r.id === 'custom'));
        
        setSuggestedRoles(suggested);
    }, [columns]);

    const handleSelect = (role) => {
        setSelectedRole(role);
        if (role.id !== 'custom') {
            onRoleSelect(role);
        }
    };

    const handleCustomSubmit = () => {
        if (customRole.trim()) {
            onRoleSelect({
                id: 'custom',
                name: customRole.trim(),
                icon: '✨',
                description: 'Custom role defined by user'
            });
        }
    };

    const displayRoles = showAllRoles ? PREDEFINED_ROLES : suggestedRoles;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 max-w-2xl mx-auto"
        >
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    What's your role?
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Select your role to get customized insights and recommendations
                </p>
            </div>

            {/* Role Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {displayRoles.map((role) => (
                    <motion.button
                        key={role.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelect(role)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                            selectedRole?.id === role.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                        }`}
                    >
                        <div className="text-2xl mb-2">{role.icon}</div>
                        <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                            {role.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {role.description}
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Show more/less toggle */}
            {!showAllRoles && (
                <button
                    onClick={() => setShowAllRoles(true)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4"
                >
                    Show all roles →
                </button>
            )}

            {/* Custom role input */}
            {selectedRole?.id === 'custom' && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-4"
                >
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Describe your role
                    </label>
                    <input
                        type="text"
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        placeholder="e.g., Supply Chain Coordinator, Quality Assurance Lead..."
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={handleCustomSubmit}
                        disabled={!customRole.trim()}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Continue with this role
                    </button>
                </motion.div>
            )}

            {/* Skip option */}
            <div className="text-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={onSkip}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                    Skip for now — use general analysis
                </button>
            </div>
        </motion.div>
    );
};

export default RoleSelector;
