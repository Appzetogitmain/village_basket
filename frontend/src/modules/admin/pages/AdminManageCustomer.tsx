import { useState, useMemo, useEffect } from "react";
import {
  getAllCustomers,
  type Customer,
} from "../../../services/api/admin/adminCustomerService";
import { useAuth } from "../../../context/AuthContext";

type SortField =
  | "id"
  | "name"
  | "email"
  | "phone"
  | "registrationDate"
  | "status"
  | "totalOrders"
  | "totalSpent";
type SortDirection = "asc" | "desc";

export default function AdminManageCustomer() {
  const { isAuthenticated, token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dateRange, setDateRange] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Active" | "Inactive" | undefined>(
    undefined
  );
  const [entriesPerPage, setEntriesPerPage] = useState("10");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch customers on component mount
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: {
          page: number;
          limit: number;
          status?: "Active" | "Inactive";
          search?: string;
        } = {
          page: currentPage,
          limit: parseInt(entriesPerPage),
        };

        if (statusFilter) {
          params.status = statusFilter;
        }

        if (searchQuery) {
          params.search = searchQuery;
        }

        const response = await getAllCustomers(params);
        if (response.success) {
          setCustomers(response.data);
        }
      } catch (err) {
        console.error("Error fetching customers:", err);
        if (err && typeof err === "object" && "response" in err) {
          const axiosError = err as {
            response?: { data?: { message?: string } };
          };
          setError(
            axiosError.response?.data?.message ||
            "Failed to load customers. Please try again."
          );
        } else {
          setError("Failed to load customers. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [
    isAuthenticated,
    token,
    currentPage,
    entriesPerPage,
    statusFilter,
    searchQuery,
  ]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = [...customers];

    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortField) {
          case "id":
            aValue = a._id || "";
            bValue = b._id || "";
            break;
          case "name":
            aValue = a.name || "";
            bValue = b.name || "";
            break;
          case "email":
            aValue = a.email || "";
            bValue = b.email || "";
            break;
          case "phone":
            aValue = a.phone || "";
            bValue = b.phone || "";
            break;
          case "registrationDate":
            aValue = a.registrationDate || "";
            bValue = b.registrationDate || "";
            break;
          case "status":
            aValue = a.status || "";
            bValue = b.status || "";
            break;
          case "totalOrders":
            aValue = a.totalOrders || 0;
            bValue = b.totalOrders || 0;
            break;
          case "totalSpent":
            aValue = a.totalSpent || 0;
            bValue = b.totalSpent || 0;
            break;
          default:
            return 0;
        }

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
        }
        if (typeof bValue === 'string') {
          bValue = bValue.toLowerCase();
        }

        if (sortDirection === "asc") {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
    }

    return filtered;
  }, [customers, sortField, sortDirection]);

  const totalPages = Math.ceil(
    filteredAndSortedCustomers.length / Number(entriesPerPage)
  );
  const startIndex = (currentPage - 1) * Number(entriesPerPage);
  const endIndex = startIndex + Number(entriesPerPage);
  const displayedCustomers = filteredAndSortedCustomers.slice(
    startIndex,
    endIndex
  );

  const handleExport = () => {
    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Registration Date",
      "Status",
      "Ref Code",
      "Wallet Amount",
      "Total Orders",
      "Total Spent",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredAndSortedCustomers.map((customer) =>
        [
          customer._id.slice(-6),
          customer.name,
          customer.email,
          customer.phone,
          customer.registrationDate
            ? new Date(customer.registrationDate).toLocaleString()
            : "",
          customer.status,
          customer.refCode,
          customer.totalOrders,
          (customer.totalSpent || 0).toFixed(2),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `customers_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="text-neutral-300 text-[10px]">
      {sortField === field ? (sortDirection === "asc" ? "↑" : "↓") : "⇅"}
    </span>
  );

  return (
    <div className="flex flex-col h-full bg-neutral-50 font-poppins">
      {/* Header */}
      <div className="bg-white px-3 py-2.5 border-b border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-neutral-900 font-outfit uppercase tracking-tight">
              Manage Customer
            </h1>
          </div>
          <div className="text-[12px] font-bold text-neutral-500">
            <span className="text-[#8B3D28]">Home</span> /{" "}
            <span className="text-neutral-900 font-black">Manage Customer</span>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:p-6 bg-[#FAF7F2]/30">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          {/* Filters Bar */}
          <div className="px-5 py-4 border-b border-neutral-100 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#8B3D28] uppercase tracking-widest pl-1">
                  Date Range
                </label>
                <div className="relative">
                   <input
                    type="text"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    placeholder="MM/DD/YYYY - MM/DD/YYYY"
                    className="w-full pl-3 pr-3 py-2 text-[13px] font-bold border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B3D28]/20 focus:border-[#8B3D28] transition-all bg-neutral-50/50"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-[#8B3D28] uppercase tracking-widest pl-1">
                  Status Filter
                </label>
                <select
                  value={statusFilter || "All"}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStatusFilter(val === "All" ? undefined : (val as "Active" | "Inactive"));
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 text-[13px] font-bold border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B3D28]/20 focus:border-[#8B3D28] transition-all bg-neutral-50/50 appearance-none cursor-pointer">
                  <option value="All">All Status</option>
                  <option value="Active">Active Users</option>
                  <option value="Inactive">Inactive Users</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[#8B3D28] uppercase tracking-widest pl-1">
                  Show Entries
                </label>
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 text-[13px] font-bold border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B3D28]/20 focus:border-[#8B3D28] transition-all bg-neutral-50/50 appearance-none cursor-pointer">
                  <option value="10">10 Per Page</option>
                  <option value="20">20 Per Page</option>
                  <option value="50">50 Per Page</option>
                  <option value="100">100 Per Page</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleExport}
                  className="w-full bg-[#A54B31] hover:bg-[#8B3D28] text-white px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  Export Data
                </button>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="px-5 py-3 border-b border-neutral-100 bg-[#FAF7F2]/10">
            <div className="relative group">
              <svg 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-[#8B3D28] transition-colors"
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8"></circle><path d="M21 21l-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-11 pr-4 py-2.5 bg-neutral-100/50 border-none rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-[#8B3D28]/20 transition-all placeholder-neutral-400"
                placeholder="Search by name, email, phone, or referral code..."
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#FAF7F2] text-[10px] font-black text-[#8B3D28]/60 uppercase tracking-widest font-outfit border-b border-neutral-200">
                  <th className="px-5 py-4 border-b border-neutral-100 cursor-pointer hover:bg-[#FAF7F2] transition-colors" onClick={() => handleSort("id")}>
                    <div className="flex items-center gap-2">ID <SortIcon field="id" /></div>
                  </th>
                  <th className="px-5 py-4 border-b border-neutral-100 cursor-pointer hover:bg-[#FAF7F2] transition-colors" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-2">Customer <SortIcon field="name" /></div>
                  </th>
                  <th className="px-5 py-4 border-b border-neutral-100 cursor-pointer hover:bg-[#FAF7F2] transition-colors" onClick={() => handleSort("email")}>
                    <div className="flex items-center gap-2">Contact Details <SortIcon field="email" /></div>
                  </th>
                  <th className="px-5 py-4 border-b border-neutral-100 cursor-pointer hover:bg-[#FAF7F2] transition-colors" onClick={() => handleSort("status")}>
                    <div className="flex items-center gap-2">Status <SortIcon field="status" /></div>
                  </th>
                  <th className="px-5 py-4 border-b border-neutral-100">Ref Code</th>
                  <th className="px-5 py-4 border-b border-neutral-100 cursor-pointer hover:bg-[#FAF7F2] transition-colors" onClick={() => handleSort("totalOrders")}>
                    <div className="flex items-center gap-2 text-right">Activity <SortIcon field="totalOrders" /></div>
                  </th>
                  <th className="px-5 py-4 border-b border-neutral-100 text-right cursor-pointer hover:bg-[#FAF7F2] transition-colors" onClick={() => handleSort("totalSpent")}>
                    <div className="flex items-center justify-end gap-2">Revenue <SortIcon field="totalSpent" /></div>
                  </th>
                  <th className="px-5 py-4 border-b border-neutral-100 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-neutral-400">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-[#8B3D28]/30 border-t-[#8B3D28] rounded-full animate-spin"></div>
                        <span className="text-xs font-black uppercase tracking-widest">Loading Records...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-red-600 font-bold text-sm bg-red-50/50">{error}</td>
                  </tr>
                ) : displayedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-neutral-400">
                      <div className="flex flex-col items-center gap-2 opacity-50">
                         <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <span className="text-xs font-black uppercase tracking-widest">No Customers Found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedCustomers.map((customer) => (
                    <tr key={customer._id} className="hover:bg-neutral-50/80 transition-all group">
                      <td className="px-5 py-4 text-[11px] font-mono text-neutral-400">#{customer._id.slice(-6)}</td>
                      <td className="px-5 py-4 text-sm font-black text-neutral-900 font-outfit uppercase">{customer.name}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-neutral-700">{customer.email}</span>
                          <span className="text-[10px] font-black text-neutral-400 tracking-wider font-mono">{customer.phone || 'NO PHONE'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${customer.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-neutral-500 font-bold uppercase">{customer.refCode || '-'}</td>
                      <td className="px-5 py-4">
                         <div className="flex flex-col">
                          <span className="text-xs font-black text-[#8B3D28]">{customer.totalOrders} <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter ml-0.5">Orders</span></span>
                          <span className="text-[9px] font-bold text-neutral-300 uppercase tracking-tighter">Registered {new Date(customer.registrationDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-black text-neutral-900 font-outfit">{"\u20B9"}{(customer.totalSpent || 0).toFixed(2)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleView(customer)}
                            className="p-2 bg-[#FAF7F2] text-[#8B3D28] rounded-xl border border-[#8B3D28]/10 hover:bg-[#8B3D28] hover:text-white transition-all shadow-sm active:scale-90 group-hover:scale-110"
                            title="View Records">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Clean Pagination Footer */}
          <div className="px-6 py-4 bg-neutral-50/50 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4">
             <div className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">
              Showing <span className="text-neutral-900 font-black">{startIndex + 1}</span> to <span className="text-neutral-900 font-black">{Math.min(endIndex, customers.length)}</span> of <span className="text-neutral-900 font-black">{customers.length}</span> Records
            </div>
            <div className="flex items-center gap-1.5 font-outfit">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-neutral-200 text-neutral-400 rounded-xl hover:border-[#8B3D28] hover:text-[#8B3D28] disabled:opacity-30 disabled:hover:border-neutral-200 transition-all active:scale-90">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 18L9 12L15 6"/></svg>
              </button>
              <div className="flex items-center gap-1">
                <span className="px-3 py-1.5 bg-[#8B3D28] text-white rounded-xl text-[11px] font-black shadow-lg shadow-[#8B3D28]/20">{currentPage}</span>
                {totalPages > 1 && <span className="text-[10px] font-black text-neutral-300 uppercase px-1">OF {totalPages}</span>}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-white border border-neutral-200 text-neutral-400 rounded-xl hover:border-[#8B3D28] hover:text-[#8B3D28] disabled:opacity-30 disabled:hover:border-neutral-200 transition-all active:scale-90">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M9 18L15 12L9 6"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Detail Modal */}
      {isModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#2D1610]/80 backdrop-blur-md animate-fade-in transition-all">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-slide-up border border-white/20 relative">
            {/* Background Accent */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-[#A54B31]/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>

            {/* Header */}
            <div className="bg-gradient-to-br from-[#A54B31] to-[#8B3D28] p-8 pb-10 relative overflow-hidden">
               {/* Warli Art Style Decoration */}
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                  <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full w-fit">
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Customer Profile</span>
                  </div>
                  <h2 className="text-3xl font-black text-white font-outfit uppercase leading-tight tracking-tight mt-2">
                    {selectedCustomer.name}
                  </h2>
                </div>
                <button
                  onClick={closeDetailModal}
                  className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white hover:bg-white hover:text-[#8B3D28] transition-all active:scale-90 shadow-xl backdrop-blur-md border border-white/20">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Info Cards Grid */}
            <div className="p-8 -mt-6 relative z-10">
              <div className="bg-white rounded-[2rem] shadow-2xl shadow-neutral-200/50 p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 border border-neutral-100">
                
                {/* ID & Status */}
                <div className="flex items-center gap-4 bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#8B3D28] shadow-sm">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[#8B3D28]/40 uppercase tracking-widest">User Identity</span>
                    <span className="text-xs font-black text-neutral-400 font-mono tracking-tighter uppercase mb-0.5">#{selectedCustomer._id}</span>
                    <span className={`w-fit px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${selectedCustomer.status === "Active" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                      {selectedCustomer.status}
                    </span>
                  </div>
                </div>

                {/* Referral */}
                <div className="flex items-center gap-4 bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#A54B31] shadow-sm">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[#8B3D28]/40 uppercase tracking-widest">Ref Program</span>
                    <span className="text-sm font-black text-neutral-900 font-mono uppercase">{selectedCustomer.refCode || 'WALK-IN'}</span>
                  </div>
                </div>

                {/* Contact Card */}
                <div className="col-span-1 sm:col-span-2 space-y-4 p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#FAF7F2] rounded-lg border border-[#8B3D28]/10 text-[#8B3D28]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      </div>
                      <span className="text-sm font-bold text-neutral-700">{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#FAF7F2] rounded-lg border border-[#8B3D28]/10 text-[#8B3D28]">
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      </div>
                      <span className="text-sm font-black text-neutral-900">{selectedCustomer.phone || 'PHONE NOT PROVIDED'}</span>
                    </div>
                  </div>
                </div>

                {/* Business Stats Section */}
                <div className="col-span-1 sm:col-span-2 pt-2">
                   <div className="bg-[#FAF7F2] rounded-[1.5rem] p-6 border border-[#8B3D28]/5 grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-[#A54B31] uppercase tracking-widest mb-1">Total Placed</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-neutral-900 font-outfit">{selectedCustomer.totalOrders}</span>
                          <span className="text-[10px] font-black text-neutral-400 uppercase">Bookings</span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-[#A54B31] uppercase tracking-widest mb-1">Lifetime Value</span>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-3xl font-black text-neutral-900 font-outfit">{"\u20B9"}{(selectedCustomer.totalSpent || 0).toFixed(0)}</span>
                          <span className="text-[10px] font-black text-neutral-400 uppercase ml-1">Spent</span>
                        </div>
                      </div>
                   </div>
                </div>
              </div>

               {/* Footer with Timestamp */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-neutral-300 uppercase tracking-widest leading-none">Member Since</span>
                   <span className="text-[11px] font-bold text-neutral-400 uppercase mt-1">
                    {selectedCustomer.registrationDate ? new Date(selectedCustomer.registrationDate).toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                   </span>
                </div>
                <button
                  onClick={closeDetailModal}
                  className="px-10 py-3 bg-[#8B3D28] text-white rounded-[1.2rem] text-[12px] font-black uppercase tracking-widest hover:bg-neutral-900 transition-all shadow-[0_10px_30px_rgba(139,61,40,0.3)] active:scale-95">
                  Dismiss Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
