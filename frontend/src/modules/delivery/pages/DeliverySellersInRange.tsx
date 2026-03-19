import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDeliveryStatus } from '../context/DeliveryStatusContext';
import VillageLoader from '../../../components/VillageLoader';

// Icons
const Icons = {
    ChevronLeft: ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
        </svg>
    ),
    Location: ({ size = 18 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    ),
    Store: ({ size = 18 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
    Signal: ({ size = 16 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 20h.01" />
            <path d="M7 20v-4" />
            <path d="M12 20v-8" />
            <path d="M17 20v-12" />
            <path d="M22 20v-16" />
        </svg>
    )
};

export default function DeliverySellersInRange() {
  const navigate = useNavigate();
  const { isOnline, sellersInRange, isLoadingSellers, locationError } = useDeliveryStatus();
  const [error, setError] = useState('');

  useEffect(() => {
    if (locationError) {
      setError(locationError);
    }
  }, [locationError]);

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center pb-24 px-6 font-poppins relative">
        <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] z-0"></div>
        
        <div className="village-card paper-texture organic-radius p-8 bg-white shadow-2xl border-none flex flex-col items-center text-center max-w-xs relative z-10 scale-95 opacity-90 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-stone-50 rounded-3xl flex items-center justify-center mb-6 text-stone-200">
            <Icons.Signal size={32} />
          </div>
          <h2 className="text-[#8B3D28] text-xs font-black uppercase tracking-[0.3em] mb-3">System Offline</h2>
          <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest leading-relaxed mb-8">CONNECTION REQUIRED TO BROADCAST STORE PROXIMITY</p>
          <button
            onClick={() => navigate('/delivery')}
            className="w-full bg-[#8B3D28] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-[#8B3D28]/20 active:scale-95 transition-all outline-none border-none"
          >
            RESTORE DASHBOARD
          </button>
        </div>
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
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 leading-none">Operational Map</span>
              <span className="font-black text-[12px] text-white tracking-wide mt-1">Sellers in Range</span>
          </div>
      </div>

      <div className="px-6 py-6 relative z-10">
        <div className="flex items-center justify-between mb-8">
            <div className="h-[2px] w-8 bg-stone-200 rounded-full"></div>
            <p className="text-stone-300 text-[9px] font-black uppercase tracking-[0.3em]">PROXIMITY MANIFEST</p>
            <div className="h-[2px] w-8 bg-stone-200 rounded-full"></div>
        </div>

        {isLoadingSellers ? (
          <VillageLoader message="Mapping Nearby Villages" />
        ) : error ? (
          <div className="village-card paper-texture organic-radius p-4 bg-red-50 border border-red-100 text-[#8B3D28] text-[9px] font-black uppercase tracking-widest text-center">
            {error}
          </div>
        ) : sellersInRange.length > 0 ? (
          <div className="space-y-5">
            {sellersInRange.map((seller) => (
              <div
                key={seller._id}
                className="village-card paper-texture organic-radius p-6 bg-white shadow-sm border-none group transition-all active:scale-[0.98] animate-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-village-umber font-black text-sm tracking-tight">{seller.storeName}</h3>
                      <span className="px-2 py-1 bg-[#8B3D28]/10 text-[#8B3D28] text-[8px] font-black uppercase tracking-widest rounded-lg border border-[#8B3D28]/10">
                        BROADCASTING
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-400 text-[10px] font-bold mb-5 opacity-70">
                      <Icons.Location size={12} />
                      <span className="truncate max-w-[180px] uppercase tracking-tight">{seller.address || 'LOC-DATA UNAVAILABLE'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-50">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-stone-300 uppercase tracking-widest font-black mb-1">TX DISTANCE</span>
                        <span className="text-[12px] font-black text-village-umber italic">
                          {(seller.distanceFromDeliveryBoy / 1000).toFixed(2)} KM
                        </span>
                      </div>
                      <div className="flex flex-col border-l border-stone-50 pl-4">
                        <span className="text-[8px] text-stone-300 uppercase tracking-widest font-black mb-1">SERVICE RADIUS</span>
                        <span className="text-[12px] font-black text-[#4A7C59] italic">
                          {seller.serviceRadiusKm} KM
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex flex-col items-center">
                    <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-[#8B3D28]/40 group-hover:bg-[#8B3D28]/10 group-hover:text-[#8B3D28] transition-all shadow-inner">
                      <Icons.Store size={20} />
                    </div>
                    <div className="h-4 w-[2px] bg-stone-50 my-2"></div>
                    <div className="w-2 h-2 rounded-full bg-[#4A7C59] animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="village-card paper-texture organic-radius p-16 bg-white flex flex-col items-center justify-center border-none shadow-sm opacity-60 grayscale scale-95 min-h-[50vh]">
            <div className="w-16 h-16 rounded-3xl bg-stone-50 flex items-center justify-center text-stone-200 mb-6">
                <Icons.Store size={32} />
            </div>
            <p className="text-stone-300 text-[10px] font-black uppercase tracking-[0.3em] text-center">No Active Beacons</p>
            <p className="text-stone-200 text-[8px] font-bold uppercase tracking-widest mt-2">SECTOR IS CURRENTLY SILENT</p>
          </div>
        )}
      </div>
    </div>
  );
}
