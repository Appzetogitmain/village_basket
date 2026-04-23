import { useState, useEffect } from 'react';
import { getWalletTransactions, createFundTransfer, WalletTransaction } from '../../../services/api/admin/adminWalletService';
import { getDeliveryBoys } from '../../../services/api/admin/adminDeliveryService';

interface FundTransfer {
  id: string;
  name: string;
  mobile: string;
  openingBalance: number;
  closingBalance: number;
  amount: number;
  type: string;
  message: string;
  date: string;
}

export default function AdminFundTransfer() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedDeliveryBoy, setSelectedDeliveryBoy] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [fundTransfers, setFundTransfers] = useState<FundTransfer[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBoyForTransfer, setSelectedBoyForTransfer] = useState('');
  const [transferAmount, setTransferAmount] = useState<number | ''>('');
  const [transferType, setTransferType] = useState('Credit');
  const [transferMessage, setTransferMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDeliveryBoysData();
    fetchTransactions();
  }, []);

  const fetchDeliveryBoysData = async () => {
    try {
      const res = await getDeliveryBoys();
      if (res.success && res.data) {
        setDeliveryBoys(res.data);
      }
    } catch (error) {
      console.error('Error fetching delivery boys', error);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await getWalletTransactions({ userType: 'DELIVERY_BOY', limit: 1000 });
      if (res.success && res.data) {
        const formatted: FundTransfer[] = res.data.map((t: any) => ({
          id: t._id,
          name: t.userName || 'Unknown',
          mobile: t.userId?.mobile || 'N/A', // If populated
          openingBalance: t.openingBalance || 0,
          closingBalance: t.closingBalance || 0,
          amount: t.amount,
          type: t.type,
          message: t.description,
          date: new Date(t.createdAt).toLocaleDateString(),
          rawDate: new Date(t.createdAt)
        }));
        setFundTransfers(formatted);
      }
    } catch (error) {
      console.error('Error fetching transactions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBoyForTransfer || !transferAmount || transferAmount <= 0) {
      alert("Please check your inputs.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createFundTransfer({
        userId: selectedBoyForTransfer,
        userType: 'DELIVERY_BOY',
        amount: Number(transferAmount),
        type: transferType,
        description: transferMessage || `${transferType} transfer`
      });
      if (result.success) {
        alert("Fund transfer successful!");
        setIsModalOpen(false);
        // Reset form
        setSelectedBoyForTransfer('');
        setTransferAmount('');
        setTransferType('Credit');
        setTransferMessage('');
        fetchTransactions();
      }
    } catch (error: any) {
      console.error("Error creating transfer", error);
      alert(error.response?.data?.message || "Failed to create fund transfer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTransfers = fundTransfers.filter(transfer => {
    const matchesSearch = transfer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.mobile.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.id.toString().includes(searchTerm);
    
    // Quick attempt to match delivery boy name (if select value is id we need to map it)
    const matchesDeliveryBoy = selectedDeliveryBoy === 'all' || transfer.name === deliveryBoys.find(d => d._id === selectedDeliveryBoy)?.name;
    const matchesMethod = selectedMethod === 'all' || transfer.type === selectedMethod;

    let matchesDate = true;
    if (fromDate || toDate) {
      const tDate = (transfer as any).rawDate as Date;
      if (fromDate) {
        matchesDate = matchesDate && tDate >= new Date(fromDate);
      }
      if (toDate) {
        matchesDate = matchesDate && tDate <= new Date(toDate);
      }
    }
    
    return matchesSearch && matchesDeliveryBoy && matchesMethod && matchesDate;
  }).sort((a: any, b: any) => {
    if (!sortColumn) return 0;
    const valA = a[sortColumn];
    const valB = b[sortColumn];
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(filteredTransfers.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const displayedTransfers = filteredTransfers.slice(startIndex, endIndex);

  const handleExport = () => {
    alert('Export functionality will be implemented here');
  };

  const handleClearDate = () => {
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-[#A54B31] px-3 py-2.5 rounded-t-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <h1 className="text-white text-xl sm:text-2xl font-semibold">View Fund Transfer</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#8B3D28] hover:bg-[#8B3D28] text-white px-3 py-1.5 rounded text-[11px] font-black flex items-center gap-2 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Fund Transfer
        </button>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        {/* Filters */}
        <div className="px-3 py-2 sm:p-3 border-b border-neutral-200">
          <div className="flex flex-col lg:flex-row gapx-3 py-2 items-start lg:items-center justify-between">
            {/* Left Side Filters */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1 flex-wrap">
              {/* From - To Date */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-700 whitespace-nowrap">From - To Date:</label>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#8B3D28]"
                    />
                  </div>
                  <span className="text-neutral-500">-</span>
                  <div className="relative">
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#8B3D28]"
                    />
                  </div>
                  <button
                    onClick={handleClearDate}
                    className="px-3 py-2 bg-neutral-700 hover:bg-neutral-800 text-white rounded text-sm transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Filter by Delivery Boy */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-700 whitespace-nowrap">Filter by Delivery Boy:</label>
                <select
                  value={selectedDeliveryBoy}
                  onChange={(e) => {
                    setSelectedDeliveryBoy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8B3D28] min-w-[150px]"
                >
                  <option value="all">All Delivery Boys</option>
                  {deliveryBoys.map((boy) => (
                    <option key={boy._id} value={boy._id}>
                      {boy.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Method */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-700 whitespace-nowrap">Filter by Method:</label>
                <select
                  value={selectedMethod}
                  onChange={(e) => {
                    setSelectedMethod(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8B3D28] min-w-[100px]"
                >
                  <option value="all">All</option>
                  <option value="Credit">Credit</option>
                  <option value="Debit">Debit</option>
                </select>
              </div>
            </div>

            {/* Right Side Controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mt-3 lg:mt-0">
              {/* Per Page */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-700">Per Page:</span>
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-neutral-300 rounded text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#8B3D28]"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExport}
                className="bg-[#8B3D28] hover:bg-[#8B3D28] text-white px-3 py-1.5 rounded text-[11px] font-black flex items-center gap-2 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export
              </button>

              {/* Search */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-700">Search:</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search..."
                  className="px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#8B3D28] min-w-[150px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
             <div className="text-center py-6 text-neutral-500">Loading transfers...</div>
          ) : (
            <table className="w-full min-w-[1200px]">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-[#FAF7F2]" onClick={() => handleSort('id')}>ID</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-[#FAF7F2]" onClick={() => handleSort('name')}>Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-[#FAF7F2]" onClick={() => handleSort('mobile')}>Mobile</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-[#FAF7F2]" onClick={() => handleSort('openingBalance')}>Opening Balance (₹)</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-[#FAF7F2]" onClick={() => handleSort('closingBalance')}>Closing Balance (₹)</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-[#FAF7F2]" onClick={() => handleSort('amount')}>Amount (₹)</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-[#FAF7F2]" onClick={() => handleSort('type')}>Type</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-[#FAF7F2]" onClick={() => handleSort('message')}>Message</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider cursor-pointer hover:bg-[#FAF7F2]" onClick={() => handleSort('date')}>Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {displayedTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-4 text-center text-sm text-neutral-500">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  displayedTransfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-neutral-50">
                      <td className="px-3 py-2 text-[12px] font-black text-neutral-900">{transfer.id.substring(transfer.id.length - 6)}</td>
                      <td className="px-3 py-2 text-[12px] font-black text-neutral-900">{transfer.name}</td>
                      <td className="px-3 py-2 text-[12px] font-bold text-neutral-500">{transfer.mobile}</td>
                      <td className="px-3 py-2 text-[12px] font-black text-neutral-900">{(transfer.openingBalance || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 text-[12px] font-black text-neutral-900">{(transfer.closingBalance || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 text-[12px] font-black text-neutral-900">{(transfer.amount || 0).toFixed(2)}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${transfer.type === 'Credit'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {transfer.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[12px] font-bold text-neutral-500">{transfer.message}</td>
                      <td className="px-3 py-2 text-[12px] font-bold text-neutral-500">{transfer.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && fundTransfers.length > 0 && (
          <div className="px-3 py-2 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="text-xs sm:text-sm text-neutral-700">
              Showing {filteredTransfers.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredTransfers.length)} of {filteredTransfers.length} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || totalPages === 0}
                className={`p-2 border border-neutral-300 rounded ${currentPage === 1 || totalPages === 0
                  ? 'text-neutral-400 cursor-not-allowed bg-neutral-50'
                  : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`p-2 border border-neutral-300 rounded ${currentPage === totalPages || totalPages === 0
                  ? 'text-neutral-400 cursor-not-allowed bg-neutral-50'
                  : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-neutral-500 py-4">
        Copyright © {new Date().getFullYear()}. Developed By{' '}
        <span className="text-[#A54B31] font-semibold">Village Basket</span>
      </div>

      {/* Add Fund Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-neutral-900 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-[#A54B31] px-4 py-3 flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Add Fund Transfer</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-neutral-200">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitTransfer} className="px-4 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Delivery Boy <span className="text-red-500">*</span></label>
                  <select 
                    required 
                    value={selectedBoyForTransfer} 
                    onChange={(e) => setSelectedBoyForTransfer(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                  >
                    <option value="" disabled>Select Delivery Boy</option>
                    {deliveryBoys.map(b => (
                      <option key={b._id} value={b._id}>{b.name} ({b.mobile})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Type <span className="text-red-500">*</span></label>
                  <select 
                    required 
                    value={transferType} 
                    onChange={(e) => setTransferType(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                  >
                    <option value="Credit">Credit (Add to Balance)</option>
                    <option value="Debit">Debit (Deduct from Balance)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Amount (₹) <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    value={transferAmount} 
                    onChange={(e) => setTransferAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Enter Amount" 
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-[#8B3D28] focus:border-[#8B3D28]" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Message</label>
                  <textarea 
                    rows={2} 
                    value={transferMessage} 
                    onChange={(e) => setTransferMessage(e.target.value)}
                    placeholder="Enter remark or message" 
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-[#A54B31] text-white rounded hover:bg-[#8B3D28] transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Transfer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
