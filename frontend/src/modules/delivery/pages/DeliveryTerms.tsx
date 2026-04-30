import { useNavigate } from 'react-router-dom';

// Icons
const Icons = {
    ChevronLeft: ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
        </svg>
    )
};

export default function DeliveryTerms() {
    const navigate = useNavigate();

    const sections = [
        {
            title: "Working with Us",
            content: "You are working as an independent partner, not a direct employee. You manage your own time and deliveries."
        },
        {
            title: "Your Duties",
            content: "Please be professional with customers, handle food carefully, and update the app as you finish each delivery step."
        },
        {
            title: "Payments",
            content: "You earn money for every successful delivery. We may hold payments if there are serious issues like fake orders or customer complaints."
        },
        {
            title: "Safety First",
            content: "You must keep your vehicle in good shape and always follow traffic rules. Your safety and the safety of others is the top priority."
        },
        {
            title: "Closing your Account",
            content: "We may stop your access to the app if you break the rules, get very low ratings, or fail to follow these guidelines."
        }
    ];

    return (
        <div className="min-h-screen bg-transparent pb-24 font-poppins relative">
            <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[url('/assets/natural-paper.png')] z-0"></div>

            {/* Local Header */}
            <div className="sticky top-0 z-30 bg-[#8B3D28] px-4 py-3 flex items-center shadow-md overflow-hidden shrink-0">
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/assets/natural-paper.png')]"></div>
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-white/80 hover:bg-white/10 rounded-xl transition-all active:scale-90"
                >
                    <Icons.ChevronLeft size={20} />
                </button>
                <div className="ml-2 flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 leading-none">Settings</span>
                    <span className="font-black text-[12px] text-white tracking-wide mt-1">Terms of Service</span>
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
