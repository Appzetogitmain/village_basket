import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getOrders, getOrderById, updateOrderStatus, OrderDetail, getAvailableDeliveryBoys, assignDeliveryBoy, acknowledgeOrder } from '../../../services/api/orderService';
import jsPDF from 'jspdf';

export default function SellerOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [orderStatus, setOrderStatus] = useState<string>('Out For Delivery');
  
  // Delivery Boy states
  const [availableDeliveryBoys, setAvailableDeliveryBoys] = useState<{ _id: string; name: string; mobile: string; isOnline: boolean; activeOrders?: number }[]>([]);
  const [selectedDeliveryBoys, setSelectedDeliveryBoys] = useState<string[]>([]);
  const [assigningLoading, setAssigningLoading] = useState(false);

  // Fetch order detail from API
  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!id) return;

      setLoading(true);
      setError('');
      try {
        // Try fetching directly first
        let response = await getOrderById(id);
        
        // Fallback: If not found and it looks like an Order Number (ORD...), try searching for it
        if (!response.success && (id.startsWith('ORD') || id.length > 15)) {
          const searchResponse = await getOrders({ search: id });
          if (searchResponse.success && searchResponse.data.length > 0) {
            // Found it via search, now fetch details using the real internal ID
            const realId = searchResponse.data[0].id;
            response = await getOrderById(realId);
          }
        }

        if (response.success && response.data) {
          setOrderDetail(response.data);
          setOrderStatus(response.data.status);
        } else {
          setError(response.message || 'Resource not found');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    const fetchDeliveryBoys = async () => {
      try {
        const res = await getAvailableDeliveryBoys();
        if (res.success) setAvailableDeliveryBoys(res.data);
      } catch (err) {
        console.error("Failed to fetch delivery boys", err);
      }
    };

    fetchOrderDetail();
    fetchDeliveryBoys();
  }, [id]);

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (!orderDetail) return;

    try {
      const response = await updateOrderStatus(orderDetail.id, { status: newStatus as any });
      if (response.success) {
        setOrderStatus(newStatus);
        setOrderDetail({ ...orderDetail, status: newStatus as any });
      } else {
        alert('Failed to update order status');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleAssignDeliveryBoy = async () => {
    if (!orderDetail || selectedDeliveryBoys.length === 0) {
      alert("Please select at least one delivery partner");
      return;
    }
    
    setAssigningLoading(true);
    try {
      const response = await assignDeliveryBoy(orderDetail.id, selectedDeliveryBoys);
      if (response.success) {
        alert(response.message || "Delivery partner(s) assigned successfully!");
        setOrderStatus(response.data.status);
        setSelectedDeliveryBoys([]);
        
        // Refresh order details to show new delivery boy info
        const freshOrder = await getOrderById(orderDetail.id);
        if (freshOrder.success && freshOrder.data) {
           setOrderDetail(freshOrder.data);
        }
        
      } else {
        alert(response.message || 'Failed to assign delivery partner');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign delivery partner');
    } finally {
      setAssigningLoading(false);
    }
  };

  const toggleDeliveryBoySelection = (deliveryBoyId: string) => {
    setSelectedDeliveryBoys((prev) =>
      prev.includes(deliveryBoyId)
        ? prev.filter((id) => id !== deliveryBoyId)
        : [...prev, deliveryBoyId]
    );
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
            onClick={() => navigate('/seller/orders')}
            className="bg-[#8B3D28] hover:bg-[#723221] text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!orderDetail) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Order Not Found</h2>
          <button
            onClick={() => navigate('/seller/orders')}
            className="bg-[#8B3D28] hover:bg-[#723221] text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const day = date.getDate();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';
    return `${day}${suffix} ${month}, ${year}`;
  };

  const handleExportPDF = () => {
    if (!orderDetail) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = margin;

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredHeight: number) => {
      if (yPos + requiredHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Header - Company Info
    doc.setFillColor(139, 61, 40); // Brown color (#8B3D28)
    doc.rect(margin, yPos, contentWidth, 15, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Village Basket', margin + 5, yPos + 10);

    yPos += 20;

    // Company Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Village Basket', margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('From: Village Basket', margin, yPos);
    yPos += 6;
    doc.text('Phone: 7829903973', margin, yPos);
    yPos += 6;
    doc.text('Email: info@villagebasket.com', margin, yPos);
    yPos += 6;
    doc.text('Website: https://villagebasket.com', margin, yPos);
    yPos += 12;

    // Invoice Details (Right aligned)
    const rightX = pageWidth - margin;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${formatDate(orderDetail.orderDate)}`, rightX, yPos - 30, { align: 'right' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Order ID: #${orderDetail.invoiceNumber}`, rightX, yPos - 20, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Delivery Date: ${formatDate(orderDetail.deliveryDate)}`, rightX, yPos - 8, { align: 'right' });
    doc.text(`Time Slot: ${orderDetail.timeSlot}`, rightX, yPos - 2, { align: 'right' });

    // Status badge
    const statusWidth = doc.getTextWidth(orderStatus) + 8;
    doc.setFillColor(59, 130, 246); // Blue for status
    doc.roundedRect(rightX - statusWidth, yPos + 2, statusWidth, 6, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(orderStatus, rightX - statusWidth / 2, yPos + 5.5, { align: 'center' });

    yPos += 15;
    doc.setTextColor(0, 0, 0);

    // Draw a line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Table Header
    checkPageBreak(20);
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos, contentWidth, 10, 'F');

    const colWidths = [
      contentWidth * 0.08,  // Sr. No.
      contentWidth * 0.40,  // Product
      contentWidth * 0.15,  // Price
      contentWidth * 0.15,  // Tax
      contentWidth * 0.10,  // Qty
      contentWidth * 0.12,  // Subtotal
    ];

    let xPos = margin;
    const headers = ['Sr. No.', 'Product', 'Price', 'Tax ₹ (%)', 'Qty', 'Subtotal'];

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);

    headers.forEach((header, index) => {
      doc.text(header, xPos + 2, yPos + 7);
      xPos += colWidths[index];
    });

    yPos += 12;

    // Table Rows
    orderDetail.items.forEach((item, index) => {
      checkPageBreak(15);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      xPos = margin;
      const rowData = [
        String(index + 1),
        item.product,
        `₹${item.price.toFixed(2)}`,
        `${item.tax.toFixed(2)} (${item.taxPercent.toFixed(2)}%)`,
        item.qty.toString(),
        `₹${item.subtotal.toFixed(2)}`,
      ];

      rowData.forEach((data, index) => {
        // Truncate long text
        const maxWidth = colWidths[index] - 4;
        let text = data;
        if (doc.getTextWidth(text) > maxWidth && index === 1) {
          // Truncate product name if too long
          while (doc.getTextWidth(text + '...') > maxWidth && text.length > 0) {
            text = text.slice(0, -1);
          }
          text += '...';
        }
        doc.text(text, xPos + 2, yPos + 5);
        xPos += colWidths[index];
      });

      // Draw row separator
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, yPos + 8, pageWidth - margin, yPos + 8);

      yPos += 10;
    });

    // Calculate totals
    const totalSubtotal = orderDetail.items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalTax = orderDetail.items.reduce((sum, item) => sum + item.tax, 0);
    const grandTotal = totalSubtotal + totalTax;

    yPos += 5;
    checkPageBreak(30);

    // Totals Section
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', pageWidth - margin - 60, yPos, { align: 'right' });
    doc.text(`₹${totalSubtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 7;

    doc.text('Tax:', pageWidth - margin - 60, yPos, { align: 'right' });
    doc.text(`₹${totalTax.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 7;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Grand Total:', pageWidth - margin - 60, yPos, { align: 'right' });
    doc.text(`₹${grandTotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 15;

    // Footer
    checkPageBreak(20);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Bill Generated by Village Basket', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    doc.setFontSize(8);
    doc.text('Copyright Â© {new Date().getFullYear()}. Developed By Village Basket', pageWidth / 2, yPos, { align: 'center' });

    // Save the PDF
    const fileName = `Invoice_${orderDetail.invoiceNumber}_${orderDetail.id}.pdf`;
    doc.save(fileName);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'bg-blue-100 text-blue-800 border border-blue-400';
      case 'Processed':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-400';
      case 'On the way':
        return 'bg-purple-100 text-purple-800 border border-purple-400';
      case 'Delivered':
        return 'bg-green-100 text-green-800 border border-green-400';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border border-red-400';
      case 'Out For Delivery':
        return 'bg-blue-600 text-white border border-blue-700';
      case 'Received':
        return 'bg-blue-50 text-blue-600 border border-blue-200';
      case 'Payment Pending':
        return 'bg-orange-50 text-orange-600 border border-orange-200';
      default:
        return 'bg-gray-50 text-gray-600 border border-gray-200';
    }
  };

  const formatUnit = (unit: string, qty: number) => {
    if (!unit || unit === 'N/A') return 'N/A';

    // improved regex to handle decimals and various spacing
    const match = unit.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
    if (match) {
      const val = parseFloat(match[1]);
      const u = match[2];
      // check if val is a valid number
      if (!isNaN(val)) {
        const total = val * qty;
        // Format to remove trailing zeros if integer (e.g. 1.0 -> 1)
        return `${parseFloat(total.toFixed(2))}${u}`;
      }
    }
    return `${unit} x ${qty}`;
  };

  const assignedPartnerIds = new Set(
    orderDetail.assignedDeliveryBoys?.map((partner) => partner.id) || []
  );

  return (
    <div className="min-h-screen bg-white/40 pb-8">
      {/* Order Action Section */}
      <div className="bg-white/90 backdrop-blur-md border-white/20 mb-6 rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="bg-[#8B3D28] text-white px-4 sm:px-6 py-3">
          <h2 className="text-base sm:text-lg font-semibold">Order Action Section</h2>
        </div>
        <div className="bg-white/40 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full sm:w-auto">
              {orderStatus === 'Received' ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStatusUpdate('Accepted')}
                    className="flex-1 bg-[#8B3D28] hover:bg-[#723221] text-white px-6 py-2 rounded-lg transition-colors font-medium shadow-sm"
                  >
                    Accept Order
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to reject this order? This cannot be undone.')) {
                        handleStatusUpdate('Rejected');
                      }
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors font-medium shadow-sm"
                  >
                    Reject Order
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <select
                    value={orderStatus}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    className="w-full sm:w-64 px-4 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-900 bg-white/90 backdrop-blur-md border-white/20 focus:outline-none focus:ring-2 focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                    disabled={orderStatus === 'Rejected' || orderStatus === 'Cancelled' || orderStatus === 'Delivered'}
                  >
                    <option value="Accepted">Accepted</option>
                    <option value="Processed">Processed</option>
                    <option value="On the way">On the way</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                    {orderStatus === 'Rejected' && <option value="Rejected">Rejected</option>}
                  </select>

                  {(orderStatus === 'Cancelled' || orderStatus === 'Rejected') && !orderDetail.isRefunded && (
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to approve the refund for this order?')) {
                          try {
                            const res = await acknowledgeOrder(orderDetail.id);
                            if (res.success) {
                              alert("Refund approved successfully!");
                              setOrderDetail({ ...orderDetail, isRefunded: true });
                            }
                          } catch (err: any) {
                             alert(err.response?.data?.message || 'Failed to approve refund');
                          }
                        }
                      }}
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors font-bold shadow-md"
                    >
                      Acknowledge & Approve Refund
                    </button>
                  )}
                  {(orderStatus === 'Cancelled' || orderStatus === 'Rejected') && orderDetail.isRefunded && (
                    <span className="text-green-600 font-bold bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 text-sm">
                      ✅ Refund Processed
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 bg-[#8B3D28] hover:bg-[#723221] text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Export Invoice PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-[#8B3D28] hover:bg-[#723221] text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print Invoice
            </button>
          </div>
          
          {/* Manual Delivery Boy Assignment Section */}
          {(orderStatus === 'Accepted' || orderStatus === 'Processed') && (
             <div className="mt-6 border-t border-neutral-200 pt-5 w-full">
               <h3 className="text-sm font-semibold text-neutral-800 mb-3">
                  Assign Delivery Partner(s)
                  {orderDetail?.assignedDeliveryBoys && orderDetail.assignedDeliveryBoys.length > 0 && (
                    <span className="text-[#8B3D28] ml-1 text-xs">
                      ({orderDetail.assignedDeliveryBoys.length} assigned)
                    </span>
                  )}
               </h3>

               {orderDetail?.assignedDeliveryBoys && orderDetail.assignedDeliveryBoys.length > 0 && (
                 <div className="mb-4 flex flex-wrap gap-2">
                   {orderDetail.assignedDeliveryBoys.map((partner) => (
                     <span
                       key={partner.id}
                       className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-800 border border-orange-200"
                     >
                       {partner.name} ({partner.mobile})
                     </span>
                   ))}
                 </div>
               )}

               <div className="flex flex-col gap-3">
                 <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded-lg bg-white/90 p-2 space-y-1">
                   {availableDeliveryBoys.length === 0 ? (
                     <p className="text-sm text-neutral-500 px-2 py-3">No online delivery partners available</p>
                   ) : (
                     availableDeliveryBoys.map((boy) => {
                       const isAlreadyAssigned = assignedPartnerIds.has(boy._id);
                       const isSelected = selectedDeliveryBoys.includes(boy._id);
                       return (
                         <label
                           key={boy._id}
                           className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                             isAlreadyAssigned
                               ? 'bg-neutral-100 opacity-60 cursor-not-allowed'
                               : isSelected
                                 ? 'bg-orange-50 border border-orange-200'
                                 : 'hover:bg-neutral-50'
                           }`}
                         >
                           <input
                             type="checkbox"
                             checked={isSelected}
                             disabled={isAlreadyAssigned}
                             onChange={() => toggleDeliveryBoySelection(boy._id)}
                             className="rounded border-neutral-300 text-[#8B3D28] focus:ring-[#8B3D28]"
                           />
                           <span className="text-sm text-neutral-900 flex-1">
                             {boy.name} ({boy.mobile}) {boy.isOnline ? '🟢 Online' : '⚪ Offline'}
                             {(boy.activeOrders ?? 0) > 0 && (
                               <span className="ml-2 text-xs text-neutral-500">
                                 · {boy.activeOrders} active order{boy.activeOrders === 1 ? '' : 's'}
                               </span>
                             )}
                             {isAlreadyAssigned && (
                               <span className="ml-2 text-xs text-green-700 font-medium">Already assigned</span>
                             )}
                           </span>
                         </label>
                       );
                     })
                   )}
                 </div>
                 
                 <button
                   onClick={handleAssignDeliveryBoy}
                   disabled={selectedDeliveryBoys.length === 0 || assigningLoading}
                   className="w-full sm:w-auto bg-[#e67e22] hover:bg-[#d35400] disabled:opacity-50 text-white px-6 py-2 rounded-lg transition-colors font-medium shadow-sm whitespace-nowrap"
                 >
                   {assigningLoading
                     ? 'Assigning...'
                     : selectedDeliveryBoys.length > 1
                       ? `Assign ${selectedDeliveryBoys.length} Partners`
                       : 'Assign Partner'}
                 </button>
               </div>
             </div>
          )}
        </div>
      </div>

      {/* View Order Details Section */}
      <div className="bg-white/90 backdrop-blur-md border-white/20 rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="bg-[#8B3D28] text-white px-4 sm:px-6 py-3">
          <h2 className="text-base sm:text-lg font-semibold">View Order Details</h2>
        </div>
        <div className="bg-white/90 backdrop-blur-md border-white/20 px-4 sm:px-6 py-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between gap-6 mb-6">
            {/* Left: Company Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-[#8B3D28] rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">A</span>
                </div>
                <div>
                  <div className="text-xs text-[#8B3D28] font-semibold">Village Basket</div>
                  <div className="text-[10px] text-[#8B3D28]">in 10 Minutes</div>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">Village Basket</h1>
              <div className="text-sm text-neutral-600 mb-1">
                <span className="font-medium">From:</span> Village Basket
              </div>
              <div className="text-sm text-neutral-600 space-y-1">
                <div>
                  <span className="font-medium">Phone:</span> 7829903973
                </div>
                <div>
                  <span className="font-medium">Email:</span> info@villagebasket.com
                </div>
                <div>
                  <span className="font-medium">Website:</span> https://villagebasket.com
                </div>
              </div>
            </div>

            {/* Right: Invoice Details */}
            <div className="flex-1 lg:text-right">
              <div className="text-sm text-neutral-600 mb-4">
                <span className="font-medium">Date:</span> {formatDate(orderDetail.orderDate)}
              </div>
              <div className="text-lg font-semibold text-neutral-900 mb-1">Order ID: #{orderDetail.invoiceNumber}</div>
              <div className="text-sm text-neutral-600 mb-1">
                <span className="font-medium">Delivery Date:</span> {formatDate(orderDetail.deliveryDate)}
              </div>
              <div className="text-sm text-neutral-600 mb-3">
                <span className="font-medium">Time Slot:</span> {orderDetail.timeSlot}
              </div>
              <div className="flex items-center gap-2 lg:justify-end mb-2">
                <span className="text-sm font-medium text-neutral-700">Payment:</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                  orderDetail.paymentMethod === 'COD' 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : 'bg-green-50 text-green-700 border-green-200'
                }`}>
                  {orderDetail.paymentMethod || 'COD'} ({orderDetail.paymentStatus || 'Pending'})
                </span>
              </div>
              <div className="flex items-center gap-2 lg:justify-end">
                <span className="text-sm font-medium text-neutral-700">Order Status:</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(orderStatus)}`}>
                  {orderStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Product Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full min-w-[800px]">
              <thead className="bg-white/40 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Sr. No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Tax ₹ (%)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-white/90 backdrop-blur-md border-white/20 divide-y divide-neutral-200">
                {orderDetail.items.map((item, index) => (
                  <tr key={`${item.product}-${index}`}>
                    <td className="px-4 py-3 text-sm text-neutral-900">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-neutral-900">{item.product}</td>
                    <td className="px-4 py-3 text-sm text-neutral-900">{formatUnit(item.unit, item.qty)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-900">₹{item.price.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {item.tax.toFixed(2)} ({item.taxPercent.toFixed(2)}%)
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-900">{item.qty}</td>
                    <td className="px-4 py-3 text-sm text-neutral-900 font-medium">₹{item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bill Generation Note */}
          <div className="border-t border-dashed border-neutral-300 pt-4">
            <p className="text-sm text-neutral-600 text-center">
              Bill Generated by Village Basket
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-6 px-4 sm:px-6 text-center py-4 bg-neutral-100 rounded-lg">
        <p className="text-xs sm:text-sm text-neutral-600">
          Copyright © {new Date().getFullYear()}. Developed By{' '}
          <span className="font-semibold text-[#8B3D28]">Village Basket</span>
        </p>
      </footer>
    </div>
  );
}




