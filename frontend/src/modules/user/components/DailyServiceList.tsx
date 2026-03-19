import React from 'react';
import { motion } from 'framer-motion';
import { useSubscription } from '../../../context/SubscriptionContext';
import { SUBSCRIPTION_PLANS } from '../../../types/subscription';

const DailyServiceList: React.FC = () => {
  const { subscriptions, updateSubscriptionStatus, removeSubscription } = useSubscription();

  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-6 border border-stone-100">
           <svg className="w-10 h-10 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
        </div>
        <h3 className="text-village-umber font-black text-lg uppercase tracking-widest leading-none">
          No Daily Services
        </h3>
        <p className="text-stone-400 text-xs mt-3 max-w-[240px] font-medium leading-relaxed">
          You haven't subscribed to any daily essentials yet. Subscribe to your favorite items for hassle-free delivery!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {subscriptions.map((sub) => {
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === sub.planId);
        const daysLeft = Math.max(0, Math.ceil((new Date(sub.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
        const progress = Math.min(100, (((plan?.days || 1) - daysLeft) / (plan?.days || 1)) * 100);

        return (
          <motion.div
            key={sub.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] border border-stone-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-1">
                    Subscription Bundle
                  </h4>
                  <p className="text-xs font-black text-village-umber uppercase tracking-tight">
                    {sub.items.length} {sub.items.length === 1 ? 'Production' : 'Productions'}
                  </p>
                </div>
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                  sub.status === 'active' ? 'bg-village-green/10 text-village-green' : 
                  sub.status === 'paused' ? 'bg-orange-100 text-orange-600' : 'bg-stone-100 text-stone-400'
                }`}>
                  {sub.status}
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-3 mb-5">
                {sub.items.map((item, idx) => (
                  <div key={`${item.productId}-${idx}`} className="flex items-center gap-3 bg-stone-50/50 p-2 rounded-2xl border border-stone-100/50">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-stone-100 bg-white flex-shrink-0">
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-[10px] font-black text-village-umber uppercase tracking-tight truncate">
                        {item.productName}
                      </h5>
                      <p className="text-[9px] text-stone-400 font-bold uppercase tracking-tighter">
                        {item.variantName} • {item.quantity} Units
                      </p>
                    </div>
                    <p className="text-[10px] font-black text-village-green">₹{item.pricePerDay}</p>
                  </div>
                ))}
              </div>
              
              {/* Progress Bar */}
              <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-100/50">
                 <div className="flex justify-between items-end mb-2">
                    <span className="text-[9px] font-black text-village-umber uppercase tracking-widest">
                      Cycle Progress
                    </span>
                    <span className="text-[10px] font-black text-village-green">
                      {daysLeft} days left
                    </span>
                 </div>
                 <div className="h-1.5 bg-white rounded-full overflow-hidden border border-stone-100">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-village-green shadow-[0_0_8px_rgba(74,124,89,0.3)]"
                    />
                 </div>
              </div>
            </div>

            <div className="bg-stone-50/50 px-5 py-3.5 flex items-center justify-between border-t border-stone-100/50">
               <div>
                  <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest leading-none">Total Cycle Cost</p>
                  <p className="text-sm font-black text-village-umber mt-1.5">₹{Math.round(sub.totalCyclePrice).toLocaleString('en-IN')}</p>
               </div>
               <div className="flex gap-4">
                 {sub.status === 'active' ? (
                   <button 
                    onClick={() => updateSubscriptionStatus(sub.id, 'paused')}
                    className="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:scale-105 transition-transform"
                   >
                     Pause
                   </button>
                 ) : sub.status === 'paused' ? (
                   <button 
                    onClick={() => updateSubscriptionStatus(sub.id, 'active')}
                    className="text-[10px] font-black text-village-green uppercase tracking-widest hover:scale-105 transition-transform"
                   >
                     Resume
                   </button>
                 ) : null}
                 <button 
                  onClick={() => removeSubscription(sub.id)}
                  className="text-[10px] font-black text-stone-400 uppercase tracking-widest hover:text-red-500 transition-colors"
                 >
                   Stop
                 </button>
               </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default DailyServiceList;
