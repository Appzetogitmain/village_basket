import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getSalesReport, SalesReport } from '../../../services/api/reportService';

export default function SellerSalesReport() {
    const [reports, setReports] = useState<SalesReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortColumn, setSortColumn] = useState<string>('createdAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [pagination, setPagination] = useState({
        total: 0,
        pages: 0
    });

    const fetchReports = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getSalesReport({
                fromDate,
                toDate,
                search: searchTerm,
                page: currentPage,
                limit: rowsPerPage,
                sortBy: sortColumn,
                sortOrder: sortDirection,
            });

            if (response.success) {
                setReports(response.data);
                setPagination({
                    total: response.pagination.total,
                    pages: response.pagination.pages
                });
            } else {
                setError(response.message || 'Failed to fetch sales reports');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error loading sales reports');
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate, searchTerm, currentPage, rowsPerPage, sortColumn, sortDirection]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchReports();
        }, 500); // Debounce search

        return () => clearTimeout(timeoutId);
    }, [fetchReports]);

    const handleSort = (column: string) => {
        // Map frontend table column names to backend model fields if necessary
        const columnMap: Record<string, string> = {
            'orderId': 'orderId',
            'orderItemId': '_id',
            'product': 'productName',
            'variant': 'variantTitle',
            'total': 'subtotal',
            'date': 'createdAt'
        };

        const backendColumn = columnMap[column] || column;

        if (sortColumn === backendColumn) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(backendColumn);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };


    const SortIcon = ({ column }: { column: string }) => (
        <span className="text-neutral-300 text-[10px]">
            {sortColumn === column ? (sortDirection === 'asc' ? '↑' : '↓') : '⇅'}
        </span>
    );

    const handleClearDates = () => {
        setFromDate('');
        setToDate('');
    };

    return (
        <div className="flex flex-col h-full min-h-screen bg-white/40">
            {/* Top Navigation/Header */}
            <div className="bg-white/90 backdrop-blur-md border-white/20 border-b border-neutral-200 px-4 sm:px-6 py-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-xl font-black text-village-umber uppercase tracking-tight">Sales Report</h1>
                    <div className="flex items-center gap-2 text-sm">
                        <Link to="/seller" className="text-[#8B3D28] hover:text-[#3a6346] font-medium">
                            Home
                        </Link>
                        <span className="text-neutral-400">/</span>
                        <span className="text-neutral-900">Sales Report</span>
                    </div>
                </div>
            </div>

            {/* Content Card */}
            <div className="flex-1 p-4 sm:p-6">
                <div className="bg-white/90 backdrop-blur-md border-white/20 rounded-lg shadow-sm border border-neutral-200 flex flex-col">
                    {/* Section Header */}
                    <div className="bg-[#8B3D28] text-white px-4 sm:px-6 py-3 rounded-t-lg">
                        <h2 className="text-lg sm:text-xl font-semibold">View Sales Report</h2>
                    </div>

                    {/* Controls Panel */}
                    <div className="p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-neutral-100">
                        {/* Left Side: Date Range Filter */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="flex items-center gap-2">
                                <label className="text-[11px] font-bold text-neutral-500 uppercase">From:</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => {
                                            setFromDate(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="pl-3 pr-2 py-1.5 bg-white border border-neutral-400 rounded text-sm focus:ring-1 focus:ring-[#8B3D28] focus:border-[#8B3D28] focus:outline-none shadow-sm transition-all text-neutral-900"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-[11px] font-bold text-neutral-500 uppercase">To:</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => {
                                            setToDate(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="pl-3 pr-2 py-1.5 bg-white border border-neutral-400 rounded text-sm focus:ring-1 focus:ring-[#8B3D28] focus:border-[#8B3D28] focus:outline-none shadow-sm transition-all text-neutral-900"
                                    />
                                </div>
                            </div>
                            {(fromDate || toDate) && (
                                <button
                                    onClick={handleClearDates}
                                    className="px-3 py-1.5 bg-neutral-100 border border-neutral-300 hover:bg-neutral-200 text-neutral-600 text-xs font-bold rounded transition-colors uppercase tracking-tight"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Right Side: Per Page, Export, Search */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            {/* Per Page */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-neutral-600">Per Page:</span>
                                <select
                                    value={rowsPerPage}
                                    onChange={(e) => {
                                        setRowsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="bg-white/90 backdrop-blur-md border-white/20 border border-neutral-300 rounded py-1.5 px-3 text-sm focus:ring-1 focus:ring-[#8B3D28] focus:outline-none cursor-pointer"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>

                            {/* Export Button */}
                            <button
                                onClick={() => {
                                    const headers = ['Order Id', 'Order Item Id', 'Product', 'Variant', 'Total', 'Date'];
                                    const csvContent = [
                                        headers.join(','),
                                        ...reports.map(report => [
                                            report.orderId,
                                            report.orderItemId,
                                            `"${report.product}"`,
                                            `"${report.variant}"`,
                                            report.total,
                                            report.date
                                        ].join(','))
                                    ].join('\n');
                                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                    const link = document.createElement('a');
                                    const url = URL.createObjectURL(blob);
                                    link.setAttribute('href', url);
                                    link.setAttribute('download', `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
                                    link.style.visibility = 'hidden';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                                className="bg-[#8B3D28] hover:bg-[#3a6346] text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Export
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>

                            {/* Search */}
                            <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-neutral-500 uppercase">Search:</span>
                                <input
                                    type="text"
                                    className="pl-14 pr-3 py-1.5 bg-white border border-neutral-400 rounded text-sm focus:ring-1 focus:ring-[#8B3D28] focus:border-[#8B3D28] focus:outline-none w-full sm:w-48 shadow-sm transition-all"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    placeholder=""
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto min-h-[400px]">
                        {loading ? (
                            <div className="flex items-center justify-center p-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B3D28]"></div>
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center text-red-500">{error}</div>
                        ) : (
                            <table className="w-full text-left border-collapse border border-neutral-200">
                                <thead>
                                    <tr className="bg-white/40 text-xs font-bold text-neutral-800">
                                        <th
                                            className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                                            onClick={() => handleSort('orderId')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Order Id
                                                <SortIcon column="orderId" />
                                            </div>
                                        </th>
                                        <th
                                            className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                                            onClick={() => handleSort('orderItemId')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Order Item Id
                                                <SortIcon column="orderItemId" />
                                            </div>
                                        </th>
                                        <th
                                            className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                                            onClick={() => handleSort('product')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Product
                                                <SortIcon column="product" />
                                            </div>
                                        </th>
                                        <th
                                            className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                                            onClick={() => handleSort('variant')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Variant
                                                <SortIcon column="variant" />
                                            </div>
                                        </th>
                                        <th
                                            className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                                            onClick={() => handleSort('total')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Total
                                                <SortIcon column="total" />
                                            </div>
                                        </th>
                                        <th
                                            className="p-4 border border-neutral-200 cursor-pointer hover:bg-neutral-100 transition-colors"
                                            onClick={() => handleSort('date')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Date
                                                <SortIcon column="date" />
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-neutral-500">
                                                No data available in table
                                            </td>
                                        </tr>
                                    ) : (
                                        reports.map((report, index) => (
                                            <tr key={index} className="hover:bg-white/40">
                                                <td className="p-4 border border-neutral-200 text-sm">
                                                    <span className="text-[#8B3D28] font-medium">
                                                        {report.orderId}
                                                    </span>
                                                </td>
                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900">{report.orderItemId}</td>
                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900">{report.product}</td>
                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900">{report.variant}</td>
                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900">{report.total.toFixed(2)}</td>
                                                <td className="p-4 border border-neutral-200 text-sm text-neutral-900">{report.date}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination Footer */}
                    <div className="p-4 border-t border-neutral-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-neutral-600">
                            Showing {reports.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, pagination.total)} of {pagination.total} entries
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1 || pagination.pages === 0}
                                className="w-8 h-8 flex items-center justify-center border border-[#8B3D28] rounded hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            {pagination.pages > 0 && Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                // Simple pagination logic for showing first few pages
                                const pageNum = i + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 flex items-center justify-center border rounded transition-colors ${currentPage === pageNum
                                            ? 'border-[#8B3D28] bg-[#8B3D28] text-white'
                                            : 'border-[#8B3D28] hover:bg-white/40 text-neutral-900'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                                disabled={currentPage === pagination.pages || pagination.pages === 0}
                                className="w-8 h-8 flex items-center justify-center border border-[#8B3D28] rounded hover:bg-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="px-4 sm:px-6 py-4 text-center bg-white/90 backdrop-blur-md border-white/20 border-t border-neutral-200">
                <p className="text-xs sm:text-sm text-neutral-600">
                    Copyright © {new Date().getFullYear()}. Developed By{' '}
                    <span className="font-semibold text-[#8B3D28]">Village Basket</span>
                </p>
            </footer>
        </div>
    );
}




