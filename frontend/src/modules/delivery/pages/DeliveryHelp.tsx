import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHelpSupport } from '../../../services/api/delivery/deliveryService';

// Icons
const Icons = {
    ChevronLeft: ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
        </svg>
    ),
    Phone: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
    ),
    Mail: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
        </svg>
    ),
    MessageCircle: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
    ),
    HelpCircle: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    )
};

export default function DeliveryHelp() {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHelp = async () => {
      try {
        const data = await getHelpSupport();
        setFaqs(data.faqs || []);
        setContacts(data.contact || []);
      } catch (error) {
        console.error("Failed to load help data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHelp();
  }, []);

  const getThemedIcon = (iconName: string) => {
    if (iconName === 'phone') return <Icons.Phone />;
    if (iconName === 'email') return <Icons.Mail />;
    if (iconName === 'chat') return <Icons.MessageCircle />;
    return <Icons.HelpCircle />;
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-8">
          <div className="w-10 h-10 border-4 border-stone-200 border-t-[#8B3D28] rounded-full animate-spin mb-4"></div>
          <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest text-center">Contacting Fleet Command...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24 font-poppins relative">
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
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 leading-none">Support</span>
              <span className="font-black text-[12px] text-white tracking-wide mt-1">Operational Help</span>
          </div>
      </div>

      <div className="px-6 py-6 relative z-10">
        {/* Help Group: Support Channels */}
        <div className="mb-8">
            <h3 className="text-[#8B3D28] text-[9px] font-black uppercase tracking-[0.3em] mb-4 ml-1">Dispatch Channels</h3>
            <div className="village-card paper-texture organic-radius bg-white divide-y divide-stone-100 overflow-hidden shadow-sm border-none pr-2 pl-2">
                {contacts.map((option, index) => (
                    <div key={index} className="p-5 flex items-center justify-between group active:bg-stone-50 transition-colors">
                        <div className="flex-1 pr-4">
                            <p className="text-village-umber text-[11px] font-black uppercase tracking-tight mb-1">{option.label}</p>
                            <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest opacity-70 leading-none">{option.value}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-[#8B3D28]/40 transition-all group-active:scale-90 ring-1 ring-stone-100/50">
                            {getThemedIcon(option.icon)}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-8">
            <h3 className="text-[#8B3D28] text-[9px] font-black uppercase tracking-[0.3em] mb-4 ml-1">Strategic Intel (FAQ)</h3>
            <div className="space-y-4">
                {faqs.map((item, index) => (
                    <div key={index} className="village-card paper-texture organic-radius p-5 border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                        <p className="text-village-umber text-[11px] font-black uppercase tracking-tight mb-2.5 leading-tight">{item.question}</p>
                        <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest leading-relaxed opacity-60 italic">{item.answer}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Tactical Extraction / Contact Button */}
        <button className="w-full mt-6 bg-gradient-to-br from-[#8B3D28] to-[#3D2B1F] text-white py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-[#8B3D28]/30 transition-all active:scale-[0.98] relative overflow-hidden group">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] group-hover:scale-110 transition-transform"></div>
            <span className="relative z-10">INITIATE EMERGENCY CHAT</span>
        </button>

        {/* Secondary Info */}
        <div className="mt-8 text-center">
            <p className="text-[7px] font-black text-stone-300 uppercase tracking-[0.3em]">Operational Readiness: 99.8% UP</p>
        </div>
      </div>
    </div>
  );
}

