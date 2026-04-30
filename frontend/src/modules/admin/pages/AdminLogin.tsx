import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOTP, verifyOTP } from '../../../services/api/auth/adminAuthService';
import OTPInput from '../../../components/OTPInput';
import { useAuth } from '../../../context/AuthContext';
import villageBasketLogo from '@assets/village_basket-removebg-preview.png';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMobileLogin = async () => {
    if (mobileNumber.length !== 10) return;

    setLoading(true);
    setError("");

    try {
      await sendOTP(mobileNumber);
      setShowOTP(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = async (otp: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await verifyOTP(mobileNumber, otp);
      if (response.success && response.data) {
        // Update AuthContext with token and user data
        login(response.data.token, {
          ...response.data.user,
          userType: "Admin",
        });
        navigate("/admin");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-poppins relative flex flex-col items-center justify-center px-4 py-4 overflow-hidden">
      {/* Background texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/assets/natural-paper.png')] z-0"></div>
      
      {/* Decorative Brand Accents */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#8B3D28]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#8B3D28]/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-3 left-6 z-20 w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-md shadow-sm border border-neutral-200/50 flex items-center justify-center hover:bg-white hover:scale-110 hover:rotate-3 transition-all duration-300"
        aria-label="Back">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M15 18L9 12L15 6"
            stroke="#8B3D28"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl shadow-[#8B3D28]/10 overflow-hidden border border-neutral-100 relative z-10 transition-all duration-500 hover:shadow-3xl">
        {/* Header Section */}
        <div className="relative pt-12 pb-8 px-8 text-center bg-gradient-to-br from-[#8B3D28] to-[#6D2E1F] overflow-hidden">
          {/* Decorative Circles */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute -top-10 -left-10 w-48 h-48 bg-white rounded-full blur-3xl"></div>
             <div className="absolute top-20 -right-20 w-48 h-48 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-3 flex items-center justify-center mb-6 border-2 border-white/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <img
                src={villageBasketLogo}
                alt="Village Basket"
                className="w-full h-full object-contain"
              />
            </div>

            <h1 className="text-3xl font-black text-white mb-2 tracking-tight font-outfit uppercase">
              Admin Gateway
            </h1>
            <p className="text-white/80 text-xs font-bold bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/20 uppercase tracking-[0.2em]">
              Village Basket Management
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="p-8 space-y-6">
          {!showOTP ? (
            /* Mobile Login Form */
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">
                  Mobile Number
                </label>
                <div className="flex items-center bg-neutral-50/50 border-2 border-neutral-100 rounded-2xl overflow-hidden focus-within:border-[#8B3D28] focus-within:bg-white transition-all duration-300 shadow-sm">
                  <div className="px-5 py-4 text-sm font-black text-[#8B3D28] border-r border-neutral-100 bg-neutral-100/50 font-outfit">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) =>
                      setMobileNumber(
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    placeholder="999-000-0000"
                    className="flex-1 px-5 py-4 text-sm font-bold text-neutral-800 placeholder:text-neutral-300 focus:outline-none bg-transparent"
                    maxLength={10}
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="text-[11px] font-bold text-red-600 bg-red-50/50 border border-red-100 p-3 rounded-xl flex items-center gap-2 animate-shake">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  {error}
                </div>
              )}

              <button
                onClick={handleMobileLogin}
                disabled={mobileNumber.length !== 10 || loading}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 font-outfit ${mobileNumber.length === 10 && !loading
                  ? "bg-[#A54B31] text-white hover:bg-[#8B3D28] shadow-lg shadow-[#A54B31]/20 transform active:scale-95"
                  : "bg-neutral-100 text-neutral-300 cursor-not-allowed border border-neutral-200/50"
                  }`}>
                {loading ? "Authenticating..." : "Submit Request"}
              </button>
            </div>
          ) : (
            /* OTP Verification Form */
            <div className="space-y-6">
              <div className="bg-neutral-50 rounded-2xl px-3 py-2 border border-neutral-100 text-center space-y-1">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  Secure Code Sent to
                </p>
                <p className="text-lg font-black text-[#8B3D28] font-outfit tracking-wider">
                  +91 {mobileNumber}
                </p>
              </div>

              <div className="flex justify-center scale-95 md:scale-100">
                 <OTPInput onComplete={handleOTPComplete} disabled={loading} />
              </div>

              {error && (
                <div className="text-[11px] font-bold text-red-600 bg-red-50/50 border border-red-100 p-3 rounded-xl flex items-center justify-center gap-2 animate-shake text-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowOTP(false);
                    setError("");
                  }}
                  disabled={loading}
                  className="flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-white text-[#A54B31] hover:bg-neutral-50 transition-all border-2 border-neutral-100 font-outfit">
                  Change
                </button>
                <button
                  onClick={handleMobileLogin}
                  disabled={loading}
                  className="flex-1 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-[#8B3D28] text-white hover:opacity-90 transition-all shadow-md font-outfit">
                  {loading ? "Sending..." : "Resend OTP"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Text */}
      <div className="mt-8 relative z-10 text-center">
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-2">Developed for High Performance</p>
        <p className="text-[11px] text-neutral-400 font-bold max-w-xs">
          Village Basket &copy; 2025 | Admin Command Center
        </p>
      </div>
    </div>
  );
}
