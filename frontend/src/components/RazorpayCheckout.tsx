import React, { useEffect } from 'react';
import { createRazorpayOrder, verifyPayment } from '../services/api/paymentService';
import brandLogo from '@assets/village_basket-removebg-preview.png';

interface RazorpayCheckoutProps {
    orderId: string;
    amount: number;
    onSuccess: (paymentId: string) => void;
    onFailure: (error: string) => void;
    customerDetails: {
        name: string;
        email: string;
        phone: string;
    };
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

const RazorpayCheckout: React.FC<RazorpayCheckoutProps> = ({
    orderId,
    amount,
    onSuccess,
    onFailure,
    customerDetails,
}) => {
    useEffect(() => {
        // Load Razorpay script if not already loaded
        const loadRazorpayScript = () => {
            return new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                script.onload = () => resolve(true);
                script.onerror = () => resolve(false);
                document.body.appendChild(script);
            });
        };

        const initiatePayment = async () => {
            try {
                // Load Razorpay script
                const scriptLoaded = await loadRazorpayScript();
                if (!scriptLoaded) {
                    onFailure('Failed to load Razorpay SDK');
                    return;
                }

                // Create Razorpay order
                const orderResponse = await createRazorpayOrder(orderId);

                if (!orderResponse.success) {
                    onFailure(orderResponse.message || 'Failed to create payment order');
                    return;
                }

                const { razorpayOrderId, razorpayKey } = orderResponse.data;

                // Razorpay options
                const options = {
                    key: razorpayKey, // Get key from backend response
                    amount: amount * 100, // Amount in paise
                    currency: 'INR',
                    name: 'Village Basket',
                    description: `Order #${orderId}`,
                    order_id: razorpayOrderId,
                    prefill: {
                        name: customerDetails.name,
                        email: customerDetails.email,
                        contact: customerDetails.phone,
                    },
                    theme: {
                        color: '#8B3D28', // VillageBasket Terracotta
                    },
                    handler: async function (response: any) {
                        try {
                            // Verify payment with backend
                            const verificationResponse = await verifyPayment({
                                orderId,
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature,
                            });

                            if (verificationResponse.success) {
                                onSuccess(response.razorpay_payment_id);
                            } else {
                                onFailure(verificationResponse.message || 'Payment verification failed');
                            }
                        } catch (error: any) {
                            console.error('Payment verification error:', error);
                            onFailure(error.response?.data?.message || 'Payment verification failed');
                        }
                    },
                    modal: {
                        animation: true,
                        escape: false,
                        handle_back: true,
                        confirm_close: true,
                        ondismiss: function () {
                            onFailure('Payment cancelled by user');
                        },
                    },
                };

                const razorpay = new window.Razorpay(options);
                razorpay.open();
            } catch (error: any) {
                console.error('Payment initiation error:', error);
                onFailure(error.response?.data?.message || 'Failed to initiate payment');
            }
        };

        const timer = setTimeout(() => {
            initiatePayment();
        }, 800);
        return () => clearTimeout(timer);
    }, [orderId, amount, customerDetails, onSuccess, onFailure]);

    return (
        <div className="fixed inset-0 bg-[#3E2723]/5 backdrop-blur-[2px] flex items-center justify-center z-[100] transition-all duration-700">
            <div className="bg-[#FEFBF6] rounded-[4rem] px-20 py-24 max-w-lg w-full mx-4 shadow-[0_40px_100px_-20px_rgba(139,61,40,0.12)] border border-white/50 relative overflow-hidden font-poppins text-center">
                <div className="relative z-10 flex flex-col items-center">
                    {/* Floating Premium Logo */}
                    <div className="mb-14 relative">
                        <div className="absolute inset-0 bg-[#8B3D28]/10 rounded-full blur-3xl animate-pulse"></div>
                        <div className="w-36 h-36 bg-white rounded-[2.5rem] flex items-center justify-center relative shadow-[0_20px_50px_-10px_rgba(0,0,0,0.06)] border border-[#8B3D28]/5 p-8">
                            <img
                                src={brandLogo}
                                alt="Village Basket"
                                className="w-full h-auto object-contain brightness-105"
                            />
                        </div>
                    </div>

                    {/* Elegant Minimal Typography */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-[#3E2723] tracking-tight lowercase">
                                Securing <span className="text-[#8B3D28]">harvest...</span>
                            </h2>
                            <p className="text-[#8B3D28] font-bold tracking-[0.4em] text-[11px] uppercase opacity-60">
                                Premium Secure Payment
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-4">
                            <span className="w-12 h-[1px] bg-[#3E2723]/10"></span>
                            <div className="flex gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#8B3D28]/30 animate-bounce"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-[#8B3D28]/50 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-[#8B3D28]/30 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                            <span className="w-12 h-[1px] bg-[#3E2723]/10"></span>
                        </div>
                    </div>
                </div>

                {/* Subtle Security Detail */}
                <div className="mt-16 flex items-center justify-center gap-3 opacity-20 filter grayscale">
                    <span className="text-xs font-black tracking-widest uppercase">Verified</span>
                    <span className="text-sm">🛡️</span>
                    <span className="text-xs font-black tracking-widest uppercase">Encrypted</span>
                </div>
            </div>
        </div>
    );
};

export default RazorpayCheckout;
