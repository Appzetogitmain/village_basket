import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../hooks/useOrders';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Delivered':
      return 'bg-green-100 text-[#4A7C59]';
    case 'On the way':
      return 'bg-blue-100 text-blue-700';
    case 'Accepted':
      return 'bg-amber-100 text-amber-700';
    case 'Received':
      return 'bg-neutral-100 text-neutral-500';
    default:
      return 'bg-neutral-100 text-neutral-500';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function Orders() {
  const { orders } = useOrders();
  const navigate = useNavigate();

  return (
    <div className="pb-24 min-h-screen">
      {/* Village Themed Header - Compact */}
      <div className="px-4 py-3 bg-[#8B3D28] border-b border-white/10 mb-4 sticky top-0 z-20 flex items-center gap-2 shadow-lg">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
        <button 
          onClick={() => navigate(-1)} 
          className="p-1.5 text-white hover:bg-white/10 rounded-full transition-all active:scale-95 z-10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[12px] font-black text-white uppercase tracking-[0.2em] font-poppins z-10">My Orders</h1>
        <div className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-[8px] font-black text-white uppercase tracking-tighter z-10">
          {orders.length} Orders
        </div>
      </div>

      <div className="px-4 space-y-3">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center px-8">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center text-4xl mb-4 opacity-50">
              📦
            </div>
            <h2 className="text-[14px] font-black text-village-umber mb-2 uppercase tracking-widest">No orders yet</h2>
            <p className="text-[10px] text-neutral-400 mb-8 font-bold leading-relaxed max-w-[200px] mx-auto italic">
              Start shopping to see your village treasures here!
            </p>
            <button 
              onClick={() => navigate('/user')} 
              className="bg-[#4A7C59] text-white rounded-xl h-9 px-6 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#4A7C59]/20"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              onClick={() => navigate(`/user/orders/${order.id}`)}
              className="village-card paper-texture organic-radius p-3 active:scale-[0.98] transition-all cursor-pointer bg-white relative shadow-sm border border-neutral-100/50"
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] font-black text-village-umber/40 uppercase tracking-tighter">Order</span>
                  <h4 className="text-[10px] font-black text-village-umber uppercase truncate max-w-[160px]">#{order.id}</h4>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${getStatusColor(order.status)}`}>
                      {order.status === 'Received' ? 'Order Placed' : order.status}
                    </span>
                    <span className="text-xs font-black text-village-umber">{"\u20B9"}{order.totalAmount.toFixed(0)}</span>
                  </div>
                  <span className="text-[9px] font-bold text-neutral-400 italic">
                    {order.totalItems} {order.totalItems === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-1 border-t border-village-umber/5 pt-2">
                <div className="text-[9px] font-bold text-neutral-500">{formatDate(order.createdAt)}</div>
                <div className="flex items-center gap-1">
                  <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center text-[7px] font-black text-neutral-400 border border-neutral-200 uppercase">
                    {order.status.charAt(0)}
                  </div>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-village-umber/20">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
