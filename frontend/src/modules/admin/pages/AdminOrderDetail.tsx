import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getOrderById, updateOrderStatus, Order } from '../../../services/api/admin/adminOrderService';
import { getCustomerById, Customer } from '../../../services/api/admin/adminCustomerService';

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(false);

  // Fetch order detail from API
  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!id) return;

      setLoading(true);
      setError('');
      try {
        const response = await getOrderById(id);
        if (response.success && response.data) {
          setOrder(response.data);
        } else {
          setError(response.message || 'Failed to fetch order details');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id]);

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    setUpdating(true);
    try {
      const response = await updateOrderStatus(order._id, { status: newStatus });
      if (response.success && response.data) {
        setOrder(response.data);
        alert('Order status updated successfully');
      } else {
        alert('Failed to update order status');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-neutral-500">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/admin/orders/all')}
            className="bg-[#A54B31] hover:opacity-90 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Order Not Found</h2>
          <button
            onClick={() => navigate('/admin/orders/all')}
            className="bg-[#A54B31] hover:opacity-90 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const customer = typeof order.customer === 'object' ? order.customer : null;
  const deliveryBoy = typeof order.deliveryBoy === 'object' ? order.deliveryBoy : null;
  const items = Array.isArray(order.items) ? order.items : [];

  const handleViewCustomer = async () => {
    const customerId = typeof order?.customer === 'object' ? (order?.customer as any)._id : order?.customer;
    if (!customerId) {
        alert("Customer ID not found for this order");
        return;
    }
    
    setLoadingCustomer(true);
    try {
      const response = await getCustomerById(customerId);
      if (response.success && response.data) {
        setSelectedCustomer(response.data);
        setIsCustomerModalOpen(true);
      } else {
        alert('Failed to load customer details');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to load customer details');
    } finally {
      setLoadingCustomer(false);
    }
  };

  const statusOptions = [
    'Received',
    'Pending',
    'Processed',
    'Shipped',
    'Out for Delivery',
    'Delivered',
    'Cancelled',
    'Rejected',
    'Returned',
  ];

  return (
    <div className="px-3 py-2 sm:p-3 lg:p-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/orders/all')}
          className="text-[#A54B31] hover:text-teal-700 mb-4 flex items-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </button>
        <h1 className="text-2xl font-bold text-neutral-900">Order Details</h1>
        <p className="text-neutral-600 mt-1">Order #{order.orderNumber}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status */}
          <div className="bg-white rounded-lg shadow p-3">
            <h2 className="text-lg font-semibold mb-4">Order Status</h2>
            <div className="mb-4">
              <label className="block text-[11px] font-black text-neutral-600 font-outfit uppercase tracking-wider mb-2">
                Current Status
              </label>
              <select
                value={order.status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                disabled={updating}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B3D28]"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gapx-3 py-2 text-sm">
              <div>
                <span className="text-neutral-600">Order Date:</span>
                <span className="ml-2 font-medium">{formatDate(order.orderDate)}</span>
              </div>
              <div>
                <span className="text-neutral-600">Payment Status:</span>
                <span className="ml-2 font-medium capitalize">{order.paymentStatus}</span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-lg shadow p-3">
            <h2 className="text-lg font-semibold mb-4">Order Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Product</th>
                    <th className="text-right py-2 px-2">Price</th>
                    <th className="text-right py-2 px-2">Qty</th>
                    <th className="text-right py-2 px-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, index: number) => {
                    const product = typeof item.product === 'object' ? item.product : null;
                    const seller = typeof item.seller === 'object' ? item.seller : null;
                    return (
                      <tr key={item._id || index} className="border-b">
                        <td className="py-3 px-2">
                          <div>
                            <div className="font-medium">{item.productName || product?.productName || 'N/A'}</div>
                            {seller && (
                              <div className="text-sm text-neutral-500">
                                Seller: {seller.storeName || seller.sellerName}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="text-right py-3 px-2">{"\u20B9"}{item.unitPrice?.toFixed(2) || '0.00'}</td>
                        <td className="text-right py-3 px-2">{item.quantity || 0}</td>
                        <td className="text-right py-3 px-2 font-medium">
                          {"\u20B9"}{item.total?.toFixed(2) || '0.00'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-lg shadow p-3">
            <h2 className="text-lg font-semibold mb-4">Delivery Address</h2>
            <div className="text-neutral-700">
              <p className="font-medium">{order.customerName}</p>
              <p>{order.deliveryAddress.address}</p>
              <p>
                {order.deliveryAddress.city}, {order.deliveryAddress.state || ''} -{' '}
                {order.deliveryAddress.pincode}
              </p>
              {order.deliveryAddress.landmark && (
                <p className="text-sm text-neutral-500">Landmark: {order.deliveryAddress.landmark}</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div 
            className="bg-white rounded-lg shadow p-3 cursor-pointer hover:ring-2 hover:ring-[#8B3D28]/40 transition-all group relative"
            onClick={handleViewCustomer}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold">Customer Information</h2>
              {loadingCustomer ? (
                <div className="w-5 h-5 border-2 border-[#8B3D28]/30 border-t-[#8B3D28] rounded-full animate-spin"></div>
              ) : (
                <div className="text-[10px] font-black text-[#8B3D28] uppercase tracking-widest bg-[#FAF7F2] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                  View Detail
                </div>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-neutral-600">Name:</span>
                <span className="ml-2 font-medium">{order.customerName}</span>
              </div>
              <div>
                <span className="text-neutral-600">Email:</span>
                <span className="ml-2 font-medium">{order.customerEmail}</span>
              </div>
              <div>
                <span className="text-neutral-600">Phone:</span>
                <span className="ml-2 font-medium">{order.customerPhone}</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow p-3">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Subtotal:</span>
                <span className="font-medium">{"\u20B9"}{order.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Tax:</span>
                <span className="font-medium">{"\u20B9"}{order.tax?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Shipping:</span>
                <span className="font-medium">{"\u20B9"}{order.shipping?.toFixed(2) || '0.00'}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span className="font-medium">-{"\u20B9"}{(order.discount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                <span>Total:</span>
                <span>{"\u20B9"}{order.total?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          {deliveryBoy && (
            <div className="bg-white rounded-lg shadow p-3">
              <h2 className="text-lg font-semibold mb-4">Delivery Information</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-neutral-600">Delivery Boy:</span>
                  <span className="ml-2 font-medium">{deliveryBoy.name}</span>
                </div>
                {deliveryBoy.mobile && (
                  <div>
                    <span className="text-neutral-600">Mobile:</span>
                    <span className="ml-2 font-medium">{deliveryBoy.mobile}</span>
                  </div>
                )}
                {order.deliveryBoyStatus && (
                  <div>
                    <span className="text-neutral-600">Status:</span>
                    <span className="ml-2 font-medium capitalize">{order.deliveryBoyStatus}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow p-3">
            <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-neutral-600">Method:</span>
                <span className="ml-2 font-medium">{order.paymentMethod}</span>
              </div>
              <div>
                <span className="text-neutral-600">Status:</span>
                <span className="ml-2 font-medium capitalize">{order.paymentStatus}</span>
              </div>
              {order.paymentId && (
                <div>
                  <span className="text-neutral-600">Payment ID:</span>
                  <span className="ml-2 font-medium text-xs">{order.paymentId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Detail Modal - Consistent with AdminManageCustomer design */}
      {isCustomerModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#2D1610]/80 backdrop-blur-md animate-fade-in transition-all">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up border border-white/20 relative">
            {/* Header section with profile name */}
            <div className="bg-gradient-to-br from-[#A54B31] to-[#8B3D28] p-6 pb-10 relative">
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                  <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full w-fit">
                    <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Customer Profile</span>
                  </div>
                  <h2 className="text-2xl font-black text-white font-outfit uppercase tracking-tight mt-1">
                    {selectedCustomer.name}
                  </h2>
                </div>
                <button
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white hover:text-[#8B3D28] transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Info Cards */}
            <div className="p-6 -mt-6 relative z-10">
              <div className="bg-white rounded-[1.5rem] shadow-xl p-5 border border-neutral-100 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 flex flex-col">
                    <span className="text-[9px] font-black text-[#8B3D28]/40 uppercase tracking-widest mb-1">Status</span>
                    <span className={`w-fit px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${selectedCustomer.status === 'Active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                      {selectedCustomer.status}
                    </span>
                  </div>
                  <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 flex flex-col">
                    <span className="text-[9px] font-black text-[#8B3D28]/40 uppercase tracking-widest mb-1">Wallet Card</span>
                    <span className="text-xs font-black text-neutral-900 font-mono uppercase">{selectedCustomer.refCode || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-3 px-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#FAF7F2] rounded-lg text-[#8B3D28]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </div>
                    <span className="text-xs font-bold text-neutral-700">{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#FAF7F2] rounded-lg text-[#8B3D28]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </div>
                    <span className="text-xs font-black text-neutral-900">{selectedCustomer.phone || 'N/A'}</span>
                  </div>
                </div>

                <div className="bg-[#FAF7F2]/60 rounded-xl p-4 grid grid-cols-2 gap-4 border border-[#8B3D28]/5">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-[#A54B31] uppercase tracking-widest mb-1">Total Orders</span>
                    <span className="text-xl font-black text-neutral-900 font-outfit">{selectedCustomer.totalOrders}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-[#A54B31] uppercase tracking-widest mb-1">Total Spent</span>
                    <span className="text-xl font-black text-neutral-900 font-outfit">{"\u20B9"}{(selectedCustomer.totalSpent || 0).toFixed(0)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="w-full py-3 bg-[#8B3D28] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-neutral-900 transition-all active:scale-95 mt-2 shadow-lg shadow-[#8B3D28]/20"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}








