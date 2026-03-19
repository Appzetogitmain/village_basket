import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { useLoading } from '../context/LoadingContext';

interface VillageLoaderProps {
    message?: string;
    show?: boolean;
    className?: string;
    isAdmin?: boolean;
    isSeller?: boolean;
    isDelivery?: boolean;
}

const VillageLoader: React.FC<VillageLoaderProps> = ({ 
    message, 
    show = false,
    className = "",
    isAdmin: isAdminProp = false,
    isSeller: isSellerProp = false,
    isDelivery: isDeliveryProp = false
}) => {
    const { isRouteLoading } = useLoading();
    const path = typeof window !== 'undefined' ? window.location.pathname : '';
    const [loginAnimationData, setLoginAnimationData] = useState<any>(null);

    useEffect(() => {
        if (path.includes('/login')) {
            fetch('/animations/login_animation.json')
                .then(res => res.json())
                .then(data => setLoginAnimationData(data))
                .catch(err => console.error('Failed to load login animation in VillageLoader:', err));
        }
    }, [path]);

    // Don't show if global route loading is already active to prevent double animations
    if (isRouteLoading) return null;

    const isSeller = path.includes('/seller');
    const isAdmin = path.includes('/admin');
    const isDelivery = path.includes('/delivery');

    const renderAnimation = () => {
        // LOGIN: LOTTIE ANIMATION
        if (path.includes('/login')) {
            return (
                <div className="w-64 h-64 flex items-center justify-center">
                    {loginAnimationData ? (
                        <Lottie animationData={loginAnimationData} loop={true} />
                    ) : (
                        <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    )}
                </div>
            );
        }

        // Shared animation rendering logic (Same as IconLoader for consistency)
        if (isDelivery) {
            return (
                <motion.div animate={{ y: [0, -4, 0], x: [-2, 2, -2], rotate: [-1, 1, -1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                    <svg width="100" height="60" viewBox="0 0 60 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="5" y="25" width="45" height="4" rx="1" fill="#8B3D28" />
                        <path d="M10 12 L50 12 L55 25 L5 25 Z" fill="#8B3D28" />
                        <rect x="15" y="6" width="12" height="12" rx="1" fill="#8B3D28" opacity="0.6" />
                        <motion.g animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ originX: "18px", originY: "32px" }}>
                            <circle cx="18" cy="32" r="6" stroke="#8B3D28" strokeWidth="2" strokeDasharray="2 2" />
                        </motion.g>
                        <motion.g animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ originX: "42px", originY: "32px" }}>
                            <circle cx="42" cy="32" r="6" stroke="#8B3D28" strokeWidth="2" strokeDasharray="2 2" />
                        </motion.g>
                    </svg>
                </motion.div>
            );
        }

        if (isAdmin || isSeller) {
            return (
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 18C4 18 6 22 12 22C18 22 20 18 20 18" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" />
                        <rect x="6" y="14" width="12" height="6" rx="1" stroke="#3E2723" strokeWidth="1.5" />
                        <path d="M6 14V6H18V14" stroke="#3E2723" strokeWidth="1.5" />
                        <motion.path d="M12 6V12" stroke="#8B3D28" strokeWidth="2" animate={{ y: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
                        <motion.circle cx="12" cy="12" r="2" fill="#8B3D28" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    </svg>
                </motion.div>
            );
        }

        if (path === '/' || path === '/user/home') {
            return (
                <div className="relative">
                    <motion.div animate={{ y: [10, -5, 10], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }}>
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="10" r="5" fill="#FFCC00" fillOpacity="0.4" />
                            <path d="M12 2V4M12 16V18M4 10H2M22 10H20" stroke="#FFCC00" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </motion.div>
                    <motion.div className="absolute -bottom-2 left-1/2 -translate-x-1/2" animate={{ scale: [0.8, 1.1, 0.8] }} transition={{ duration: 2, repeat: Infinity }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22V14M12 14C12 14 13 11 16 11M12 14C12 14 11 11 8 11" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </motion.div>
                </div>
            );
        }

        if (path.includes('/search')) {
            return (
                <motion.div animate={{ rotate: [-10, 10, -10] }} transition={{ duration: 2, repeat: Infinity }}>
                    <svg width="90" height="90" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="11" cy="11" r="7" stroke="#2E7D32" strokeWidth="2" />
                        <path d="M16 16L20 20" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </motion.div>
            );
        }

        if (path.includes('/cart') || path.includes('/checkout')) {
            return (
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 10C3 10 4 20 12 20C20 20 21 10 21 10H3Z" stroke="#3E2723" strokeWidth="2" fill="#3E2723" fillOpacity="0.05" />
                        <path d="M8 10C8 10 8 4 12 4C16 4 16 10 16 10" stroke="#3E2723" strokeWidth="2" />
                    </svg>
                </motion.div>
            );
        }

        if (path.includes('/categories') || path.includes('/category')) {
            return (
                <motion.div animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 2, repeat: Infinity }}>
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22V16" stroke="#3E2723" strokeWidth="3" />
                        <circle cx="12" cy="10" r="7" fill="#2E7D32" fillOpacity="0.1" stroke="#2E7D32" strokeWidth="1.5" />
                        <motion.circle cx="11" cy="13" r="1.5" fill="#4CAF50" animate={{ scale: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity }} />
                    </svg>
                </motion.div>
            );
        }

        if (path.includes('/wishlist')) {
            return (
                <motion.div animate={{ rotate: [-10, 10, -10], y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    <svg width="90" height="90" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3" stroke="#4A7C59" strokeWidth="2" fill="#4A7C59" fillOpacity="0.1" />
                    </svg>
                </motion.div>
            );
        }

        if (path.includes('/product/')) {
            return (
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="9" stroke="#3E2723" strokeWidth="1.5" />
                        <path d="M8 12C8 12 10 15 12 15C14 15 16 12 16 12" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </motion.div>
            );
        }

        if (path.includes('/store')) {
            return (
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 20V8L12 3L21 8V20H3Z" stroke="#3E2723" strokeWidth="2" />
                    </svg>
                </motion.div>
            );
        }

        if (path.includes('/wallet') || path.includes('/rewards')) {
            return (
                <motion.div animate={{ y: [0, -5, 0], rotate: [-2, 2, -2] }} transition={{ duration: 2, repeat: Infinity }}>
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5C8 5 6 9 6 13C6 18 9 21 12 21C15 21 18 18 18 13C18 9 16 5 12 5Z" fill="#8B3D28" fillOpacity="0.1" stroke="#8B3D28" strokeWidth="2" />
                    </svg>
                </motion.div>
            );
        }

        // DEFAULT: TRADITIONAL WEIGHING SCALE
        return (
            <motion.div animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4V20" stroke="#3E2723" strokeWidth="1.5" />
                    <path d="M4 7H20" stroke="#3E2723" strokeWidth="1.5" />
                    <path d="M3 15H9M15 15H21" stroke="#3E2723" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            </motion.div>
        );
    };

    const getLoadingText = () => {
        if (message) return { h2: message, p: "Village Basket" };
        if (isDelivery) return { h2: "Village Logistics", p: "Synchronizing Manifest" };
        if (isAdmin) return { h2: "Core Dashboard", p: "Managing Village Records" };
        if (isSeller) return { h2: "Seller Hub", p: "Arranging your Counter" };
        if (path === '/' || path === '/user/home') return { h2: "Morning Harvest", p: "Sourcing the freshest picks" };
        if (path.includes('/search')) return { h2: "Browsing Market", p: "Looking for nature's best" };
        if (path.includes('/cart')) return { h2: "Gathering Goods", p: "Filling your village basket" };
        if (path.includes('/checkout')) return { h2: "Checkout Session", p: "Preparing your final bill" };
        if (path.includes('/categories')) return { h2: "Market Fair", p: "Sorting the seasons finest" };
        if (path.includes('/account')) return { h2: "My Profile", p: "Opening your settings" };
        if (path.includes('/address')) return { h2: "Village Map", p: "Locating your homestead" };
        if (path.includes('/wallet')) return { h2: "Village Vault", p: "Syncing your Wallet" };
        if (path.includes('/rewards')) return { h2: "Village Rewards", p: "Polishing your points" };
        if (path.includes('/orders')) return { h2: "Tracking Cargo", p: "Navigating Village paths" };
        if (path.includes('/order-again')) return { h2: "Repeat Harvest", p: "Sourcing your favorites" };
        if (path.includes('/wishlist')) return { h2: "Dream Basket", p: "Saving what you love" };
        if (path.includes('/product/')) return { h2: "Quality Check", p: "Inspecting the harvest" };
        if (path.includes('/store')) return { h2: "Village Store", p: "Entering the Marketplace" };
        if (path.includes('/faq') || path.includes('/help')) return { h2: "Village Support", p: "Resolving your queries" };
        if (path.includes('/about-us')) return { h2: "Our Village Story", p: "The roots of the brand" };
        if (path.includes('/login')) return { h2: "Welcome Back", p: "Lighting the way for you" };
        
        return { h2: "Village Basket", p: "Bringing the village to you" };
    };

    const text = getLoadingText();

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-stone-50/98 backdrop-blur-md px-6 text-center">
            {/* Texture Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] z-0"></div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 space-y-8"
            >
                <div className="relative h-32 flex items-center justify-center">
                    {renderAnimation()}
                    
                    {/* Shadow */}
                    <motion.div
                        className="absolute bottom-0 w-16 h-1.5 bg-black/5 rounded-[50%] blur-[1px]"
                        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </div>

                {/* Loading State Text */}
                <div className="space-y-4">
                    <h2 className="text-village-umber font-black text-sm uppercase tracking-[0.4em] italic leading-none animate-pulse">
                        {text.h2}
                    </h2>
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-[2px] w-12 bg-stone-200 relative overflow-hidden rounded-full">
                            <motion.div 
                                animate={{ left: ["-100%", "100%"] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-0 bottom-0 w-1/2 bg-village-green"
                            />
                        </div>
                        <p className="text-stone-400 text-[8px] font-black uppercase tracking-[0.2em] leading-none mt-1">
                            {text.p}
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default VillageLoader;
