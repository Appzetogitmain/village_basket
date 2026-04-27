import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sendOTP, verifyOTP } from '../../services/api/auth/customerAuthService';
import { useAuth } from '../../context/AuthContext';
import OTPInput from '../../components/OTPInput';
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

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const intendedCustomerType = (
    location.state?.accountType || location.state?.customerType || 'retail'
  ) as 'retail' | 'wholesale';

  const isSignUpMode = !!location.state?.isSignUp;
  const signUpDetails = isSignUpMode ? {
    name: location.state?.name,
    email: location.state?.email
  } : null;

  const [mobileNumber, setMobileNumber] = useState(location.state?.mobile || '');
  const [showOTP, setShowOTP] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(120);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showOTP && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOTP, timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => setPhase(3), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const handleContinue = async () => {
    if (mobileNumber.length !== 10) return;
    setLoading(true);
    setError('');
    try {
      const response = await sendOTP(mobileNumber, isSignUpMode);
      if (response.sessionId) setSessionId(response.sessionId);
      setShowOTP(true);
      setTimer(120); // Reset timer on resend
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
      const response = await verifyOTP(
        mobileNumber, 
        otp, 
        sessionId, 
        intendedCustomerType,
        signUpDetails?.name,
        signUpDetails?.email
      );
      if (response.success && response.data) {
        login(response.data.token, {
          ...response.data.user,
          customerType: response.data.user.customerType,
          accountType: response.data.user.customerType,
          userType: 'Customer',
        });
        // Redirect to the page they were trying to access, or home
        const from = (location.state as any)?.from?.pathname || '/user/home';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
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

        {/* ── LOGO BADGE – floats above everything ── */}
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
          {!showOTP && (
            <div className="vb-tagline">
              <h1 className="vb-tagline-heading">Village Basket</h1>
              <p className="vb-tagline-sub">Fresh from the farm, straight to your door</p>
            </div>
          )}

          {showOTP && (
            <div className="vb-otp-header">
              <h2 className="vb-otp-title">Verification</h2>
              <p className="vb-otp-sub">Enter code sent to +91 {mobileNumber}</p>
            </div>
          )}

          {/* Input form */}
          <div className="vb-input-section">
            {!showOTP ? (
              <div className="vb-input-group">
                <div className="vb-phone-row">
                  <div className="vb-prefix">+91</div>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter mobile number"
                    className="vb-phone-input"
                    maxLength={10}
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="vb-error-msg">{error}</div>
                )}

                <button
                  onClick={handleContinue}
                  disabled={mobileNumber.length !== 10 || loading}
                  className={`vb-cta-btn ${mobileNumber.length === 10 && !loading ? 'vb-cta-active' : 'vb-cta-disabled'}`}
                >
                  {loading ? (
                    <span className="vb-spinner-row">
                      <span className="vb-spinner" />
                      Processing...
                    </span>
                  ) : 'Continue'}
                </button>
              </div>
            ) : (
              <div className="vb-otp-group">
                <OTPInput onComplete={handleOTPComplete} disabled={loading} />

                {error && (
                  <div className="vb-error-msg">{error}</div>
                )}

                <div className="vb-otp-actions">
                  <button
                    onClick={() => { setShowOTP(false); setError(''); }}
                    disabled={loading}
                    className="vb-action-btn"
                  >
                    Change No.
                  </button>
                  <button
                    onClick={handleContinue}
                    disabled={loading || timer > 0}
                    className={`vb-action-btn vb-action-resend ${timer > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading ? 'Sending...' : timer > 0 ? `Resend in ${formatTime(timer)}` : 'Resend Code'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="vb-signup-line">
            New to Village Basket?{' '}
            <button onClick={() => navigate('/user/signup')} className="vb-signup-link">
              Sign Up
            </button>
          </p>
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

        .vb-form-card { width: 100%; max-width: 420px; padding: 42px 28px 28px; display: flex; flex-direction: column; gap: 20px; position: relative; }
        .vb-form-card::after { content: ''; position: absolute; top: 12px; left: 50%; transform: translateX(-50%); width: 40px; height: 4px; background: rgba(139,61,40,0.3); border-radius: 2px; }
        .vb-tagline { text-align: center; }
        .vb-tagline-heading { font-size: 1.5rem; font-weight: 800; color: #8B3D28; }
        .vb-tagline-sub { font-size: 0.82rem; color: #888; margin-top: 4px; font-weight: 500; }
        .vb-otp-header { text-align: center; }
        .vb-otp-title { font-size: 1.25rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #1a1a1a; }
        .vb-otp-sub { font-size: 0.8rem; color: #888; margin-top: 4px; }
        .vb-input-group { display: flex; flex-direction: column; gap: 24px; width: 100%; }
        .vb-otp-group { display: flex; flex-direction: column; gap: 24px; align-items: center; width: 100%; }

        .vb-phone-row {
          display: flex;
          height: 54px;
          background: #fff;
          border: 2px solid #eeeada;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
        .vb-prefix { width: 64px; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #555; background: #faf7f2; border-right: 2px solid #eeeada; font-size: 0.95rem; }
        .vb-phone-input { flex: 1; border: none; outline: none; padding: 0 16px; font-size: 1rem; font-weight: 700; color: #1a1a1a; }
        .vb-error-msg { text-align: center; font-size: 0.72rem; font-weight: 700; color: #e53e3e; background: #fff5f5; border: 1px solid #fed7d7; padding: 8px; border-radius: 10px; text-transform: uppercase; }

        .vb-cta-btn {
          width: 100%;
          height: 54px;
          border: none;
          border-radius: 16px;
          font-size: 0.9rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: all 0.2s;
        }
        .vb-cta-active { background: #8B3D28; color: #fff; box-shadow: 0 6px 20px rgba(139,61,40,0.3); cursor: pointer; }
        .vb-cta-active:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(139,61,40,0.4); }
        .vb-cta-disabled { background: #d1c9bf; color: #fff; cursor: not-allowed; }

        .vb-otp-actions { display: flex; gap: 12px; width: 100%; }
        .vb-action-btn { flex: 1; height: 46px; border-radius: 14px; border: 1.5px solid #eeeada; background: #fff; font-weight: 900; font-size: 0.75rem; text-transform: uppercase; color: #666; cursor: pointer; }
        .vb-action-resend { color: #8B3D28; border-color: rgba(139,61,40,0.15); }

        .vb-signup-line { text-align: center; font-size: 0.75rem; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: 0.05em; }
        .vb-signup-link { border: none; background: none; color: #8B3D28; font-weight: 900; cursor: pointer; text-decoration: underline; }

        @keyframes marqueeRight { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes marqueeLeft { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes logoBounce {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -8px, 0); }
        }

        @media (min-width: 1024px) {
          .vb-login-root { flex-direction: row; }
          .vb-top-panel { width: 45%; height: 100vh; gap: 20px; }
          .vb-marquee-inner { gap: 20px; }
          .vb-item-box { width: 130px; height: 130px; border-radius: 24px; }
          .vb-logo-badge { bottom: 50%; transform: translate(-50%, 50%) scale(0.3); }
          .vb-logo-badge.vb-logo-in { transform: translate(-50%, 50%) scale(1.1); }
          .vb-logo-img { width: 180px; height: 80px; border-radius: 20px; padding: 12px 20px; }
          .vb-intro-ripple { top: 50%; left: 22.5%; }
          .vb-bottom-panel { width: 55%; height: 100vh; justify-content: center; }
          .vb-form-card { max-width: 480px; padding: 60px; }
          .vb-top-overlay {
            background: linear-gradient(to right, rgba(240,235,226,0) 0%, rgba(240,235,226,0) 60%, rgba(250,247,242,0.9) 90%, rgba(250,247,242,1) 100%);
          }
        }
      `}</style>
    </div>
  );
}
