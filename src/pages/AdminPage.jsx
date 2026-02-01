import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { trackEvent } from '../services/posthog';
import { 
    FiUsers, 
    FiCreditCard, 
    FiTag, 
    FiTrendingUp, 
    FiPlus, 
    FiEdit, 
    FiTrash2, 
    FiEye, 
    FiCopy, 
    FiCheckCircle, 
    FiXCircle,
    FiDollarSign,
    FiCalendar,
    FiLoader
} from 'react-icons/fi';

// Helper to format dates
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
};

function AdminPage() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [tickets, setTickets] = useState([]);
    const [promoCodes, setPromoCodes] = useState([]);
    const [users, setUsers] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showCreatePromo, setShowCreatePromo] = useState(false);
    const [editingPromo, setEditingPromo] = useState(null);
    const [selectedPromoUsages, setSelectedPromoUsages] = useState([]);
    const [showUsages, setShowUsages] = useState(null);
    const [userFilter, setUserFilter] = useState('all'); // all, active, inactive

    // Form state for creating/editing promo codes
    const [promoForm, setPromoForm] = useState({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        max_uses: '',
        valid_until: ''
    });

    // Load data based on active tab
    useEffect(() => {
        loadData();
    }, [activeTab, userFilter]);

    const loadData = async () => {
        setIsLoading(true);
        setError('');
        try {
            if (activeTab === 'dashboard') {
                const response = await api.get('/admin/stats');
                setStats(response.data);
            } else if (activeTab === 'tickets') {
                const response = await api.get('/support/admin/tickets');
                setTickets(response.data);
            } else if (activeTab === 'promocodes') {
                const response = await api.get('/promocodes/');
                setPromoCodes(response.data);
            } else if (activeTab === 'users') {
                const [usersResponse, statsResponse] = await Promise.all([
                    api.get(`/admin/users?subscription_status=${userFilter}`),
                    api.get('/admin/users/stats')
                ]);
                console.log('Users Response:', usersResponse.data);
                console.log('Users Array:', usersResponse.data.users);
                setUsers(usersResponse.data.users || []);
                setUserStats(statsResponse.data);
            }
        } catch (err) {
            setError('Failed to load data. You may not have admin privileges.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleSubscription = async (userId, currentStatus) => {
        const isActivating = currentStatus !== 'active';
        const action = isActivating ? 'activate' : 'deactivate';
        const message = isActivating 
            ? 'Activate subscription for this user? This will grant them 1 year of access.'
            : 'Deactivate subscription for this user? They will lose access immediately.';
        
        if (!confirm(message)) {
            return;
        }
        
        try {
            const endpoint = isActivating 
                ? `/admin/users/${userId}/activate-subscription`
                : `/admin/users/${userId}/deactivate-subscription`;
            
            await api.post(endpoint);
            
            trackEvent(`admin_subscription_${action}d`, { user_id: userId });
            loadData(); // Reload users
        } catch (err) {
            alert(`Failed to ${action} subscription: ` + (err.response?.data?.detail || err.message));
            console.error(err);
        }
    };

    const handleActivateSubscription = async (userId) => {
        if (!confirm('Activate subscription for this user? This will grant them 1 year of access.')) {
            return;
        }
        
        try {
            await api.post(`/admin/users/${userId}/activate-subscription`);
            alert('Subscription activated successfully!');
            trackEvent('admin_subscription_activated', { user_id: userId });
            loadData(); // Reload users
        } catch (err) {
            alert('Failed to activate subscription: ' + (err.response?.data?.detail || err.message));
            console.error(err);
        }
    };

    const handleDeactivateSubscription = async (userId) => {
        if (!confirm('Deactivate subscription for this user? They will lose access immediately.')) {
            return;
        }
        
        try {
            await api.post(`/admin/users/${userId}/deactivate-subscription`);
            alert('Subscription deactivated successfully!');
            trackEvent('admin_subscription_deactivated', { user_id: userId });
            loadData(); // Reload users
        } catch (err) {
            alert('Failed to deactivate subscription: ' + (err.response?.data?.detail || err.message));
            console.error(err);
        }
    };

    const handleStatusChange = async (ticketId, newStatus) => {
        try {
            const response = await api.put(`/support/admin/tickets/${ticketId}`, { status: newStatus });
            setTickets(prevTickets =>
                prevTickets.map(ticket =>
                    ticket.id === ticketId ? { ...ticket, status: response.data.status } : ticket
                )
            );
            if (selectedTicket && selectedTicket.id === ticketId) {
                setSelectedTicket(prev => ({ ...prev, status: response.data.status }));
            }
        } catch (err) {
            alert('Failed to update status.');
            console.error(err);
        }
    };

    // Promo code management functions
    const createPromoCode = async () => {
        try {
            const payload = {
                ...promoForm,
                max_uses: promoForm.max_uses ? parseInt(promoForm.max_uses) : null,
                valid_until: promoForm.valid_until ? new Date(promoForm.valid_until).toISOString() : null
            };

            await api.post('/promocodes/', payload);
            
            // Track promo code creation
            trackEvent('promo_code_created', {
                code: payload.code,
                discount_type: payload.discount_type,
                discount_value: payload.discount_value,
                max_uses: payload.max_uses,
                has_expiry: !!payload.valid_until
            });
            
            alert('Promo code created successfully!');
            setShowCreatePromo(false);
            resetPromoForm();
            loadData();
        } catch (err) {
            alert(`Error: ${err.response?.data?.detail || 'Failed to create promo code'}`);
        }
    };

    const updatePromoCode = async () => {
        if (!editingPromo) return;

        try {
            const payload = {
                description: promoForm.description,
                discount_type: promoForm.discount_type,
                discount_value: promoForm.discount_value,
                max_uses: promoForm.max_uses ? parseInt(promoForm.max_uses) : null,
                is_active: editingPromo.is_active,
                valid_until: promoForm.valid_until ? new Date(promoForm.valid_until).toISOString() : null
            };

            await api.put(`/promocodes/${editingPromo.id}`, payload);
            alert('Promo code updated successfully!');
            setEditingPromo(null);
            setShowCreatePromo(false);
            resetPromoForm();
            loadData();
        } catch (err) {
            alert(`Error: ${err.response?.data?.detail || 'Failed to update promo code'}`);
        }
    };

    const togglePromoStatus = async (promoCode) => {
        try {
            await api.put(`/promocodes/${promoCode.id}`, { is_active: !promoCode.is_active });
            loadData();
        } catch (err) {
            alert('Failed to toggle promo status');
        }
    };

    const deletePromoCode = async (promoCodeId) => {
        if (!confirm('Are you sure you want to delete this promo code?')) return;

        try {
            await api.delete(`/promocodes/${promoCodeId}`);
            alert('Promo code deleted successfully!');
            loadData();
        } catch (err) {
            alert('Failed to delete promo code');
        }
    };

    const loadPromoUsages = async (promoCodeId) => {
        try {
            const response = await api.get(`/promocodes/${promoCodeId}/usages`);
            setSelectedPromoUsages(response.data);
            setShowUsages(promoCodeId);
        } catch (err) {
            alert('Failed to load promo usages');
        }
    };

    const resetPromoForm = () => {
        setPromoForm({
            code: '',
            description: '',
            discount_type: 'percentage',
            discount_value: 0,
            max_uses: '',
            valid_until: ''
        });
    };

    const startEditPromo = (promoCode) => {
        setEditingPromo(promoCode);
        setPromoForm({
            code: promoCode.code,
            description: promoCode.description,
            discount_type: promoCode.discount_type,
            discount_value: promoCode.discount_value,
            max_uses: promoCode.max_uses?.toString() || '',
            valid_until: promoCode.valid_until ? new Date(promoCode.valid_until).toISOString().split('T')[0] : ''
        });
        setShowCreatePromo(true);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    // Render functions for different tabs
    const renderDashboard = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Users Stats */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FiUsers className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900">{stats?.users?.total || 0}</p>
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                        {stats?.users?.admins || 0} admins, {stats?.users?.regular || 0} regular users
                    </div>
                </div>

                {/* Subscriptions Stats */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <FiCreditCard className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                            <p className="text-2xl font-bold text-gray-900">{stats?.subscriptions?.active || 0}</p>
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                        {stats?.subscriptions?.total || 0} total subscriptions
                    </div>
                </div>

                {/* Promo Codes Stats */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <FiTag className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Promo Codes</p>
                            <p className="text-2xl font-bold text-gray-900">{stats?.promo_codes?.active || 0}</p>
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                        {stats?.promo_codes?.total_usages || 0} total uses
                    </div>
                </div>
            </div>

            {/* Discount Stats */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Discount Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <FiDollarSign className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Discount Given</p>
                            <p className="text-xl font-bold text-gray-900">
                                ₹{stats?.promo_codes?.total_discount_given?.toFixed(2) || '0.00'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <FiTrendingUp className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Average Discount</p>
                            <p className="text-xl font-bold text-gray-900">
                                ₹{stats?.promo_codes?.total_usages ? 
                                    (stats.promo_codes.total_discount_given / stats.promo_codes.total_usages).toFixed(2) : 
                                    '0.00'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPromoCodes = () => (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Promo Code Management</h2>
                <button
                    onClick={() => {
                        setShowCreatePromo(true);
                        setEditingPromo(null);
                        resetPromoForm();
                    }}
                    className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all"
                >
                    <FiPlus className="w-4 h-4 mr-2" />
                    Create Promo Code
                </button>
            </div>

            {/* Create/Edit Form */}
            {showCreatePromo && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {editingPromo ? 'Edit Promo Code' : 'Create New Promo Code'}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Promo Code
                            </label>
                            <input
                                type="text"
                                value={promoForm.code}
                                onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                                disabled={!!editingPromo}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                                placeholder="SAVE20"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <input
                                type="text"
                                value={promoForm.description}
                                onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="20% off for new users"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Discount Type
                            </label>
                            <select
                                value={promoForm.discount_type}
                                onChange={(e) => setPromoForm({ ...promoForm, discount_type: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="percentage">Percentage</option>
                                <option value="fixed">Fixed Amount</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Discount Value {promoForm.discount_type === 'percentage' ? '(%)' : '(₹)'}
                            </label>
                            <input
                                type="number"
                                value={promoForm.discount_value}
                                onChange={(e) => setPromoForm({ ...promoForm, discount_value: parseFloat(e.target.value) || 0 })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder={promoForm.discount_type === 'percentage' ? '20' : '100'}
                                min="0"
                                max={promoForm.discount_type === 'percentage' ? '100' : undefined}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Uses (Optional)
                            </label>
                            <input
                                type="number"
                                value={promoForm.max_uses}
                                onChange={(e) => setPromoForm({ ...promoForm, max_uses: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Leave empty for unlimited"
                                min="1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Valid Until (Optional)
                            </label>
                            <input
                                type="date"
                                value={promoForm.valid_until}
                                onChange={(e) => setPromoForm({ ...promoForm, valid_until: e.target.value })}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={editingPromo ? updatePromoCode : createPromoCode}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all"
                        >
                            {editingPromo ? 'Update' : 'Create'} Promo Code
                        </button>
                        <button
                            onClick={() => {
                                setShowCreatePromo(false);
                                setEditingPromo(null);
                                resetPromoForm();
                            }}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Promo Codes List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Active Promo Codes</h3>
                </div>
                
                {promoCodes.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No promo codes created yet
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Code
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Discount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Usage
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Valid Until
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {promoCodes.map((promo) => (
                                    <tr key={promo.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="text-sm font-medium text-gray-900">{promo.code}</span>
                                                <button
                                                    onClick={() => copyToClipboard(promo.code)}
                                                    className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                                                >
                                                    <FiCopy className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="text-sm text-gray-500">{promo.description}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {promo.discount_type === 'percentage' 
                                                ? `${promo.discount_value}%` 
                                                : `₹${promo.discount_value}`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex items-center">
                                                <span>{promo.current_uses}</span>
                                                {promo.max_uses && <span className="text-gray-500">/{promo.max_uses}</span>}
                                                <button
                                                    onClick={() => loadPromoUsages(promo.id)}
                                                    className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                                                >
                                                    <FiEye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => togglePromoStatus(promo)}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    promo.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}
                                            >
                                                {promo.is_active ? (
                                                    <>
                                                        <FiCheckCircle className="w-3 h-3 mr-1" />
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiXCircle className="w-3 h-3 mr-1" />
                                                        Inactive
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {promo.valid_until 
                                                ? new Date(promo.valid_until).toLocaleDateString()
                                                : 'No expiry'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => startEditPromo(promo)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    <FiEdit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deletePromoCode(promo.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Usage Modal */}
            {showUsages && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">Promo Code Usage History</h3>
                            <button
                                onClick={() => setShowUsages(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <FiXCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {selectedPromoUsages.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">No usage history found</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    User
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Discount Amount
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Used At
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Subscription ID
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {selectedPromoUsages.map((usage) => (
                                                <tr key={usage.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{usage.user_name}</div>
                                                            <div className="text-sm text-gray-500">{usage.user_email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        ₹{usage.discount_amount.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(usage.used_at).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                        {usage.subscription_id}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderUsers = () => (
        <div className="space-y-6">
            {/* User Stats Cards */}
            {userStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FiUsers className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900">{userStats.total_users}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FiCheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Subscribers</p>
                                <p className="text-2xl font-bold text-gray-900">{userStats.active_subscribers}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <FiXCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Inactive Users</p>
                                <p className="text-2xl font-bold text-gray-900">{userStats.inactive_users}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <FiTrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                                <p className="text-2xl font-bold text-gray-900">{userStats.conversion_rate}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User List */}
            <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                        <div className="flex space-x-2">
                            <select
                                value={userFilter}
                                onChange={(e) => setUserFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="all">All Users</option>
                                <option value="active">Active Subscribers</option>
                                <option value="inactive">Inactive Users</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Subscription Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Joined
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users?.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                                {user.phone_number && (
                                                    <div className="text-xs text-gray-400">{user.phone_number}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            user.role === 'admin' 
                                                ? 'bg-purple-100 text-purple-800' 
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                user.subscription_status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {user.subscription_status === 'active' ? 'Active' : 'Inactive'}
                                            </span>
                                            {user.plan_name && (
                                                <span className="text-xs text-gray-500">({user.plan_name})</span>
                                            )}
                                        </div>
                                        {user.subscription_end && (
                                            <div className="text-xs text-gray-400 mt-1">
                                                Expires: {new Date(user.subscription_end).toLocaleDateString()}
                                            </div>
                                        )}
                                        {user.role !== 'admin' && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={user.subscription_status === 'active'}
                                                        onChange={() => handleToggleSubscription(user.id, user.subscription_status)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                                    <span className="ml-2 text-xs font-medium text-gray-700">
                                                        {user.subscription_status === 'active' ? 'Active' : 'Inactive'}
                                                    </span>
                                                </label>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {users?.length === 0 && (
                    <div className="text-center py-8">
                        <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No users found</p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderTickets = () => (
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3">
                {/* Ticket List */}
                <div className="md:col-span-1 border-r border-gray-200">
                    <div className="p-4 bg-gray-50 border-b">
                        <h2 className="font-semibold text-lg">All Tickets ({tickets.length})</h2>
                    </div>
                    <ul className="divide-y divide-gray-200 max-h-[80vh] overflow-y-auto">
                        {tickets.map(ticket => (
                            <li key={ticket.id} onClick={() => setSelectedTicket(ticket)} className={`p-4 cursor-pointer hover:bg-blue-50 ${selectedTicket?.id === ticket.id ? 'bg-blue-100' : ''}`}>
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold truncate">{ticket.user.name}</p>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                        ticket.status === 'open' ? 'bg-red-100 text-red-800' : 
                                        ticket.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {ticket.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 truncate">{ticket.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{formatDate(ticket.created_at)}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Selected Ticket Details */}
                <div className="md:col-span-2 p-6">
                    {selectedTicket ? (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold">Ticket Details</h3>
                                <p className="text-sm text-gray-500">ID: {selectedTicket.id}</p>
                            </div>
                            <div className="border-t pt-4">
                                <p className="text-sm font-medium text-gray-500">User</p>
                                <p>{selectedTicket.user.name} ({selectedTicket.user.email})</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Message</p>
                                <p className="mt-1 p-3 bg-gray-50 rounded-md whitespace-pre-wrap">{selectedTicket.message}</p>
                            </div>
                            
                            {selectedTicket.screenshot_path && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Screenshot</p>
                                    <a 
                                        href={`${api.defaults.baseURL}/support/admin/tickets/${selectedTicket.id}/screenshot`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-1 inline-block text-blue-600 hover:underline"
                                    >
                                        View/Download Screenshot
                                    </a>
                                </div>
                            )}

                            <div>
                                <label htmlFor="status" className="text-sm font-medium text-gray-500">Status</label>
                                <select
                                    id="status"
                                    value={selectedTicket.status}
                                    onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                >
                                    <option value="open">Open</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <p>Select a ticket to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Main render logic
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <FiLoader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading Admin Dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center text-red-500">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
                
                {/* Tabs */}
                <div className="mb-6">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'dashboard', label: 'Dashboard', icon: FiTrendingUp },
                            { id: 'users', label: 'User Management', icon: FiUsers },
                            { id: 'promocodes', label: 'Promo Codes', icon: FiTag },
                            { id: 'tickets', label: 'Support Tickets', icon: FiUsers }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <tab.icon className="w-4 h-4 mr-2" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'users' && renderUsers()}
                {activeTab === 'promocodes' && renderPromoCodes()}
                {activeTab === 'tickets' && renderTickets()}
            </div>
        </div>
    );
}

export default AdminPage;