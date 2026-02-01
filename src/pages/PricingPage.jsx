import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiTag, FiLoader, FiZap, FiTrendingUp } from 'react-icons/fi';
import api from '../services/api';
import { trackEvent } from '../services/posthog';

function PricingPage() {
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [promoValidation, setPromoValidation] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
    const [error, setError] = useState('');
    const [currentPlan, setCurrentPlan] = useState(null);

    const planDetails = {
        originalPrice: 2000,
        currency: 'INR'
    };

    // Check user's current subscription status
    useEffect(() => {
        const checkSubscription = async () => {
            try {
                const response = await api.get('/users/me/usage');
                setCurrentPlan(response.data);
            } catch (err) {
                console.error('Failed to check subscription:', err);
            }
        };
        checkSubscription();
    }, []);

    const validatePromoCode = async () => {
        if (!promoCode.trim()) {
            setPromoValidation(null);
            return;
        }

        setIsValidating(true);
        setError('');
        
        try {
            const response = await api.post('/promocodes/validate', {
                code: promoCode.trim(),
                plan_id: 'plan_RCrr7pvcD7JqiGo'
            });
            
            setPromoValidation(response.data);
            
            // Track promo code validation
            trackEvent('promo_code_validated', {
                code: promoCode.trim(),
                valid: response.data.valid,
                discount_amount: response.data.discount_amount,
                page: 'pricing'
            });
        } catch (err) {
            setPromoValidation({
                valid: false,
                message: err.response?.data?.detail || 'Invalid promo code'
            });
            
            // Track failed validation
            trackEvent('promo_code_validation_failed', {
                code: promoCode.trim(),
                error: err.response?.data?.detail,
                page: 'pricing'
            });
        } finally {
            setIsValidating(false);
        }
    };

    const proceedToCheckout = async () => {
        setIsCreatingSubscription(true);
        setError('');
        
        try {
            const payload = {};
            if (promoCode.trim() && promoValidation?.valid) {
                payload.promo_code = promoCode.trim();
            }

            const response = await api.post('/payments/create-subscription', payload);
            
            if (response.data.checkout_url) {
                // Track subscription initiation
                trackEvent('subscription_initiated', {
                    plan: 'pro',
                    original_amount: response.data.original_amount,
                    final_amount: response.data.final_amount,
                    discount_amount: response.data.discount_amount,
                    promo_code: response.data.promo_code_applied,
                    page: 'pricing'
                });
                
                if (response.data.promo_code_applied) {
                    alert(`🎉 Promo code "${response.data.promo_code_applied}" applied! You saved ₹${response.data.discount_amount}!`);
                }
                window.location.href = response.data.checkout_url;
            } else {
                setError('Could not retrieve checkout URL. Please try again.');
                
                trackEvent('subscription_creation_failed', {
                    error: 'No checkout URL',
                    page: 'pricing'
                });
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'An error occurred. Please try again.');
            
            trackEvent('subscription_creation_error', {
                error: err.response?.data?.detail || err.message,
                page: 'pricing'
            });
        } finally {
            setIsCreatingSubscription(false);
        }
    };

    const finalPrice = promoValidation?.valid ? promoValidation.final_amount : planDetails.originalPrice;
    const discount = promoValidation?.valid ? promoValidation.discount_amount : 0;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 sm:py-12 overflow-x-hidden">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full">
                {/* Header */}
                <div className="text-center mb-8 sm:mb-12">
                    <div className="inline-flex items-center justify-center p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                        <FiZap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4">Upgrade to Pro</h1>
                    <p className="text-base sm:text-xl text-gray-600 dark:text-gray-400">Unlock unlimited analyses and AI-powered insights</p>
                </div>

                {/* Current Status */}
                {currentPlan && !currentPlan.is_paid && (
                    <div className="mb-6 sm:mb-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 sm:p-4">
                        <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                            <FiTrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                                    You're currently on the Free plan
                                </p>
                                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                                    {currentPlan.remaining_free_messages} of {currentPlan.free_limit} free analyses remaining
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {currentPlan?.is_paid && (
                    <div className="mb-6 sm:mb-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 sm:p-4">
                        <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                            <FiCheck className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                    You're already on the Pro plan!
                                </p>
                                <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                                    Enjoying unlimited analyses and all premium features
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pro Plan Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl border-2 border-blue-600 dark:border-blue-500 relative overflow-hidden">
                    {/* Gradient Background */}
                    <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
                    
                    <div className="relative p-4 sm:p-6 md:p-8">
                        <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 sm:px-6 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg whitespace-nowrap">
                            ⚡ Early Bird Offer
                        </div>

                        <div className="text-center mb-6 sm:mb-8 mt-3 sm:mt-4">
                            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">Pro Plan</h3>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Full access for researchers</p>
                        </div>
                        
                        <div className="text-center mb-6 sm:mb-8">
                            <div className="flex items-end justify-center gap-2 sm:gap-3 mb-2">
                                <span className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white">₹2,000</span>
                                <span className="text-lg sm:text-2xl text-gray-500 dark:text-gray-400 line-through mb-2">₹4,000</span>
                            </div>
                            <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-lg">/month</span>
                            <div className="mt-3 sm:mt-4">
                                <span className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-normal sm:whitespace-nowrap">
                                    💰 Save 50% - Limited Time Only
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-6 sm:mb-8">
                            <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <FiCheck className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">Unlimited Analyses</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">No monthly limits</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <FiCheck className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">All Statistical Tests</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Complete test suite</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <FiCheck className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">AI-Powered Insights</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Smart interpretations</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <FiCheck className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">Advanced Visualizations</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Publication-ready charts</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <FiCheck className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">Priority Support</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Fast response times</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <FiCheck className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                    <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">Export All Formats</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">PDF, PNG, CSV, Excel</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setShowPromoModal(true);
                                trackEvent('upgrade_button_clicked', {
                                    page: 'pricing',
                                    plan: 'pro'
                                });
                            }}
                            disabled={currentPlan?.is_paid}
                            className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg"
                        >
                            {currentPlan?.is_paid ? '✓ Already Subscribed' : '🚀 Upgrade to Pro Now'}
                        </button>

                        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <FiCheck className="w-3 sm:w-4 h-3 sm:h-4 text-green-500 flex-shrink-0" />
                                <span>30-day money-back</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FiCheck className="w-3 sm:w-4 h-3 sm:h-4 text-green-500 flex-shrink-0" />
                                <span>Cancel anytime</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ or Additional Info */}
                <div className="mt-8 sm:mt-12 text-center">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Questions? Contact us at{' '}
                        <a href="mailto:support@gemmastat.com" className="text-blue-600 dark:text-blue-400 hover:underline break-all">
                            support@gemmastat.com
                        </a>
                    </p>
                </div>
            </div>

            {/* Promo Code Modal */}
            {showPromoModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full my-4">
                        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Complete Your Subscription</h2>
                            <button
                                onClick={() => setShowPromoModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                            >
                                <FiX className="w-5 sm:w-6 h-5 sm:h-6" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4">
                                <h3 className="font-semibold text-sm sm:text-base text-blue-900 dark:text-blue-300">Pro Plan - Early Bird</h3>
                                <div className="mt-2 space-y-2">
                                    <div className="flex items-center justify-between text-xs sm:text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Original Price:</span>
                                        <span className={`font-semibold ${discount > 0 ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                                            ₹{planDetails.originalPrice}
                                        </span>
                                    </div>
                                    
                                    {discount > 0 && (
                                        <>
                                            <div className="flex items-center justify-between text-green-600 dark:text-green-400 text-xs sm:text-sm">
                                                <span>Promo Discount:</span>
                                                <span className="font-semibold">-₹{discount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-blue-200 dark:border-blue-700 pt-2 text-xs sm:text-sm">
                                                <span className="text-blue-900 dark:text-blue-300 font-semibold">Final Price:</span>
                                                <span className="font-bold text-blue-900 dark:text-blue-300">₹{finalPrice.toFixed(2)}</span>
                                            </div>
                                        </>
                                    )}
                                    
                                    {discount === 0 && (
                                        <div className="flex items-center justify-between border-t border-blue-200 dark:border-blue-700 pt-2 text-xs sm:text-sm">
                                            <span className="text-blue-900 dark:text-blue-300 font-semibold">Total:</span>
                                            <span className="font-bold text-blue-900 dark:text-blue-300">₹{finalPrice}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Have a promo code? 🎁
                                </label>
                                <div className="flex gap-2 flex-col sm:flex-row">
                                    <div className="flex-1 relative">
                                        <FiTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                                        <input
                                            type="text"
                                            value={promoCode}
                                            onChange={(e) => {
                                                setPromoCode(e.target.value.toUpperCase());
                                                setPromoValidation(null);
                                            }}
                                            onBlur={validatePromoCode}
                                            onKeyPress={(e) => e.key === 'Enter' && validatePromoCode()}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            placeholder="Enter promo code"
                                        />
                                    </div>
                                    <button
                                        onClick={validatePromoCode}
                                        disabled={isValidating || !promoCode.trim()}
                                        className="px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all disabled:opacity-50 text-sm sm:text-base"
                                    >
                                        {isValidating ? <FiLoader className="w-4 h-4 animate-spin" /> : 'Apply'}
                                    </button>
                                </div>

                                {promoValidation && (
                                    <div className={`mt-2 p-2 sm:p-3 rounded-lg flex items-center gap-2 text-xs sm:text-sm ${
                                        promoValidation.valid 
                                            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' 
                                            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                                    }`}>
                                        {promoValidation.valid ? <FiCheck className="w-4 h-4 flex-shrink-0" /> : <FiX className="w-4 h-4 flex-shrink-0" />}
                                        <span>{promoValidation.message}</span>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 sm:p-3">
                                    <p className="text-red-800 dark:text-red-300 text-xs sm:text-sm">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-3 flex-col sm:flex-row">
                                <button
                                    onClick={() => setShowPromoModal(false)}
                                    className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm sm:text-base"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={proceedToCheckout}
                                    disabled={isCreatingSubscription}
                                    className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
                                >
                                    {isCreatingSubscription ? (
                                        <>
                                            <FiLoader className="w-4 h-4 animate-spin" />
                                            <span className="hidden sm:inline">Processing...</span>
                                        </>
                                    ) : (
                                        `Pay ₹${finalPrice.toFixed(2)}`
                                    )}
                                </button>
                            </div>

                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                By subscribing, you agree to our Terms of Service and Privacy Policy.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PricingPage;
