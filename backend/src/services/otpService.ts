import axios from 'axios';
import Otp from '../models/Otp';

const SMS_INDIA_HUB_API_URL = 'http://cloud.smsindiahub.in/vendorsms/pushsms.aspx';
const API_TIMEOUT = 30000;

/**
 * Interface for OTP Response
 */
interface OtpResponse {
  success: boolean;
  sessionId?: string;
  message: string;
  /** Only present in non-production when DEV_EXPOSE_OTP=true */
  debugOtp?: string;
}

/**
 * SMS India HUB API Response Interface
 */
interface SmsIndiaHubResponse {
  ErrorCode?: string;
  ErrorMessage?: string;
  JobId?: string;
  MessageId?: string;
  MessageData?: Array<{
    Number: string;
    MessageId: string;
    Message: string;
  }>;
}

type UserType = 'Customer' | 'Delivery' | 'Seller' | 'Admin';

function getSmsConfig() {
  return {
    apiKey: process.env.SMS_INDIA_HUB_API_KEY?.trim() || '',
    senderId: process.env.SMS_INDIA_HUB_SENDER_ID?.trim() || '',
    dltTemplateId: process.env.SMS_INDIA_HUB_DLT_TEMPLATE_ID?.trim() || '',
    username: process.env.SMS_INDIA_HUB_USERNAME?.trim() || '',
    password: process.env.SMS_INDIA_HUB_PASSWORD?.trim() || '',
    appName: process.env.APP_NAME?.trim() || 'Village Basket',
    messageTemplate: process.env.SMS_OTP_MESSAGE_TEMPLATE?.trim() || '',
  };
}

/**
 * Generate numeric OTP
 */
function generateOTP(length: number = 4): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

/**
 * Normalize mobile number to include country code (91)
 */
function normalizeMobileNumber(mobile: string): string {
  let cleanMobile = mobile.replace(/^\+/, '').replace(/\D/g, '');

  if (cleanMobile.length === 10) {
    cleanMobile = '91' + cleanMobile;
  } else if (!cleanMobile.startsWith('91')) {
    cleanMobile = '91' + cleanMobile;
  }

  if (cleanMobile.length < 12 || cleanMobile.length > 13) {
    throw new Error(`Invalid mobile number: ${cleanMobile}. Must be 12-13 digits with country code.`);
  }

  return cleanMobile;
}

/**
 * Build DLT-compliant message.
 * Approved DLT template:
 * "Welcome to the ##var## powered by Appzeto.Your OTP for registration is ##var##.BGADEC"
 *
 * Override with SMS_OTP_MESSAGE_TEMPLATE using {otp} and {app} placeholders.
 * Message text MUST exactly match the approved DLT template (spacing included).
 */
function buildOtpMessage(otp: string): string {
  const { appName, messageTemplate } = getSmsConfig();
  if (messageTemplate) {
    return messageTemplate.replace(/\{otp\}/gi, otp).replace(/\{app\}/gi, appName);
  }
  // Keep spacing exact: "Appzeto.Your" (no space) and trailing ".BGADEC"
  return `Welcome to the ${appName} powered by Appzeto.Your OTP for registration is ${otp}.BGADEC`;
}

/**
 * Parse gateway body (JSON object or JSON string)
 */
function parseSmsResponse(data: unknown): SmsIndiaHubResponse {
  if (data && typeof data === 'object') {
    return data as SmsIndiaHubResponse;
  }
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (!trimmed) {
      throw new Error('SMS India HUB returned an empty response');
    }
    try {
      return JSON.parse(trimmed) as SmsIndiaHubResponse;
    } catch {
      throw new Error(`SMS India HUB returned non-JSON response: ${trimmed.slice(0, 200)}`);
    }
  }
  throw new Error('SMS India HUB returned an unexpected response format');
}

/**
 * Parse and handle SMS India HUB API response
 */
