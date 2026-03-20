import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { updateSettings, getDeliveryProfile } from '../../../services/api/delivery/deliveryService';
import VillageLoader from '../../../components/VillageLoader';

// Icons
const Icons = {
    ChevronLeft: ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
        </svg>
    ),
    ChevronRight: ({ size = 16 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
        </svg>
    ),
    Settings: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    )
};

export default function DeliverySettings() {
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const profile = await getDeliveryProfile();
        if (profile.settings) {
          setNotificationsEnabled(profile.settings.notifications ?? true);
          setLocationEnabled(profile.settings.location ?? true);
          setSoundEnabled(profile.settings.sound ?? true);
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSettingChange = async (key: string, value: boolean) => {
    if (key === 'notifications') setNotificationsEnabled(value);
    if (key === 'location') setLocationEnabled(value);
    if (key === 'sound') setSoundEnabled(value);

    try {
      await updateSettings({ [key]: value });
    } catch (error) {
      console.error("Failed to update settings", error);
    }
  };

  const settingsOptions = [
    {
      id: 'notifications',
      title: 'Transmission Alerts',
      description: 'Notify me of incoming assignments',
      value: notificationsEnabled,
      onChange: (val: boolean) => handleSettingChange('notifications', val),
    },
    {
      id: 'location',
      title: 'Geospatial Tracking',
      description: 'Allow access to device coordinates',
      value: locationEnabled,
      onChange: (val: boolean) => handleSettingChange('location', val),
    },
    {
      id: 'sound',
      title: 'Acoustic Feedback',
      description: 'Play auditory signals for events',
      value: soundEnabled,
      onChange: (val: boolean) => handleSettingChange('sound', val),
    },
  ];

  if (loading) {
    return <VillageLoader message="Configuring Logistics" />;
  }

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
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 leading-none">Preferences</span>
              <span className="font-black text-[12px] text-white tracking-wide mt-1">System Configuration</span>
          </div>
      </div>

      <div className="px-6 py-6 relative z-10">
        {/* Settings Group: Preferences */}
        <div className="mb-8">
            <h3 className="text-[#8B3D28] text-[9px] font-black uppercase tracking-[0.3em] mb-4 ml-1">Core Protocols</h3>
            <div className="village-card paper-texture organic-radius bg-white divide-y divide-stone-100 overflow-hidden shadow-sm border-none pr-2 pl-2">
                {settingsOptions.map((option) => (
                    <div key={option.id} className="p-4 flex items-center justify-between">
                        <div className="flex-1 pr-4">
                            <p className="text-village-umber text-[11px] font-black uppercase tracking-tight mb-1">{option.title}</p>
                            <p className="text-stone-400 text-[8px] font-black uppercase tracking-widest leading-relaxed opacity-70">{option.description}</p>
                        </div>
                        <button
                            onClick={() => option.onChange(!option.value)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all active:scale-90 ${
                                option.value ? 'bg-[#8B3D28] shadow-[0_0_8px_rgba(139,61,40,0.3)]' : 'bg-stone-200'
                            }`}
                        >
                            <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-300 shadow-sm ${
                                    option.value ? 'translate-x-5' : 'translate-x-0.5'
                                }`}
                            />
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {/* Settings Group: Legal & Other */}
        <div className="mb-8">
            <h3 className="text-[#8B3D28] text-[9px] font-black uppercase tracking-[0.3em] mb-4 ml-1">Documentation</h3>
            <div className="village-card paper-texture organic-radius bg-white divide-y divide-stone-100 overflow-hidden shadow-sm border-none pr-2 pl-2">
                {[
                    { label: 'Primary Language', sub: 'English (US)', route: null },
                    { label: 'Privacy Protocols', sub: 'Policy Framework', route: '/delivery/privacy' },
                    { label: 'Service Mandate', sub: 'Terms & Conditions', route: '/delivery/terms' }
                ].map((item, idx) => (
                    <button key={idx} className="w-full p-4 flex items-center justify-between group active:bg-stone-50 transition-colors">
                        <div className="text-left">
                            <p className="text-village-umber text-[11px] font-black uppercase tracking-tight mb-1">{item.label}</p>
                            <p className="text-stone-300 text-[8px] font-black uppercase tracking-widest">{item.sub}</p>
                        </div>
                        <div className="text-stone-200 group-hover:translate-x-1 group-hover:text-[#8B3D28]/30 transition-all pr-2">
                            <Icons.ChevronRight />
                        </div>
                    </button>
                ))}
            </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-12 flex flex-col items-center">
            <div className="w-8 h-[1px] bg-stone-200 mb-6"></div>
            <div className="flex flex-col items-center gap-1.5 opacity-30">
                <p className="text-[8px] font-black text-stone-400 uppercase tracking-[0.4em]">VB-CORE STABLE</p>
                <p className="text-[7px] font-bold text-stone-300 uppercase tracking-widest">BUILD ID: VB-PRT-2.4.0</p>
            </div>
        </div>
      </div>
    </div>
  );
}

