import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import DeliveryHeader from "../components/DeliveryHeader";
import SummaryBar from "../components/SummaryBar";
import DashboardCard from "../components/DashboardCard";
import DeliveryBottomNav from "../components/DeliveryBottomNav";
import { getDashboardStats } from "../../../services/api/delivery/deliveryService";
import { useDeliveryStatus } from "../context/DeliveryStatusContext";
import VillageLoader from "../../../components/VillageLoader";

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const { isOnline, sellersInRangeCount, locationError } = useDeliveryStatus();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Icons for dashboard cards (Keep existing SVGs)
  const pendingOrderIcon = (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 17H4L5 12H19L20 17H22M2 17C2 18.1046 2.89543 19 4 19C5.10457 19 6 18.1046 6 17M2 17C2 15.8954 2.89543 15 4 15C5.10457 15 6 15.8954 6 17M22 17C22 18.1046 21.1046 19 20 19C18.8954 19 18 18.1046 18 17M22 17C22 15.8954 21.1046 15 20 15C18.8954 15 18 15.8954 18 17M6 17H18M5 12L4 7H2M20 12L21 7H22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M8 10H10M12 10H14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );

  const allOrderIcon = (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 17H4L5 12H19L20 17H22M2 17C2 18.1046 2.89543 19 4 19C5.10457 19 6 18.1046 6 17M2 17C2 15.8954 2.89543 15 4 15C5.10457 15 6 15.8954 6 17M22 17C22 18.1046 21.1046 19 20 19C18.8954 19 18 18.1046 18 17M22 17C22 15.8954 21.1046 15 20 15C18.8954 15 18 15.8954 18 17M6 17H18M5 12L4 7H2M20 12L21 7H22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect
        x="7"
        y="5"
        width="10"
        height="6"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="8"
        y="3"
        width="8"
        height="4"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );

  const returnOrderIcon = (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect
        x="6"
        y="6"
        width="12"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );

  const returnItemIcon = (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 12L7 8M3 12L7 16M3 12H21M21 12L17 8M21 12L17 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );

  const dailyCollectionIcon = (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <rect
        x="2"
        y="6"
        width="20"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M6 10H18M6 14H14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M9 17L11 19L15 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  const cashBalanceIcon = (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <rect
        x="2"
        y="6"
        width="20"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M6 10H18M6 14H14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle
        cx="16"
        cy="12"
        r="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );

  const earningIcon = (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <rect
        x="2"
        y="6"
        width="20"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M6 10H18M6 14H14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M16 12H20M18 10V14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );

  if (loading) {
    return <VillageLoader message="Preparing Your Dashboard" />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center pb-20">
        <p className="text-red-500">{error}</p>
        <DeliveryBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-32">
      {/* Header */}
      <DeliveryHeader />

      <div className="px-4 py-5 space-y-5 relative z-10">
        {/* Daily Collection & Cash Balance Bar */}
        <SummaryBar
          leftIcon={dailyCollectionIcon}
          leftLabel="Daily Collection"
          leftValue={`\u20B9 ${stats?.dailyCollection?.toLocaleString("en-IN") || "0"}`}
          rightIcon={cashBalanceIcon}
          rightLabel="Cash Balance"
          rightValue={`\u20B9 ${stats?.cashBalance?.toFixed(2) || "0.00"}`}
          accentColor="#8B3D28"
        />

        {/* Wallet Balance Card - Village Themed Gradient */}
        <div
          onClick={() => navigate("/delivery/wallet")}
          className="bg-gradient-to-br from-[#8B3D28] to-[#3D2B1F] organic-radius p-4 text-white shadow-lg shadow-[#8B3D28]/20 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden group">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
          
          <div className="flex items-center justify-between mb-2 relative z-10">
            <p className="text-white/60 text-[8px] font-black uppercase tracking-[0.2em]">Partner Wallet Balance</p>
            <div className="bg-white/10 p-1.5 rounded-xl backdrop-blur-sm ring-1 ring-white/10">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
          </div>
          <div className="flex items-end justify-between relative z-10">
            <p className="text-2xl font-black tracking-tight">
              {"\u20B9"} {stats?.walletBalance?.toFixed(2) || "0.00"}
            </p>
            <div className="px-2 py-1 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all group-hover:bg-white/20">
              View History
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Real-time Seller Radius Indicator */}
        <div
          onClick={() => isOnline && navigate("/delivery/sellers-in-range")}
          className={`village-card paper-texture organic-radius p-4 border-none cursor-pointer transition-all active:scale-[0.98] ${isOnline ? 'ring-2 ring-[#4A7C59]/10' : 'opacity-60'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isOnline ? "bg-[#4A7C59]/10 text-[#4A7C59]" : "bg-stone-200 text-stone-400"}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="flex flex-col">
                <h3 className={`text-[10px] font-black uppercase tracking-widest leading-none mb-1.5 ${isOnline ? "text-[#4A7C59]" : "text-stone-500"}`}>
                  {isOnline ? "Active Radius" : "Device Offline"}
                </h3>
                <p className="text-stone-400 text-[9px] font-bold leading-none">
                  {isOnline
                    ? `Tracking ${sellersInRangeCount} Seller Hubs`
                    : "Connect to receive real-time pings"}
                </p>
              </div>
            </div>
            {isOnline && (
              <div className="flex items-center gap-2 bg-stone-50 px-2 py-1.5 rounded-xl border border-stone-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4A7C59] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4A7C59]"></span>
                </span>
                <span className="text-sm font-black text-village-umber">
                  {sellersInRangeCount}
                </span>
              </div>
            )}
          </div>
          {locationError && isOnline && (
            <div className="mt-3 p-2 bg-red-50 organic-radius border border-red-100 text-[8px] font-black text-red-600 flex items-center gap-2 uppercase tracking-tight">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {locationError}
            </div>
          )}
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          <DashboardCard
            icon={pendingOrderIcon}
            title="Today's Pending"
            value={stats?.pendingOrders || 0}
            accentColor="#8B3D28"
            onClick={() => navigate("/delivery/orders/pending")}
          />
          <DashboardCard
            icon={allOrderIcon}
            title="Total Orders"
            value={stats?.allOrders || 0}
            accentColor="#3D2B1F"
            onClick={() => navigate("/delivery/orders/all")}
          />
          <DashboardCard
            icon={returnOrderIcon}
            title="Returns Today"
            value={stats?.returnOrders || 0}
            accentColor="#f97316"
            onClick={() => navigate("/delivery/orders/return")}
          />
          <DashboardCard
            icon={returnItemIcon}
            title="In Possession"
            value={stats?.returnItems || 0}
            accentColor="#4A7C59"
            onClick={() => navigate("/delivery/orders")}
          />
        </div>

        {/* Today's Earning Summary Bar */}
        <SummaryBar
          leftIcon={earningIcon}
          leftLabel="Today's Earning"
          leftValue={`\u20B9 ${stats?.todayEarning || 0}`}
          rightIcon={cashBalanceIcon}
          rightLabel="Total Earnings"
          rightValue={`\u20B9 ${stats?.totalEarning?.toFixed(2) || "0.00"}`}
          accentColor="#4A7C59"
        />

        {/* Today's Pending Order Section */}
        <div className="pt-2">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-village-umber text-xs font-black uppercase tracking-[0.2em] opacity-80">
              Live Pending tasks
            </h2>
            <div className="h-[2px] w-12 bg-village-umber/5 rounded-full"></div>
          </div>
          
          {stats?.pendingOrdersList && stats.pendingOrdersList.length > 0 ? (
            <div className="space-y-3.5">
              {stats.pendingOrdersList.map((order: any) => (
                <div
                  key={order.id}
                  className="village-card paper-texture organic-radius p-4 border-none shadow-sm cursor-pointer transition-all active:scale-[0.98]"
                  onClick={() => navigate(`/delivery/orders/${order.id}`)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex flex-col">
                      <p className="text-village-umber font-black text-[11px] uppercase tracking-wide">
                        {order.orderId}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-1 h-1 rounded-full bg-stone-300"></div>
                        <p className="text-stone-500 text-[9px] font-bold uppercase tracking-tight">
                          {order.customerName}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                        order.status === "Ready for pickup"
                          ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                          : "bg-[#4A7C59]/10 text-[#4A7C59] ring-1 ring-[#4A7C59]/20"
                      }`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="bg-stone-50/50 p-2.5 rounded-xl border border-stone-100/50 mb-3">
                    <p className="text-stone-500 text-[9px] font-bold leading-relaxed line-clamp-1">
                      <span className="text-[#8B3D28]/40 mr-1 opacity-50 font-black">📍</span>
                      {order.address}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-village-umber font-black text-sm tracking-tight pt-1">
                      {"\u20B9"} {order.totalAmount}
                    </p>
                    {order.estimatedDeliveryTime && (
                      <div className="flex items-center gap-1.5 bg-stone-50 px-2 py-1 rounded-lg">
                        <span className="text-[8px] font-black text-stone-400 uppercase tracking-tighter">ETA</span>
                        <p className="text-village-umber text-[9px] font-black tracking-tight">
                          {order.estimatedDeliveryTime}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="village-card paper-texture organic-radius p-10 min-h-[160px] flex flex-col items-center justify-center opacity-60">
              <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center mb-3 text-stone-300">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">Awaiting New Orders</p>
            </div>
          )}
        </div>
      </div>
      <DeliveryBottomNav />
    </div>
  );
}
