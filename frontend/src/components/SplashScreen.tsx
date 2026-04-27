import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import bullockCart from '@assets/animation/bullock_cart.json';
import logo from '@assets/village_basket-removebg-preview.png';

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setVisible(false), 3200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#FAF7F2]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {/* Background warli pattern */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: "url('/assets/warli_pattern.png')",
              backgroundSize: '320px',
              backgroundRepeat: 'repeat',
            }}
          />

          {/* Logo */}
          <motion.img
            src={logo}
            alt="Village Basket"
            className="w-20 h-20 object-contain mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />

          {/* Brand name */}
          <motion.p
            className="text-[#8B3D28] text-xs font-black uppercase tracking-[0.3em] mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Village Basket
          </motion.p>

          {/* Bullock Cart Animation */}
          <motion.div
            className="w-[90vw] h-[50vh] max-w-3xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Lottie animationData={bullockCart} loop autoplay className="w-full h-full" />
          </motion.div>

          {/* Tagline */}
          <motion.p
            className="text-[#3E2723]/50 text-[11px] font-bold uppercase tracking-widest mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            Farm to Doorstep
          </motion.p>

          {/* Progress bar */}
          <motion.div
            className="absolute bottom-12 w-32 h-1 bg-[#8B3D28]/10 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              className="h-full bg-[#8B3D28] rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.6, delay: 0.4, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
