import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import loginAnimation from '../../../assets/login/login_screen2.json';

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    accountType: 'retailer' // default to retailer
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Frontend only: Simulate success and navigate back to login
    setTimeout(() => {
      setLoading(false);
      navigate('/user/login');
    }, 1500);
  };

  return (
    <div className="h-screen w-screen bg-[#FAF7F2] flex flex-col lg:flex-row items-center p-0 overflow-y-auto lg:overflow-hidden fixed inset-0 font-poppins">

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 z-[60] w-10 h-10 bg-white shadow-md rounded-full flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Animation Section - 40% on Desktop */}
      <div className="w-screen lg:w-2/5 h-[40vh] lg:h-full relative overflow-hidden p-0 m-0 flex justify-center bg-[#FAF7F2] order-1 lg:order-1">
        <div className="w-[120vw] lg:w-full h-full absolute lg:relative left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0 flex items-center justify-center">
          <Lottie
            animationData={loginAnimation}
            loop={true}
            className="w-full h-full object-cover scale-[1.3] lg:scale-[1.1] translate-y-[5%] lg:translate-y-0"
          />
        </div>
      </div>

      {/* Form Section - 60% on Desktop */}
      <div className="w-full lg:w-3/5 flex flex-col items-center justify-center flex-1 py-8 lg:h-full order-2 lg:order-2 bg-[#FAF7F2]">
        <div className="w-full max-w-md px-8 flex flex-col items-center justify-center relative bg-[#FAF7F2]">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-neutral-800 uppercase tracking-tight">Create Account</h1>
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1 opacity-60">Join the Village Network</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Full Name</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
                className="w-full h-12 px-4 rounded-xl border-2 border-neutral-100 focus:border-[#8B3D28]/30 focus:outline-none font-bold text-sm text-neutral-800 transition-all shadow-sm bg-white"
              />
            </div>

            {/* Mobile */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Mobile Number</label>
              <div className="flex h-12 bg-white border-2 border-neutral-100 rounded-xl overflow-hidden focus-within:border-[#8B3D28]/30 transition-all shadow-sm">
                <div className="w-16 flex items-center justify-center border-r-2 border-neutral-50 bg-neutral-50/30">
                  <span className="text-neutral-600 font-black text-sm">+91</span>
                </div>
                <input
                  required
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="999-000-0000"
                  className="flex-1 px-4 py-2 outline-none text-neutral-800 font-bold text-sm bg-white"
                  maxLength={10}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Email Address</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@email.com"
                className="w-full h-12 px-4 rounded-xl border-2 border-neutral-100 focus:border-[#8B3D28]/30 focus:outline-none font-bold text-sm text-neutral-800 transition-all shadow-sm bg-white"
              />
            </div>

            {/* Account Type Selection */}
            <div className="space-y-2.5 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, accountType: 'retailer' })}
                  className={`py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${formData.accountType === 'retailer'
                    ? 'border-[#8B3D28] bg-[#8B3D28]/5 text-[#8B3D28] shadow-md'
                    : 'border-neutral-100 text-neutral-400 bg-white hover:bg-neutral-50'}`}
                >
                  Retailer
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, accountType: 'wholesaler' })}
                  className={`py-3 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${formData.accountType === 'wholesaler'
                    ? 'border-[#8B3D28] bg-[#8B3D28]/5 text-[#8B3D28] shadow-md'
                    : 'border-neutral-100 text-neutral-400 bg-white hover:bg-neutral-50'}`}
                >
                  Wholesaler
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              disabled={loading}
              className="w-full h-12 bg-[#8B3D28] text-white rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-[#8B3D28]/20 transition-all active:scale-95 duration-300 mt-6 flex items-center justify-center"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center pb-8 w-full">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/user/login')}
                className="text-[#8B3D28] hover:underlineDecoration transition-all"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
