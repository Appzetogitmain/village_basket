import { useNavigate } from 'react-router-dom';

// Icons
const Icons = {
    ChevronLeft: ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
        </svg>
    )
};

export default function DeliveryPrivacy() {
    const navigate = useNavigate();

    const sections = [
        {
            title: "Your Location",
            content: "We track your location so customers can see where their order is. This works even if the app is closed, so we can send you orders that are nearby."
        },
        {
            title: "Your Information",
            content: "We use your profile info and how many deliveries you finish to calculate your payments correctly."
        },
        {
            title: "App Permissions",
            content: "The app needs your camera to take photos of delivered orders and your location to find the best routes for you."
        },
        {
            title: "Sharing Data",
            content: "We never sell your data. We only show your location to a customer while you are delivering their specific order."
        }
    ];

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
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 leading-none">Settings</span>
                    <span className="font-black text-[12px] text-white tracking-wide mt-1">Privacy Policy</span>
                </div>
            </div>

            <div className="px-6 py-6 relative z-10">
                <div className="space-y-6">
                    {sections.map((section, idx) => (
                        <div key={idx} className="village-card paper-texture organic-radius p-6 border-none shadow-sm bg-white">
                            <h4 className="text-[#8B3D28] text-[11px] font-black uppercase tracking-widest mb-3">{section.title}</h4>
                            <p className="text-black text-[10px] font-semibold leading-relaxed">
                                {section.content}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center opacity-30">
                    <p className="text-[7px] font-black text-stone-400 uppercase tracking-[0.4em]">Last Updated: April 2026</p>
                </div>
            </div>
        </div>
    );
}
