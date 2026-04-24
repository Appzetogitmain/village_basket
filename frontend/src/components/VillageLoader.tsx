import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { useLoading } from '../context/LoadingContext';
import { ALLOWED_ANIMATIONS, getAnimationData } from '../utils/animationCache';

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
    const [animationData, setAnimationData] = useState<any>(null);
    const [lockedPath, setLockedPath] = useState<string>(path);

    useEffect(() => {
        if (!isRouteLoading) {
            // Keep tracking the path when hidden
            setLockedPath(path);
            return;
        }
    }, [path, isRouteLoading]);

    // Use lockedPath for all visual decisions so they don't change midway through loading
    const currentPath = isRouteLoading ? lockedPath : path;

    useEffect(() => {
        // Pick one at random for every load
        const index = Math.floor(Math.random() * ALLOWED_ANIMATIONS.length);
        const animationName = ALLOWED_ANIMATIONS[index];

        getAnimationData(animationName).then(data => {
            if (data) setAnimationData(data);
        });
    }, [currentPath]);

    // Don't show if global route loading is already active to prevent double animations
    if (isRouteLoading) return null;

    const isSeller = currentPath.includes('/seller');
    const isAdmin = currentPath.includes('/admin');
    const isDelivery = currentPath.includes('/delivery');

    const renderAnimation = () => {
        return (
            <div className="w-[200px] h-[200px] flex items-center justify-center">
                {animationData ? (
                    <Lottie animationData={animationData} loop={true} />
                ) : (
                    <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
                )}
            </div>
        );
    };

    const getLoadingText = () => {
        if (message) return { h2: message, p: "Village Basket" };
        if (isDelivery) return { h2: "Village Logistics", p: "Synchronizing Manifest" };
        if (isAdmin) return { h2: "Core Dashboard", p: "Managing Village Records" };
        if (isSeller) return { h2: "Seller Hub", p: "Arranging your Counter" };
        if (currentPath === '/' || currentPath === '/user/home') return { h2: "Morning Harvest", p: "Sourcing the freshest picks" };
        if (currentPath.includes('/search')) return { h2: "Browsing Market", p: "Looking for nature's best" };
        if (currentPath.includes('/cart')) return { h2: "Gathering Goods", p: "Filling your village basket" };
        if (currentPath.includes('/checkout')) return { h2: "Checkout Session", p: "Preparing your final bill" };
        if (currentPath.includes('/categories')) return { h2: "Market Fair", p: "Sorting the seasons finest" };
        if (currentPath.includes('/account')) return { h2: "My Profile", p: "Opening your settings" };
        if (currentPath.includes('/address')) return { h2: "Village Map", p: "Locating your homestead" };
        if (currentPath.includes('/wallet')) return { h2: "Village Vault", p: "Syncing your Wallet" };
        if (currentPath.includes('/rewards')) return { h2: "Village Rewards", p: "Polishing your points" };
        if (currentPath.includes('/orders')) return { h2: "Tracking Cargo", p: "Navigating Village paths" };
        if (currentPath.includes('/order-again')) return { h2: "Repeat Harvest", p: "Sourcing your favorites" };
        if (currentPath.includes('/wishlist')) return { h2: "Dream Basket", p: "Saving what you love" };
        if (currentPath.includes('/product/')) return { h2: "Quality Check", p: "Inspecting the harvest" };
        if (currentPath.includes('/store')) return { h2: "Village Store", p: "Entering the Marketplace" };
        if (currentPath.includes('/faq') || currentPath.includes('/help')) return { h2: "Village Support", p: "Resolving your queries" };
        if (currentPath.includes('/about-us')) return { h2: "Our Village Story", p: "The roots of the brand" };
        if (currentPath.includes('/login')) return { h2: "Welcome Back", p: "Lighting the way for you" };
        
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
