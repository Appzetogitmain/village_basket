import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSrc from '../../../assets/village_basket-removebg-preview.png';
import almonds from '../../../assets/login/login_bg/almonds.png';
import bananas from '../../../assets/login/login_bg/bananas.png';
import carrots from '../../../assets/login/login_bg/carrots.png';
import mangoes from '../../../assets/login/login_bg/mangoes.png';
import oil from '../../../assets/login/login_bg/oil.png';
import onion from '../../../assets/login/login_bg/onion.png';
import potatoes from '../../../assets/login/login_bg/potatoes.png';
import spinach from '../../../assets/login/login_bg/spinach.png';
import tomatoes from '../../../assets/login/login_bg/tomatoes.png';

// ─────────────────────────────────────────────
// Individual product images for 9 boxes
// ─────────────────────────────────────────────
const productImages = [
  tomatoes,  // Row 1
  carrots,
  mangoes,
  bananas,   // Row 2
  spinach,
  potatoes,
  onion,     // Row 3
  almonds,
  oil
];

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    accountType: 'retailer' // default to retailer
  });
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => setPhase(3), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Convert 'retailer'/'wholesaler' UI terms to 'retail'/'wholesale' for the system
    const systemAccountType = formData.accountType === 'wholesaler' ? 'wholesale' : 'retail';

    // Real flow: Navigate to login (OTP) and pass the intended account type
    navigate('/user/login', { state: { accountType: systemAccountType } });
  };

  // Helper to render a row of items
  const ItemRow = ({ items, className }: { items: string[], className: string }) => (
    <div className={`vb-marquee-track ${className}`}>
      <div className="vb-marquee-inner">
        {[...items, ...items, ...items, ...items].map((src, i) => (
          <div key={`${className}-${i}`} className="vb-item-box">
            <div className="vb-item-inner">
              <img src={src} alt="" className="vb-product-img" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="vb-login-root">
      {/* ── BACK BUTTON ── */}
      <button
        onClick={() => navigate(-1)}
        className="vb-back-btn"
        aria-label="Go back"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* ── TOP PANEL : sliding products ── */}
      <div className="vb-top-panel">
        <ItemRow items={productImages.slice(0, 3)} className="vb-track-right" />
        <ItemRow items={productImages.slice(3, 6)} className="vb-track-left" />
        <ItemRow items={productImages.slice(6, 9)} className="vb-track-right-slow" />

        {/* Gradient overlay on top of produce */}
        <div className="vb-top-overlay" />

        {/* ── LOGO BADGE ── */}
        <div className={`vb-logo-badge ${phase >= 1 ? 'vb-logo-in' : ''}`}>
          <img src={logoSrc} alt="Village Basket" className="vb-logo-img" />
        </div>
      </div>

      {/* ── CINEMATIC INTRO OVERLAY ── */}
      <div className={`vb-intro-overlay ${phase >= 2 ? 'vb-intro-out' : ''}`}>
        <div className={`vb-intro-ripple ${phase >= 2 ? 'vb-ripple-expand' : ''}`} />
      </div>

      {/* ── BOTTOM PANEL : form ── */}
      <div className={`vb-bottom-panel ${phase >= 3 ? 'vb-bottom-in' : ''}`}>
        <div className="vb-form-card">
          <div className="text-center mb-4">
            <h1 className="vb-tagline-heading">Create Account</h1>
            <p className="vb-tagline-sub tracking-widest uppercase">Join the Village Network</p>
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
            <div className="space-y-2.5 pt-1">
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
              className="w-full h-12 bg-[#8B3D28] text-white rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-[#8B3D28]/20 transition-all active:scale-95 duration-300 mt-4 flex items-center justify-center relative overflow-hidden group"
            >
              <div className="absolute inset-0 w-full h-full bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </div>
              ) : 'Sign Up Now'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center pb-8 w-full">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/user/login')}
                className="text-[#8B3D28] hover:underline transition-all"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .vb-login-root {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          background: #FAF7F2;
          overflow: hidden;
          font-family: 'Inter', 'Segoe UI', sans-serif;
        }

        .vb-back-btn {
          position: absolute;
          top: 18px;
          left: 18px;
          z-index: 120;
          width: 38px;
          height: 38px;
          border: none;
          border-radius: 50%;
          background: rgba(255,255,255,0.92);
          color: #444;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0,0,0,0.15);
          transition: background 0.2s;
        }
        .vb-back-btn:hover { background: #fff; }

        .vb-top-panel {
          position: relative;
          width: 100%;
          height: 52vh;
          min-height: 260px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          gap: 12px;
          background: #7A3E26;
          padding: 0;
        }

        .vb-marquee-track {
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
        }

        .vb-marquee-inner {
          display: flex;
          align-items: center;
          width: max-content;
          gap: 16px;
          padding: 0 8px;
        }

        .vb-item-box {
          flex-shrink: 0;
          width: 95px;
          height: 95px;
          background: #FFF9E5;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(139,61,40,0.06);
          border: 1px solid rgba(139,61,40,0.1);
        }

        .vb-item-inner {
          width: 75%;
          height: 75%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vb-product-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
        }

        .vb-track-right .vb-marquee-inner { animation: marqueeRight 30s linear infinite; }
        .vb-track-left .vb-marquee-inner { animation: marqueeLeft 25s linear infinite; }
        .vb-track-right-slow .vb-marquee-inner { animation: marqueeRight 40s linear infinite; }

        .vb-top-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(122,62,38,0.0) 0%,
            rgba(122,62,38,0.1) 40%,
            rgba(250,247,242,0.85) 85%,
            rgba(250,247,242,1) 100%
          );
          pointer-events: none;
          z-index: 10;
        }

        .vb-logo-badge {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%) scale(0.3);
          z-index: 30;
          opacity: 0;
          transition: transform 0.75s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease;
        }
        .vb-logo-badge.vb-logo-in { transform: translateX(-50%) scale(1); opacity: 1; }

        .vb-logo-img {
          width: 140px;
          height: 64px;
          border-radius: 12px;
          object-fit: contain;
          background: #fff;
          padding: 8px 12px;
          box-shadow: 0 8px 30px rgba(139,61,40,0.2), 0 0 0 6px rgb(250, 247, 242);
          animation: logoBounce 3s ease-in-out infinite;
          will-change: transform;
          backface-visibility: hidden;
          -webkit-font-smoothing: antialiased;
          transform: translateZ(0);
        }

        .vb-intro-overlay {
          position: fixed;
          inset: 0;
          z-index: 90;
          pointer-events: none;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .vb-intro-overlay::before {
          content: '';
          position: absolute;
          inset: 0;
          background: #6B3520;
          transition: opacity 0.7s ease 0.1s;
        }
        .vb-intro-overlay.vb-intro-out::before { opacity: 0; }

        .vb-intro-ripple {
          position: absolute;
          top: calc(52vh - 30px);
          left: 50%;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0);
          background: radial-gradient(circle, #FAF7F2 0%, #f0ebe2 60%, transparent 100%);
          transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease;
          opacity: 0;
        }
        .vb-intro-overlay.vb-intro-out .vb-intro-ripple { transform: translate(-50%, -50%) scale(30); opacity: 0; }

        .vb-bottom-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow-y: auto;
          background: #FAF7F2;
          transform: translateY(60px);
          opacity: 0;
          transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s, opacity 0.5s ease 0.1s;
        }
        .vb-bottom-panel.vb-bottom-in { transform: translateY(0); opacity: 1; }

        .vb-form-card { width: 100%; max-width: 420px; padding: 42px 28px 28px; display: flex; flex-direction: column; gap: 4px; position: relative; }
        .vb-form-card::after { content: ''; position: absolute; top: 12px; left: 50%; transform: translateX(-50%); width: 40px; height: 4px; background: rgba(139,61,40,0.3); border-radius: 2px; }
        
        .vb-tagline-heading { font-size: 1.5rem; font-weight: 800; color: #8B3D28; }
        .vb-tagline-sub { font-size: 0.7rem; color: #888; margin-top: 4px; font-weight: 800; }

        @keyframes marqueeRight { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes marqueeLeft { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes logoBounce {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -8px, 0); }
        }

        @media (min-width: 1024px) {
          .vb-login-root { flex-direction: row; }
          .vb-top-panel { width: 38%; height: 100vh; gap: 20px; }
          .vb-marquee-inner { gap: 20px; }
          .vb-item-box { width: 130px; height: 130px; border-radius: 24px; }
          .vb-logo-badge { bottom: 50%; transform: translate(-50%, 50%) scale(0.3); }
          .vb-logo-badge.vb-logo-in { transform: translate(-50%, 50%) scale(1.1); }
          .vb-logo-img { width: 180px; height: 80px; border-radius: 20px; padding: 12px 20px; }
          .vb-intro-ripple { top: 50%; left: 19%; }
          .vb-bottom-panel { width: 62%; height: 100vh; justify-content: center; }
          .vb-form-card { max-width: 480px; padding: 60px; }
          .vb-top-overlay {
            background: linear-gradient(to right, rgba(240,235,226,0) 0%, rgba(240,235,226,0) 60%, rgba(250,247,242,0.9) 90%, rgba(250,247,242,1) 100%);
          }
        }
      `}</style>
    </div>
  );
}

