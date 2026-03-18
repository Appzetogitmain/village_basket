import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoading } from '../../context/LoadingContext';
import './iconLoader.css';

interface IconLoaderProps {
  forceShow?: boolean;
}

const IconLoader: React.FC<IconLoaderProps> = ({ forceShow = false }) => {
  const { isRouteLoading } = useLoading();
  const show = isRouteLoading || forceShow;

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
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            zIndex: 10000
          }}
        >
          <div className="flex flex-col items-center justify-center p-4">
            {/* Speed & Nature Container */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              
              {/* Speed Lines (Quick Commerce Vibe) */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-1 bg-village-green/20 rounded-full"
                  style={{
                    width: Math.random() * 20 + 20,
                    top: `${20 + i * 12}%`,
                    left: '-20%'
                  }}
                  animate={{
                    x: ['0%', '200%'],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 0.8,
                    delay: i * 0.15,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              ))}

              {/* Central Bouncing Wicker Basket */}
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [-2, 2, -2]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative z-10"
              >
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Wicker Pattern Basket */}
                  <path 
                    d="M3 10C3 10 4 20 12 20C20 20 21 10 21 10H3Z" 
                    fill="#3E2723" 
                    fillOpacity="0.08" 
                    stroke="#3E2723" 
                    strokeWidth="1.2" 
                    strokeLinecap="round" 
                  />
                  {/* Wicker Grid Lines */}
                  <path d="M7 10V18" stroke="#3E2723" strokeWidth="0.8" opacity="0.2" />
                  <path d="M12 10V20" stroke="#3E2723" strokeWidth="0.8" opacity="0.2" />
                  <path d="M17 10V18" stroke="#3E2723" strokeWidth="0.8" opacity="0.2" />
                  <path d="M4 14H20" stroke="#3E2723" strokeWidth="0.8" opacity="0.2" />
                  
                  {/* Fast Grocery Items Popping In/Out */}
                  {/* Leaf */}
                  <motion.path
                    d="M9 7C9 7 7 8 7 10M12 4C12 4 11 5 11 7"
                    stroke="#2E7D32"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    animate={{ y: [20, -10], opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                  />
                  {/* Carrot Shape */}
                  <motion.path
                    d="M15 5L13 9"
                    stroke="#FF9800"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    animate={{ y: [20, -12], opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.3 }}
                  />
                  {/* Round Fruit (Apple) */}
                  <motion.circle
                    cx="12" cy="6" r="1.5"
                    fill="#E53935"
                    animate={{ y: [20, -8], opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }}
                  />
                </svg>
              </motion.div>

              {/* Ground Shadow Ripple */}
              <motion.div
                className="absolute bottom-10 w-16 h-2 bg-village-umber/10 rounded-full blur-[2px]"
                animate={{
                  scaleX: [0.8, 1.2, 0.8],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>

            {/* Quick Commerce Branding */}
            <div className="mt-2 text-center">
              <motion.h2 
                className="text-village-umber font-black text-sm uppercase tracking-[0.3em]"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Village Basket
              </motion.h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="h-[1px] w-4 bg-village-green/20" />
                <span className="text-[10px] font-black text-village-green uppercase tracking-wider">Fast Harvest Delivery</span>
                <span className="h-[1px] w-4 bg-village-green/20" />
              </div>
              
              {/* Delivery Progress Dots */}
              <div className="flex gap-1.5 justify-center mt-3">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-village-orange"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.15
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IconLoader;
