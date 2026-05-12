import { useEffect, useState } from 'react';
import { getNotifications, markNotificationRead } from '../../../services/api/delivery/deliveryService';
import VillageLoader from '../../../components/VillageLoader';
import { useAuth } from '../../../context/AuthContext';
import DeliveryGuestState from '../components/DeliveryGuestState';

// Icons
const Icons = {
  Package: ({ size = 18, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 7.5L12 3L3 7.5v9l9 4.5l9-4.5v-9z" />
      <path d="M3 7.5l9 4.5l9-4.5" />
      <path d="M12 12v9" />
    </svg>
  ),
  Bell: ({ size = 18, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  ChevronLeft: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
};

export default function DeliveryNotifications() {
  const { isAuthenticated, user } = useAuth();
  const isDeliveryUser = isAuthenticated && user?.userType === 'Delivery';

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isDeliveryUser) {
      setLoading(false);
      return;
    }
    fetchNotifications();
  }, [isDeliveryUser]);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'JUST NOW';
    if (diffInMinutes < 60) return `${diffInMinutes}M AGO`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}H AGO`;
    return `${Math.floor(diffInMinutes / 1440)}D AGO`;
  };

  if (loading) {
    return <VillageLoader message="Updating Notices" />;
  }

  if (!isDeliveryUser) {
    return <DeliveryGuestState message="Please login as a delivery partner to view your real-time operational alerts" />;
  }

  return (
    <div className="min-h-screen bg-transparent pb-20 font-poppins relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[url('/assets/natural-paper.png')] z-0"></div>

      {/* Local Header */}
      <div className="sticky top-0 z-30 bg-[#8B3D28] px-4 py-3 flex items-center shadow-md overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/assets/natural-paper.png')]"></div>
        <div className="ml-2 flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 leading-none">Intelligence</span>
          <span className="font-black text-[12px] text-white tracking-wide mt-1">Operational Briefings</span>
        </div>
      </div>

      <div className="px-6 py-6 relative z-10">
        {notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification._id}
                onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                className={`village-card paper-texture organic-radius p-5 border-none shadow-sm transition-all active:scale-[0.98] group relative overflow-hidden ${notification.isRead ? 'bg-white opacity-80' : 'bg-stone-50 ring-2 ring-[#8B3D28]/10'
                  }`}
              >
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${notification.type?.toLowerCase() === 'order'
                      ? 'bg-[#4A7C59]/10 text-[#4A7C59]'
                      : 'bg-stone-100 text-[#8B3D28]/30'
                    }`}>
                    {notification.type?.toLowerCase() === 'order' ? <Icons.Package /> : <Icons.Bell />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-village-umber text-sm font-black tracking-tight leading-none truncate">{notification.title}</h3>
                      <span className="text-stone-300 text-[8px] font-black uppercase tracking-widest shrink-0">{formatTime(notification.createdAt)}</span>
                    </div>
                    <p className="text-stone-500 text-[10px] font-black leading-relaxed opacity-70 line-clamp-2">{notification.message}</p>
                  </div>

                  {!notification.isRead && (
                    <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-[#8B3D28] animate-pulse shadow-[0_0_8px_rgba(139,61,40,0.5)]"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="village-card paper-texture organic-radius p-10 min-h-[300px] border-none shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mb-6 text-stone-100">
              <Icons.Bell size={32} />
            </div>
            <p className="text-stone-300 text-[10px] font-black uppercase tracking-[0.2em]">Zero Intercepts</p>
            <p className="text-stone-200 text-[8px] font-bold uppercase tracking-widest mt-2">No active briefings at this moment</p>
          </div>
        )}
      </div>
    </div>
  );
}
