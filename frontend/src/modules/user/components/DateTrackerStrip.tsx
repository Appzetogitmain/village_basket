import React, { useEffect, useState, useRef } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { useDateTracker } from '../../../context/DateTrackerContext';
import { useAuth } from '../../../context/AuthContext';
import { getOrdersByDateRange } from '../../../services/api/customerOrderService';

export default function DateTrackerStrip() {
  const { selectedDeliveryDate, setSelectedDeliveryDate } = useDateTracker();
  const { isAuthenticated } = useAuth();
  const [dates, setDates] = useState<Date[]>([]);
  const [orderDates, setOrderDates] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Normalize to noon to avoid timezone shifts
    const next15Days = Array.from({ length: 15 }, (_, i) => addDays(today, i));
    setDates(next15Days);
    
    // Set today as default if none selected
    if (!selectedDeliveryDate) {
      setSelectedDeliveryDate(today);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && dates.length > 0) {
      const fetchOrderStatuses = async () => {
        try {
          const startDate = dates[0].toISOString();
          const endDate = dates[dates.length - 1].toISOString();
          const response = await getOrdersByDateRange(startDate, endDate);
          if (response.success) {
            setOrderDates(response.data);
          }
        } catch (error) {
          console.error("Error fetching order dates:", error);
        }
      };
      fetchOrderStatuses();
    }
  }, [isAuthenticated, dates]);

  const getStatusColor = (date: Date) => {
    const order = orderDates.find(o => isSameDay(new Date(o.deliverySlot.date), date));
    if (!order) return null;

    if (order.status === 'Delivered') return 'bg-green-500';
    
    const upcomingStatuses = [
      'Received', 'Accepted', 'Pending', 'Processed', 
      'Ready for pickup', 'Picked up', 'Shipped', 'Out for Delivery'
    ];
    
    if (upcomingStatuses.includes(order.status)) return 'bg-blue-500';
    if (order.status === 'Vacation') return 'bg-yellow-500';
    if (order.status === 'On Hold') return 'bg-red-500';
    
    return null;
  };

  return (
    <div className="w-full px-4 mb-6 relative z-20">
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {dates.map((date, idx) => {
          const isSelected = selectedDeliveryDate && isSameDay(selectedDeliveryDate, date);
          const isToday = isSameDay(new Date(), date);
          const dotColor = getStatusColor(date);

          return (
            <button
              key={idx}
              onClick={() => setSelectedDeliveryDate(date)}
              className={`flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 active:scale-95 ${
                isSelected 
                  ? 'bg-[#8B3D28] text-white shadow-lg scale-105' 
                  : 'bg-white border border-neutral-100 text-village-umber shadow-sm hover:border-[#8B3D28]/30'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-white/70' : 'text-neutral-400'}`}>
                {format(date, 'EEE')}
              </span>
              <span className="text-lg font-black mt-0.5">
                {format(date, 'd')}
              </span>
              <div className="h-1.5 mt-1.5 flex gap-0.5">
                {dotColor && <div className={`w-1.5 h-1.5 rounded-full ${dotColor} shadow-[0_0_4px_rgba(0,0,0,0.2)]`}></div>}
                {isToday && !dotColor && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/30' : 'bg-neutral-200'}`}></div>}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm"></div>
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Delivered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm"></div>
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Upcoming</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-sm"></div>
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Vacation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm"></div>
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">On Hold</span>
        </div>
      </div>
    </div>
  );
}
