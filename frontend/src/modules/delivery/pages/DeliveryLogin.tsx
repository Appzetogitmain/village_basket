import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOTP, verifyOTP } from '../../../services/api/auth/deliveryAuthService';
import OTPInput from '../../../components/OTPInput';
import { useAuth } from '../../../context/AuthContext';
import { removeAuthToken } from '../../../services/api/config';
import villageBasketLogo from '@assets/village_basket-removebg-preview.png';
import VillageLoader from '../../../components/VillageLoader';

export default function DeliveryLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNotRegistered, setIsNotRegistered] = useState(false);

  // Clear any existing token on mount to prevent role conflicts
  useEffect(() => {
    removeAuthToken();
  }, []);

  const handleMobileLogin = async () => {
    if (mobileNumber.length !== 10) return;

    setLoading(true);
    setError('');
    setIsNotRegistered(false);

    try {
      const response = await sendOTP(mobileNumber);
      if (response.success && response.sessionId) {
        setSessionId(response.sessionId);
        setShowOTP(true);
      } else {
        setError(response.message || 'Failed to initiate OTP');
      }
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message || 'Failed to send OTP. Please try again.';

      setError(message);

      // Check for 400 Bad Request specific to user not found (or based on message content)
      if (status === 400 && (message.toLowerCase().includes('not found') || message.toLowerCase().includes('register'))) {
        setIsNotRegistered(true);
      }
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
        // Update auth context
        login(response.data.token, {
          ...response.data.user,
          userType: 'Delivery'
        });
        navigate('/delivery');
      }
    } catch (err: any) {
      // Also handle 401 Unauthorized for verify step
      const message = err.response?.data?.message || 'Invalid OTP. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col items-center justify-center px-6 relative font-poppins"
      style={{
        backgroundColor: 'var(--village-cream, #FAF7F2)',
        backgroundImage: `linear-gradient(rgba(250, 247, 242, 0.88), rgba(250, 247, 242, 0.88)), url('/assets/delivery_bg_pattern.png')`,
        backgroundRepeat: 'repeat',
        backgroundSize: '320px',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Village Loader Overlay */}


      {/* Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('/assets/natural-paper.png')] z-0"></div>

      {/* Login Card */}
      <div className="w-full max-w-[340px] village-card paper-texture organic-radius shadow-2xl shadow-stone-200/50 p-0 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500">
        {/* Header Section */}
        <div className="relative pt-12 pb-10 px-8 text-center bg-[#8B3D28] overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/assets/natural-paper.png')]"></div>
          <div className="absolute -top-10 -left-10 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl p-3 flex items-center justify-center mb-6 border border-white/20 transform hover:scale-105 transition-transform duration-500 group">
              <img
                src={villageBasketLogo}
                alt="Village Basket"
                className="w-full h-full object-contain group-hover:rotate-6 transition-transform"
              />
            </div>

            <h1 className="text-[16px] font-black text-white uppercase tracking-[0.25em] mb-2 leading-none italic">
              PARTNER HUB
            </h1>
            <div className="inline-block bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 mt-1">
              <p className="text-white/60 text-[8px] font-black uppercase tracking-[0.3em] leading-none">
                Strategic Logistics
              </p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-8 space-y-6">
          {!showOTP ? (
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-village-umber uppercase tracking-[0.15em] mb-2.5 opacity-60">
                  Mobile Number
                </label>
                <div className="flex items-center bg-stone-50/50 border border-stone-200 rounded-2xl overflow-hidden focus-within:border-[#8B3D28] focus-within:ring-4 focus-within:ring-[#8B3D28]/5 transition-all">
                  <div className="px-4 py-3 text-[11px] font-black text-stone-500 border-r border-stone-200 bg-stone-100/50">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Ten digit number"
                    className="flex-1 px-4 py-3 text-[11px] font-black placeholder:text-stone-300 focus:outline-none bg-transparent text-village-umber"
                    maxLength={10}
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="text-[9px] font-black text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 flex flex-col gap-2 uppercase tracking-tight">
                  <div className="flex gap-2 items-center">
                    <div className="w-1 h-1 rounded-full bg-red-600"></div>
                    <span>{error}</span>
                  </div>
                  {isNotRegistered && (
                    <button
                      onClick={() => navigate('/delivery/signup')}
                      className="text-[8px] font-black text-white bg-red-600 hover:bg-red-700 py-2 px-4 rounded-lg self-start transition-all uppercase tracking-widest"
                    >
                      Register Now
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={handleMobileLogin}
                disabled={mobileNumber.length !== 10 || loading}
                className={`w-full py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-stone-200 ${mobileNumber.length === 10 && !loading
                  ? 'bg-[#8B3D28] text-white hover:bg-[#6D2E1D] active:scale-[0.97]'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
              >
                {loading ? 'Processing...' : 'Request OTP'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-[10px] font-black text-village-umber/50 uppercase tracking-widest mb-1.5">
                  Confirm the code sent to
                </p>
                <p className="text-[12px] font-black text-village-umber tracking-wider">+91 {mobileNumber}</p>
              </div>

              <div className="flex justify-center flex-col items-center">
                <OTPInput onComplete={handleOTPComplete} disabled={loading} />
              </div>

              {error && (
                <div className="text-[9px] font-black text-red-600 bg-red-50 p-3 rounded-xl text-center uppercase tracking-widest">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowOTP(false);
                    setError('');
                  }}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest bg-stone-100 text-stone-500 hover:bg-stone-200 transition-all border border-stone-200 active:scale-95"
                >
                  Edit
                </button>
                <button
                  onClick={handleMobileLogin}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest bg-[#8B3D28] text-white hover:bg-[#6D2E1D] transition-all active:scale-95"
                >
                  {loading ? 'Wait...' : 'Resend'}
                </button>
              </div>
            </div>
          )}

          {/* Sign Up Link */}
          <div className="text-center pt-6 border-t border-stone-100">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
              New to the village?{' '}
              <button
                onClick={() => navigate('/delivery/signup')}
                className="text-[#8B3D28] hover:underline ml-1"
              >
                Join Now
              </button>
            </p>
            {/* Skip button */}
            <button
              onClick={() => navigate('/delivery')}
              className="mt-4 w-full py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest text-stone-400 bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-all active:scale-95"
            >
              Skip for now →
            </button>
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <p className="mt-10 text-[8px] font-black text-stone-400 text-center max-w-[280px] uppercase tracking-[0.2em] leading-loose opacity-60">
        By continuing, you agree to our digital marketplace terms and vendor policies
      </p>
    </div>
  );
}

