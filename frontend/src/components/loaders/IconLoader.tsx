import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import { useLoading } from '../../context/LoadingContext';
import './iconLoader.css';

interface IconLoaderProps {
  forceShow?: boolean;
}

const IconLoader: React.FC<IconLoaderProps> = ({ forceShow = false }) => {
  const { isRouteLoading } = useLoading();
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const [animationData, setAnimationData] = useState<any>(null);
  const [lockedPath, setLockedPath] = useState<string>(path);
  const [currentAnimationName, setCurrentAnimationName] = useState<string>('bullock_cart.json');

  useEffect(() => {
    if (!isRouteLoading && !forceShow) {
      // Keep tracking the path when hidden
      setLockedPath(path);
      return;
    }
  }, [path, isRouteLoading, forceShow]);

  // Use lockedPath for all visual decisions so they don't change midway through loading
  const currentPath = (isRouteLoading || forceShow) ? lockedPath : path;

  useEffect(() => {
    // List of rotating Indian Village animations provided by the user
    const ROTATING_ANIMATIONS = [
      'indian_woman_vegetables.json',
      'india_man_mango_plucking.json',
      'indian_man_choose_fruits.json',
      'indian_man_spices.json'
    ];

    let animationName = 'bullock_cart.json'; // Default to the iconic bullock cart

    // Home & Root page always use the Bullock Cart as the primary "Load" experience
    // Added /user and /user/ to ensure the redirect after login defaults to bullock cart
    if (currentPath === '/' || currentPath === '/user' || currentPath === '/user/' || currentPath === '/user/home') {
      animationName = 'bullock_cart.json';
    } else {
      // For all other route transitions, pick one of the other 4 "village life" scenes at random
      const index = Math.floor(Math.random() * ROTATING_ANIMATIONS.length);
      animationName = ROTATING_ANIMATIONS[index];
    }

    setCurrentAnimationName(animationName);
    fetch(`/animations/${animationName}`)
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error('Failed to load animation:', err));
  }, [currentPath]);

  const show = isRouteLoading || forceShow;

  // Detect themes using currentPath
  const isDelivery = currentPath.includes('/delivery');
  const isAdmin = currentPath.includes('/admin');
  const isSeller = currentPath.includes('/seller');

  // Animation variants for consistency
  const containerVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.1 }
  };

  const currentAnimation = currentAnimationName;
  const isExtraLarge = currentAnimation === 'indian_man_spices.json' ||
    currentAnimation === 'indian_woman_vegetables.json' ||
    currentAnimation === 'bullock_cart.json';

  const renderAnimation = () => {
    const isRotatingVariant = currentAnimation !== 'bullock_cart.json';

    // Tailored sizes for different animation types
    let sizeClasses = "w-[600px] h-[600px]"; // Primary animations scale (Bullock Cart, Spices, Vegetables)
    
    if (isRotatingVariant && !isExtraLarge) {
      sizeClasses = "w-[400px] h-[400px]"; // Slightly reduced scale for mango and fruit scenes for better framing
    }

    return (
      <div className={`${sizeClasses} flex items-center justify-center`}>
        {animationData ? (
          <Lottie animationData={animationData} loop={true} className="w-full h-full" />
        ) : (
          <div className="w-12 h-12 border-4 border-village-green border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    );
  };

  const getLoadingText = () => {
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
    <AnimatePresence>
      {show && (
        <motion.div
          className="global-loader-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1, max: 1, ease: "easeOut" }}
          style={{
            background: 'rgba(255, 255, 255, 1)',
            backdropFilter: 'blur(10px)',
            zIndex: 10000
          }}
        >
          <div className="flex flex-col items-center justify-center p-4 max-w-2xl w-full">
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`flex flex-col items-center justify-center ${isExtraLarge ? 'space-y-0' : 'space-y-2'} translate-y-12`} // Repositioned for larger scale
            >
              {/* Animation Container */}
              <div className={`relative ${isExtraLarge ? 'min-h-[600px]' : 'min-h-[480px]'} flex items-center justify-center`}>
                {/* Speed Lines Effects */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute h-[1px] bg-village-green/10"
                      style={{
                        width: 40 + Math.random() * 40,
                        top: 20 + i * 20 + '%',
                        left: -40
                      }}
                      animate={{
                        x: [0, 300],
                        opacity: [0, 0.5, 0]
                      }}
                      transition={{
                        duration: 1 + Math.random(),
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                    />
                  ))}
                </div>

                {renderAnimation()}

                {/* Ground Shadow */}
                <motion.div
                  className="absolute bottom-4 w-28 h-2 bg-black/5 rounded-[50%] blur-[2px]"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>

              {/* Status Text (Single Line) */}
              <div className={`text-center ${isExtraLarge ? '-mt-24' : ''}`}>
                <p className="text-village-green font-bold text-[10px] uppercase tracking-[0.2em] leading-none opacity-60">
                  {text.p}
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


export default IconLoader;
