import { useState, useEffect } from "react";
import DashboardCard from "../components/DashboardCard";
import OrderChart from "../components/OrderChart";
import SalesLineChart from "../components/SalesLineChart";
import GaugeChart from "../components/GaugeChart";
import VillageLoader from "../../../components/VillageLoader";
import ErrorBoundary from "../../../components/ErrorBoundary";
import { useAuth } from "../../../context/AuthContext";
import {
  getDashboardStats,
  getSalesAnalytics,
  getOrderAnalytics,
  getTodaySales,
  getTopSellers,
  getRecentOrders,
  getSalesByLocation,
  type DashboardStats,
  type TopSeller,
  type RecentOrder,
  type SalesByLocation,
  type SalesAnalytics,
  type TodaySales,
} from "../../../services/api/admin/adminDashboardService";

export default function AdminDashboard() {
  const { isAuthenticated, token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [newOrders, setNewOrders] = useState<RecentOrder[]>([]);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [salesByLocation, setSalesByLocation] = useState<SalesByLocation[]>([]);
  const [salesAnalytics, setSalesAnalytics] = useState<SalesAnalytics | null>(
    null
  );
  const [orderAnalytics, setOrderAnalytics] = useState<SalesAnalytics | null>(
    null
  );
  const [orderAnalyticsDaily, setOrderAnalyticsDaily] = useState<SalesAnalytics | null>(
    null
  );
  const [todaySales, setTodaySales] = useState<TodaySales | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch dashboard data on component mount
  useEffect(() => {
    // Don't fetch if not authenticated
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all dashboard data in parallel
        const [
          statsResponse,
          ordersResponse,
          sellersResponse,
          locationResponse,
          analyticsResponse,
          orderAnalyticsResponse,
          orderAnalyticsDailyResponse,
          todaySalesResponse,
        ] = await Promise.all([
          getDashboardStats(),
          getRecentOrders(10),
          getTopSellers(10),
          getSalesByLocation(),
          getSalesAnalytics("day"), // Use daily data for the sales line chart
          getOrderAnalytics("month"),
          getOrderAnalytics("day"),
          getTodaySales(),
        ]);

        if (statsResponse.success) {
          console.log("Dashboard stats received:", statsResponse.data);
          setStats(statsResponse.data);
        } else {
          console.error("Failed to fetch dashboard stats:", statsResponse);
        }

        if (ordersResponse.success) {
          setNewOrders(ordersResponse.data);
        }

        if (sellersResponse.success) {
          setTopSellers(sellersResponse.data);
        }

        if (locationResponse.success) {
          setSalesByLocation(locationResponse.data);
        }

        if (analyticsResponse.success) {
          setSalesAnalytics(analyticsResponse.data);
        }

        if (orderAnalyticsResponse.success) {
          setOrderAnalytics(orderAnalyticsResponse.data);
        }

        if (orderAnalyticsDailyResponse.success) {
          setOrderAnalyticsDaily(orderAnalyticsDailyResponse.data);
        }

        if (todaySalesResponse.success) {
          setTodaySales(todaySalesResponse.data);
        }
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(
          err.response?.data?.message ||
          "Failed to load dashboard data. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, token]);

  // Icons for KPI cards
  const userIcon = (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="12"
        cy="8"
        r="4"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M4 20c0-4 3.5-7 8-7s8 3 8 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );

  const categoryIcon = (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const subcategoryIcon = (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const productIcon = (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const ordersIcon = (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const completedOrdersIcon = (
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
      />
      <path
        d="M16 7H18C19.1046 7 20 7.89543 20 9V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V9C4 7.89543 4.89543 7 6 7H8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const pendingOrdersIcon = (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const cancelledOrdersIcon = (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 7L8 15M8 7L16 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 7H18C19.1046 7 20 7.89543 20 9V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V9C4 7.89543 4.89543 7 6 7H8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const soldOutIcon = (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 12H16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  const lowStockIcon = (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 9V15M9 12H15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  // Transform sales analytics data for charts
  const salesThisMonth = salesAnalytics?.thisPeriod || [];
  const salesLastMonth = salesAnalytics?.lastPeriod || [];

  // Transform order analytics data for charts (real data from backend)
  const orderDataDec2025 = orderAnalyticsDaily?.thisPeriod || [];
  const orderData2025 = orderAnalytics?.thisPeriod || [];

  const totalPagesNewOrders = Math.ceil(newOrders.length / entriesPerPage);
  const startIndexNewOrders = (currentPage - 1) * entriesPerPage;
  const endIndexNewOrders = startIndexNewOrders + entriesPerPage;
  const displayedNewOrders = newOrders.slice(
    startIndexNewOrders,
    endIndexNewOrders
  );

  const totalPagesTopSellers = Math.ceil(topSellers.length / entriesPerPage);
  const startIndexTopSellers = (currentPage - 1) * entriesPerPage;
  const endIndexTopSellers = startIndexTopSellers + entriesPerPage;
  const displayedTopSellers = topSellers.slice(
    startIndexTopSellers,
    endIndexTopSellers
  );

  // Calculate sales today and comparison from today's sales data
  const salesToday = todaySales?.salesToday || 0;
  const salesLastWeekSameDay = todaySales?.salesLastWeekSameDay || 0;
  const salesDifference = salesToday - salesLastWeekSameDay;
  const salesPercentChange =
    salesLastWeekSameDay > 0
      ? ((salesDifference / salesLastWeekSameDay) * 100).toFixed(0)
      : salesToday > 0 ? "100" : "0";

  // Loading state
  if (loading) {
    return <VillageLoader message="Loading dashboard data..." />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-neutral-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#A54B31] hover:opacity-90 text-white px-4 py-1.5 rounded-lg transition-all font-bold text-sm shadow-md">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No stats data
  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-neutral-600 font-medium">No dashboard data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 font-poppins">
      {/* KPI Cards Grid - More Compact */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3">
        <DashboardCard
          icon={userIcon}
          title="Total User"
          value={stats.totalUser}
          accentColor="#3b82f6"
        />
        <DashboardCard
          icon={categoryIcon}
          title="Total Category"
          value={stats.totalCategory}
          accentColor="#eab308"
        />
        <DashboardCard
          icon={subcategoryIcon}
          title="Total Subcategory"
          value={stats.totalSubcategory ?? 0}
          accentColor="#ec4899"
        />
        <DashboardCard
          icon={productIcon}
          title="Total Product"
          value={stats.totalProduct}
          accentColor="#ef4444"
        />
        <DashboardCard
          icon={ordersIcon}
          title="Total Orders"
          value={stats.totalOrders}
          accentColor="#3b82f6"
        />
        <DashboardCard
          icon={completedOrdersIcon}
          title="Completed Orders"
          value={stats.completedOrders}
          accentColor="#16a34a"
        />
        <DashboardCard
          icon={pendingOrdersIcon}
          title="Pending Orders"
          value={stats.pendingOrders}
          accentColor="#a855f7"
        />
        <DashboardCard
          icon={cancelledOrdersIcon}
          title="Cancelled Orders"
          value={stats.cancelledOrders}
          accentColor="#ef4444"
        />
        <DashboardCard
          icon={soldOutIcon}
          title="Product Sold Out"
          value={stats.soldOutProducts}
          accentColor="#ec4899"
        />
        <DashboardCard
          icon={lowStockIcon}
          title="Product low on Stock"
          value={stats.lowStockProducts}
          accentColor="#eab308"
        />
      </div>

      {/* Sales Section - Top Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gapx-3 py-2 sm:gap-5">
        {/* Total Sales Today */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-black/5 px-3 py-2 sm:p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#A54B31]"></div>
          <h3 className="text-sm font-black text-neutral-800 mb-3 uppercase tracking-wider font-outfit">
            Total Sales Today
          </h3>
          <div className="mb-4">
            <p className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              ₹{(salesToday || 0).toFixed(2)}
            </p>
            {salesDifference >= 0 ? (
              <p className="text-[11px] font-bold text-[#8B3D28] mt-1 flex items-center gap-1">
                <span className="bg-green-100 px-1 rounded">▲ ₹{Math.abs(salesDifference).toFixed(2)} (+{salesPercentChange}%)</span>
                <span className="text-neutral-400 font-medium">vs last week</span>
              </p>
            ) : (
              <p className="text-[11px] font-bold text-red-600 mt-1 flex items-center gap-1">
                <span className="bg-red-100 px-1 rounded">▼ ₹{Math.abs(salesDifference).toFixed(2)} ({salesPercentChange}%)</span>
                <span className="text-neutral-400 font-medium">vs last week</span>
              </p>
            )}
          </div>
          <SalesLineChart
            thisMonthData={salesThisMonth}
            lastMonthData={salesLastMonth}
            height={180}
          />
        </div>

        {/* Sales by Location & Gauge */}
        <div className="space-y-4 sm:space-y-5">
          {/* Sales by Location */}
          <div className="bg-white rounded-xl shadow-sm border border-black/5 px-3 py-2 sm:p-5">
            <h3 className="text-sm font-black text-neutral-800 mb-4 uppercase tracking-wider font-outfit">
              Sales by Location
            </h3>
            <div className="space-y-2.5">
              {salesByLocation.length > 0 ? (
                salesByLocation.map((location, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between group">
                    <span className="text-[13px] text-neutral-600 font-medium">
                      {location.location}
                    </span>
                    <span className="text-[13px] font-black text-neutral-900 bg-neutral-50 px-2 py-0.5 rounded group-hover:bg-[#FAF7F2] transition-colors">
                      ₹{(location.amount / 1000).toFixed(1)}K
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-400 italic">
                  No location data available
                </p>
              )}
            </div>
          </div>

          {/* Avg. Completed Order Value */}
          <div className="bg-white rounded-xl shadow-sm border border-black/5 px-3 py-2 sm:p-5">
            <h3 className="text-sm font-black text-neutral-800 mb-4 uppercase tracking-wider font-outfit">
              Avg. Order Value
            </h3>
            <div className="flex justify-center -mt-4">
              <GaugeChart
                value={stats.avgCompletedOrderValue}
                maxValue={521}
                label=""
              />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gapx-3 py-2 sm:gap-5">
        <ErrorBoundary fallback={<div className="text-xs text-red-600 px-3 py-2">Chart failed to load</div>}>
          <div className="bg-white rounded-xl shadow-sm border border-black/5 px-3 py-2 overflow-hidden">
            <OrderChart
              title="Order - Dec 2025"
              data={orderDataDec2025}
              maxValue={3}
              height={300}
            />
          </div>
        </ErrorBoundary>
        <ErrorBoundary fallback={<div className="text-xs text-red-600 px-3 py-2">Chart failed to load</div>}>
          <div className="bg-white rounded-xl shadow-sm border border-black/5 px-3 py-2 overflow-hidden">
            <OrderChart
              title="Order - 2025"
              data={orderData2025}
              maxValue={80}
              height={300}
            />
          </div>
        </ErrorBoundary>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gapx-3 py-2 sm:gap-5">
        {/* View New Orders Table */}
        <div className="bg-white rounded-xl shadow-md border border-black/5 overflow-hidden font-poppins">
          <div className="bg-[#8B3D28] text-white px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest font-outfit">
              New Orders
            </h2>
            <button className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors uppercase">
              View All
            </button>
          </div>

          <div className="px-4 py-2 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-tighter">Show</span>
              <input
                type="number"
                value={entriesPerPage}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 10;
                  setEntriesPerPage(Math.max(1, Math.min(100, value)));
                  setCurrentPage(1);
                }}
                className="w-12 px-1.5 py-0.5 border border-neutral-200 rounded text-[11px] font-bold text-neutral-900 bg-white focus:outline-none focus:ring-1 focus:ring-[#8B3D28]"
                min="1"
                max="100"
              />
            </div>
            <div className="relative">
              <input 
                 type="text" 
                 placeholder="Filter orders..." 
                 className="text-[11px] px-3 py-1 bg-white border border-neutral-200 rounded-full w-32 focus:outline-none focus:ring-1 focus:ring-[#8B3D28]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-[#FAF7F2] border-b border-neutral-100">
                <tr>
                  <th className="px-4 py-2 text-left text-[10px] font-black text-neutral-500 uppercase tracking-wider font-outfit">Order ID</th>
                  <th className="px-4 py-2 text-left text-[10px] font-black text-neutral-500 uppercase tracking-wider font-outfit">Customer</th>
                  <th className="px-4 py-2 text-left text-[10px] font-black text-neutral-500 uppercase tracking-wider font-outfit">Date</th>
                  <th className="px-4 py-2 text-left text-[10px] font-black text-neutral-500 uppercase tracking-wider font-outfit">Status</th>
                  <th className="px-4 py-2 text-left text-[10px] font-black text-neutral-500 uppercase tracking-wider font-outfit">Amount</th>
                  <th className="px-4 py-2 text-center text-[10px] font-black text-neutral-500 uppercase tracking-wider font-outfit">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-50">
                {displayedNewOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-center text-xs text-neutral-400 italic">No orders found</td>
                  </tr>
                ) : (
                  displayedNewOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-4 py-2.5 text-[12px] font-bold text-neutral-700">#{order.orderNumber || order.id.slice(-6)}</td>
                      <td className="px-4 py-2.5 text-[12px] font-medium text-neutral-600 truncate max-w-[120px]">{order.customerName}</td>
                      <td className="px-4 py-2.5 text-[11px] text-neutral-500">{new Date(order.orderDate).toLocaleDateString()}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight bg-blue-50 text-[#8B3D28] border border-blue-100">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[12px] font-black text-neutral-900">₹{(order.amount || 0).toFixed(0)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <button className="text-[#A54B31] hover:scale-110 transition-transform p-1.5" aria-label="View order">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2.5 border-t border-neutral-50 flex items-center justify-between bg-neutral-50/30">
            <span className="text-[10px] font-bold text-neutral-400">
              {startIndexNewOrders + 1}-{Math.min(endIndexNewOrders, newOrders.length)} of {newOrders.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 border border-neutral-200 rounded disabled:opacity-30 hover:bg-white transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 18L9 12L15 6" /></svg>
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPagesNewOrders, prev + 1))}
                disabled={currentPage === totalPagesNewOrders}
                className="p-1 border border-neutral-200 rounded disabled:opacity-30 hover:bg-white transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18L15 12L9 6" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* View Top Seller Table - Similarly Compact */}
        <div className="bg-white rounded-xl shadow-md border border-black/5 overflow-hidden font-poppins">
          <div className="bg-[#A54B31] text-white px-4 sm:px-6 py-2.5 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest font-outfit">
              Top Sellers
            </h2>
            <button className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors uppercase">
              Ranking
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-[#FAF7F2] border-b border-neutral-100">
                <tr>
                  <th className="px-4 py-2 text-left text-[10px] font-black text-neutral-500 uppercase tracking-wider font-outfit">Seller</th>
                  <th className="px-4 py-2 text-left text-[10px] font-black text-neutral-500 uppercase tracking-wider font-outfit">Store</th>
                  <th className="px-4 py-2 text-left text-[10px] font-black text-neutral-500 uppercase tracking-wider font-outfit">Revenue</th>
                  <th className="px-4 py-2 text-center text-[10px] font-black text-neutral-500 uppercase tracking-wider font-outfit">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-50">
                {displayedTopSellers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-xs text-neutral-400 italic">No data</td>
                  </tr>
                ) : (
                  displayedTopSellers.map((seller) => (
                    <tr key={seller.sellerId} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col">
                          <span className="text-[12px] font-black text-neutral-800 tracking-tight">{seller.sellerName}</span>
                          <span className="text-[10px] text-neutral-400">ID: {seller.sellerId.slice(-4)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[11px] font-bold text-neutral-600 italic">"{seller.storeName}"</td>
                      <td className="px-4 py-2.5">
                         <span className="text-[13px] font-black text-[#8B3D28]">₹{(seller.totalRevenue / 1).toFixed(0)}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button className="text-[#8B3D28] hover:scale-110 transition-transform p-1.5" aria-label="View seller">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-neutral-50/30 text-center">
             <button className="text-[10px] font-black text-[#A54B31] uppercase tracking-widest hover:underline transition-all">Download Detailed Sales Report</button>
          </div>
        </div>
      </div>

      {/* Footer - Mini */}
      <div className="text-center py-4 relative group">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-neutral-200 group-hover:w-24 transition-all duration-500 rounded-full"></div>
        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Generated by System</p>
        <p className="text-[11px] text-neutral-300 font-bold">
          Village Basket &copy; 2025 | Premium Admin Interface
        </p>
      </div>
    </div>
  );
}








