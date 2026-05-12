import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";
import { selfDeleteDeliveryAccount } from "../../../services/api/delivery/deliveryAccountService";
import { useToast } from "../../../context/ToastContext";

// Icons
const Icons = {
  ChevronLeft: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Wallet: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  History: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Coins: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18" /><path d="M7 6h1v4" /><path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Help: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Info: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  LogOut: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  Trash: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
};

export default function DeliveryMenu() {
  const navigate = useNavigate();
  const { logout, isAuthenticated, user } = useAuth();
  const isDeliveryUser = isAuthenticated && user?.userType === 'Delivery';
  const { showToast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const menuItems = [
    { id: "menu-1", title: "Personal Profile", route: "/delivery/profile", icon: Icons.User },
    { id: "menu-w", title: "Payment Wallet", route: "/delivery/wallet", icon: Icons.Wallet },
    { id: "menu-history", title: "Manifest History", route: "/delivery/orders/all", icon: Icons.History },
    { id: "menu-2", title: "Daily Earnings", route: "/delivery/earnings", icon: Icons.Coins },
    { id: "menu-3", title: "App Settings", route: "/delivery/settings", icon: Icons.Settings },
    { id: "menu-4", title: "Support Hub", route: "/delivery/help", icon: Icons.Help },
    { id: "menu-5", title: "Legal & About", route: "/delivery/about", icon: Icons.Info },
    { id: "menu-6", title: "Detach Session", route: "/delivery/login", icon: Icons.LogOut, danger: true },
    { id: "menu-delete", title: "Delete Account", route: "delete-account", icon: Icons.Trash, danger: true },
  ];

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      const res = await selfDeleteDeliveryAccount();
      if (res.success) {
        setDeleteSuccess(true);
        setTimeout(() => {
          logout();
          localStorage.removeItem("delivery_user_name");
          localStorage.removeItem("delivery_user_profile_image");
          navigate("/delivery/login", { replace: true });
        }, 2000);
      } else {
        showToast(res.message || "Failed to delete account", "error");
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || "An error occurred", "error");
    } finally {
      setIsDeleting(false);
      if (!deleteSuccess) setShowDeleteConfirm(false);
    }
  };

  const handleMenuClick = (route: string) => {
    if (route === "delete-account") {
      setShowDeleteConfirm(true);
    } else if (route === "/delivery/login") {
      // Clear all delivery related session data
      logout(); // This handles tokens and user object in the global state
      localStorage.removeItem("delivery_user_name");
      localStorage.removeItem("delivery_user_profile_image");

      // Navigate to login with replace to prevent going back to the menu
      navigate("/delivery/login", { replace: true });
    } else {
      navigate(route);
    }
  };

  // Guest — show login prompt instead of blank screen
  if (!isDeliveryUser) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center pb-20 px-6 text-center font-poppins">
        <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[url('/assets/natural-paper.png')] z-0"></div>
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-[#8B3D28]/10 flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#8B3D28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <div>
            <h2 className="text-[#8B3D28] font-black text-sm uppercase tracking-[0.2em] mb-2">Login Required</h2>
            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
              Please login to access<br />the menu
            </p>
          </div>
          <button
            onClick={() => navigate('/delivery/login')}
            className="px-10 py-3.5 bg-[#8B3D28] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-[#8B3D28]/20 active:scale-95 transition-all"
          >
            Login / Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-20 font-poppins relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[url('/assets/natural-paper.png')] z-0"></div>

      {/* Header Area */}
      <div className="bg-[#8B3D28] px-6 py-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('/assets/natural-paper.png')]"></div>
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Navigation Center</p>
          <h1 className="text-white text-3xl font-black tracking-tighter">Command Menu</h1>
        </div>
      </div>

      <div className="px-6 -mt-6 relative z-20">
        <div className="space-y-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.route)}
              className={`w-full village-card paper-texture organic-radius p-4 border-none shadow-sm flex items-center justify-between transition-all active:scale-[0.98] group ${item.danger ? 'bg-red-50/50' : 'bg-white'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${item.danger
                  ? 'bg-red-100 text-red-500'
                  : 'bg-stone-50 text-[#8B3D28]/40 group-hover:bg-[#8B3D28]/10 group-hover:text-[#8B3D28]'
                  }`}>
                  <item.icon />
                </div>
                <span className={`text-[11px] font-black uppercase tracking-widest text-left ${item.danger ? 'text-red-600/80' : 'text-village-umber'}`}>
                  {item.title}
                </span>
              </div>

              <div className={`${item.danger ? 'text-red-300' : 'text-stone-200'} group-hover:translate-x-1 transition-transform`}>
                <Icons.ChevronRight />
              </div>
            </button>
          ))}
        </div>

        {/* Branding Footer */}
        <div className="mt-12 flex flex-col items-center opacity-30">
          <div className="h-[1px] w-12 bg-stone-300 mb-4"></div>
          <p className="text-[8px] font-black text-stone-400 uppercase tracking-[0.4em]">Village Basket Partners</p>
          <p className="text-[7px] font-bold text-stone-400 uppercase tracking-widest mt-1">Version 2.4.0 (Stable)</p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && !deleteSuccess && setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white paper-texture organic-radius shadow-2xl overflow-hidden p-6 text-center"
            >
              {deleteSuccess ? (
                <div className="py-4">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-village-umber uppercase tracking-widest mb-2">Success!</h3>
                  <p className="text-xs text-stone-500 font-bold leading-relaxed">
                    Your account has been successfully deleted.
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icons.Trash />
                  </div>
                  <h3 className="text-lg font-black text-village-umber uppercase tracking-widest mb-2">Delete Account?</h3>
                  <p className="text-xs text-stone-500 font-bold leading-relaxed mb-6">
                    Are you sure you want to delete your account? <br />
                    <span className="text-red-500">This action cannot be undone.</span>
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="w-full bg-red-600 text-white py-3 organic-radius text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-red-200 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isDeleting ? "Processing..." : "Yes, Delete Account"}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="w-full bg-stone-100 text-stone-600 py-3 organic-radius text-[10px] font-black uppercase tracking-[0.2em] active:scale-[0.98] transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