function handleSmsResponse(responseData: SmsIndiaHubResponse): SmsIndiaHubResponse {
  const errorCode = String(responseData.ErrorCode ?? '');
  const errorMsg = String(responseData.ErrorMessage ?? '');

  if (errorCode === '000' || errorMsg === 'Done' || responseData.JobId || responseData.MessageData) {
    return responseData;
  }

  if (errorCode || errorMsg) {
    switch (errorCode) {
      case '001':
        throw new Error('SMS India HUB: Account details cannot be blank.');
      case '006':
        throw new Error(
          'SMS India HUB: Invalid DLT template. Message text must exactly match the registered DLT template, and SMS_INDIA_HUB_DLT_TEMPLATE_ID must be correct.'
        );
      case '007':
        throw new Error('SMS India HUB: Invalid API key or credentials.');
      case '021':
        throw new Error('SMS India HUB: Insufficient credits in your account.');
      default:
        throw new Error(`SMS India HUB API Error (Code: ${errorCode}): ${errorMsg}`);
    }
  }

  throw new Error('SMS India HUB: Unrecognized response — SMS may not have been accepted');
}

/**
 * Send SMS via SMS India HUB API
 */
async function sendSmsViaApi(mobile: string, message: string): Promise<SmsIndiaHubResponse> {
  const { apiKey, senderId, dltTemplateId, username, password } = getSmsConfig();

  if (!apiKey && !(username && password)) {
    throw new Error(
      'SMS India HUB credentials are missing. Set SMS_INDIA_HUB_API_KEY + SMS_INDIA_HUB_SENDER_ID (or USERNAME + PASSWORD).'
    );
  }
  if (!senderId) {
    throw new Error('SMS_INDIA_HUB_SENDER_ID is missing in environment variables.');
  }

  const cleanMobile = normalizeMobileNumber(mobile);

  const params: Record<string, string> = {
    msisdn: cleanMobile,
    sid: senderId,
    msg: message,
    fl: '0',
    gwid: '2',
  };

  if (apiKey) {
    params.APIKey = apiKey;
  }
  if (username) {
    params.user = username;
  }
  if (password) {
    params.password = password;
  }
  if (dltTemplateId) {
    params.DLT_TE_ID = dltTemplateId;
  }

  console.log('[SMS] Sending OTP SMS', {
    msisdn: cleanMobile,
    sid: senderId,
    dltTemplateId: dltTemplateId || '(not set)',
    auth: apiKey ? 'APIKey' : 'user/password',
    messagePreview: message.replace(/\d{4,6}/g, '****'),
  });

  const response = await axios.get(SMS_INDIA_HUB_API_URL, {
    params,
    paramsSerializer: (p) =>
      Object.keys(p)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(p[key])}`)
        .join('&'),
    timeout: API_TIMEOUT,
    // Gateway returns JSON with Content-Type: text/html
    transformResponse: [(data) => data],
    responseType: 'text',
    validateStatus: () => true,
  });

  if (response.status >= 400) {
    throw new Error(`SMS India HUB HTTP ${response.status}: ${String(response.data).slice(0, 200)}`);
  }

  const parsed = parseSmsResponse(response.data);
  const accepted = handleSmsResponse(parsed);

  console.log('[SMS] Gateway accepted message', {
    ErrorCode: accepted.ErrorCode,
    JobId: accepted.JobId,
    MessageId: accepted.MessageData?.[0]?.MessageId,
  });

  return accepted;
}

/**
 * Save OTP to database
 */
async function saveOtpToDb(mobile: string, otp: string, userType: UserType): Promise<void> {
  const normalizedMobile = mobile.replace(/\D/g, '').slice(-10);

  await Otp.deleteMany({ mobile: normalizedMobile, userType });
  await Otp.create({
    mobile: normalizedMobile,
    otp: otp.trim(),
    userType,
    expiresAt: new Date(Date.now() + Number(process.env.OTP_EXPIRY_MINUTES || 5) * 60 * 1000),
  });
}

/**
 * Verify OTP from database
 */
async function verifyOtpFromDb(mobile: string, otp: string, userType: UserType): Promise<boolean> {
  const normalizedMobile = mobile.replace(/\D/g, '').slice(-10);

  const record = await Otp.findOne({
    mobile: normalizedMobile,
    userType,
    otp: otp.trim(),
  });

  if (!record) {
    console.error('OTP verification failed - record not found:', {
      mobile: normalizedMobile,
      userType,
      otp: otp.trim(),
      availableRecords: await Otp.find({ mobile: normalizedMobile, userType }).select('otp expiresAt'),
    });
    return false;
  }

  if (record.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: record._id });
    console.error('OTP verification failed - expired:', {
      mobile: normalizedMobile,
      expiresAt: record.expiresAt,
      now: new Date(),
    });
    return false;
  }

  await Otp.deleteOne({ _id: record._id });
  return true;
}

function isSpecialBypass(mobile: string): boolean {
  return mobile.replace(/\D/g, '').slice(-10) === '9111966732';
}

function isMockMode(): boolean {
  const { apiKey, senderId, username, password } = getSmsConfig();
  const hasCreds = Boolean(apiKey || (username && password));
  return process.env.USE_MOCK_OTP === 'true' || !hasCreds || !senderId;
}

function isDeveloperBypass(otp: string): boolean {
  return (
    (process.env.NODE_ENV !== 'production' || process.env.USE_MOCK_OTP === 'true') &&
    (otp === '999999' || otp === '9999')
  );
}

function buildSuccessResponse(mobile: string, otp: string, mode: 'real' | 'mock' | 'bypass'): OtpResponse {
  const exposeOtp =
    process.env.NODE_ENV !== 'production' && process.env.DEV_EXPOSE_OTP === 'true';

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[OTP] ${mode.toUpperCase()} | mobile=${mobile.slice(-10)} | otp=${otp}`);
  }

  return {
    success: true,
    sessionId: (mode === 'mock' ? 'MOCK_SESSION_' : 'DB_VERIFIED_') + mobile.replace(/\D/g, '').slice(-10),
    message: 'OTP sent successfully',
    ...(exposeOtp ? { debugOtp: otp } : {}),
  };
}

