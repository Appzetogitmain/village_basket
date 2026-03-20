import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscription } from '../../../context/SubscriptionContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { SubscriptionItem } from '../../../types/subscription';

const DailyServiceBasketBar: React.FC = () => {
  const { dailyServiceCart } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();

  if (dailyServiceCart.length === 0 || location.pathname === '/daily-service/checkout') return null;

  const totalItems = dailyServiceCart.reduce((acc: number, item: SubscriptionItem) => acc + item.quantity, 0);
  const totalDailyPrice = dailyServiceCart.reduce((acc: number, item: SubscriptionItem) => acc + (item.pricePerDay * item.quantity), 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-[74px] left-4 right-4 z-[45]"
      >
        <div 
          onClick={() => navigate('/daily-service/checkout')}
          className="bg-white/95 backdrop-blur-md border border-village-green/20 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between cursor-pointer group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-village-green/5 rounded-xl flex items-center justify-center relative flex-shrink-0 overflow-hidden border border-village-green/10">
              <img 
                src={dailyServiceCart[dailyServiceCart.length - 1].productImage} 
                alt="Product" 
                className="w-full h-full object-cover"
              />
              <span className="absolute -top-1 -right-1 bg-village-green text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center ring-2 ring-white">
                {totalItems}
              </span>
            </div>
            <div className="flex flex-col">
              <h4 className="text-[10px] font-black text-village-umber uppercase tracking-widest leading-none">
                Daily Basket
              </h4>
              <span className="text-[8px] text-stone-400 font-bold mt-1 uppercase tracking-tighter">
                Bundle & Save more
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right flex flex-col items-end">
              <span className="text-[8px] font-black text-village-green uppercase tracking-tighter leading-none">
                Total Daily
              </span>
              <span className="text-[13px] font-black text-village-umber leading-none mt-1">
                ₹{totalDailyPrice.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="w-7 h-7 rounded-full bg-village-green flex items-center justify-center text-white shadow-lg shadow-village-green/20 group-hover:translate-x-0.5 transition-transform">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DailyServiceBasketBar;
