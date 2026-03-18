import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendOTP, verifyOTP } from '../../services/api/auth/customerAuthService';
import { useAuth } from '../../context/AuthContext';
import OTPInput from '../../components/OTPInput';
import fruitsVegIcon from '@assets/category/Fruits & Vegetables.png';
import milkIcon from '@assets/category/Dairy, Bread & Eggs.png';
import snacksIcon from '@assets/category/Snacks & Munchies.png';
import breadIcon from '/assets/product-britannia-bread.jpg';
import riceIcon from '@assets/category/Atta, Rice & Dal.png';
import drinksIcon from '@assets/category/Cold Drinks & Juices.png';

// Final Mascot path
const GENERATED_MASCOT = '/assets/login/mascot.png';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const gridItems = [
    { id: 1, img: fruitsVegIcon },
    { id: 2, img: milkIcon },
    { id: 3, img: breadIcon },
    { id: 4, img: snacksIcon },
    { id: 5, img: riceIcon },
    { id: 6, img: drinksIcon },
  ];

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
    <div className="min-h-screen bg-[#EBF5FF] flex flex-col items-center relative overflow-hidden font-poppins h-screen">
      {/* 1. Background Grid - Large Product Cards exactly like the image */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-80 p-2">
        <div className="grid grid-cols-3 gap-4 md:gap-8 transform -rotate-1 translate-y-[-10%] scale-110">
           {[...gridItems, ...gridItems, ...gridItems, ...gridItems].map((item, idx) => (
             <div key={idx} className="aspect-square flex items-center justify-center">
                <div className="w-[85%] h-[85%] bg-white rounded-[40px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/50 flex items-center justify-center transition-transform hover:scale-105">
                  <img 
                    src={idx % 4 === 0 ? fruitsVegIcon : (idx % 3 === 0 ? milkIcon : (idx % 2 === 0 ? snacksIcon : item.img))} 
                    alt="Prod" 
                    className="w-[80%] h-[80%] object-contain" 
                  />
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-neutral-800 hover:bg-neutral-50 active:scale-95 transition-all"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18L9 12L15 6" />
        </svg>
      </button>

      {/* 2. Main Verified Content Area - Floating over background */}
      <div className="relative z-20 w-full max-w-sm flex flex-col items-center px-6 pt-32 md:pt-40 space-y-6">
        
        {/* Mascot Centerpiece - Perfectly Circular */}
        <div className="w-44 h-44 md:w-56 md:h-56 relative">
           <div className="w-full h-full rounded-full border-[6px] border-white shadow-2xl overflow-hidden bg-white">
              <img 
                src={GENERATED_MASCOT} 
                alt="Village Basket Mascot" 
                className="w-full h-full object-cover"
              />
           </div>
        </div>

        {/* OTP Input Section - Directly on BG as per reference image */}
        <div className="w-full flex flex-col items-center space-y-8 animate-fadeIn">
          {!showOTP ? (
             <div className="w-full space-y-6">
               <div className="text-center space-y-1">
                 <h2 className="text-3xl font-black text-neutral-900 tracking-tight">Login</h2>
                 <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em]">Village Basket</p>
               </div>

               <div className="w-full space-y-4">
                  <div className="flex items-center bg-white/90 backdrop-blur-md border-2 border-white rounded-[28px] transition-all h-14 px-6 shadow-xl shadow-blue-900/5">
                    <span className="text-lg font-black text-[#8B3D28] mr-3">+91</span>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Mobile number"
                      className="flex-1 bg-transparent text-lg font-bold text-neutral-900 placeholder:text-neutral-300 focus:outline-none"
                      maxLength={10}
                      disabled={loading}
                    />
                  </div>
                  
                  <button
                    onClick={handleContinue}
                    disabled={mobileNumber.length !== 10 || loading}
                    className={`w-full py-4 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl ${
                      mobileNumber.length === 10 && !loading
                        ? 'bg-[#8B3D28] text-white shadow-[#8B3D28]/40 hover:brightness-110 active:scale-95'
                        : 'bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    {loading ? 'Calling...' : 'Get OTP on Call'}
                  </button>
               </div>
             </div>
          ) : (
             <div className="w-full space-y-8">
               <div className="text-center space-y-1.5">
                 <p className="text-[13px] text-neutral-600 font-medium">Enter the 4-digit OTP sent via voice call to</p>
                 <p className="text-lg font-black text-neutral-900 tracking-tight">+91 {mobileNumber}</p>
               </div>

               <div className="flex justify-center">
                 <OTPInput length={4} onComplete={handleOTPComplete} disabled={loading} />
               </div>

               {error && (
                 <div className="bg-red-50 text-red-600 text-[10px] font-black px-4 py-2.5 rounded-full border border-red-100 flex items-center justify-center gap-2">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                   {error}
                 </div>
               )}

               <div className="w-full flex flex-col gap-3">
                  <button
                    onClick={handleContinue}
                    disabled={loading}
                    className="w-full py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest bg-[#8B3D28] text-white shadow-2xl shadow-[#8B3D28]/30 active:scale-95 transition-all"
                  >
                    {loading ? 'Resending...' : 'Resend OTP'}
                  </button>
                  <button
                    onClick={() => {
                      setShowOTP(false);
                      setError('');
                    }}
                    disabled={loading}
                    className="w-full py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest bg-white/80 backdrop-blur-sm text-neutral-700 border border-white active:scale-95 transition-all shadow-lg"
                  >
                    Change Number
                  </button>
               </div>
             </div>
          )}

          <div className="pt-6 text-center max-w-[200px]">
             <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter opacity-70 leading-relaxed">
               Access your saved addresses from <br/><span className="text-[#8B3D28]">Village Basket</span> automatically!
             </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
