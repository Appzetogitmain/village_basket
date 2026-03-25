import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOTP, verifyOTP } from '../../services/api/auth/customerAuthService';
import { useAuth } from '../../context/AuthContext';
import OTPInput from '../../components/OTPInput';
import Lottie from 'lottie-react';
import loginAnimation from '../../../assets/login/login_screen2.json';

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
        navigate('/user');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-white flex flex-col items-center p-0 overflow-y-auto overflow-x-hidden fixed inset-0">

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 z-50 w-10 h-10 bg-white shadow-md rounded-full flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Top Animation Section - Truly Edge-to-Edge (Brute Force) */}
      <div className="w-screen h-[80vh] relative overflow-hidden p-0 m-0 flex justify-center">
        <div className="w-[120vw] h-full absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
          <Lottie
            animationData={loginAnimation}
            loop={true}
            className="w-full h-full object-cover scale-[1.5] translate-y-[-5%]"
          />
        </div>
      </div>

      {/* Content Section - Bottom Part */}
      <div className="w-full max-w-md px-8 flex flex-col items-center justify-center flex-1 py-6">

        {showOTP && (
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-neutral-800 uppercase tracking-widest">Verification</h2>
            <p className="text-neutral-500 text-sm mt-1">
              Enter code sent to +91 {mobileNumber}
            </p>
          </div>
        )}

        {/* Input Form */}
        <div className="w-full space-y-4">
          {!showOTP ? (
            <div className="space-y-4">
              <div className="flex h-11 bg-white border-2 border-neutral-100 rounded-xl overflow-hidden focus-within:border-[#8B3D28]/30 transition-all shadow-sm">
                <div className="w-16 flex items-center justify-center border-r-2 border-neutral-50 bg-neutral-50/30">
                  <span className="text-neutral-600 font-black text-base">+91</span>
                </div>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter mobile number"
                  className="flex-1 px-4 py-2 outline-none text-neutral-800 font-bold text-base placeholder:text-neutral-300 placeholder:font-medium"
                  maxLength={10}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="text-center text-[9px] text-red-500 bg-red-50/50 py-1.5 rounded-lg border border-red-100/50 uppercase font-bold tracking-tighter">
                  {error}
                </div>
              )}

              <button
                onClick={handleContinue}
                disabled={mobileNumber.length !== 10 || loading}
                className={`w-full h-11 rounded-xl font-black tracking-[0.2em] uppercase text-xs active:scale-95 transition-all duration-300 shadow-md flex items-center justify-center ${
                  mobileNumber.length === 10 && !loading
                    ? 'bg-village-green text-white shadow-village-green/20' 
                    : 'bg-neutral-400 text-white'
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center scale-100 mb-1">
                <OTPInput onComplete={handleOTPComplete} disabled={loading} />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowOTP(false);
                    setError('');
                  }}
                  disabled={loading}
                  className="flex-1 h-10 rounded-xl bg-neutral-50 text-neutral-500 font-black text-[9px] uppercase tracking-widest hover:bg-neutral-100 transition-colors"
                >
                  Change No.
                </button>
                <button
                  onClick={handleContinue}
                  disabled={loading}
                  className="flex-1 h-10 rounded-xl bg-neutral-50 text-[#8B3D28] border border-[#8B3D28]/10 font-black text-[9px] uppercase tracking-widest hover:bg-neutral-100 transition-colors"
                >
                  {loading ? 'Sending...' : 'Resend Code'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Text */}
        <div className="mt-auto pt-4 text-center w-full">
          <p className="text-[8.5px] text-neutral-400 font-bold opacity-80 max-w-[180px] mx-auto leading-relaxed uppercase tracking-tighter">
            Access your saved addresses from Village Basket automatically!
          </p>
        </div>
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