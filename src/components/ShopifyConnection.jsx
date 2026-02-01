import React, { useState } from 'react';
import api from '../services/api';

function ShopifyConnection({ onConnectionSuccess, onDataSelect }) {
    const [shopDomain, setShopDomain] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState('');
    const [shopName, setShopName] = useState('');
    const [selectedDataType, setSelectedDataType] = useState(null);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [conversationId, setConversationId] = useState(null);
    const [connectionStep, setConnectionStep] = useState('credentials'); // 'credentials' | 'data-selection'

    const availableDataTypes = [
        {
            id: 'orders',
            name: 'Orders',
            description: 'Order history, revenue, and transaction data',
            icon: '🛒',
            color: 'from-blue-500 to-blue-600'
        },
        {
            id: 'inventory',
            name: 'Inventory',
            description: 'Product stock levels and inventory tracking',
            icon: '📦',
            color: 'from-emerald-500 to-emerald-600'
        },
        {
            id: 'products',
            name: 'Products',
            description: 'Product catalog with variants and pricing',
            icon: '🏷️',
            color: 'from-purple-500 to-purple-600'
        },
        {
            id: 'customers',
            name: 'Customers',
            description: 'Customer profiles and purchase history',
            icon: '👥',
            color: 'from-orange-500 to-orange-600'
        },
    ];

    const handleDomainChange = (e) => {
        setShopDomain(e.target.value);
        setError('');
    };

    const handleTokenChange = (e) => {
        setAccessToken(e.target.value);
        setError('');
    };

    const handleConnect = async (e) => {
        e.preventDefault();

        // Validate inputs
        if (!shopDomain.trim()) {
            setError('Please enter your Shopify store domain');
            return;
        }
        if (!accessToken.trim()) {
            setError('Please enter your Access Token');
            return;
        }

        // Clean up shop domain
        let cleanDomain = shopDomain.trim()
            .replace(/^https?:\/\//, '')
            .replace(/\/$/, '');

        if (!cleanDomain.includes('.myshopify.com')) {
            cleanDomain = `${cleanDomain}.myshopify.com`;
        }

        setIsConnecting(true);
        setError('');

        try {
            const response = await api.post('/shopify/connect', {
                shop_domain: cleanDomain,
                access_token: accessToken.trim()
            });

            setShopName(response.data.shop_name || cleanDomain);
            setConversationId(response.data.conversation_id);
            setConnectionStep('data-selection');

            if (onConnectionSuccess) {
                onConnectionSuccess(response.data);
            }
        } catch (err) {
            const errorDetail = err.response?.data?.detail;
            if (typeof errorDetail === 'string') {
                setError(errorDetail);
            } else if (errorDetail?.message) {
                setError(errorDetail.message);
            } else {
                setError('Failed to connect to Shopify. Please check your credentials.');
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDataTypeSelect = async (dataType) => {
        if (!conversationId) return;

        setIsLoadingData(true);
        setSelectedDataType(dataType.id);
        setError('');

        try {
            const response = await api.post(`/shopify/${conversationId}/fetch_data`, {
                data_type: dataType.id
            });

            if (onDataSelect) {
                onDataSelect({
                    ...response.data,
                    selectedDataType: dataType.id,
                    dataTypeName: dataType.name
                });
            }
        } catch (err) {
            const errorDetail = err.response?.data?.detail;
            if (typeof errorDetail === 'string') {
                setError(errorDetail);
            } else {
                setError(`Failed to fetch ${dataType.name} data from Shopify.`);
            }
            setSelectedDataType(null);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleDisconnect = () => {
        setShopDomain('');
        setAccessToken('');
        setShopName('');
        setSelectedDataType(null);
        setConversationId(null);
        setConnectionStep('credentials');
        setError('');
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            {/* Header with Shopify branding */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.337 3.415c-.104.04-.185.125-.222.231-.037.106-.03.224.018.325.042.091.113.164.201.209l.025.012c.069.033.145.05.222.05.07 0 .14-.014.205-.042.124-.052.22-.152.268-.28.05-.127.048-.271-.004-.396-.047-.115-.137-.206-.25-.257-.124-.055-.264-.063-.393-.018l-.07.166zm.633 1.17l-.63 1.48-.63-1.48.63-1.48.63 1.48zM12 .587l-1.244 2.768L8.25 3.93l2.506 2.068-.938 2.995L12 7.502l2.182 1.49-.938-2.995L15.75 3.93l-2.506-.575L12 .587z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                        Connect to Shopify
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Import your store data for analysis
                    </p>
                </div>
            </div>

            {connectionStep === 'credentials' && (
                <form onSubmit={handleConnect} className="space-y-4">
                    {/* Store Domain Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Store Domain
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={shopDomain}
                                onChange={handleDomainChange}
                                required
                                placeholder="your-store"
                                className="w-full px-4 py-3 pr-32 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 font-medium text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm font-mono">
                                .myshopify.com
                            </span>
                        </div>
                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                            Enter only your store name, e.g., "my-store"
                        </p>
                    </div>

                    {/* Access Token Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Admin API Access Token
                        </label>
                        <input
                            type="password"
                            value={accessToken}
                            onChange={handleTokenChange}
                            required
                            placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxx"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        />
                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                            Found in Shopify Admin → Settings → Apps and sales channels → Develop apps
                        </p>
                    </div>

                    {/* Help Section */}
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            How to get your Access Token
                        </h4>
                        <ol className="text-xs text-green-700 dark:text-green-400 space-y-1 list-decimal list-inside">
                            <li>Go to Shopify Admin → Settings → Apps and sales channels</li>
                            <li>Click "Develop apps" → "Create an app"</li>
                            <li>Configure Admin API scopes (read_orders, read_inventory, read_products)</li>
                            <li>Install the app and copy the Admin API access token</li>
                        </ol>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-start gap-2">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isConnecting || !shopDomain.trim() || !accessToken.trim()}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3.5 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                        {isConnecting ? (
                            <>
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Connecting to Shopify...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Connect to Shopify
                            </>
                        )}
                    </button>
                </form>
            )}

            {connectionStep === 'data-selection' && (
                <div className="space-y-4">
                    {/* Success Banner */}
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-300 dark:border-green-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold text-green-800 dark:text-green-300">Connected to {shopName}</p>
                                <p className="text-xs text-green-600 dark:text-green-400">Select the data you want to analyze</p>
                            </div>
                        </div>
                        <button
                            onClick={handleDisconnect}
                            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 underline"
                        >
                            Disconnect
                        </button>
                    </div>

                    {/* Data Type Selection */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">
                            Choose data to import:
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            {availableDataTypes.map((dataType) => (
                                <button
                                    key={dataType.id}
                                    onClick={() => handleDataTypeSelect(dataType)}
                                    disabled={isLoadingData}
                                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${selectedDataType === dataType.id
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500/20'
                                        : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50/50 dark:hover:bg-green-900/10'
                                        } ${isLoadingData ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${dataType.color} flex items-center justify-center text-xl shadow-sm`}>
                                            {dataType.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                                                {dataType.name}
                                            </h5>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                                {dataType.description}
                                            </p>
                                        </div>
                                    </div>
                                    {selectedDataType === dataType.id && isLoadingData && (
                                        <div className="mt-3 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Loading data...
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-start gap-2">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ShopifyConnection;
