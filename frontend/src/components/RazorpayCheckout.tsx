import React, { useEffect } from 'react';
import { createRazorpayOrder, verifyPayment } from '../services/api/paymentService';

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
                        backdrop_color: '#3E2723', // VillageBasket Dark Brown
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
        <div className="fixed inset-0 bg-[#3E2723]/60 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-[#FAF7F2] rounded-[2rem] p-10 max-w-sm w-full mx-4 shadow-2xl border-4 border-white relative overflow-hidden font-poppins">
                {/* Decorative element */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#8B3D28]/5 rounded-bl-full"></div>
                
                <div className="text-center relative z-10">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#8B3D28]/10">
                         <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#8B3D28]/20 border-t-[#8B3D28]"></div>
                    </div>
                    <h3 className="text-xl font-black text-[#3E2723] mb-3 uppercase tracking-tight">Securing Your Harvest</h3>
                    <p className="text-[#3E2723]/60 text-sm font-medium leading-relaxed">
                        Please wait while we connect to our secure <br /> 
                        <span className="font-black text-[#8B3D28]/80 tracking-widest text-xs uppercase">Village Payment Gateway</span>
                    </p>
                </div>
                
                <div className="mt-8 pt-6 border-t border-[#8B3D28]/10 flex justify-center gap-2">
                    <div className="p-2 bg-white rounded-lg shadow-sm border border-black/5 opacity-50 grayscale hover:grayscale-0 transition-all">💳</div>
                    <div className="p-2 bg-white rounded-lg shadow-sm border border-black/5 opacity-50 grayscale hover:grayscale-0 transition-all">🏦</div>
                    <div className="p-2 bg-white rounded-lg shadow-sm border border-black/5 opacity-50 grayscale hover:grayscale-0 transition-all">📱</div>
                </div>
            </div>
        </div>
    );
};

export default RazorpayCheckout;
