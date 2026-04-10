import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getAllOrders,
  type Order,
} from "../../../services/api/admin/adminOrderService";
import { useAuth } from "../../../context/AuthContext";

type SortField =
  | "orderNumber"
  | "customerName"
  | "orderDate"
  | "donationAmount"
  | "total";
type SortDirection = "asc" | "desc";

export default function AdminDonations() {
  const { isAuthenticated, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("orderDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        // We'll fetch all orders and filter locally for now, 
        // or we could add a filter in the API if supported.
        const response = await getAllOrders({ limit: 1000 });
        if (response.success) {
          // Filter only orders with donationAmount > 0
          const donationOrders = response.data.filter((o: any) => o.donationAmount > 0);
          setOrders(donationOrders);
        }
      } catch (err: any) {
        console.error("Error fetching donations:", err);
        setError("Failed to load donations.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, token]);

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...orders];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      let aValue = (a as any)[sortField] || 0;
      let bValue = (b as any)[sortField] || 0;

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [orders, searchQuery, sortField, sortDirection]);

  const totalDonation = orders.reduce((sum, o) => sum + (o.donationAmount || 0), 0);

  return (
    <div className="space-y-6 -mx-6 -mt-6">
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black text-neutral-900 font-outfit uppercase tracking-tight">
            Donations Tracking
          </h1>
          <div className="flex items-center gap-2 text-sm">
            <Link to="/admin" className="text-[#8B3D28] font-bold">Dashboard</Link>
            <span className="text-neutral-400">/</span>
            <span className="text-neutral-700">Donations</span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl border-2 border-neutral-100 shadow-sm">
            <p className="text-xs font-black text-neutral-500 uppercase mb-1">Total Donation Orders</p>
            <p className="text-3xl font-black text-[#8B3D28] font-outfit">{orders.length}</p>
          </div>
          <div className="bg-[#8B3D28] p-6 rounded-xl shadow-lg">
            <p className="text-xs font-black text-white/70 uppercase mb-1">Total Amount Collected</p>
            <p className="text-3xl font-black text-white font-outfit">{"\u20B9"}{totalDonation.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-neutral-100 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search user or order..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-[#8B3D28] transition-colors"
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                <circle cx="11" cy="11" r="8"/><path d="M21 21L16.65 16.65"/>
              </svg>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100 font-outfit">
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Order ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Donation</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Total Bill</th>
                  <th className="px-6 py-4 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-neutral-500 font-medium">Loading donations...</td></tr>
                ) : filteredAndSortedOrders.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-neutral-500 font-medium">No donations found.</td></tr>
                ) : (
                  filteredAndSortedOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-black text-[#8B3D28]">{order.orderNumber}</td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-neutral-900">{order.customerName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-green-600">{"\u20B9"}{order.donationAmount}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-neutral-600">{"\u20B9"}{order.total}</td>
                      <td className="px-6 py-4 text-xs text-neutral-500">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
