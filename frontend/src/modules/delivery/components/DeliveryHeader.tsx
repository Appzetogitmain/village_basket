import { useDeliveryStatus } from '../context/DeliveryStatusContext';
import { useDeliveryUser } from '../context/DeliveryUserContext';

interface DeliveryHeaderProps {
  userName?: string;
}

export default function DeliveryHeader({ userName }: DeliveryHeaderProps) {
  const { isOnline, setIsOnline } = useDeliveryStatus();
  const { userName: contextUserName, profileImage } = useDeliveryUser();
  const displayName = userName || contextUserName;

  return (
    <div className={`relative ${isOnline ? 'bg-[#8B3D28]' : 'bg-stone-500'} transition-colors shadow-md overflow-hidden pt-env-top`}>
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>

      <div className="px-4 py-3 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
            Village Basket <span className="text-white/40 ml-1">| Partners</span>
          </h1>
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isOnline ? 'bg-white/10 ring-1 ring-white/20' : 'bg-stone-400'
            }`}>
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={`${displayName || 'Partner'} profile`}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="2" fill="none"/>
                  <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-white/60 text-[9px] font-bold uppercase tracking-tight">Partner Dashboard</span>
              <span className="text-white text-[11px] font-black tracking-wide leading-none mt-1">{displayName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[8px] font-bold uppercase tracking-wider ${isOnline ? 'text-green-300' : 'text-stone-300'}`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`relative w-8 h-4 rounded-full transition-all active:scale-95 ${
                isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-stone-400'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                  isOnline ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {!isOnline && (
          <div className="flex justify-end mt-2">
            <div className="bg-white/10 px-2 py-1 rounded-lg">
              <span className="text-[8px] font-black text-white/90 uppercase tracking-widest animate-pulse">
                Go online to receive orders
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

