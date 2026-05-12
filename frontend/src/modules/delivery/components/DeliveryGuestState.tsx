import { useNavigate } from "react-router-dom";

export default function DeliveryGuestState({ message = "Please login to access the menu" }: { message?: string }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center pb-20 px-6 text-center font-poppins relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[url('/assets/natural-paper.png')] z-0"></div>
      
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-[#8B3D28]/10 flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#8B3D28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>

        <div>
          <h2 className="text-[#8B3D28] font-black text-sm uppercase tracking-[0.2em] mb-2">Login Required</h2>
          <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed max-w-[250px] mx-auto">
            {message}
          </p>
        </div>

        <button
          onClick={() => navigate('/delivery/login')}
          className="px-10 py-3.5 bg-[#8B3D28] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-[#8B3D28]/20 active:scale-95 transition-all"
        >
          Login / Sign Up
        </button>
      </div>

      <div className="absolute bottom-10 opacity-20 text-center">
         <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Village Basket Logistics Network</p>
      </div>
    </div>
  );
}
