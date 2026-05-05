import api, { setAuthToken, removeAuthToken, setUserData } from '../config';

export interface SendOTPResponse {
  success: boolean;
  message: string;
  sessionId?: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      name: string;
      phone: string;
      email: string;
      walletAmount: number;
      refCode: string;
      status: string;
      customerType: 'retail' | 'wholesale';
      userType: 'Customer' | 'Admin' | 'Seller' | 'Delivery';
    };
    isNewUser?: boolean;
  };
}

/**
 * Send SMS OTP to customer mobile number
 */
export const sendOTP = async (mobile: string, isSignUp: boolean = false, email?: string): Promise<SendOTPResponse> => {
  const response = await api.post<SendOTPResponse>('/auth/customer/send-sms-otp', { mobile, isSignUp, email });
  return response.data;
};

/**
 * Verify SMS OTP and login customer
 * Auto-creates customer if not exists
 */
export const verifyOTP = async (
  mobile: string, 
  otp: string, 
  sessionId?: string, 
  customerType?: string,
  name?: string,
  email?: string
): Promise<VerifyOTPResponse> => {
  const response = await api.post<VerifyOTPResponse>('/auth/customer/verify-sms-otp', { 
    mobile, 
    otp, 
    sessionId,
    customerType,
    name,
    email
  });

  if (response.data.success && response.data.data.token) {
    setAuthToken(response.data.data.token, 'customer');
    
    // Ensure all identifying fields are stored for price calculations
    const userData = {
      ...response.data.data.user,
      // Fallbacks to ensure consistency with priceUtils.ts checks
      customerType: response.data.data.user.customerType || 'retail',
      accountType: response.data.data.user.customerType || 'retail',
      userType: 'Customer'
    };
    setUserData(userData, 'customer');
  }

  return response.data;
};

/**
 * Logout customer
 */
export const logout = (): void => {
  removeAuthToken('customer');
};

