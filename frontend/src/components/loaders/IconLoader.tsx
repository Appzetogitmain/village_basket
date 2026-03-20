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
  const [loginAnimationData, setLoginAnimationData] = useState<any>(null);

  useEffect(() => {
    if (path.includes('/login')) {
      fetch('/animations/login_animation.json')
        .then(res => res.json())
        .then(data => setLoginAnimationData(data))
        .catch(err => console.error('Failed to load login animation:', err));
    }
  }, [path]);

  const show = isRouteLoading || forceShow;
  
  // Detect themes
  const isDelivery = path.includes('/delivery');
  const isAdmin = path.includes('/admin');
  const isSeller = path.includes('/seller');

  // Animation variants for consistency
  const containerVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.1 }
  };

  const renderAnimation = () => {
    // 1. DELIVERY THEME: THE BULLOCK CART (BELLGADI)
    if (isDelivery) {
      return (
        <motion.div animate={{ y: [0, -4, 0], x: [-2, 2, -2], rotate: [-1, 1, -1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
          <svg width="100" height="60" viewBox="0 0 60 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="25" width="45" height="4" rx="1" fill="#8B3D28" />
            <path d="M10 12 L50 12 L55 25 L5 25 Z" fill="#8B3D28" />
            <rect x="15" y="6" width="12" height="12" rx="1" fill="#8B3D28" opacity="0.6" />
            <rect x="25" y="3" width="15" height="15" rx="1" fill="#8B3D28" opacity="0.4" />
            <rect x="42" y="8" width="8" height="8" rx="1" fill="#8B3D28" opacity="0.5" />
            <motion.g animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ originX: "18px", originY: "32px" }}>
              <circle cx="18" cy="32" r="6" stroke="#8B3D28" strokeWidth="2" strokeDasharray="2 2" />
              <circle cx="18" cy="32" r="1.5" fill="#8B3D28" />
            </motion.g>
            <motion.g animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ originX: "42px", originY: "32px" }}>
              <circle cx="42" cy="32" r="6" stroke="#8B3D28" strokeWidth="2" strokeDasharray="2 2" />
              <circle cx="42" cy="32" r="1.5" fill="#8B3D28" />
            </motion.g>
          </svg>
        </motion.div>
      );
    }

    // 2. ADMIN/SELLER THEME: THE VILLAGE WELL (Panchayat Well)
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

    // 3. HOME: SUNRISE & SPROUT
    if (path === '/' || path === '/user/home') {
      return (
        <div className="relative">
          <motion.div animate={{ y: [10, -5, 10], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="10" r="5" fill="#FFCC00" fillOpacity="0.4" />
              <path d="M12 2V4M12 16V18M4 10H2M22 10H20M5.6 16.4L4.2 17.8M19.8 4.2L18.4 5.6M18.4 14.4L19.8 15.8M4.2 4.2L5.6 5.6" stroke="#FFCC00" strokeWidth="2" strokeLinecap="round" />
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

    // 4. SEARCH: MAGNIFYING GLASS & LEAF
    if (path.includes('/search')) {
      return (
        <motion.div animate={{ rotate: [-10, 10, -10] }} transition={{ duration: 2, repeat: Infinity }}>
          <svg width="90" height="90" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="7" stroke="#2E7D32" strokeWidth="2" />
            <path d="M16 16L20 20" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" />
            <motion.path d="M9 11C9 11 10 8 13 8" stroke="#4CAF50" strokeWidth="1.5" strokeLinecap="round" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1, repeat: Infinity }} />
          </svg>
        </motion.div>
      );
    }

    // 5. CART & CHECKOUT: WICKER BASKET
    if (path.includes('/cart') || path.includes('/checkout')) {
      return (
        <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 10C3 10 4 20 12 20C20 20 21 10 21 10H3Z" stroke="#3E2723" strokeWidth="2" fill="#3E2723" fillOpacity="0.05" />
            <path d="M8 10C8 10 8 4 12 4C16 4 16 10 16 10" stroke="#3E2723" strokeWidth="2" />
            <motion.circle cx="10" cy="8" r="3" fill="#E53935" animate={{ y: [0, 6], opacity: [0, 1] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.4 }} />
            <motion.circle cx="14" cy="8" r="2.5" fill="#FF9800" animate={{ y: [0, 8], opacity: [0, 1] }} transition={{ duration: 0.7, repeat: Infinity, repeatDelay: 0.3, delay: 0.2 }} />
          </svg>
        </motion.div>
      );
    }

    // 6. CATEGORIES: HARVEST TREE
    if (path.includes('/categories') || path.includes('/category')) {
      return (
        <motion.div animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 2, repeat: Infinity }}>
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22V16" stroke="#3E2723" strokeWidth="3" />
            <circle cx="12" cy="10" r="7" fill="#2E7D32" fillOpacity="0.1" stroke="#2E7D32" strokeWidth="1.5" />
            <motion.circle cx="9" cy="8" r="1.5" fill="#E53935" animate={{ scale: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity }} />
            <motion.circle cx="15" cy="11" r="1.5" fill="#FFCC00" animate={{ scale: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
            <motion.circle cx="11" cy="13" r="1.5" fill="#4CAF50" animate={{ scale: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }} />
          </svg>
        </motion.div>
      );
    }

    // 7. ACCOUNT & ADDRESS: VILLAGE HUT
    if (path.includes('/account') || path.includes('/profile') || path.includes('/address')) {
      return (
        <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 20H21" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" />
            <path d="M5 20V11L12 5L19 11V20" stroke="#3E2723" strokeWidth="2" fill="#8B3D28" fillOpacity="0.05" />
            <rect x="10" y="14" width="4" height="6" stroke="#3E2723" strokeWidth="1.5" />
            <motion.path d="M17 7V4H19V6" stroke="#3E2723" strokeWidth="1" animate={{ opacity: [0, 1, 0], y: [0, -5] }} transition={{ duration: 1.5, repeat: Infinity }} />
          </svg>
        </motion.div>
      );
    }

    // 8. WALLET & REWARDS: POTLI & COINS
    if (path.includes('/wallet') || path.includes('/rewards')) {
      return (
        <motion.div animate={{ y: [0, -5, 0], rotate: [-2, 2, -2] }} transition={{ duration: 2, repeat: Infinity }}>
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5C8 5 6 9 6 13C6 18 9 21 12 21C15 21 18 18 18 13C18 9 16 5 12 5Z" fill="#8B3D28" fillOpacity="0.1" stroke="#8B3D28" strokeWidth="2" />
            <path d="M8 8C8 8 12 7 16 8" stroke="#8B3D28" strokeWidth="2" strokeLinecap="round" />
            <motion.circle cx="12" cy="13" r="3" fill="#FFCC00" animate={{ scale: [0.8, 1.2, 0.8] }} transition={{ duration: 1, repeat: Infinity }} />
          </svg>
        </motion.div>
      );
    }

    // 9. ORDERS & AGAIN: MOVING PARCEL
    if (path.includes('/orders') || path.includes('/order-again')) {
      return (
        <motion.div animate={{ x: [-10, 10, -10] }} transition={{ duration: 2, repeat: Infinity }}>
          <svg width="90" height="90" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="8" width="16" height="12" rx="2" stroke="#3E2723" strokeWidth="2" fill="#3E2723" fillOpacity="0.05" />
            <path d="M4 12H20M12 8V20" stroke="#3E2723" strokeWidth="1" opacity="0.3" />
            <motion.path d="M2 14H5M2 17H5" stroke="#3E2723" strokeWidth="2" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} />
          </svg>
        </motion.div>
      );
    }

    // 10. WISHLIST: HEART LEAF
    if (path.includes('/wishlist')) {
      return (
        <motion.div animate={{ rotate: [-10, 10, -10], y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
          <svg width="90" height="90" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" stroke="#4A7C59" strokeWidth="2" fill="#4A7C59" fillOpacity="0.1" />
            <motion.path d="M12 11V16M12 16L10 14M12 16L14 14" stroke="#4A7C59" strokeWidth="1.5" animate={{ y: [0, 2, 0] }} transition={{ duration: 1, repeat: Infinity }} />
          </svg>
        </motion.div>
      );
    }

    // 11. PRODUCT DETAIL: QUALITY CHECK
    if (path.includes('/product/')) {
      return (
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="#3E2723" strokeWidth="1.5" />
            <motion.path d="M8 12C8 12 10 15 12 15C14 15 16 12 16 12" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} />
            <path d="M12 7V9" stroke="#3E2723" strokeWidth="1.5" />
          </svg>
        </motion.div>
      );
    }

    // 12. STORES: VILLAGE SHOP FRONT
    if (path.includes('/store')) {
      return (
        <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 20V8L12 3L21 8V20H3Z" stroke="#3E2723" strokeWidth="2" />
            <rect x="7" y="12" width="10" height="8" stroke="#3E2723" strokeWidth="1.5" />
            <motion.path d="M5 8L12 12L19 8" stroke="#3E2723" strokeWidth="1.5" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }} />
          </svg>
        </motion.div>
      );
    }

    // 13. SUPPORT, FAQ, ABOUT: BANYAN TREE (PANCHAYAT)
    if (path.includes('/faq') || path.includes('/about-us') || path.includes('/help')) {
      return (
        <motion.div animate={{ rotate: [-1, 1, -1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
          <svg width="110" height="110" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22V12" stroke="#3E2723" strokeWidth="4" />
            <motion.path d="M4 12C4 7 8 4 12 4C16 4 20 7 20 12" stroke="#2E7D32" strokeWidth="3" fill="#2E7D32" fillOpacity="0.1" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }} />
            <path d="M2 22H22" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </motion.div>
      );
    }

    // 14. LOGIN: LOTTIE ANIMATION
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

    // DEFAULT: TRADITIONAL WEIGHING SCALE (TARAZOO)
    return (
      <motion.div animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4V20" stroke="#3E2723" strokeWidth="1.5" />
          <path d="M4 7H20" stroke="#3E2723" strokeWidth="1.5" />
          <path d="M4 7L6 15M20 7L18 15" stroke="#3E2723" strokeWidth="1" />
          <path d="M3 15H9M15 15H21" stroke="#3E2723" strokeWidth="1.5" strokeLinecap="round" />
          <motion.circle cx="6" cy="15" r="3" fill="#2E7D32" fillOpacity="0.1" animate={{ y: [-1, 1, -1] }} transition={{ duration: 2, repeat: Infinity }} />
          <motion.circle cx="18" cy="15" r="3" fill="#E53935" fillOpacity="0.1" animate={{ y: [1, -1, 1] }} transition={{ duration: 2, repeat: Infinity }} />
        </svg>
      </motion.div>
    );
  };

  const getLoadingText = () => {
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
    <AnimatePresence>
      {show && (
        <motion.div
          className="global-loader-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{
            background: 'rgba(255, 255, 255, 1)',
            backdropFilter: 'blur(10px)',
            zIndex: 10000
          }}
        >
          <div className="flex flex-col items-center justify-center p-4 max-w-xs w-full">
            <motion.div
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center justify-center space-y-8"
            >
              {/* Animation Container */}
              <div className="relative h-40 flex items-center justify-center">
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
                  className="absolute bottom-4 w-20 h-2 bg-black/5 rounded-[50%] blur-[2px]"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>

              {/* Branding & Status Text */}
              <div className="text-center space-y-3">
                <motion.h2 
                  className="text-stone-800 font-black text-xs uppercase tracking-[0.4em] italic leading-none"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {text.h2}
                </motion.h2>
                
                <div className="flex flex-col items-center gap-3">
                  <div className="h-[2px] w-12 bg-stone-100 relative overflow-hidden rounded-full">
                    <motion.div 
                      className="absolute inset-y-0 left-0 bg-village-green"
                      animate={{ left: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      style={{ width: '50%' }}
                    />
                  </div>
                  
                  <p className="text-village-green/60 text-[9px] font-bold uppercase tracking-[0.2em] leading-none">
                    {text.p}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


export default IconLoader;
