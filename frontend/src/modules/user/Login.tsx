import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOTP, verifyOTP } from '../../services/api/auth/customerAuthService';
import { useAuth } from '../../context/AuthContext';
import OTPInput from '../../components/OTPInput';
import Lottie from 'lottie-react';
import groceryAnimation from '../../../assets/animation/Grocery-animation.json';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (mobileNumber.length !== 10) return;

    setLoading(true);
    setError('');

    try {
      const response = await sendOTP(mobileNumber);
      if (response.sessionId) {
        setSessionId(response.sessionId);
      }
      setShowOTP(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate call. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = async (otp: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await verifyOTP(mobileNumber, otp, sessionId);
      if (response.success && response.data) {
        // Update auth context with user data
        login(response.data.token, {
          id: response.data.user.id,
          name: response.data.user.name,
          phone: response.data.user.phone,
          email: response.data.user.email,
          walletAmount: response.data.user.walletAmount,
          refCode: response.data.user.refCode,
          status: response.data.user.status,
        });
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-white flex flex-col items-center justify-center p-4 overflow-hidden fixed inset-0">

      {/* Main Card */}
      <div className="w-full max-w-md relative z-10">

        {/* Animation Section */}
        <div className="w-full bg-white p-4 pb-0 flex flex-col items-center">
          {/* Logo */}
          <div className="mb-1">
            <img
              src="/assets/village_basket-removebg-preview.png"
              alt="Village_basket"
              className="h-16 w-auto object-contain drop-shadow-sm"
            />
          </div>

          {/* Lottie Animation */}
          <div className="w-40 h-40 sm:w-48 sm:h-48">
            <Lottie animationData={groceryAnimation} loop={true} />
          </div>

          <h2 className="text-xl font-bold text-neutral-800 text-center mt-[-10px] mb-1">
            {showOTP ? 'Verification' : 'Welcome Back!'}
          </h2>
          <p className="text-neutral-500 text-center text-[13px] mb-4 px-6 leading-tight">
            {showOTP
              ? `Enter code sent to +91 ${mobileNumber}`
              : 'Groceries delivered in 15 mins. Login to continue.'}
          </p>
        </div>

        {/* Input Section */}
        <div className="px-6 pb-6">
          {!showOTP ? (
            <div className="space-y-3">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-neutral-400 font-medium text-base">+91</span>
                </div>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="block w-full pl-14 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-base font-medium text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all"
                  placeholder="Enter mobile number"
                  maxLength={10}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-xs text-red-600 animate-fadeIn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="12" cy="16" r="1" fill="currentColor" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                onClick={handleContinue}
                disabled={mobileNumber.length !== 10 || loading}
                className={`w-full py-3.5 rounded-xl font-bold text-base shadow-md hover:shadow-lg transform active:scale-95 transition-all duration-200 ${mobileNumber.length === 10 && !loading
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-white'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center scale-90">
                <OTPInput onComplete={handleOTPComplete} disabled={loading} />
              </div>

              {error && (
                <div className="text-center text-xs text-red-600 bg-red-50 py-1.5 px-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setShowOTP(false);
                    setError('');
                  }}
                  disabled={loading}
                  className="flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
                >
                  Change No.
                </button>
                <button
                  onClick={handleContinue}
                  disabled={loading}
                  className="flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                >
                  {loading ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-[10px] text-neutral-400">
              By continuing, you agree to our <br /> <a href="#" className="text-green-600 hover:underline">Terms</a> & <a href="#" className="text-green-600 hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-xs font-medium text-neutral-500 opacity-60 uppercase tracking-widest">
          Powered by Village Basket
        </p>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}