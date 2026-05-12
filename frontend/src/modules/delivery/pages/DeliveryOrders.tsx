import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getTodayOrders } from '../../../services/api/delivery/deliveryService';
import VillageLoader from '../../../components/VillageLoader';
import { useAuth } from '../../../context/AuthContext';
import DeliveryGuestState from '../components/DeliveryGuestState';

// Icons
const Icons = {
  ChevronLeft: ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  Package: ({ size = 20, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 7.5L12 3L3 7.5v9l9 4.5l9-4.5v-9z" />
      <path d="M3 7.5l9 4.5l9-4.5" />
      <path d="M12 12v9" />
    </svg>
  ),
  Navigation: ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  )
};

export default function DeliveryOrders() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isDeliveryUser = isAuthenticated && user?.userType === 'Delivery';

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isDeliveryUser) {
      setLoading(false);
      return;
    }
    const fetchOrders = async () => {
      try {
        const data = await getTodayOrders();
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
    switch (status) {
      case 'Picked up':
      case 'Delivered':
        return 'bg-[#4A7C59]/10 text-[#4A7C59]';
      case 'Out for Delivery':
      case 'Ready for pickup':
        return 'bg-[#8B3D28]/10 text-[#8B3D28]';
      case 'Cancelled':
        return 'bg-red-50 text-red-400';
      default:
        return 'bg-stone-100 text-stone-400';
    }
  };

  if (loading) {
    return <VillageLoader />;
  }

  if (!isDeliveryUser) {
    return <DeliveryGuestState message="Please login as a delivery partner to access your active drops" />;
  }

  return (
    <div className="min-h-screen bg-transparent pb-20 font-poppins relative">
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
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 leading-none">Logistics</span>
          <span className="font-black text-[12px] text-white tracking-wide mt-1">Today's Active Drops</span>
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
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest leading-none ${getStatusStyle(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4 p-3 bg-stone-50/50 rounded-2xl border border-stone-100/50">
                  <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-[#8B3D28]/30">
                    <Icons.Navigation size={14} />
                  </div>
                  <p className="text-village-umber text-[10px] font-black leading-tight line-clamp-1 opacity-70">{order.address}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-dashed border-stone-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[10px] font-black text-stone-300">{"\u20B9"}</span>
                    <p className="text-village-umber text-sm font-black tracking-tighter">{order.totalAmount}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {[1, 2].map(i => (
                        <div key={i} className="w-5 h-5 rounded-lg bg-stone-100 border-2 border-white ring-1 ring-stone-50 shadow-sm flex items-center justify-center">
                          <Icons.Package size={10} className="text-[#8B3D28]/30" />
                        </div>
                      ))}
                    </div>
                    <p className="text-stone-400 text-[8px] font-black uppercase tracking-widest">
                      {order.items.length} Parcel Content{order.items.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {order.estimatedDeliveryTime && (
                  <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none opacity-5">
                    <Icons.Package size={100} className="text-[#8B3D28] -mr-10 -mt-10" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="village-card paper-texture organic-radius p-10 min-h-[300px] border-none shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mb-6 text-stone-100">
              <Icons.Package size={32} />
            </div>
            <p className="text-stone-300 text-[10px] font-black uppercase tracking-[0.2em]">No Manifest Records</p>
            <p className="text-stone-200 text-[8px] font-bold uppercase tracking-widest mt-2">Active runs will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}




