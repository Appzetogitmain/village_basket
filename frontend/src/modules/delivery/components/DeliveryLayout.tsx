import { ReactNode, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DeliveryBottomNav from './DeliveryBottomNav';
import { DeliveryStatusProvider, useDeliveryStatus } from '../context/DeliveryStatusContext';
import { DeliveryUserProvider, useDeliveryUser } from '../context/DeliveryUserContext';
import { getDeliveryProfile } from '../../../services/api/delivery/deliveryService';
import { useDeliveryOrderNotifications } from '../../../hooks/useDeliveryOrderNotifications';
import OrderNotificationCard from './OrderNotificationCard';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';

interface DeliveryLayoutContentProps {
  children: ReactNode;
}

function DeliveryLayoutContent({ children }: DeliveryLayoutContentProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const mainScrollRef = useRef<HTMLElement>(null);
  const { isOnline } = useDeliveryStatus();
  const { setUserName, setProfileImage } = useDeliveryUser();
  const { isAuthenticated, user } = useAuth();
  const isDeliveryUser = isAuthenticated && user?.userType === 'Delivery';
  const {
    currentNotification,
    acceptOrder,
    rejectOrder,
  } = useDeliveryOrderNotifications();

  useEffect(() => {
    if (!isDeliveryUser) return;

    const fetchProfile = async () => {
      try {
        const profile = await getDeliveryProfile();
        if (profile?.name) {
          setUserName(profile.name);
        }
        setProfileImage(profile?.profileImage || '');
      } catch (error) {
        console.error('Failed to fetch profile in layout:', error);
      }
    };

    fetchProfile();
  }, [setProfileImage, setUserName]);

  useEffect(() => {
    // Ensure each delivery page opens from the top and does not inherit
    // scroll offset from previously opened pages.
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div 
      className={`flex flex-col min-h-screen transition-all duration-300 font-poppins`}
      style={{
        backgroundColor: 'var(--village-cream, #FAF7F2)',
        backgroundImage: `linear-gradient(rgba(250, 247, 242, 0.88), rgba(250, 247, 242, 0.88)), url('/assets/delivery_bg_pattern.png')`,
        backgroundRepeat: 'repeat',
        backgroundSize: '320px',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('/assets/natural-paper.png')] z-0"></div>
      
      <main
        ref={mainScrollRef}
        className={`flex-1 overflow-y-auto scrollbar-hide pb-20 relative z-10 transition-all ${!isOnline ? 'opacity-80' : ''}`}
      >
        {children}
      </main>
      <DeliveryBottomNav />

      {/* Order Notification Card */}
      <AnimatePresence>
        {currentNotification && (
          <OrderNotificationCard
            key={currentNotification.orderId}
            notification={currentNotification}
            onAccept={(orderId) => acceptOrder(orderId, navigate)}
            onReject={rejectOrder}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface DeliveryLayoutProps {
  children: ReactNode;
}

export default function DeliveryLayout({ children }: DeliveryLayoutProps) {
  return (
    <DeliveryStatusProvider>
      <DeliveryUserProvider>
        <DeliveryLayoutContent>{children}</DeliveryLayoutContent>
      </DeliveryUserProvider>
    </DeliveryStatusProvider>
  );
}




