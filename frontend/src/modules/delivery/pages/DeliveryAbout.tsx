import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getDeliveryProfile } from '../../../services/api/delivery/deliveryService';

// Icons
const Icons = {
    ChevronLeft: ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
        </svg>
    ),
    Package: ({ size = 48 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7.5L12 3L3 7.5v9l9 4.5l9-4.5v-9z" />
            <path d="M3 7.5l9 4.5l9-4.5" />
            <path d="M12 12v9" />
        </svg>
    )
};

export default function DeliveryAbout() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getDeliveryProfile();
        setProfile(data);
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="min-h-screen bg-transparent pb-24 font-poppins relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] z-0"></div>

      {/* Local Header */}
      <div className="sticky top-0 z-30 bg-[#8B3D28] px-4 py-3 flex items-center shadow-md overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
          <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-white/80 hover:bg-white/10 rounded-xl transition-all active:scale-90"
          >
              <Icons.ChevronLeft size={20} />
          </button>
          <div className="ml-2 flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 leading-none">Identity</span>
              <span className="font-black text-[12px] text-white tracking-wide mt-1">Credentials & Core</span>
          </div>
      </div>

      <div className="px-6 py-6 relative z-10">
        {/* Profile Card Breakdown */}
        <div className="village-card paper-texture organic-radius p-7 bg-white shadow-sm border-none mb-6 text-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-4">
                <div className="w-8 h-8 border-4 border-stone-100 border-t-[#8B3D28] rounded-full animate-spin"></div>
                <p className="mt-4 text-[9px] font-black text-stone-300 uppercase tracking-widest">Verifying Agent...</p>
            </div>
          ) : profile ? (
            <>
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#8B3D28] to-[#3D2B1F] flex items-center justify-center mx-auto mb-6 text-white font-black text-4xl shadow-2xl ring-4 ring-stone-50 ring-offset-2 ring-offset-stone-100/50 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
                {profile.name?.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-village-umber text-xl font-black tracking-tighter mb-1 uppercase">{profile.name}</h3>
              <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.15em] mb-4">+91 {profile.mobile}</p>
              
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-50 ring-1 ring-stone-100">
                  <div className={`w-1.5 h-1.5 rounded-full ${profile.status === 'Active' ? 'bg-[#4A7C59] animate-pulse' : 'bg-stone-300'}`}></div>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${profile.status === 'Active' ? 'text-[#4A7C59]' : 'text-stone-400'}`}>
                    {profile.status === 'Active' ? 'FIELD READY' : 'RETIRED / INACTIVE'}
                  </span>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-8 pt-8 border-t border-stone-100">
                <div className="text-center">
                  <p className="text-stone-300 text-[8px] font-black uppercase tracking-widest mb-1.5">Operational Sector</p>
                  <p className="text-village-umber text-[11px] font-black uppercase tracking-tight">{profile.city || "UNKNOWN"}</p>
                </div>
                <div className="text-center">
                  <p className="text-stone-300 text-[8px] font-black uppercase tracking-widest mb-1.5">Induction Date</p>
                  <p className="text-village-umber text-[11px] font-black uppercase tracking-tight">
                    {new Date(profile.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-4 text-red-400 text-[9px] font-black uppercase tracking-widest">Critical: Profile Intercept Failed</div>
          )}
        </div>

        {/* Branding Manifest */}
        <div className="village-card paper-texture organic-radius p-8 bg-gradient-to-br from-stone-50 to-stone-100/50 shadow-inner border-none mb-6 flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-stone-900 pointer-events-none">
                <Icons.Package size={120} />
            </div>
            
            <div className="w-20 h-20 rounded-[1.8rem] bg-white flex items-center justify-center mb-6 shadow-xl shadow-stone-200/50 ring-1 ring-stone-200/50 transition-transform active:scale-95">
                <div className="text-[#8B3D28] group-hover:scale-110 transition-transform">
                    <Icons.Package size={36} />
                </div>
            </div>
            
            <h3 className="text-village-umber text-xl font-black tracking-tighter mb-1 uppercase">Village Basket Partners</h3>
            <p className="text-stone-400 text-[9px] font-black uppercase tracking-[0.3em]">Core Environment</p>
            
            <div className="mt-8 text-center px-4">
                <p className="text-stone-500 text-[10px] font-black leading-relaxed uppercase tracking-tight opacity-70">
                    A comprehensive strategic platform empowering delivery agents with real-time tactical overview and financial transparency.
                </p>
            </div>
        </div>

        {/* Technical Ledger */}
        <div className="village-card paper-texture organic-radius bg-white divide-y divide-stone-100 overflow-hidden shadow-sm border-none pr-1 pl-1 mb-8">
            {[
                { label: 'System Version', value: '2.4.0 (Stable)' },
                { label: 'Build Manifest', value: 'VB-PRT-2025.12' },
                { label: 'Platform Core', value: 'V-BASKET ENGINE' }
            ].map((item, idx) => (
                <div key={idx} className="p-4 flex justify-between items-center group active:bg-stone-50 transition-colors">
                    <p className="text-stone-300 text-[9px] font-black uppercase tracking-widest">{item.label}</p>
                    <p className="text-village-umber text-[11px] font-black uppercase tracking-tight">{item.value}</p>
                </div>
            ))}
        </div>

        {/* Copy Ledger */}
        <div className="flex flex-col items-center py-4">
            <div className="w-8 h-[1px] bg-stone-200 mb-6"></div>
            <p className="text-[7px] font-black text-stone-300 uppercase tracking-[0.4em] mb-1">© 2025 Village Basket Core</p>
            <p className="text-[6px] font-bold text-stone-200 uppercase tracking-widest">Unauthorized Access Prohibited</p>
        </div>
      </div>
    </div>
  );
}


