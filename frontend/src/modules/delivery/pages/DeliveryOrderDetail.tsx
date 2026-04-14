import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderDetails, updateOrderStatus, getSellerLocationsForOrder, sendDeliveryOtp, verifyDeliveryOtp, updateDeliveryLocation, checkSellerProximity, confirmSellerPickup, checkCustomerProximity } from '../../../services/api/delivery/deliveryService';
import deliveryIcon from '@assets/deliveryboy/deliveryIcon.png';
import GoogleMapsTracking from '../../../components/GoogleMapsTracking';
import VillageLoader from '../../../components/VillageLoader';

// Helper to get delivery icon URL (works in both dev and production)
const getDeliveryIconUrl = () => {
    // Try imported path first (Vite will process this in production)
    if (deliveryIcon && typeof deliveryIcon === 'string') {
        return deliveryIcon;
    }
    // Fallback to public path
    return '/assets/deliveryboy/deliveryIcon.png';
};

// Icons components to avoid external dependency issues
const Icons = {
    ChevronLeft: ({ size = 24, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M15 18l-6-6 6-6" />
        </svg>
    ),
    MapPin: ({ size = 24, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    ),
    User: ({ size = 24, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    ),
    Phone: ({ size = 24, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
    ),
    Clock: ({ size = 24, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    CheckCircle: ({ size = 24, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    Truck: ({ size = 24, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
    ),
    ShoppingBag: ({ size = 24, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
    ),
    Navigation: ({ size = 24, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
    ),
    Store: ({ size = 24, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
    AlertTriangle: ({ size = 24, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    CreditCard: ({ size = 24, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
    ),
    ShieldCheck: ({ size = 24, className = "" }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
        </svg>
    ),
};

type DeliveryOrderStatus = 'Pending' | 'Ready for pickup' | 'Picked up' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned';

export default function DeliveryOrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sellerLocations, setSellerLocations] = useState<any[]>([]);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otpValue, setOtpValue] = useState('');
    const [otpSending, setOtpSending] = useState(false);
    const [otpVerifying, setOtpVerifying] = useState(false);
    const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [deliveryBoyLocation, setDeliveryBoyLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    // New state for seller proximity and pickup tracking
    const [sellerProximity, setSellerProximity] = useState<Record<string, { withinRange: boolean; distance: number }>>({});
    const [pickupLoading, setPickupLoading] = useState<Record<string, boolean>>({});

    // New state for customer proximity
    const [customerProximity, setCustomerProximity] = useState<{ withinRange: boolean; distance: number } | null>(null);
    const [getOtpEnabled, setGetOtpEnabled] = useState(false);

    const fetchOrder = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const data = await getOrderDetails(id);
            setOrder(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [id]);

    // Fetch seller locations when order is assigned
    useEffect(() => {
        const fetchSellerLocations = async () => {
            if (!id || !order) return;
            // Only fetch if order has delivery boy assigned and status is before "Picked up"
            if (order.status && order.status !== 'Picked up' && order.status !== 'Delivered') {
                try {
                    const locations = await getSellerLocationsForOrder(id);
                    setSellerLocations(locations || []);
                } catch (err) {
                    console.error('Failed to fetch seller locations:', err);
                }
            }
        };
        fetchSellerLocations();
    }, [id, order?.status]);

    // Clean up when component unmounts
    useEffect(() => {
        return () => {
            if (locationIntervalRef.current) {
                clearInterval(locationIntervalRef.current);
            }
        };
    }, []);


    const handleSendOtp = async () => {
        if (!id) return;
        try {
            setOtpSending(true);
            await sendDeliveryOtp(id);
            setShowOtpInput(true);
            alert('OTP sent to customer successfully');
        } catch (err: any) {
            alert(err.message || 'Failed to send OTP');
        } finally {
            setOtpSending(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!id || !otpValue) {
            alert('Please enter OTP');
            return;
        }
        try {
            setOtpVerifying(true);
            const result = await verifyDeliveryOtp(id, otpValue);
            alert(result.message || 'OTP verified successfully. Order marked as delivered.');
            await fetchOrder(); // Refresh order data
            setShowOtpInput(false);
            setOtpValue('');
        } catch (err: any) {
            alert(err.message || 'Failed to verify OTP');
        } finally {
            setOtpVerifying(false);
        }
    };

    // Handle seller pickup confirmation
    const handleSellerPickup = async (sellerId: string) => {
        if (!id || !deliveryBoyLocation) {
            alert('Location not available');
            return;
        }

        try {
            setPickupLoading(prev => ({ ...prev, [sellerId]: true }));
            const result = await confirmSellerPickup(id, sellerId, deliveryBoyLocation.lat, deliveryBoyLocation.lng);
            alert(result.message || 'Pickup confirmed successfully');
            await fetchOrder(); // Refresh order data
        } catch (err: any) {
            alert(err.message || 'Failed to confirm pickup');
        } finally {
            setPickupLoading(prev => ({ ...prev, [sellerId]: false }));
        }
    };

    // Check proximity to sellers (runs periodically)
    useEffect(() => {
        const checkSellersProximity = async () => {
            if (!id || !deliveryBoyLocation || !sellerLocations.length) return;
            if (order?.status === 'Out for Delivery' || order?.status === 'Delivered') return;

            const proximityChecks: Record<string, { withinRange: boolean; distance: number }> = {};

            for (const seller of sellerLocations) {
                try {
                    const response = await checkSellerProximity(
                        id,
                        seller.sellerId,
                        deliveryBoyLocation.lat,
                        deliveryBoyLocation.lng
                    );
                    if (response.success && response.data) {
                        proximityChecks[seller.sellerId] = {
                            withinRange: response.data.withinRange,
                            distance: response.data.distanceMeters
                        };
                    }
                } catch (error) {
                    console.error(`Failed to check proximity for seller ${seller.sellerId}:`, error);
                }
            }

            setSellerProximity(proximityChecks);
        };

        if (sellerLocations.length > 0 && deliveryBoyLocation) {
            checkSellersProximity();
            const interval = setInterval(checkSellersProximity, 4000); // Check every 4 seconds
            return () => clearInterval(interval);
        }
    }, [id, deliveryBoyLocation, sellerLocations, order?.status]);

    // Check proximity to customer (runs periodically)
    useEffect(() => {
        const checkCustomerProx = async () => {
            if (!id || !deliveryBoyLocation) return;
            if (order?.status !== 'Picked up') return;

            try {
                const response = await checkCustomerProximity(id, deliveryBoyLocation.lat, deliveryBoyLocation.lng);
                if (response.success && response.data) {
                    setCustomerProximity({
                        withinRange: response.data.withinRange,
                        distance: response.data.distanceMeters
                    });
                    setGetOtpEnabled(response.data.withinRange);
                }
            } catch (error) {
                console.error('Failed to check customer proximity:', error);
            }
        };

        if (deliveryBoyLocation && order?.status === 'Picked up') {
            checkCustomerProx();
            const interval = setInterval(checkCustomerProx, 4000); // Check every 4 seconds
            return () => clearInterval(interval);
        }
    }, [id, deliveryBoyLocation, order?.status]);

    // Track if location permission was denied
    const locationPermissionDeniedRef = useRef<boolean>(false);

    // Get delivery boy's current location
    useEffect(() => {
        const getCurrentLocation = () => {
            if (!navigator.geolocation) {
                console.warn('Geolocation is not supported by this browser');
                return;
            }

            if (locationPermissionDeniedRef.current) {
                // Don't retry if permission was denied
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setDeliveryBoyLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                    locationPermissionDeniedRef.current = false; // Reset on success
                    setLocationError(null);
                },
                (error: GeolocationPositionError) => {
                    // Handle different error types
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            locationPermissionDeniedRef.current = true;
                            setLocationError('Location permission denied. Please enable location access in your browser settings to track delivery.');
                            console.warn('Location permission denied. Please enable location access in your browser settings.');
                            break;
                        case error.POSITION_UNAVAILABLE:
                            setLocationError('Location information unavailable. Please check your device settings.');
                            console.warn('Location information unavailable. Please check your device settings.');
                            break;
                        case error.TIMEOUT:
                            setLocationError('Location request timed out. Please try again.');
                            console.warn('Location request timed out. Please try again.');
                            break;
                        default:
                            setLocationError(`Error getting location: ${error.message}`);
                            console.warn('Error getting location:', error.message);
                            break;
                    }
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        };

        getCurrentLocation();
    }, []);



    // Socket.io connection
    const socketRef = useRef<any>(null);
    const [socketConnected, setSocketConnected] = useState(false);

    // Initialize Socket
    useEffect(() => {
        let isMounted = true;
        let socket: any = null;

        const initializeSocket = async () => {
            try {
                const [{ io }, { getSocketBaseURL, getAuthToken }] = await Promise.all([
                    import('socket.io-client'),
                    import('../../../services/api/config')
                ]);

                if (!isMounted) return;

                const baseURL = getSocketBaseURL();
                const token = getAuthToken();

                socket = io(baseURL, {
                    auth: { token },
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 2000
                });

                socket.on('connect', () => {
                    if (isMounted) {
                        console.log('✅ Delivery Socket Connected:', socket.id);
                        setSocketConnected(true);
                    }
                });

                socket.on('disconnect', (reason: string) => {
                    if (isMounted) {
                        console.log('❌ Delivery Socket Disconnected:', reason);
                        setSocketConnected(false);
                    }
                });

                socket.on('connect_error', (error: any) => {
                    if (isMounted) {
                        console.error('❌ Delivery Socket Connection Error:', error.message);
                    }
                });

                // Listen for order cancellation
                socket.on('order-cancelled', (data: any) => {
                    if (isMounted && data.orderId === id) {
                        console.log('Order cancelled event received:', data);
                        alert(data.message || 'Order has been cancelled');
                        // Update order status locally
                        setOrder((prev: any) => prev ? { ...prev, status: 'Cancelled' } : null);
                        // Optional: Navigate back or force re-fetch
                        fetchOrder();
                    }
                });

                socketRef.current = socket;
            } catch (err) {
                console.error('Failed to initialize socket:', err);
            }
        };

        initializeSocket();

        return () => {
            isMounted = false;
            if (socket) {
                console.log('🔌 Disconnecting delivery socket...');
                socket.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    // Helper to get socket (for use in other effects)
    const getSocket = useCallback(() => socketRef.current, []);


    // Update delivery boy location from geolocation updates (Socket)
    useEffect(() => {
        if (!id || !order) return;

        const shouldTrack = order.status && order.status !== 'Delivered' && order.status !== 'Cancelled' && order.status !== 'Returned';
        const socket = socketRef.current;

        if (shouldTrack && socketConnected && socket) {
            const updateLocation = async () => {
                if (!navigator.geolocation) return;
                if (locationPermissionDeniedRef.current) return;

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const newLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        };
                        setDeliveryBoyLocation(newLocation);
                        setLastUpdate(new Date());

                        // Emit via Socket
                        socket.emit('update-location', {
                            orderId: id,
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        });

                        locationPermissionDeniedRef.current = false;
                    },
                    (error: GeolocationPositionError) => {
                        // ... error handling ...
                        if (error.code === error.PERMISSION_DENIED) {
                            if (!locationPermissionDeniedRef.current) {
                                locationPermissionDeniedRef.current = true;
                                console.warn('Location permission denied.');
                            }
                        }
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            };

            // Initial update
            updateLocation();

            // Interval (4 seconds)
            locationIntervalRef.current = setInterval(updateLocation, 4000);

            return () => {
                if (locationIntervalRef.current) {
                    clearInterval(locationIntervalRef.current);
                    locationIntervalRef.current = null;
                }
            };
        } else {
            if (locationIntervalRef.current) {
                clearInterval(locationIntervalRef.current);
                locationIntervalRef.current = null;
            }
        }
    }, [id, order?.status, socketConnected]);


    if (loading) {
        return <VillageLoader message="Analyzing Manifest" />;
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-neutral-100 flex items-center justify-center flex-col">
                <p className="text-red-500 mb-4">{error || 'Order not found'}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-4 py-2 bg-neutral-200 rounded-lg text-neutral-700 font-medium"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const statusFlow: DeliveryOrderStatus[] = ['Pending', 'Ready for pickup', 'Picked up', 'Delivered'];

    let currentStatusIndex = statusFlow.indexOf(order.status as DeliveryOrderStatus);
    // Handle cases where status might not be in the flow (e.g. Cancelled)
    if (currentStatusIndex === -1 && (order.status === 'Cancelled' || order.status === 'Returned')) {
        // Maybe show a different UI for cancelled/returned orders
        currentStatusIndex = -1;
    }

    const handleStatusChange = async (newStatus: DeliveryOrderStatus) => {
        if (!id) return;
        try {
            setLoading(true); // Or use a separate loading state for the action
            const updatedOrder = await updateOrderStatus(id, newStatus);
            // Verify the update was successful and update local state
            if (updatedOrder && updatedOrder.data) {
                setOrder(updatedOrder.data);
            } else {
                // Fallback - re-fetch everything
                await fetchOrder();
            }
        } catch (err: any) {
            alert(err.message || "Failed to update status");
            setLoading(false);
        }
    };

    const getNextStatus = () => {
        if (currentStatusIndex !== -1 && currentStatusIndex < statusFlow.length - 1) {
            return statusFlow[currentStatusIndex + 1];
        }
        return null;
    };

    const nextStatus = getNextStatus();
    const isMapVisible = order.status === 'Out for Delivery' || order.status === 'Picked up' || (sellerLocations.length > 0 && order.status !== 'Delivered');
    const showSellerLocations = sellerLocations.length > 0 && order.status !== 'Picked up' && order.status !== 'Out for Delivery' && order.status !== 'Delivered';
    const showCustomerLocation = order.status === 'Picked up';

    // Check if we have valid customer coordinates
    const customerLat = order.deliveryAddress?.latitude || order.address?.latitude;
    const customerLng = order.deliveryAddress?.longitude || order.address?.longitude;
    const hasValidCustomerLocation = !!(customerLat && customerLng && customerLat !== 0 && customerLng !== 0);

    return (
        <div className="min-h-screen bg-transparent pb-32 relative font-poppins">
            {/* Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] z-0"></div>

            {/* Top Bar with Back Button */}
            <div className="sticky top-0 z-30 bg-[#8B3D28] px-4 py-3 flex items-center shadow-md overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-white/80 hover:bg-white/10 rounded-xl transition-all active:scale-90"
                >
                    <Icons.ChevronLeft size={20} />
                </button>
                <div className="ml-2 flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 leading-none">Order Tracking</span>
                    <span className="font-black text-[12px] text-white tracking-wide mt-1">Details & Transit</span>
                </div>

                <div className="ml-auto">
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm ring-1 ring-white/20 ${order.status === 'Delivered' ? 'bg-[#4A7C59] text-white' :
                        order.status === 'Picked up' ? 'bg-indigo-600 text-white' :
                            order.status === 'Ready for pickup' ? 'bg-amber-500 text-white' :
                                'bg-orange-500 text-white'
                        }`}>
                        {order.status}
                    </span>
                </div>
            </div>

            {/* Location Error Warning */}
            {locationError && (
                <div className="mx-4 mt-4 bg-red-50 organic-radius p-3 flex items-start gap-3 border border-red-100 relative z-10 shadow-sm">
                    <Icons.AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[9px] font-black text-red-800 uppercase tracking-widest">Maps Error</p>
                        <p className="text-[9px] font-bold text-red-600 mt-0.5 leading-relaxed">{locationError}</p>
                    </div>
                </div>
            )}

            {/* Google Maps View - Shared Component for Parity */}
            {isMapVisible && (
                <div className="mx-4 mt-4 organic-radius overflow-hidden shadow-lg border-2 border-white relative z-10">
                    <GoogleMapsTracking
                        sellerLocations={
                            (order.status === 'Picked up')
                                ? []  // Hide seller markers when delivering to customer
                                : sellerLocations.map(s => ({
                                    lat: s.latitude,
                                    lng: s.longitude,
                                    name: s.storeName
                                }))
                        }
                        customerLocation={{
                            lat: order.deliveryAddress?.latitude || order.address?.latitude || 0,
                            lng: order.deliveryAddress?.longitude || order.address?.longitude || 0
                        }}
                        deliveryLocation={deliveryBoyLocation || undefined}
                        isTracking={!!deliveryBoyLocation}
                        showRoute={!!deliveryBoyLocation && (
                            (order.status === 'Picked up' && hasValidCustomerLocation) ||
                            (sellerLocations.length > 0 && order.status !== 'Delivered' && order.status !== 'Picked up')
                        )}
                        routeOrigin={deliveryBoyLocation || undefined}
                        routeDestination={
                            order.status === 'Picked up' ? (hasValidCustomerLocation ? {
                                    lat: customerLat!,
                                    lng: customerLng!
                                } : undefined)
                                : sellerLocations.length > 0
                                    ? { lat: sellerLocations[sellerLocations.length - 1].latitude, lng: sellerLocations[sellerLocations.length - 1].longitude }
                                    : undefined
                        }
                        routeWaypoints={
                            order.status === 'Picked up' ? []
                                : sellerLocations.length > 1
                                    ? sellerLocations.slice(0, -1).map(s => ({ lat: s.latitude, lng: s.longitude }))
                                    : []
                        }
                        destinationName={
                            order.status === 'Picked up' ? order.address?.split(',')[0] : sellerLocations.length > 0 ? sellerLocations[0].storeName : undefined
                        }
                        onRouteInfoUpdate={setRouteInfo}
                        lastUpdate={lastUpdate}
                    />
                </div>
            )}

            {/* Seller Locations Card with Pickup Buttons (before all sellers picked up) */}
            {showSellerLocations && sellerLocations.length > 0 && (
                <div className="p-4 relative z-10">
                    <div className="village-card paper-texture organic-radius p-4 border-none shadow-sm">
                        <div className="flex items-baseline justify-between mb-4">
                            <h3 className="text-village-umber text-[10px] font-black uppercase tracking-[0.2em] opacity-80 flex items-center gap-2">
                                <Icons.Store size={14} className="text-[#8B3D28]/40" />
                                Collection Points
                            </h3>
                            <div className="h-[2px] w-12 bg-village-umber/5 rounded-full"></div>
                        </div>

                        <div className="space-y-3">
                            {sellerLocations.map((seller: any, idx: number) => {
                                const isPickedUp = order?.sellerPickups?.some(
                                    (p: any) => p.seller === seller.sellerId && p.pickedUpAt
                                );
                                const proximity = sellerProximity[seller.sellerId];
                                const withinRange = proximity?.withinRange || false;
                                const distance = proximity?.distance;
                                const isLoading = pickupLoading[seller.sellerId] || false;

                                return (
                                    <div key={idx} className={`p-3.5 organic-radius transition-all ${isPickedUp ? 'bg-[#4A7C59]/5 border border-[#4A7C59]/10' : 'bg-stone-50 border border-stone-100'}`}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <p className="text-[11px] font-black text-village-umber uppercase tracking-tight leading-none">{seller.storeName}</p>
                                                    {isPickedUp && (
                                                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-[#4A7C59]/10 text-[#4A7C59] rounded-lg text-[8px] font-black uppercase tracking-widest">
                                                            <Icons.CheckCircle size={10} />
                                                            Picked
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[9px] font-bold text-stone-400 line-clamp-1">{seller.address}, {seller.city}</p>
                                                {distance !== undefined && (
                                                    <div className="flex items-center gap-1.5 mt-2">
                                                        <div className={`w-1 h-1 rounded-full ${withinRange ? 'bg-[#4A7C59]' : 'bg-stone-300'}`}></div>
                                                        <p className={`text-[8px] font-black uppercase tracking-widest ${withinRange ? 'text-[#4A7C59]' :
                                                            distance < 1000 ? 'text-amber-600' : 'text-stone-400'
                                                            }`}>
                                                            {distance < 1000 ? `${distance}M DISTANCE` : `${(distance / 1000).toFixed(1)}KM DISTANCE`}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {!isPickedUp && (
                                            <button
                                                onClick={() => handleSellerPickup(seller.sellerId)}
                                                disabled={!withinRange || isLoading}
                                                className={`w-full py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${withinRange && !isLoading
                                                    ? 'bg-[#4A7C59] text-white shadow-lg shadow-[#4A7C59]/20 active:scale-[0.98]'
                                                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                {isLoading ? 'Wait...' : withinRange ? 'Confirm Collection' : 'Move Closer to Confirm'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 space-y-4 max-w-lg mx-auto relative z-10">

                {/* Status Stepper Card */}
                {currentStatusIndex !== -1 && (
                    <div className="village-card paper-texture organic-radius p-5 border-none shadow-sm">
                        <div className="flex items-baseline justify-between mb-6">
                            <h2 className="text-village-umber text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                                Transit Flow
                            </h2>
                            <div className="h-[2px] w-12 bg-village-umber/5 rounded-full"></div>
                        </div>

                        {/* Status Progress Bar - Village Themed */}
                        <div className="relative pt-2 pb-1 px-1">
                            <div className="flex justify-between mb-4 relative z-10">
                                {statusFlow.map((step, idx) => (
                                    <div key={idx} className="flex flex-col items-center flex-1">
                                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black border-2 transition-all duration-500 transform ${idx === currentStatusIndex ? 'scale-110 shadow-lg shadow-[#8B3D28]/20' : ''} ${idx <= currentStatusIndex
                                            ? 'bg-[#8B3D28] border-[#8B3D28] text-white'
                                            : 'bg-white border-stone-100 text-stone-200'
                                            }`}>
                                            {idx < currentStatusIndex ? <Icons.CheckCircle size={14} /> : idx + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Connecting Line */}
                            <div className="absolute top-[1.2rem] left-8 right-8 h-1 bg-stone-100/50 rounded-full -z-0">
                                <div
                                    className="h-full bg-[#8B3D28] transition-all duration-700 rounded-full"
                                    style={{ width: `${(currentStatusIndex / (statusFlow.length - 1)) * 100}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-[7px] font-black text-stone-400 uppercase tracking-tighter mt-1 px-1">
                                {statusFlow.map((step, idx) => (
                                    <span key={idx} className={`text-center flex-1 transition-colors px-1 ${idx === currentStatusIndex ? 'text-[#8B3D28]' : ''}`}>
                                        {step === 'Ready for pickup' ? 'READY' : step === 'Picked up' ? 'PICKED' : step}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}


                {/* Customer Details */}
                <div className="village-card paper-texture organic-radius p-4 border-none shadow-sm">
                    <div className="flex items-baseline justify-between mb-4">
                        <h3 className="text-village-umber text-[10px] font-black uppercase tracking-[0.2em] opacity-80 flex items-center gap-2">
                            <Icons.User size={14} className="text-[#8B3D28]/40" />
                            Delivery Contact
                        </h3>
                        <div className="h-[2px] w-12 bg-village-umber/5 rounded-full"></div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#8B3D28]/5 flex items-center justify-center flex-shrink-0 text-[#8B3D28]">
                                <Icons.User size={18} />
                            </div>
                            <div className="flex flex-col">
                                <p className="text-[11px] font-black text-village-umber uppercase tracking-tight leading-none">{order.customerName}</p>
                                <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mt-1.5">Recipient</span>
                            </div>
                            <button
                                onClick={() => window.open(`tel:${order.customerPhone}`, '_system')}
                                className="ml-auto w-10 h-10 bg-[#4A7C59] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#4A7C59]/30 transition-all hover:bg-[#3D664A] active:scale-90"
                            >
                                <Icons.Phone size={18} />
                            </button>
                        </div>

                        <div className="bg-stone-50/50 p-3 rounded-2xl border border-stone-100 flex gap-3">
                            <div className="p-2 bg-stone-100 rounded-xl flex items-center justify-center text-[#8B3D28]/60 self-start">
                                <Icons.MapPin size={16} />
                            </div>
                            <div className="flex flex-col flex-1">
                                <p className="text-[10px] font-bold text-stone-500 leading-relaxed italic">"{order.address}"</p>
                                {order.distance && (
                                    <div className="flex items-center gap-1.5 mt-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                                        <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">
                                            {order.distance} from shop
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delivery Earning Card - Show only if delivered or has earning */}
                {(order.status === 'Delivered' || (order.deliveryEarning ? order.deliveryEarning > 0 : false)) && (
                    <div className="bg-gradient-to-br from-[#4A7C59] to-[#3D664A] organic-radius p-4 shadow-lg shadow-[#4A7C59]/20 text-white relative overflow-hidden group">
                        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
                        <div className="flex justify-between items-center relative z-10">
                            <div className="flex flex-col">
                                <p className="text-white/60 text-[8px] font-black uppercase tracking-[0.2em] mb-1">Your payout</p>
                                <h3 className="text-2xl font-black tracking-tighter">{"\u20B9"} {order.deliveryEarning?.toFixed(2) || '0.00'}</h3>
                            </div>
                            <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-sm border border-white/10">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 3h12" />
                                    <path d="M6 8h12" />
                                    <path d="M6 13l8.5 8" />
                                    <path d="M6 13h3a5 5 0 0 0 5-5 5 5 0 0 0-5-5" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Information Card */}
                <div className="village-card paper-texture organic-radius p-4 border-none shadow-sm overflow-hidden relative">
                    <div className="flex items-baseline justify-between mb-4">
                        <h3 className="text-village-umber text-[10px] font-black uppercase tracking-[0.2em] opacity-80 flex items-center gap-2">
                            <Icons.CreditCard size={14} className="text-[#8B3D28]/40" />
                            Payment Method
                        </h3>
                        <div className="h-[2px] w-12 bg-village-umber/5 rounded-full"></div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                                order.paymentMethod === 'COD' 
                                    ? 'bg-amber-50 text-amber-600' 
                                    : 'bg-green-50 text-green-600'
                            }`}>
                                {order.paymentMethod === 'COD' ? <Icons.Truck size={18} /> : <Icons.ShieldCheck size={18} />}
                            </div>
                            <div className="flex flex-col">
                                <p className="text-[11px] font-black text-village-umber uppercase tracking-tight leading-none">
                                    {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online / Paid'}
                                </p>
                                <span className={`text-[8px] font-bold uppercase tracking-widest mt-1.5 ${
                                    order.paymentStatus === 'Paid' ? 'text-green-500' : 'text-amber-500'
                                }`}>
                                    {order.paymentStatus === 'Paid' ? 'Verified Paid' : 'Collect from Customer'}
                                </span>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-village-umber text-sm font-black">{"\u20B9"}{order.totalAmount?.toFixed(2) || '0.00'}</p>
                            <p className="text-[7px] font-bold text-stone-400 uppercase tracking-widest">Total Bill</p>
                        </div>
                    </div>

                    {order.paymentMethod === 'COD' && order.status !== 'Delivered' && (
                        <div className="mt-4 p-2.5 bg-amber-50/50 border border-amber-100 rounded-xl flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                             <p className="text-[9px] font-black text-amber-700 uppercase tracking-tighter">
                                Action Required: Collect Cash before Delivery
                             </p>
                        </div>
                    )}
                </div>

                {/* Order Items */}
                <div className="village-card paper-texture organic-radius p-4 border-none shadow-sm">
                    <div className="flex items-baseline justify-between mb-4">
                        <h3 className="text-village-umber text-[10px] font-black uppercase tracking-[0.2em] opacity-80 flex items-center gap-2">
                            <Icons.ShoppingBag size={14} className="text-[#8B3D28]/40" />
                            Parcel Contents
                        </h3>
                        <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest px-2 py-0.5 bg-stone-100 rounded-lg">
                            {order.items?.length || 0} Pieces
                        </span>
                    </div>

                    <div className="space-y-2.5">
                        {order.items?.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-stone-50/50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-stone-100 flex items-center justify-center text-[9px] font-black text-village-umber">
                                        {item.quantity}
                                    </div>
                                    <span className="text-[11px] font-black text-village-umber uppercase tracking-tight">{item.name}</span>
                                </div>
                                <span className="text-[11px] font-black text-village-umber">{"\u20B9"}{item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-dashed border-stone-200 flex justify-between items-center">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Grand Total</span>
                        <span className="text-[16px] font-black text-village-umber tracking-tighter">{"\u20B9"}{order.totalAmount}</span>
                    </div>
                </div>

                {/* Order Info */}
                <div className="village-card paper-texture organic-radius p-4 border-none shadow-sm mb-28">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100">
                            <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Package ID</p>
                            <p className="text-[10px] font-black text-village-umber uppercase">{order.orderId?.slice(-8) || "N/A"}</p>
                        </div>
                        <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100">
                            <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mb-1">Lodged On</p>
                            <p className="text-[10px] font-black text-village-umber uppercase">
                                {new Date(order.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Customer Delivery OTP Section (only when order is Out for Delivery) */}
            {order.status === 'Picked up' && (
                <div className="fixed bottom-24 left-4 right-4 z-40">
                    <div className="village-card paper-texture organic-radius p-5 shadow-2xl border-none ring-1 ring-[#8B3D28]/10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex flex-col">
                                <p className="text-[#8B3D28] text-[10px] font-black uppercase tracking-[0.2em]">Secure Handover</p>
                                <p className="text-stone-400 text-[8px] font-bold uppercase tracking-widest mt-1">Confirm OTP with Recipient</p>
                            </div>
                            {customerProximity && (
                                <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${customerProximity.withinRange ? 'bg-[#4A7C59]/10 text-[#4A7C59]' : 'bg-red-50 text-red-400'}`}>
                                    {customerProximity.distance < 1000 ? `${customerProximity.distance}M` : `${(customerProximity.distance / 1000).toFixed(1)}KM`}
                                </div>
                            )}
                        </div>

                        {/* 4-digit OTP Input */}
                        <div className="flex justify-center gap-3 mb-5">
                            <input
                                type="text"
                                value={otpValue}
                                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="----"
                                disabled={!showOtpInput}
                                className={`w-full max-w-[180px] px-6 py-3.5 rounded-2xl text-[20px] font-black text-center tracking-[0.5em] focus:outline-none transition-all shadow-inner ${showOtpInput
                                    ? 'bg-stone-50 border-2 border-[#8B3D28]/20 text-village-umber'
                                    : 'bg-stone-100 border-2 border-stone-200 text-stone-300 shadow-none'
                                    }`}
                                maxLength={4}
                            />
                        </div>

                        <div className="flex gap-3">
                            {!showOtpInput ? (
                                <button
                                    onClick={handleSendOtp}
                                    disabled={!getOtpEnabled || otpSending}
                                    className={`flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${getOtpEnabled && !otpSending
                                        ? 'bg-[#8B3D28] text-white shadow-lg shadow-[#8B3D28]/20 active:scale-[0.98]'
                                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                                        }`}
                                >
                                    {otpSending ? 'Sending...' : getOtpEnabled ? 'Generate OTP' : 'Arrive at Location'}
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => {
                                            setShowOtpInput(false);
                                            setOtpValue('');
                                        }}
                                        className="w-14 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center hover:bg-stone-200 transition-all active:scale-95"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                            <path d="M18 6L6 18M6 6l12 12" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={handleVerifyOtp}
                                        className="flex-1 py-3.5 rounded-2xl bg-[#4A7C59] text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-[#4A7C59]/20 hover:bg-[#3D664A] transition-all active:scale-95 disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none"
                                        disabled={otpVerifying || otpValue.length !== 4}
                                    >
                                        {otpVerifying ? 'Verifying...' : 'Complete Delivery'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Action Button Dock */}
            {nextStatus && order.status !== 'Picked up' && !showOtpInput && (
                <div className="fixed bottom-24 left-4 right-4 z-40">
                    <button
                        onClick={() => handleStatusChange(nextStatus)}
                        className="w-full py-4 rounded-2xl bg-[#8B3D28] shadow-2xl shadow-[#8B3D28]/30 text-white font-black text-[11px] uppercase tracking-[0.25em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden relative group"
                        disabled={loading}
                    >
                        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] group-hover:scale-110 transition-transform"></div>
                        <span className="relative z-10">
                            {loading ? 'Processing...' : nextStatus === 'Picked up' ? 'Mark Package Taken' : `Proceed to ${nextStatus}`}
                        </span>
                        {!loading && <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center relative z-10 transition-all group-hover:bg-white/30">
                            <Icons.ChevronLeft className="rotate-180" size={14} />
                        </div>}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                    </button>
                </div>
            )}
        </div>
    );
}
