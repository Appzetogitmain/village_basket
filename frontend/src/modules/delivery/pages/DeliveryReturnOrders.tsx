import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getReturnOrders } from '../../../services/api/delivery/deliveryService';
import VillageLoader from '../../../components/VillageLoader';

// Icons
const Icons = {
    ChevronLeft: ({ size = 20 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
        </svg>
    ),
    RotateCcw: ({ size = 18 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
    ),
    Package: ({ size = 14 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7.5L12 3L3 7.5v9l9 4.5l9-4.5v-9z" />
            <path d="M3 7.5l9 4.5l9-4.5" />
            <path d="M12 12v9" />
        </svg>
    ),
    Clock: ({ size = 12 }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
};

export default function DeliveryReturnOrders() {
  const navigate = useNavigate();
  const [returnOrders, setReturnOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getReturnOrders();
        setReturnOrders(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load return orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusStyle = (status: string) => {
    return 'text-red-600 bg-red-50 ring-1 ring-red-100';
  };

  if (loading) {
    return <VillageLoader message="Processing Return Requests" />;
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
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 leading-none">Reversals</span>
              <span className="font-black text-[12px] text-white tracking-wide mt-1">Return Orders</span>
          </div>
      </div>

      <div className="px-6 py-6 relative z-10">
        <div className="flex items-center justify-between mb-8">
            <div className="h-[2px] w-8 bg-stone-200 rounded-full"></div>
            <p className="text-stone-300 text-[9px] font-black uppercase tracking-[0.3em]">REVERSAL MANIFEST</p>
            <div className="h-[2px] w-8 bg-stone-200 rounded-full"></div>
        </div>

        {error && <div className="p-4 mb-6 text-[10px] font-black uppercase tracking-widest text-[#8B3D28] bg-red-50 rounded-2xl border border-red-100 text-center">{error}</div>}

        {returnOrders.length > 0 ? (
          <div className="space-y-5">
            {returnOrders.map((order) => (
              <div
                key={order.id}
                className="village-card paper-texture organic-radius p-5 bg-white shadow-sm border-none transition-all active:scale-[0.98] cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-stone-300 text-[8px] font-black uppercase tracking-widest mb-1">REVERSAL TX-ID</p>
                    <p className="text-village-umber font-black text-[13px] tracking-tight">{order.orderId}</p>
                  </div>
                  <span className={`px-2.5 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${getStatusStyle(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-5 pt-4 border-t border-stone-50">
                    <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-300 shadow-inner">
                        <Icons.Package size={14} />
                    </div>
                    <div className="flex-1">
                        <p className="text-village-umber text-[11px] font-black uppercase leading-tight line-clamp-1">{order.customerName}</p>
                        <p className="text-stone-400 text-[9px] font-black uppercase tracking-widest opacity-70 mt-1 line-clamp-1">{order.address}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                  <div className="flex items-center gap-2">
                       <div className="p-1 rounded-md bg-stone-50 text-stone-300"><Icons.Clock size={12} /></div>
                       <p className="text-stone-400 text-[9px] font-black uppercase tracking-tight">
                         {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                       </p>
                  </div>
                  <div className="text-right">
                      <p className="text-stone-300 text-[7px] font-black uppercase tracking-widest mb-0.5">EST. VALUATION</p>
                      <p className="text-village-umber text-sm font-black tracking-tighter italic">₹ {order.totalAmount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="village-card paper-texture organic-radius p-16 bg-white flex flex-col items-center justify-center border-none shadow-sm opacity-60 grayscale scale-95 min-h-[50vh]">
            <div className="w-16 h-16 rounded-3xl bg-stone-50 flex items-center justify-center text-stone-200 mb-6">
                <Icons.RotateCcw size={32} />
            </div>
            <p className="text-stone-300 text-[10px] font-black uppercase tracking-[0.3em] text-center">No Reversals</p>
            <p className="text-stone-200 text-[8px] font-bold uppercase tracking-widest mt-2">ALL SYSTEMS COMMITTED</p>
          </div>
        )}
      </div>
    </div>
  );
}

