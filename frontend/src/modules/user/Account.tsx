import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getProfile, CustomerProfile } from '../../services/api/customerService';
import { sendTestNotification } from '../../services/pushNotificationService';
import { useToast } from '../../context/ToastContext';
import { useLocation } from 'react-router-dom';
import DailyServiceList from './components/DailyServiceList';

export default function Account() {
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGstModal, setShowGstModal] = useState(false);
  const [gstNumber, setGstNumber] = useState('');
  const { showToast } = useToast();
  const [testNotifLoading, setTestNotifLoading] = useState(false);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'profile' | 'subscriptions'>('profile');

  useEffect(() => {
    if (location.state && (location.state as any).activeTab) {
      setActiveTab((location.state as any).activeTab);
    }
  }, [location]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getProfile();
        if (response.success) {
          setProfile(response.data);
        } else {
          setError('Failed to load profile');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load profile');
        if (err.response?.status === 401) {
          authLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user, navigate, authLogout]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleLogout = () => {
    authLogout();
    navigate('/user/login');
  };

  const handleGstSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowGstModal(false);
  };

  const handleTestNotification = async () => {
    try {
      setTestNotifLoading(true);
      const result = await sendTestNotification();
      if (result.success) {
        showToast(result.message, 'success');
      } else {
        showToast(result.message, 'error');
      }
    } catch (err: any) {
      showToast('Failed to send test notification', 'error');
    } finally {
      setTestNotifLoading(false);
    }
  };

  // Show login/signup prompt for unregistered users
  if (!user) {
    return (
      <div className="pb-24 md:pb-8 bg-transparent min-h-screen">
        <div className="bg-gradient-to-b from-[#8B3D28]/10 via-[#8B3D28]/5 to-transparent pb-6 md:pb-8 pt-12 md:pt-16 relative">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
          <div className="px-4 md:px-6 lg:px-8 relative z-10">
            <button onClick={() => navigate(-1)} className="mb-4 text-[#8B3D28] hover:bg-[#8B3D28]/10 p-2 rounded-full transition-colors" aria-label="Back">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <div className="flex flex-col items-center mb-4 md:mb-6">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-neutral-100 flex items-center justify-center mb-3 md:mb-4 border-2 border-[#8B3D28]/20 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-[#8B3D28]/5"></div>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-[#8B3D28]/60 md:w-12 md:h-12 relative z-10">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-[#8B3D28] mb-2 font-poppins tracking-tight">Welcome!</h1>
              <p className="text-sm md:text-base text-[#8B3D28]/70 text-center px-8 font-medium max-w-xs">
                Login to access your profile, orders, and more
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 md:px-8 mt-6">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => navigate('/user/login')}
              className="w-full py-4 rounded-xl font-bold text-base bg-[#8B3D28] text-white hover:bg-[#8B3D28]/95 transition-all shadow-xl shadow-[#8B3D28]/20 active:scale-[0.98] uppercase tracking-wider"
            >
              Login / Signup
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pb-24 md:pb-8 bg-transparent min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="pb-24 md:pb-8 bg-transparent min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-teal-600 text-white rounded">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const displayName = profile?.name || user?.name || 'User';
  const displayPhone = profile?.phone || user?.phone || '';
  const displayDateOfBirth = profile?.dateOfBirth;

  return (
    <div className="pb-24 md:pb-8 bg-transparent min-h-screen">
      <div className="bg-gradient-to-b from-[#8B3D28] to-[#8B3D28]/80 pb-6 md:pb-8 pt-12 md:pt-16 shadow-lg border-b border-white/10">
        <div className="px-4 md:px-6 lg:px-8 text-white text-center">
          <div className="flex justify-start mb-2">
            <button onClick={() => navigate(-1)} className="text-white hover:bg-white/10 p-2 rounded-full transition-colors" aria-label="Back">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
          <div className="flex flex-col items-center mb-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-neutral-200 flex items-center justify-center mb-3 border-2 border-white shadow-sm overflow-hidden">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-neutral-500">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white mb-1 uppercase tracking-tight">{displayName}</h1>
            <p className="text-xs text-white/70 font-bold uppercase tracking-widest">{displayPhone}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 -mt-6 mb-6">
        <div className="flex bg-white rounded-2xl p-1.5 border border-stone-100 shadow-xl max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-village-umber text-white shadow-md' : 'text-stone-400'
              }`}
          >
            My Profile
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'subscriptions' ? 'bg-village-green text-white shadow-md' : 'text-stone-400'
              }`}
          >
            Daily Service
          </button>
        </div>
      </div>

      <div className="px-4 max-w-2xl mx-auto">
        {activeTab === 'profile' ? (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate('/orders')} className="bg-white rounded-2xl border border-stone-100 p-4 hover:shadow-md transition-all text-center group">
                <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center mx-auto mb-2 group-hover:bg-village-umber/5 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-stone-600 group-hover:text-village-umber transition-colors"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><path d="M16 10a4 4 0 0 1-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div className="text-[10px] font-black text-village-umber uppercase tracking-widest">Orders</div>
              </button>
              <button
                onClick={() => navigate('/faq')}
                className="bg-white rounded-2xl border border-stone-100 p-4 hover:shadow-md transition-all text-center group"
              >
                <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center mx-auto mb-2 group-hover:bg-village-umber/5 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-stone-600 group-hover:text-village-umber transition-colors"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div className="text-[10px] font-black text-village-umber uppercase tracking-widest">Help</div>
              </button>
            </div>

            {/* Information Grid */}
            <div>
              <h2 className="text-[10px] font-black text-stone-400 mb-3 uppercase tracking-[0.2em] px-1">Your Information</h2>
              <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden divide-y divide-stone-50 shadow-sm">
                <button onClick={() => navigate('/address-book')} className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-stone-400"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span className="text-xs font-black text-village-umber uppercase tracking-widest">Address Book</span>
                  </div>
                  <span className="text-stone-300">›</span>
                </button>
                <button onClick={() => navigate('/wishlist')} className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-stone-400"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span className="text-xs font-black text-village-umber uppercase tracking-widest">Wishlist</span>
                  </div>
                  <span className="text-stone-300">›</span>
                </button>
                <button onClick={() => navigate('/rewards')} className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-lg leading-none">🪙</span>
                    <span className="text-xs font-black text-village-umber uppercase tracking-widest">Village Rewards</span>
                  </div>
                  <span className="text-stone-300">›</span>
                </button>
                <button onClick={() => setShowGstModal(true)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-stone-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span className="text-xs font-black text-village-umber uppercase tracking-widest">GST Details</span>
                  </div>
                  <span className="text-stone-300">›</span>
                </button>
              </div>
            </div>

            {/* App Settings */}
            <div>
              <h2 className="text-[10px] font-black text-stone-400 mb-3 uppercase tracking-[0.2em] px-1">App & Support</h2>
              <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden divide-y divide-stone-50 shadow-sm">
                <button onClick={() => window.location.href = 'https://about.villagebasket.com'} className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-stone-400"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" strokeWidth="2" /><line x1="12" y1="8" x2="12.01" y2="8" stroke="currentColor" strokeWidth="2" /></svg>
                    <span className="text-xs font-black text-village-umber uppercase tracking-widest">About Village</span>
                  </div>
                  <span className="text-stone-300">›</span>
                </button>
                <button
                  onClick={handleTestNotification}
                  disabled={testNotifLoading}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-4">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-village-green">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-xs font-black text-village-umber uppercase tracking-widest">
                      {testNotifLoading ? 'Testing...' : 'Test Notifications'}
                    </span>
                  </div>
                  <span className="text-stone-300">›</span>
                </button>
                <button onClick={handleLogout} className="w-full flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors text-red-500">
                  <div className="flex items-center gap-4">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-red-500"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    <span className="text-xs font-black uppercase tracking-widest">Log Out</span>
                  </div>
                  <span className="text-stone-300 opacity-50">›</span>
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] text-stone-300 font-bold uppercase tracking-widest pb-10">Version 2.4.0 • Village Basket</p>
          </div>
        ) : (
          <DailyServiceList />
        )}
      </div>

      {showGstModal && (
        <>
          <div className="fixed inset-0 z-[60] bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowGstModal(false)} />
          <div className="fixed inset-x-0 bottom-0 z-[70] animate-in slide-in-from-bottom duration-500 ease-out p-4">
            <div className="bg-white rounded-[32px] shadow-2xl max-w-lg mx-auto p-8 relative">
              <button
                onClick={() => setShowGstModal(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:bg-stone-200 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div className="text-center">
                <div className="mx-auto mb-6 w-20 h-20 rounded-3xl bg-village-umber/5 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-10 h-10 text-village-umber" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="3" width="14" height="18" rx="2" ry="2" /><line x1="9" y1="7" x2="15" y2="7" /><line x1="9" y1="11" x2="15" y2="11" /><line x1="9" y1="15" x2="13" y2="15" /></svg>
                </div>
                <h3 className="text-xl font-black text-village-umber mb-2 uppercase tracking-tight">Add GST Details</h3>
                <p className="text-xs text-stone-400 mb-8 px-4 font-medium leading-relaxed">Save your business details to receive a GST-ready invoice on your village purchases.</p>
                <form onSubmit={handleGstSubmit} className="space-y-4">
                  <input
                    type="text"
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="Enter GST Number"
                    className="w-full rounded-2xl border-2 border-stone-100 px-6 py-4 text-sm font-bold text-village-umber placeholder:text-stone-300 focus:outline-none focus:border-village-umber/20 transition-all bg-stone-50/30"
                  />
                  <button
                    type="submit"
                    disabled={!gstNumber.trim()}
                    className="w-full rounded-2xl bg-village-umber text-white font-black py-4 hover:shadow-xl disabled:opacity-30 disabled:shadow-none transition-all shadow-lg shadow-village-umber/20 uppercase tracking-widest text-xs"
                  >
                    Save Details
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
