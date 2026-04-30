import api from './config';

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  dateOfBirth?: string;
  registrationDate: string;
  status: string;
  refCode: string;
  walletAmount: number;
  totalOrders: number;
  userType: 'Customer';
  customerType: 'retail' | 'wholesale';
}

export interface WalletTransaction {
  _id: string;
  amount: number;
  type: 'Credit' | 'Debit';
  description: string;
  status: string;
  reference: string;
  createdAt: string;
  relatedOrder?: string;
}

export interface GetWalletTransactionsResponse {
  success: boolean;
  data: WalletTransaction[];
}

export interface DeliveryConfig {
  isDistanceBased: boolean;
  baseCharge: number;
  baseDistance: number;
  kmRate: number;
  deliveryBoyKmRate?: number;
  googleMapsKey?: string;
}

export interface AppDeliverySettings {
  deliveryConfig: DeliveryConfig;
  platformFee: number;
  deliveryCharges: number;
  freeDeliveryThreshold: number;
}

export interface GetProfileResponse {
  success: boolean;
  message: string;
  data: CustomerProfile;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
  dateOfBirth?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: CustomerProfile;
}

/**
 * Get customer profile
 */
export const getProfile = async (): Promise<GetProfileResponse> => {
  const response = await api.get<GetProfileResponse>('/customer/profile');
  return response.data;
};

/**
 * Update customer profile
 */
export const updateProfile = async (data: UpdateProfileData): Promise<UpdateProfileResponse> => {
  const response = await api.put<UpdateProfileResponse>('/customer/profile', data);
  return response.data;
};

/**
 * Get wallet transactions
 */
export const getWalletTransactions = async (): Promise<GetWalletTransactionsResponse> => {
  const response = await api.get<GetWalletTransactionsResponse>('/customer/wallet/transactions');
  return response.data;
};

/**
 * Get delivery configuration settings
 */
export const getDeliveryConfig = async (): Promise<{ success: boolean; data: AppDeliverySettings }> => {
  const response = await api.get<{ success: boolean; data: AppDeliverySettings }>('/customer/delivery-config');
  return response.data;
};


export const selfDeleteCustomerAccount = async () => {
  const response = await api.delete("/customers/account");
  return response.data;
};
