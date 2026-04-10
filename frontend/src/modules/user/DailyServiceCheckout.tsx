import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscription } from '../../context/SubscriptionContext';
import { useToast } from '../../context/ToastContext';
import { SUBSCRIPTION_PLANS, SubscriptionPlanId } from '../../types/subscription';
import Button from '../../components/ui/button';

const DailyServiceCheckout: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { 
    dailyServiceCart, 
    removeFromDailyServiceCart, 
    updateDailyServiceCartQuantity,
    calculateTotalPrice,
    createSubscription 
  } = useSubscription();

  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>('monthly');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('6:00 AM - 8:00 AM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (dailyServiceCart.length === 0) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-4xl mb-4 border border-stone-100">
          🧺
        </div>
        <h2 className="text-village-umber font-black text-sm uppercase tracking-widest mb-2">
          Your Daily Basket is Empty
        </h2>
        <p className="text-stone-400 text-[10px] font-bold uppercase tracking-tight mb-8 max-w-[200px]">
          Add some village fresh productions to start your service.
        </p>
        <Button onClick={() => navigate('/user')} className="bg-village-green text-white px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
          Go To Store
        </Button>
      </div>
    );
  }

  const { totalPrice, discountedPrice, savings, days } = calculateTotalPrice(dailyServiceCart, selectedPlanId);
  const dailyTotal = dailyServiceCart.reduce((sum, item) => sum + (item.pricePerDay * item.quantity), 0);

  const handleSubscribe = async () => {
    setIsSubmitting(true);
    try {
      // Simulate API call or just local creation
      createSubscription(selectedPlanId, selectedTimeSlot);
      showToast('Daily Service Started Successfully!', 'success');
      navigate('/user/account', { state: { activeTab: 'subscriptions' } });
    } catch (err) {
      showToast('Failed to start service', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-32">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-4 py-4 sticky top-0 z-30 shadow-sm flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 text-village-umber">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-village-umber font-black text-xs uppercase tracking-widest leading-none">
            Daily Service Checkout
          </h1>
          <p className="text-stone-400 text-[9px] font-bold mt-1 uppercase tracking-tight">
            Finalize your fresh bundle
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Production List */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-stone-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black text-village-umber uppercase tracking-widest">Your Selections</h3>
            <span className="bg-stone-50 text-stone-400 text-[8px] font-black px-2 py-0.5 rounded-full border border-stone-100">
              {dailyServiceCart.length} Productions
            </span>
          </div>
          
          <div className="space-y-3">
            {dailyServiceCart.map((item) => (
              <motion.div 
                layout
                key={`${item.productId}-${item.variantId}`}
                className="flex items-center gap-3 bg-stone-50/50 p-2 rounded-2xl border border-stone-100"
              >
                <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-stone-100 flex-shrink-0">
                  <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[10px] font-black text-village-umber uppercase tracking-tight truncate">
                    {item.productName}
                  </h4>
                  <p className="text-[9px] text-stone-400 font-bold uppercase tracking-tighter">
                    {item.variantName}
                  </p>
                  <p className="text-[9px] text-village-green font-black mt-0.5">{"\u20B9"}{item.pricePerDay.toLocaleString('en-IN')}/day</p>
                </div>

                <div className="flex items-center gap-2 bg-white rounded-xl border border-stone-100 p-1 shadow-sm">
                  <button 
                    onClick={() => updateDailyServiceCartQuantity(item.productId, item.quantity - 1, item.variantId)}
                    className="w-6 h-6 flex items-center justify-center text-village-umber/50 hover:text-red-500 transition-colors"
                  >
                    {item.quantity === 1 ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    ) : (
                      <span className="text-sm font-bold">−</span>
                    )}
                  </button>
                  <span className="text-[10px] font-black text-village-umber min-w-[12px] text-center">
                    {item.quantity}
                  </span>
                  <button 
                    onClick={() => updateDailyServiceCartQuantity(item.productId, item.quantity + 1, item.variantId)}
                    className="w-6 h-6 flex items-center justify-center text-village-green font-bold hover:scale-110 transition-transform"
                  >
                    <span className="text-sm font-bold">+</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-4 pt-3 border-t border-stone-100 flex justify-between items-center">
            <span className="text-[9px] font-black text-stone-400 uppercase">Daily Combined</span>
            <span className="text-xs font-black text-village-umber tracking-tight">{"\u20B9"}{dailyTotal.toLocaleString('en-IN')}/day</span>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-black text-village-umber px-2 uppercase tracking-widest">Select Your Plan</h3>
          <div className="grid grid-cols-2 gap-2">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const { savings: planSavings, discountedPrice: planDiscounted } = calculateTotalPrice(dailyServiceCart, plan.id);
              const isSelected = selectedPlanId === plan.id;
              
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-3 rounded-3xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-village-green bg-village-green/5 ring-4 ring-village-green/10'
                      : 'border-white bg-white hover:border-stone-100 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className={`text-[9px] font-black uppercase tracking-tighter ${isSelected ? 'text-village-green' : 'text-stone-400'}`}>
                      {plan.label}
                    </span>
                    {plan.discount > 0 && (
                      <span className="bg-orange-100 text-orange-600 text-[8px] font-black px-1.5 rounded-full">
                        {Math.round(plan.discount * 100)}% OFF
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-black text-village-umber">
                    {"\u20B9"}{Math.round(planDiscounted).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[8px] text-stone-500 font-bold mt-0.5 truncate">
                    SAVE \u20B9{Math.round(planSavings).toLocaleString('en-IN')} OVER {plan.days}D
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Delivery Slot */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-stone-100">
          <h3 className="text-[10px] font-black text-village-umber mb-3 uppercase tracking-widest">Delivery Time Slot</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['6:00 AM - 8:00 AM', '8:00 AM - 10:00 AM', '5:00 PM - 7:00 PM'].map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedTimeSlot(slot)}
                className={`px-4 py-2 rounded-2xl border-2 whitespace-nowrap text-[9px] font-black uppercase tracking-tight transition-all ${
                  selectedTimeSlot === slot 
                    ? 'border-village-umber bg-village-umber text-white' 
                    : 'border-stone-100 text-stone-400'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Commitment Summary */}
        <div className="bg-stone-900 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
               <path d="M12 3L4 9v12h16V9l-8-6zm0 2.5L18 10v9H6v-9l6-4.5z" />
             </svg>
          </div>
          <div className="relative z-10">
            <h3 className="text-[10px] font-black text-village-green uppercase tracking-widest mb-4">Total Service Value</h3>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl font-black">{"\u20B9"}{Math.round(discountedPrice).toLocaleString('en-IN')}</span>
              <span className="text-xs text-white/40 line-through">{"\u20B9"}{Math.round(totalPrice).toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[10px] text-white/60 font-medium uppercase tracking-widest">
              Secured fresh for {days} days
            </p>
            
            <div className="mt-6 flex items-center justify-between bg-white/10 rounded-2xl p-3 border border-white/10">
              <div>
                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">You Save Today</p>
                <p className="text-sm font-black text-village-green">{"\u20B9"}{Math.round(savings).toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Slot Confirmed</p>
                <p className="text-[10px] font-black">{selectedTimeSlot}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Final Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-stone-100 z-40">
        <button
          onClick={handleSubscribe}
          disabled={isSubmitting}
          className="w-full bg-village-green text-white py-4 rounded-2xl shadow-lg shadow-village-green/20 font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              SUBSCRIBE & START SERVICE
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DailyServiceCheckout;
