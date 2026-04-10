import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscription } from '../../../context/SubscriptionContext';

interface DailyServiceSelectorProps {
  isSubscriptionMode: boolean;
  onModeToggle: (isSub: boolean) => void;
  dailyPrice: number;
}

const DailyServiceSelector: React.FC<DailyServiceSelectorProps> = ({
  isSubscriptionMode,
  onModeToggle,
  dailyPrice,
}) => {
  const { dailyServiceCart } = useSubscription();
  const isInBasket = dailyServiceCart.some(item => item.pricePerDay === dailyPrice); // Simple check for demo

  return (
    <div className="mt-4 border-t border-stone-100 pt-5 pb-2">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-village-umber font-black text-[10px] uppercase tracking-widest leading-none">
            Delivery Choice
          </h3>
          <p className="text-stone-400 text-[9px] mt-1 uppercase font-bold tracking-tight italic">
            Pick your village service
          </p>
        </div>
        <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200/50 shadow-inner">
          <button
            onClick={() => onModeToggle(false)}
            className={`px-3 py-1 rounded-md text-[9px] font-black transition-all uppercase tracking-tighter ${
              !isSubscriptionMode ? 'bg-white text-village-umber shadow-sm' : 'text-stone-400'
            }`}
          >
            Buy Once
          </button>
          <button
            onClick={() => onModeToggle(true)}
            className={`px-3 py-1 rounded-md text-[9px] font-black transition-all uppercase tracking-tighter ${
              isSubscriptionMode ? 'bg-village-green text-white shadow-sm' : 'text-stone-400'
            }`}
          >
            Daily Service
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isSubscriptionMode ? (
          <motion.div
            key="sub-info"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="bg-village-green/5 border border-village-green/10 rounded-xl p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-village-green/10 flex items-center justify-center text-xs">
                  🌾
                </div>
                <div>
                  <p className="text-[10px] font-black text-village-umber uppercase tracking-tight leading-none">
                    Fresh Morning Delivery
                  </p>
                  <p className="text-[9px] text-village-green font-bold mt-1">
                    Adds {"\u20B9"}{dailyPrice}/day to your basket
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 bg-village-green text-white px-2 py-1 rounded-lg shadow-sm shadow-village-green/10">
                <span className="text-[7px] font-black uppercase tracking-widest whitespace-nowrap">Bundle & Save</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="once-info"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="bg-stone-50 border border-stone-200/50 rounded-xl p-3 flex items-center gap-2.5"
          >
            <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 border border-stone-200">
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
              </svg>
            </div>
            <p className="text-[9px] text-stone-500 font-bold uppercase tracking-tight">
              Standard one-time purchase from the village store.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DailyServiceSelector;
