import React, { useState } from 'react';
import { FiCheck, FiX, FiLoader, FiArrowRight } from 'react-icons/fi';
import { motion } from 'framer-motion';
import api from '../services/api';
import authService from '../services/authService';

function PublicPricingPage() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [formError, setFormError] = useState('');
    const isLoggedIn = authService.isAuthenticated();

    const planDetails = {
        name: 'Premium Plan',
        price: '4500',
        period: 'one-time payment',
        description: 'GemmaStat Premium Subscription',
        features: [
            { text: 'Unlimited analyses', included: true },
            { text: 'All statistical tests', included: true },
            { text: 'Advanced visualizations', included: true },
            { text: '🤖 AI-powered insights', included: true },
            { text: 'Priority support', included: true },
            { text: 'Export in any format', included: true },
        ]
    };

    const handleSubscribe = async () => {
        if (!isLoggedIn) {
            setShowModal(true);
            return;
        }

        setIsProcessing(true);
        setError('');
        
        try {
            const response = await api.post('/payments/create-subscription', {
                plan_id: 'plan_S1S1UEU5u0DhUt'
            });
            
            console.log('Subscription response:', response.data);
            
            if (response.data.checkout_url) {
                window.location.href = response.data.checkout_url;
            } else {
                setError('Failed to create subscription - no checkout URL');
            }
        } catch (err) {
            console.error('Subscription error:', err);
            setError(err.response?.data?.detail || 'Failed to create subscription');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleModalSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        // Validate
        if (!formData.name.trim()) {
            setFormError('Please enter your name');
            return;
        }
        if (!formData.email.trim() || !formData.email.includes('@')) {
            setFormError('Please enter a valid email');
            return;
        }

        setIsProcessing(true);

        try {
            // Create subscription as guest
            console.log('Sending guest subscription request:', {
                plan_id: 'plan_S1S1UEU5u0DhUt',
                guest_name: formData.name,
                guest_email: formData.email
            });
            
            const response = await api.post('/payments/create-subscription', {
                plan_id: 'plan_S1S1UEU5u0DhUt',
                guest_name: formData.name,
                guest_email: formData.email
            });
            
            console.log('Guest subscription response:', response.data);
            
            if (response.data.checkout_url) {
                console.log('Redirecting to checkout URL:', response.data.checkout_url);
                window.location.href = response.data.checkout_url;
            } else {
                setFormError('Failed to create subscription - no checkout URL received');
            }
        } catch (err) {
            console.error('Guest subscription error:', err);
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to create subscription';
            setFormError(errorMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
            {/* Guest Checkout Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
                    >
                        {/* Header */}
                        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Checkout</h2>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Enter your details to proceed</p>
                        </div>

                        {/* Content */}
                        <form onSubmit={handleModalSubmit} className="p-6 space-y-4">
                            {/* Name Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="John Doe"
                                />
                            </div>

                            {/* Email Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="john@example.com"
                                />
                            </div>

                            {/* Error Message */}
                            {formError && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                                    <p className="text-red-800 dark:text-red-300 text-sm">{formError}</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setFormData({ name: '', email: '' });
                                        setFormError('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <FiLoader className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Proceed to Pay'
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Header */}
            <div className="max-w-3xl mx-auto mb-16">
                <div className="text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Get Started with GemmaStat
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                        Premium subscription for unlimited research analysis
                    </p>
                </div>
            </div>

            {/* Pricing Card */}
            <div className="max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
                >
                    {/* Content */}
                    <div className="p-8 md:p-12">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{planDetails.name}</h2>
                        <p className="text-gray-600 dark:text-gray-400 text-base mb-8">{planDetails.description}</p>

                        {/* Price */}
                        <div className="mb-12">
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-bold text-gray-900 dark:text-white">₹{planDetails.price}</span>
                                <span className="text-lg text-gray-600 dark:text-gray-400">{planDetails.period}</span>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="space-y-4 mb-10">
                            {planDetails.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    {feature.included ? (
                                        <FiCheck className="w-6 h-6 text-green-500 flex-shrink-0" />
                                    ) : (
                                        <FiX className="w-6 h-6 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                                    )}
                                    <span className={feature.included ? 'text-gray-700 dark:text-gray-300 text-lg' : 'text-gray-400 dark:text-gray-600 text-lg'}>
                                        {feature.text}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
                                <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
                            </div>
                        )}

                        {/* CTA Button */}
                        <button
                            onClick={handleSubscribe}
                            disabled={isProcessing}
                            className="w-full py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                        >
                            {isProcessing ? (
                                <>
                                    <FiLoader className="w-5 h-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Subscribe Now
                                    <FiArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        {/* Terms */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
                            By subscribing, you agree to our Terms of Service and Privacy Policy.
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* FAQ Section */}
            <div className="max-w-3xl mx-auto mt-20">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">
                    Frequently Asked Questions
                </h2>

                <div className="space-y-6">
                    {[
                        {
                            q: 'Can I cancel anytime?',
                            a: 'Yes! You can cancel your subscription anytime. No strings attached.'
                        },
                        {
                            q: 'What payment methods do you accept?',
                            a: 'We accept all major payment methods through Razorpay including credit cards, debit cards, and UPI.'
                        },
                        {
                            q: 'Is there a money-back guarantee?',
                            a: 'Yes, if you\'re not satisfied within 7 days, we offer a full refund.'
                        },
                        {
                            q: 'Do you offer team/enterprise plans?',
                            a: 'Yes! Contact our sales team for custom enterprise pricing.'
                        }
                    ].map((faq, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{faq.q}</h3>
                            <p className="text-gray-600 dark:text-gray-400">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default PublicPricingPage;
