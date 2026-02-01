import React, { useState, useEffect } from 'react';
import { FiX, FiTag, FiCheck, FiLoader, FiGift, FiCode } from 'react-icons/fi';
import api from '../services/api';

const SubscriptionModal = ({ isOpen, onClose, onSuccess }) => {
    const [promoCode, setPromoCode] = useState('');
    const [promoValidation, setPromoValidation] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
    const [error, setError] = useState('');
    const [userPendingPromo, setUserPendingPromo] = useState(null);
    const [showQrCode, setShowQrCode] = useState(false);
    const [qrData, setQrData] = useState(null);
    const [isLoadingQr, setIsLoadingQr] = useState(false);

    // Plan details (you can make this dynamic)
    const planDetails = {
        name: 'Pro Plan - Early Bird',
        originalPrice: 2000, // ₹2,000
        currency: 'INR'
    };

    const validatePromoCode = async () => {
        validatePromoCodeForCode(promoCode);
    };

    const createSubscription = async () => {
        setIsCreatingSubscription(true);
        setError('');

        try {
            const payload = {};
            if (promoCode.trim() && promoValidation?.valid) {
                payload.promo_code = promoCode.trim();
            }

            const response = await api.post('/payments/create-subscription', payload);
            
            // Redirect to Razorpay checkout
            if (response.data.checkout_url) {
                window.open(response.data.checkout_url, '_blank');
                onSuccess && onSuccess(response.data);
            } else {
                setError('Failed to create subscription link');
            }
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create subscription');
        } finally {
            setIsCreatingSubscription(false);
        }
    };

    const handleTestPayment = async () => {
        setIsLoadingQr(true);
        setError('');
        
        try {
            const response = await api.post('/payments/xyz/payment', {
                plan_id: 'plan_S1S1UEU5u0DhUt'
            });
            
            setQrData(response.data);
            setShowQrCode(true);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to generate QR code');
        } finally {
            setIsLoadingQr(false);
        }
    };

    // Check for user's pending promo code when modal opens
    useEffect(() => {
        if (isOpen) {
            checkPendingPromoCode();
        }
    }, [isOpen]);

    const checkPendingPromoCode = async () => {
        try {
            const response = await api.get('/users/me');
            if (response.data.pending_promo_code) {
                setUserPendingPromo(response.data.pending_promo_code);
                setPromoCode(response.data.pending_promo_code);
                // Auto-validate the pending promo code
                validatePromoCodeForCode(response.data.pending_promo_code);
            }
        } catch (err) {
            console.error('Failed to check pending promo code:', err);
        }
    };

    const validatePromoCodeForCode = async (codeToValidate) => {
        if (!codeToValidate.trim()) {
            setPromoValidation(null);
            return;
        }

        setIsValidating(true);
        setError('');
        
        try {
            const response = await api.post('/promocodes/validate', {
                code: codeToValidate.trim(),
                plan_id: 'plan_RCrr7pvcD7JqiGo' // Actual Razorpay plan ID for ₹2,000
            });
            
            setPromoValidation(response.data);
        } catch (err) {
            setPromoValidation({
                valid: false,
                message: err.response?.data?.detail || 'Invalid promo code'
            });
        } finally {
            setIsValidating(false);
        }
    };

    const finalPrice = promoValidation?.valid ? promoValidation.final_amount : planDetails.originalPrice;
    const discount = promoValidation?.valid ? promoValidation.discount_amount : 0;

    if (!isOpen) return null;

    // QR Code Modal
    if (showQrCode && qrData) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Google Pay QR Code</h2>
                        <button
                            onClick={() => setShowQrCode(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <FiX className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Plan Details */}
                        <div className="bg-green-50 rounded-lg p-4">
                            <h3 className="font-semibold text-green-900">Test Payment - Google Pay</h3>
                            <div className="mt-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Amount:</span>
                                    <span className="font-bold text-lg text-green-900">₹{qrData.amount}</span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-gray-600">Description:</span>
                                    <span className="text-sm text-gray-600">{qrData.description}</span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-gray-600">Subscription ID:</span>
                                    <span className="text-xs text-gray-500 font-mono">{qrData.subscription_id}</span>
                                </div>
                            </div>
                        </div>

                        {/* QR Code */}
                        <div className="flex justify-center">
                            <img
                                src={qrData.qr_code_url}
                                alt="Google Pay QR Code"
                                className="w-64 h-64 border-2 border-gray-200 rounded-lg"
                            />
                        </div>

                        {/* UPI Info */}
                        <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-sm font-semibold text-blue-900 mb-2">📱 UPI Details:</p>
                            <p className="text-xs text-blue-800 break-all font-mono mb-3">{qrData.upi_string}</p>
                            <p className="text-xs text-blue-700">
                                Scan this QR code with Google Pay or any UPI app to complete the payment.
                            </p>
                        </div>

                        {/* Test Mode Badge */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800">
                                ⚠️ <strong>Test Mode:</strong> This is a test payment endpoint. Use for testing only.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowQrCode(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    // Copy UPI string to clipboard
                                    navigator.clipboard.writeText(qrData.upi_string);
                                    alert('UPI string copied to clipboard!');
                                }}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
                            >
                                Copy UPI
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Subscribe to Pro Plan</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Plan Details */}
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900">{planDetails.name}</h3>
                        <div className="mt-2">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Original Price:</span>
                                <span className={`font-semibold ${discount > 0 ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                    ₹{planDetails.originalPrice}
                                </span>
                            </div>
                            
                            {discount > 0 && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-green-600">Discount:</span>
                                        <span className="font-semibold text-green-600">-₹{discount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-blue-200 pt-2 mt-2">
                                        <span className="text-blue-900 font-semibold">Final Price:</span>
                                        <span className="font-bold text-blue-900 text-lg">₹{finalPrice.toFixed(2)}</span>
                                    </div>
                                </>
                            )}
                            
                            {discount === 0 && (
                                <div className="flex items-center justify-between border-t border-blue-200 pt-2 mt-2">
                                    <span className="text-blue-900 font-semibold">Total:</span>
                                    <span className="font-bold text-blue-900 text-lg">₹{finalPrice}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Promo Code Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {userPendingPromo ? 'Your promo code from registration' : 'Have a promo code?'}
                        </label>
                        
                        {userPendingPromo && (
                            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                <FiGift className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-800">
                                    Great! We found your promo code from registration: <strong>{userPendingPromo}</strong>
                                </span>
                            </div>
                        )}
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <FiTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={promoCode}
                                    onChange={(e) => {
                                        setPromoCode(e.target.value.toUpperCase());
                                        setPromoValidation(null);
                                    }}
                                    onBlur={validatePromoCode}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter promo code"
                                />
                            </div>
                            <button
                                onClick={validatePromoCode}
                                disabled={isValidating || !promoCode.trim()}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all disabled:opacity-50"
                            >
                                {isValidating ? (
                                    <FiLoader className="w-4 h-4 animate-spin" />
                                ) : (
                                    'Apply'
                                )}
                            </button>
                        </div>

                        {/* Promo Code Validation Result */}
                        {promoValidation && (
                            <div className={`mt-2 p-3 rounded-lg flex items-center gap-2 ${
                                promoValidation.valid 
                                    ? 'bg-green-50 text-green-800' 
                                    : 'bg-red-50 text-red-800'
                            }`}>
                                {promoValidation.valid ? (
                                    <FiCheck className="w-4 h-4" />
                                ) : (
                                    <FiX className="w-4 h-4" />
                                )}
                                <span className="text-sm">{promoValidation.message}</span>
                            </div>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createSubscription}
                                disabled={isCreatingSubscription}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isCreatingSubscription ? (
                                    <>
                                        <FiLoader className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    `Subscribe for ₹${finalPrice.toFixed(2)}`
                                )}
                            </button>
                        </div>

                        {/* Test Payment Button */}
                        <button
                            onClick={handleTestPayment}
                            disabled={isLoadingQr}
                            className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoadingQr ? (
                                <>
                                    <FiLoader className="w-4 h-4 animate-spin" />
                                    Generating QR...
                                </>
                            ) : (
                                <>
                                    <FiCode className="w-4 h-4" />
                                    Test Payment (Google Pay QR) ₹4500
                                </>
                            )}
                        </button>
                    </div>

                    {/* Terms */}
                    <p className="text-xs text-gray-500 text-center">
                        By subscribing, you agree to our Terms of Service and Privacy Policy.
                        You will be redirected to Razorpay for secure payment processing.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionModal;