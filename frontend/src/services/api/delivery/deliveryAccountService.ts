import api from "../config";
import { ApiResponse } from "../admin/types";

/**
 * Delete current delivery boy account (soft delete)
 */
export const selfDeleteDeliveryAccount = async (): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>("/delivery/account");
    return response.data;
};
