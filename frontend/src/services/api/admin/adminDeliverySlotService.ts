import api from '../config';

export interface DeliverySlot {
  _id: string;
  name: string;
  startTime: string;
  endTime: string;
  label: string;
  maxOrders: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliverySlotData {
  name: string;
  startTime: string;
  endTime: string;
  label?: string;
  maxOrders?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export const getDeliverySlots = async (): Promise<{ success: boolean; data: DeliverySlot[] }> => {
  const response = await api.get('/admin/delivery-slots');
  return response.data;
};

export const createDeliverySlot = async (data: CreateDeliverySlotData): Promise<{ success: boolean; data: DeliverySlot; message: string }> => {
  const response = await api.post('/admin/delivery-slots', data);
  return response.data;
};

export const updateDeliverySlot = async (id: string, data: Partial<CreateDeliverySlotData>): Promise<{ success: boolean; data: DeliverySlot; message: string }> => {
  const response = await api.put(`/admin/delivery-slots/${id}`, data);
  return response.data;
};

export const toggleDeliverySlotStatus = async (id: string, isActive: boolean): Promise<{ success: boolean; data: DeliverySlot; message: string }> => {
  const response = await api.patch(`/admin/delivery-slots/${id}/status`, { isActive });
  return response.data;
};

export const deleteDeliverySlot = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/admin/delivery-slots/${id}`);
  return response.data;
};

// Customer-facing: get active slots for checkout
export const getActiveDeliverySlots = async (): Promise<{ success: boolean; data: Pick<DeliverySlot, '_id' | 'name' | 'label' | 'startTime' | 'endTime'>[] }> => {
  const response = await api.get('/customer/delivery-slots');
  return response.data;
};
