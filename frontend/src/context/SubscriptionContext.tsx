import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LocalSubscription, SubscriptionPlanId, SUBSCRIPTION_PLANS, SubscriptionItem } from '../types/subscription';

interface SubscriptionContextType {
  subscriptions: LocalSubscription[];
  dailyServiceCart: SubscriptionItem[];
  addToDailyServiceCart: (item: SubscriptionItem) => void;
  removeFromDailyServiceCart: (productId: string, variantId?: string) => void;
  clearDailyServiceCart: () => void;
  createSubscription: (planId: SubscriptionPlanId, deliveryTimeSlot: string) => void;
  updateSubscriptionStatus: (id: string, status: 'active' | 'paused' | 'cancelled') => void;
  removeSubscription: (id: string) => void;
  updateDailyServiceCartQuantity: (productId: string, quantity: number, variantId?: string) => void;
  calculateTotalPrice: (items: SubscriptionItem[], planId: SubscriptionPlanId) => { 
    totalPrice: number; 
    discountedPrice: number; 
    savings: number;
    days: number;
  };
}

const STORAGE_KEY = 'village_daily_services';
const CART_STORAGE_KEY = 'village_daily_service_cart';

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState<LocalSubscription[]>([]);
  const [dailyServiceCart, setDailyServiceCart] = useState<SubscriptionItem[]>([]);

  // Initialize from LocalStorage
  useEffect(() => {
    const savedSubs = localStorage.getItem(STORAGE_KEY);
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedSubs) {
      try {
        setSubscriptions(JSON.parse(savedSubs));
      } catch (err) {
        console.error('Failed to parse local subscriptions', err);
      }
    }
    if (savedCart) {
      try {
        setDailyServiceCart(JSON.parse(savedCart));
      } catch (err) {
        console.error('Failed to parse local daily service cart', err);
      }
    }
  }, []);

  // Sync back to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(dailyServiceCart));
  }, [dailyServiceCart]);

  const calculateTotalPrice = (items: SubscriptionItem[], planId: SubscriptionPlanId) => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[0];
    const totalDailyAmount = items.reduce((acc, item) => acc + (item.pricePerDay * item.quantity), 0);
    const rawTotal = totalDailyAmount * plan.days;
    const savings = rawTotal * plan.discount;
    const discountedPrice = rawTotal - savings;

    return {
      totalPrice: rawTotal,
      discountedPrice,
      savings,
      days: plan.days
    };
  };

  const addToDailyServiceCart = (item: SubscriptionItem) => {
    setDailyServiceCart(prev => {
      const existingIndex = prev.findIndex(p => p.productId === item.productId && p.variantId === item.variantId);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], quantity: next[existingIndex].quantity + item.quantity };
        return next;
      }
      return [...prev, item];
    });
  };

  const updateDailyServiceCartQuantity = (productId: string, quantity: number, variantId?: string) => {
    setDailyServiceCart(prev => {
      if (quantity <= 0) {
        return prev.filter(p => !(p.productId === productId && p.variantId === variantId));
      }
      return prev.map(p => {
        if (p.productId === productId && p.variantId === variantId) {
          return { ...p, quantity };
        }
        return p;
      });
    });
  };

  const removeFromDailyServiceCart = (productId: string, variantId?: string) => {
    setDailyServiceCart(prev => prev.filter(p => !(p.productId === productId && p.variantId === variantId)));
  };

  const clearDailyServiceCart = () => {
    setDailyServiceCart([]);
  };

  const createSubscription = (planId: SubscriptionPlanId, deliveryTimeSlot: string) => {
    if (dailyServiceCart.length === 0) return;

    const { discountedPrice, savings } = calculateTotalPrice(dailyServiceCart, planId);
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[0];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.days);

    const newSub: LocalSubscription = {
      id: `SUB_${Math.random().toString(36).substr(2, 9)}`,
      items: [...dailyServiceCart],
      planId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalCyclePrice: discountedPrice,
      savings,
      status: 'active',
      deliveryTimeSlot
    };

    setSubscriptions(prev => [newSub, ...prev]);
    clearDailyServiceCart();
  };

  const updateSubscriptionStatus = (id: string, status: 'active' | 'paused' | 'cancelled') => {
    setSubscriptions(prev => prev.map(sub => 
      sub.id === id ? { ...sub, status } : sub
    ));
  };

  const removeSubscription = (id: string) => {
    setSubscriptions(prev => prev.filter(sub => sub.id !== id));
  };

  return (
    <SubscriptionContext.Provider value={{ 
      subscriptions, 
      dailyServiceCart,
      addToDailyServiceCart,
      updateDailyServiceCartQuantity,
      removeFromDailyServiceCart,
      clearDailyServiceCart,
      createSubscription,
      updateSubscriptionStatus, 
      removeSubscription,
      calculateTotalPrice
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