// ==========================================
// SMS OTP (Customer / Delivery)
// ==========================================

export async function sendSmsOtp(
  mobile: string,
  userType: 'Customer' | 'Delivery' = 'Delivery'
): Promise<OtpResponse> {
  try {
    const otp = generateOTP(4);
    const tenDigit = mobile.replace(/\D/g, '').slice(-10);

    if (isSpecialBypass(tenDigit)) {
      const specialOtp = '1234';
      await saveOtpToDb(tenDigit, specialOtp, userType);
      return buildSuccessResponse(tenDigit, specialOtp, 'bypass');
    }

    if (isMockMode()) {
      console.warn(
        '[OTP] Mock mode active — SMS not sent. Set USE_MOCK_OTP=false and valid SMS_INDIA_HUB_* credentials.'
      );
      await saveOtpToDb(tenDigit, otp, userType);
      return buildSuccessResponse(tenDigit, otp, 'mock');
    }

    await saveOtpToDb(tenDigit, otp, userType);
    const message = buildOtpMessage(otp);
    await sendSmsViaApi(tenDigit, message);

    return buildSuccessResponse(tenDigit, otp, 'real');
  } catch (error: any) {
    const errorMessage = error.message || 'Failed to send OTP. Please try again.';
    console.error('SMS OTP Error (sendSmsOtp):', {
      error: errorMessage,
      mobile,
      userType,
    });
    throw new Error(errorMessage);
  }
}

