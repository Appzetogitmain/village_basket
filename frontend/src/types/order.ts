import { CartItem } from './cart';

export type OrderStatus = 'Received' | 'Accepted' | 'Pending' | 'Processed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Rejected' | 'Returned' | 'On the way';

export interface OrderAddress {
  name: string;
  phone: string;
  flat: string;
  street: string;
  address?: string; // Add address field for backend compat
  city: string;
  state?: string;
  pincode: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  id?: string;
  _id?: string;
}

export interface OrderFees {
  platformFee?: number;
  deliveryFee?: number;
}

/** @deprecated Use DeliverySlotSelection */
export type DeliveryShift = 'morning' | 'evening';

export interface DeliverySlotSelection {
  slotId: string;
  label: string;        // e.g., "7 AM - 10 AM"
  timeRange: string;    // same as label for backend
  name: string;         // e.g., "Morning Slot"
}

export interface Order {
  id: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  fees: OrderFees;
  totalAmount: number;
  address: OrderAddress;
  status: OrderStatus;
  paymentMethod?: string;
  paymentStatus?: "Pending" | "Paid" | "Failed" | "Refunded";
  createdAt: string;
  tipAmount?: number;
  donationAmount?: number;
  gstin?: string;
  couponCode?: string;
  giftPackaging?: boolean;
  /** @deprecated Use deliverySlot */
  deliveryShift?: DeliveryShift;
  deliverySlot?: DeliverySlotSelection;
}



