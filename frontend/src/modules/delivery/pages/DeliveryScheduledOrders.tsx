import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getScheduledOrders } from '../../../services/api/delivery/deliveryService';
import VillageLoader from '../../../components/VillageLoader';

// Icons
const Icons = {
  ChevronLeft: ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  Calendar: ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Clock: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Package: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 7.5L12 3L3 7.5v9l9 4.5l9-4.5v-9z" />
      <path d="M3 7.5l9 4.5l9-4.5" />
      <path d="M12 12v9" />
    </svg>
  )
};

export default function DeliveryScheduledOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getScheduledOrders();
        setOrders(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load scheduled orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return <VillageLoader />;
  }

  return (
    <div className="min-h-screen bg-transparent pb-24 font-poppins relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[url('/assets/natural-paper.png')] z-0"></div>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#8B3D28] px-4 py-3 flex items-center shadow-md overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/assets/natural-paper.png')]"></div>
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-white/80 hover:bg-white/10 rounded-xl transition-all active:scale-90"
        >
          <Icons.ChevronLeft size={20} />
        </button>
        <div className="ml-2 flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 leading-none">Planning</span>
          <span className="font-black text-[12px] text-white tracking-wide mt-1">Scheduled Deliveries</span>
        </div>
      </div>

      <div className="px-6 py-6 relative z-10">
        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/delivery/orders/${order.id}`)}
                className="village-card paper-texture organic-radius p-5 border-none shadow-sm cursor-pointer active:scale-[0.98] transition-all group relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col">
                    <p className="text-[11px] font-black text-village-umber uppercase tracking-tight mb-0.5">{order.orderId ? `#${order.orderId.slice(-8)}` : 'N/A'}</p>
                    <p className="text-stone-400 text-[9px] font-black uppercase tracking-widest">{order.customerName}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-[#8B3D28]/5 rounded-lg border border-[#8B3D28]/10 mb-1">
                      <Icons.Calendar size={12} className="text-[#8B3D28]" />
                      <span className="text-[#8B3D28] text-[9px] font-black uppercase tracking-tight">
                        {order.scheduledDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-stone-50 rounded-md border border-stone-100">
                      <Icons.Clock size={10} className="text-stone-400" />
                      <span className="text-stone-400 text-[8px] font-black uppercase tracking-tight">
                        {order.timeSlot}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4 p-3 bg-stone-50/50 rounded-2xl border border-stone-100/50">
                  <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-[#8B3D28]/30">
                    <Icons.Package size={14} />
                  </div>
                  <p className="text-village-umber text-[10px] font-black leading-tight line-clamp-1 opacity-70">{order.address}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-dashed border-stone-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] font-black text-stone-300">{"\u20B9"}</span>
                    <p className="text-village-umber text-sm font-black tracking-tighter">{order.totalAmount}</p>
                  </div>

                  <p className="text-stone-400 text-[8px] font-black uppercase tracking-widest">
                    {order.items.length} Parcel Content{order.items.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="village-card paper-texture organic-radius p-10 min-h-[300px] border-none shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mb-6 text-stone-100">
              <Icons.Calendar size={32} />
            </div>
            <p className="text-stone-300 text-[10px] font-black uppercase tracking-[0.2em]">No Future Manifests</p>
            <p className="text-stone-200 text-[8px] font-bold uppercase tracking-widest mt-2">Upcoming deliveries will show here</p>
          </div>
        )}
      </div>
    </div>
  );
}