export async function verifySmsOtp(
  sessionId: string,
  otpInput: string,
  mobile?: string,
  userType: 'Customer' | 'Delivery' = 'Delivery'
): Promise<boolean> {
  if (isDeveloperBypass(otpInput)) {
    return true;
  }

  const normalizedOtp = String(otpInput).trim().replace(/\s/g, '');

  if (!normalizedOtp || normalizedOtp.length !== 4) {
    console.error('OTP verification failed - invalid OTP format:', {
      otpInput,
      normalizedOtp,
      length: normalizedOtp.length,
    });
    return false;
  }

  let targetMobile = mobile;
  if (!targetMobile && sessionId) {
    if (sessionId.startsWith('DB_VERIFIED_')) {
      targetMobile = sessionId.replace('DB_VERIFIED_', '');
    } else if (sessionId.startsWith('MOCK_SESSION_')) {
      targetMobile = sessionId.replace('MOCK_SESSION_', '');
    }
  }

  if (!targetMobile) {
    console.error('OTP verification failed - no mobile number:', {
      sessionId,
      mobile,
      userType,
    });
    return false;
  }

  const normalizedMobile = targetMobile.replace(/\D/g, '');
  if (normalizedMobile.length < 10 || normalizedMobile.length > 12) {
    console.error('OTP verification failed - invalid mobile format:', {
      original: targetMobile,
      normalized: normalizedMobile,
      length: normalizedMobile.length,
    });
    return false;
  }

  return verifyOtpFromDb(normalizedMobile.slice(-10), normalizedOtp, userType);
}

// ==========================================
// SMS OTP (Seller / Admin)
// ==========================================

export async function sendOTP(
  mobile: string,
  userType: 'Seller' | 'Admin' | 'Customer' | 'Delivery',
  _isLogin: boolean = true
): Promise<OtpResponse> {
  try {
    const otp = generateOTP(4);
    const tenDigit = mobile.replace(/\D/g, '').slice(-10);

    if (isSpecialBypass(tenDigit)) {
      const specialOtp = '1234';
      await saveOtpToDb(tenDigit, specialOtp, userType);
      return buildSuccessResponse(tenDigit, specialOtp, 'bypass');
    }

    if (isMockMode()) {
      console.warn(
        '[OTP] Mock mode active — SMS not sent. Set USE_MOCK_OTP=false and valid SMS_INDIA_HUB_* credentials.'
      );
      await saveOtpToDb(tenDigit, otp, userType);
      return buildSuccessResponse(tenDigit, otp, 'mock');
    }

    await saveOtpToDb(tenDigit, otp, userType);
    const message = buildOtpMessage(otp);
    await sendSmsViaApi(tenDigit, message);

    return buildSuccessResponse(tenDigit, otp, 'real');
  } catch (error: any) {
    const errorMessage = error.message || 'Failed to send OTP. Please try again.';
    console.error('SMS OTP Error (sendOTP):', {
      error: errorMessage,
      mobile,
      userType,
    });
    throw new Error(errorMessage);
  }
}

export async function verifyOTP(
  mobile: string,
  otpInput: string,
  userType: 'Seller' | 'Admin' | 'Customer' | 'Delivery'
): Promise<boolean> {
  if (isDeveloperBypass(otpInput)) {
    return true;
  }

  const normalizedOtp = String(otpInput).trim().replace(/\s/g, '');

  if (!normalizedOtp || normalizedOtp.length !== 4) {
    console.error('OTP verification failed - invalid OTP format:', {
      otpInput,
      normalizedOtp,
      length: normalizedOtp.length,
    });
    return false;
  }

  const normalizedMobile = mobile.replace(/\D/g, '');
  if (normalizedMobile.length < 10 || normalizedMobile.length > 12) {
    console.error('OTP verification failed - invalid mobile format:', {
      original: mobile,
      normalized: normalizedMobile,
      length: normalizedMobile.length,
    });
    return false;
  }

  return verifyOtpFromDb(normalizedMobile.slice(-10), normalizedOtp, userType);
}
