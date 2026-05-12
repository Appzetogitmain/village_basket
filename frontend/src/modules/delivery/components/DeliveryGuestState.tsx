import { useNavigate } from "react-router-dom";

export default function DeliveryGuestState({ message = "Please login as a delivery partner to access this page" }: { message?: string }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center pb-32 gap-6 px-8 text-center font-poppins relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[url('/assets/natural-paper.png')] z-0"></div>
      
      <div className="relative">
        <div className="w-24 h-24 bg-gradient-to-br from-[#8B3D28]/10 to-[#8B3D28]/5 rounded-[2.5rem] flex items-center justify-center text-[#8B3D28] mb-2 shadow-inner">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
          </svg>
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-[#8B3D28]/10">
           <span className="text-[14px]">🔐</span>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-village-umber font-black text-xl uppercase tracking-widest leading-none">Login First</h2>
        <div className="h-1 w-12 bg-[#8B3D28]/10 rounded-full mx-auto"></div>
        <p className="text-stone-400 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed max-w-[240px] mx-auto opacity-80">
          {message}
        </p>
      </div>

      <button
        onClick={() => navigate('/delivery/login')}
        className="w-full max-w-[220px] py-4 bg-[#8B3D28] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl shadow-[#8B3D28]/30 active:scale-95 transition-all relative overflow-hidden group"
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/assets/natural-paper.png')] group-hover:scale-110 transition-transform"></div>
        <span className="relative z-10">Identify Yourself</span>
      </button>

      <div className="absolute bottom-10 opacity-20 text-center">
         <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Village Basket Logistics Network</p>
      </div>
    </div>
  );
}
