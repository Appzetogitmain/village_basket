import { useState, useEffect, useMemo } from "react";
import { getInquiries, updateInquiryStatus, IInquiry } from "../../../services/api/contactService";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";

type SortField = "name" | "email" | "createdAt" | "status";
type SortDirection = "asc" | "desc";

export default function AdminInquiries() {
  const { isAuthenticated, token } = useAuth();
  const { showToast } = useToast();
  const [inquiries, setInquiries] = useState<IInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedInquiry, setSelectedInquiry] = useState<IInquiry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchInquiries();
    }
  }, [isAuthenticated, token]);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const response = await getInquiries();
      if (response.success) {
        setInquiries(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: "Pending" | "Read" | "Resolved") => {
    try {
      setIsUpdating(true);
      const response = await updateInquiryStatus(id, newStatus);
      if (response.success) {
        showToast(`Status updated to ${newStatus}`, "success");
        setInquiries(inquiries.map(inv => inv._id === id ? { ...inv, status: newStatus } : inv));
        if (selectedInquiry?._id === id) {
          setSelectedInquiry({ ...selectedInquiry, status: newStatus });
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredInquiries = useMemo(() => {
    return inquiries
      .filter(inv => {
        const matchesSearch = 
          inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.message.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "All" || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        if (sortDirection === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
  }, [inquiries, searchQuery, statusFilter, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="text-neutral-300 text-[10px] ml-1">
      {sortField === field ? (sortDirection === "asc" ? "↑" : "↓") : "⇅"}
    </span>
  );

  return (
    <div className="flex flex-col h-full bg-neutral-50 font-poppins">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-neutral-900 font-outfit uppercase tracking-tight">
              Customer Inquiries
            </h1>
            <p className="text-[11px] font-bold text-neutral-400 mt-0.5">MANAGE "GET IN TOUCH" SUBMISSIONS</p>
          </div>
          <div className="flex items-center gap-2 text-[12px] font-bold text-neutral-500">
            <span className="text-[#8B3D28]">Home</span>
            <span className="text-neutral-300">/</span>
            <span className="text-neutral-900 font-black">Inquiries</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAF7F2]/30">
        <div className="bg-white rounded-[2rem] shadow-sm border border-neutral-200 overflow-hidden flex flex-col">
          
          {/* Toolbar */}
          <div className="p-5 border-b border-neutral-100 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative group">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-[#8B3D28] transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or message..."
                className="w-full pl-11 pr-4 py-2.5 bg-neutral-100/50 border-none rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-[#8B3D28]/20 transition-all"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-neutral-100/50 border-none rounded-2xl text-[13px] font-bold focus:ring-2 focus:ring-[#8B3D28]/20 transition-all cursor-pointer appearance-none"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Read">Read</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <button 
              onClick={fetchInquiries}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FAF7F2] text-[#8B3D28] rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#8B3D28] hover:text-white transition-all border border-[#8B3D28]/10"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              Refresh Data
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-[#FAF7F2] text-[10px] font-black text-[#8B3D28]/60 uppercase tracking-widest border-b border-neutral-200">
                  <th className="px-6 py-4 cursor-pointer hover:bg-[#FAF7F2] transition-colors" onClick={() => handleSort("name")}>
                    Customer <SortIcon field="name" />
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-[#FAF7F2] transition-colors" onClick={() => handleSort("email")}>
                    Email <SortIcon field="email" />
                  </th>
                  <th className="px-6 py-4">Message Preview</th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-[#FAF7F2] transition-colors" onClick={() => handleSort("status")}>
                    Status <SortIcon field="status" />
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-[#FAF7F2] transition-colors" onClick={() => handleSort("createdAt")}>
                    Date <SortIcon field="createdAt" />
                  </th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-[#8B3D28]/20 border-t-[#8B3D28] rounded-full animate-spin"></div>
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Fetching Inquiries...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredInquiries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-neutral-400 font-bold text-sm">
                      No inquiries found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInquiries.map((inv) => (
                    <tr key={inv._id} className="hover:bg-neutral-50/50 transition-all group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#8B3D28]/10 flex items-center justify-center text-[#8B3D28] text-xs font-black">
                            {inv.name.charAt(0)}
                          </div>
                          <span className="text-sm font-black text-neutral-800 font-outfit uppercase">{inv.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-neutral-500">{inv.email}</td>
                      <td className="px-6 py-5">
                        <p className="text-xs text-neutral-600 line-clamp-1 max-w-[200px]">{inv.message}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          inv.status === 'Resolved' ? 'bg-green-100 text-green-700' : 
                          inv.status === 'Read' ? 'bg-amber-100 text-amber-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-neutral-800">{new Date(inv.createdAt).toLocaleDateString()}</span>
                          <span className="text-[9px] font-bold text-neutral-400 tracking-tighter uppercase">{new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => { setSelectedInquiry(inv); setIsModalOpen(true); }}
                            className="p-2 bg-[#FAF7F2] text-[#8B3D28] rounded-xl hover:bg-[#8B3D28] hover:text-white transition-all"
                            title="View Message"
                          >
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
        </div>
      </div>

      {/* Inquiry Detail Modal */}
      {isModalOpen && selectedInquiry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2D1610]/90 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-slide-up">
            <div className="bg-[#8B3D28] p-8 text-white relative">
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                  <span className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest">Inquiry Details</span>
                  <h2 className="text-3xl font-black font-outfit uppercase mt-2">{selectedInquiry.name}</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white hover:text-[#8B3D28] transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-[#8B3D28] uppercase tracking-widest">Email Address</p>
                  <p className="text-sm font-bold text-neutral-800">{selectedInquiry.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-[#8B3D28] uppercase tracking-widest">Received Date</p>
                  <p className="text-sm font-bold text-neutral-800">{new Date(selectedInquiry.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-[#8B3D28] uppercase tracking-widest">Submission Message</p>
                <div className="bg-neutral-50 p-6 rounded-3xl border border-neutral-100">
                  <p className="text-sm text-neutral-700 leading-relaxed italic">"{selectedInquiry.message}"</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-start gap-6 pt-4">
                <div className="space-y-3 w-full sm:w-auto">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest text-center sm:text-left">Mark Assessment</p>
                  <div className="flex flex-wrap gap-2">
                    {(["Pending", "Read", "Resolved"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedInquiry._id, status)}
                        disabled={isUpdating || selectedInquiry.status === status}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          selectedInquiry.status === status 
                          ? 'bg-[#8B3D28] text-white shadow-lg' 
                          : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                        } disabled:opacity-50`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
