export type SubscriptionPlanId = 'daily' | 'monthly' | 'quarterly' | 'yearly';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  days: number;
  discount: number;
  label: string;
}

export interface SubscriptionItem {
  productId: string;
  productName: string;
  productImage: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  pricePerDay: number; // Unit price
}

export interface LocalSubscription {
  id: string;
  items: SubscriptionItem[];
  planId: SubscriptionPlanId;
  startDate: string;
  endDate: string;
  totalCyclePrice: number;
  savings: number;
  status: 'active' | 'paused' | 'cancelled';
  deliveryTimeSlot: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: 'daily', name: '15 Days', days: 15, discount: 0.03, label: 'Fortnightly' },
  { id: 'monthly', name: '30 Days', days: 30, discount: 0.07, label: 'Monthly' },
  { id: 'quarterly', name: '90 Days', days: 90, discount: 0.12, label: 'Quarterly' },
  { id: 'yearly', name: '365 Days', days: 365, discount: 0.20, label: 'Yearly' },
];
