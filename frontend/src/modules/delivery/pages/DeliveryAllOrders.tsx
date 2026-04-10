import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getAllOrdersHistory } from '../../../services/api/delivery/deliveryService';
import VillageLoader from '../../../components/VillageLoader';

// Icons
const Icons = {
  ChevronLeft: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  History: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Package: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 7.5L12 3L3 7.5v9l9 4.5l9-4.5v-9z" />
      <path d="M3 7.5l9 4.5l9-4.5" />
      <path d="M12 12v9" />
    </svg>
  )
};

export default function DeliveryAllOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getAllOrdersHistory();
        setOrders(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('delivered')) return 'text-[#4A7C59] bg-[#4A7C59]/10 ring-1 ring-[#4A7C59]/20';
    if (s.includes('pickup') || s.includes('ready')) return 'text-[#8B3D28] bg-[#8B3D28]/10 ring-1 ring-[#8B3D28]/20';
    if (s.includes('cancel') || s.includes('return')) return 'text-red-600 bg-red-50 ring-1 ring-red-100';
    return 'text-stone-500 bg-stone-100 ring-1 ring-stone-200';
  };

  if (loading) {
    return <VillageLoader message="Fetching Assigned Orders" />;
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
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 leading-none">Archives</span>
          <span className="font-black text-[12px] text-white tracking-wide mt-1">Order History Log</span>
        </div>
      </div>

      <div className="px-6 py-6 relative z-10">
        {error && <div className="p-4 mb-6 text-[10px] font-black uppercase tracking-widest text-[#8B3D28] bg-red-50 rounded-2xl border border-red-100 text-center">{error}</div>}

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="village-card paper-texture organic-radius p-5 bg-white shadow-sm border-none transition-all active:scale-[0.98] cursor-pointer hover:shadow-md"
                onClick={() => navigate(`/delivery/orders/${order.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-stone-300 text-[8px] font-black uppercase tracking-widest mb-1">TX-MANIFEST ID</p>
                    <p className="text-village-umber font-black text-[13px] tracking-tight">{order.orderId}</p>
                  </div>
                  <span className={`px-2.5 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${getStatusStyle(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-5 pt-4 border-t border-stone-50">
                  <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-300 shadow-inner">
                    <Icons.Package />
                  </div>
                  <div className="flex-1">
                    <p className="text-village-umber text-[11px] font-black uppercase leading-tight line-clamp-1">{order.customerName}</p>
                    <p className="text-stone-400 text-[9px] font-black uppercase tracking-widest opacity-70 mt-1 line-clamp-1">{order.address}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                  <div className="flex flex-col gap-1">
                    <p className="text-stone-300 text-[7px] font-black uppercase tracking-widest">TRANSMISSION EPOCH</p>
                    <p className="text-stone-400 text-[9px] font-bold uppercase tracking-tight">
                      {new Date(order.createdAt).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      }).toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-stone-300 text-[7px] font-black uppercase tracking-widest mb-1">TOTAL VALUATION</p>
                    <p className="text-village-umber text-sm font-black tracking-tighter italic">{"\u20B9"} {order.totalAmount}</p>
                    {order.deliveryEarning > 0 && (
                      <p className="text-[#4A7C59] text-[9px] font-black uppercase tracking-widest mt-1 opacity-80">+ {"\u20B9"}{order.deliveryEarning}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="village-card paper-texture organic-radius p-12 bg-white flex flex-col items-center justify-center border-none shadow-sm opacity-60 grayscale scale-95 min-h-[50vh]">
            <div className="w-16 h-16 rounded-3xl bg-stone-50 flex items-center justify-center text-stone-200 mb-6">
              <Icons.History />
            </div>
            <p className="text-stone-300 text-[10px] font-black uppercase tracking-[0.3em] text-center">No Archives Found</p>
            <p className="text-stone-200 text-[8px] font-bold uppercase tracking-widest mt-2">MANIFEST IS CURRENTLY EMPTY</p>
          </div>
        )}
      </div>
    </div>
  );
}

