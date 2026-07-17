import { useState, useEffect } from 'react';
import { getAllSellers, updateSellerStatus, deleteSeller, Seller as SellerType, updateSeller } from '../../../services/api/sellerService';
import SellerServiceMap from '../components/SellerServiceMap';

interface Seller {
    _id: string;
    id?: number; // For backward compatibility with existing code
    name: string;
    sellerName: string;
    storeName: string;
    phone: string;
    mobile: string;
    email: string;
    logo?: string;
    balance: number;
    commission: number;
    categories: string[];
    status: 'Approved' | 'Pending' | 'Rejected';
    needApproval: boolean;
    // Additional fields from signup
    category?: string;
    address?: string;
    city?: string;
    serviceableArea?: string;
    panCard?: string;
    taxName?: string;
    taxNumber?: string;
    searchLocation?: string;
    latitude?: string;
    longitude?: string;
    serviceRadiusKm?: number;
    accountName?: string;
    bankName?: string;
    branch?: string;
    accountNumber?: string;
    ifsc?: string;
    profile?: string;
    idProof?: string;
    addressProof?: string;
    requireProductApproval?: boolean;
    viewCustomerDetails?: boolean;
}

// Helper function to convert backend seller to frontend format
const mapSellerToFrontend = (seller: SellerType): Seller => {
    return {
        _id: seller._id,
        id: parseInt(seller._id.slice(-6), 16) || 0, // Generate a numeric ID from MongoDB _id
        name: seller.sellerName,
        sellerName: seller.sellerName,
        storeName: seller.storeName,
        phone: seller.mobile,
        mobile: seller.mobile,
        email: seller.email,
        logo: seller.logo || '/api/placeholder/40/40',
        balance: seller.balance || 0,
        commission: seller.commission || 0,
        categories: seller.categories || [],
        status: seller.status,
        needApproval: seller.status === 'Pending',
        category: seller.category,
        address: seller.address,
        city: seller.city,
        serviceableArea: seller.serviceableArea,
        panCard: seller.panCard,
        taxName: seller.taxName,
        taxNumber: seller.taxNumber,
        searchLocation: seller.searchLocation,
        latitude: seller.latitude,
        longitude: seller.longitude,
        serviceRadiusKm: seller.serviceRadiusKm,
        accountName: seller.accountName,
        bankName: seller.bankName,
        branch: seller.branch,
        accountNumber: seller.accountNumber,
        ifsc: seller.ifsc,
        profile: seller.profile,
        idProof: seller.idProof,
        addressProof: seller.addressProof,
        requireProductApproval: seller.requireProductApproval,
        viewCustomerDetails: seller.viewCustomerDetails,
    };
};

// Stable fallback logo to avoid endless reload loops when logo is missing
const FALLBACK_LOGO =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="8" fill="#E5F3F2"/>
            <path d="M20 19c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Zm0 2.5c-3.333 0-10 1.667-10 5v1.5c0 .552.448 1 1 1h18c.552 0 1-.448 1-1V26.5c0-3.333-6.667-5-10-5Z" fill="#0F766E"/>
        </svg>`
    );

export default function AdminManageSellerList() {
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
     const [isUpdatingRadius, setIsUpdatingRadius] = useState(false);
    const [newRadius, setNewRadius] = useState<number>(10);
    const [isUpdatingCommission, setIsUpdatingCommission] = useState(false);
    const [tempCommission, setTempCommission] = useState<number>(0);
    const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        sellerName: '',
        storeName: '',
        email: '',
        mobile: '',
        category: '',
        address: '',
        city: '',
        serviceableArea: '',
        panCard: '',
        taxName: '',
        taxNumber: '',
        accountName: '',
        bankName: '',
        branch: '',
        accountNumber: '',
        ifsc: '',
    });

    // Fetch sellers from backend
    useEffect(() => {
        const fetchSellers = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await getAllSellers();
                if (response.success && response.data) {
                    const mappedSellers = response.data.map(mapSellerToFrontend);
                    setSellers(mappedSellers);
                } else {
                    setError('Failed to fetch sellers');
                }
            } catch (err: any) {
                console.error('Error fetching sellers:', err);
                // Show a clear message when the admin is not authenticated/authorized
                if (err?.response?.status === 401 || err?.response?.status === 403) {
                    setError('Please login as admin to view sellers.');
                } else {
                    setError(err.response?.data?.message || 'Failed to fetch sellers. Please try again.');
                }
                // Show empty on error - no mock data fallback
                setSellers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchSellers();
    }, []);

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    const SortIcon = ({ column }: { column: string }) => (
        <span className="text-neutral-400 text-xs ml-1">
            {sortColumn === column ? (sortDirection === 'asc' ? '↑' : '↓') : '⇅'}
        </span>
    );

    // Filter sellers
    let filteredSellers = sellers.filter(seller =>
        seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.phone.includes(searchTerm) ||
        seller.mobile.includes(searchTerm)
    );

    // Sort sellers
    if (sortColumn) {
        filteredSellers = [...filteredSellers].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortColumn) {
                case 'id':
                    aValue = a._id;
                    bValue = b._id;
                    break;
                case 'name':
                    aValue = a.name;
                    bValue = b.name;
                    break;
                case 'storeName':
                    aValue = a.storeName;
                    bValue = b.storeName;
                    break;
                case 'balance':
                    aValue = a.balance;
                    bValue = b.balance;
                    break;
                case 'commission':
                    aValue = a.commission;
                    bValue = b.commission;
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    const totalPages = Math.ceil(filteredSellers.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const displayedSellers = filteredSellers.slice(startIndex, endIndex);

    const handleExport = () => {
        const headers = ['Id', 'Name', 'Store Name', 'Contact', 'Balance', 'Commission', 'Status'];
        const csvContent = [
            headers.join(','),
            ...filteredSellers.map(seller => [
                seller.id,
                `"${seller.name}"`,
                `"${seller.storeName}"`,
                `"${seller.phone}, ${seller.email}"`,
                seller.balance,
                `${seller.commission}%`,
                seller.status
            ].join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `sellers_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEdit = (id: number | string) => {
        const sellerId = typeof id === 'number' ? sellers.find(s => s.id === id)?._id : id;
        const seller = sellers.find(s => s._id === sellerId);
         if (seller) {
            setEditingSeller(seller);
            setNewRadius(seller.serviceRadiusKm || 10);
            setTempCommission(seller.commission || 0);
            setProfileForm({
                sellerName: seller.sellerName || seller.name || '',
                storeName: seller.storeName || '',
                email: seller.email || '',
                mobile: seller.mobile || seller.phone || '',
                category: seller.category || seller.categories?.[0] || '',
                address: seller.address || '',
                city: seller.city || '',
                serviceableArea: seller.serviceableArea || '',
                panCard: seller.panCard || '',
                taxName: seller.taxName || '',
                taxNumber: seller.taxNumber || '',
                accountName: seller.accountName || '',
                bankName: seller.bankName || '',
                branch: seller.branch || '',
                accountNumber: seller.accountNumber || '',
                ifsc: seller.ifsc || '',
            });
            setIsEditModalOpen(true);
        }
    };

    const handleProfileFieldChange = (field: keyof typeof profileForm, value: string) => {
        setProfileForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const applyUpdatedSeller = (updatedSeller: SellerType) => {
        const mappedSeller = mapSellerToFrontend(updatedSeller);
        setEditingSeller(mappedSeller);
        setSellers((prev) => prev.map((seller) => (
            seller._id === mappedSeller._id ? mappedSeller : seller
        )));
        setProfileForm({
            sellerName: mappedSeller.sellerName || mappedSeller.name || '',
            storeName: mappedSeller.storeName || '',
            email: mappedSeller.email || '',
            mobile: mappedSeller.mobile || mappedSeller.phone || '',
            category: mappedSeller.category || mappedSeller.categories?.[0] || '',
            address: mappedSeller.address || '',
            city: mappedSeller.city || '',
            serviceableArea: mappedSeller.serviceableArea || '',
            panCard: mappedSeller.panCard || '',
            taxName: mappedSeller.taxName || '',
            taxNumber: mappedSeller.taxNumber || '',
            accountName: mappedSeller.accountName || '',
            bankName: mappedSeller.bankName || '',
            branch: mappedSeller.branch || '',
            accountNumber: mappedSeller.accountNumber || '',
            ifsc: mappedSeller.ifsc || '',
        });
        setNewRadius(mappedSeller.serviceRadiusKm || 10);
        setTempCommission(mappedSeller.commission || 0);
    };

    const handleSaveProfile = async () => {
        if (!editingSeller) return;

        if (!profileForm.sellerName.trim() || !profileForm.storeName.trim() || !profileForm.email.trim() || !profileForm.mobile.trim()) {
            setError('Seller name, store name, email, and mobile are required.');
            setTimeout(() => setError(''), 3000);
            return;
        }

        try {
            setIsSavingProfile(true);
            setError('');
            const response = await updateSeller(editingSeller._id, {
                sellerName: profileForm.sellerName.trim(),
                storeName: profileForm.storeName.trim(),
                email: profileForm.email.trim(),
                mobile: profileForm.mobile.trim(),
                category: profileForm.category.trim(),
                address: profileForm.address.trim(),
                city: profileForm.city.trim(),
                serviceableArea: profileForm.serviceableArea.trim(),
                panCard: profileForm.panCard.trim(),
                taxName: profileForm.taxName.trim(),
                taxNumber: profileForm.taxNumber.trim(),
                accountName: profileForm.accountName.trim(),
                bankName: profileForm.bankName.trim(),
                branch: profileForm.branch.trim(),
                accountNumber: profileForm.accountNumber.trim(),
                ifsc: profileForm.ifsc.trim(),
            });

            if (response.success && response.data) {
                applyUpdatedSeller(response.data);
                setSuccessMessage('Seller profile updated successfully');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(response.message || 'Failed to update seller profile');
                setTimeout(() => setError(''), 3000);
            }
        } catch (err: any) {
            console.error('Error updating seller profile:', err);
            setError(err.response?.data?.message || 'Failed to update seller profile');
            setTimeout(() => setError(''), 3000);
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleUpdateRadius = async () => {
        if (!editingSeller) return;

        try {
            setIsUpdatingRadius(true);
            const response = await updateSeller(editingSeller._id, { serviceRadiusKm: newRadius });
            if (response.success && response.data) {
                applyUpdatedSeller(response.data);
                setSuccessMessage('Service radius updated successfully');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(response.message || 'Failed to update service radius');
                setTimeout(() => setError(''), 3000);
            }
        } catch (error: any) {
            console.error('Error updating radius:', error);
            setError(error.response?.data?.message || 'Failed to update service radius');
            setTimeout(() => setError(''), 3000);
        } finally {
            setIsUpdatingRadius(false);
        }
    };

    const handleUpdateCommission = async () => {
        if (!editingSeller) return;

        try {
            setIsUpdatingCommission(true);
            const response = await updateSeller(editingSeller._id, { commission: tempCommission });
            if (response.success && response.data) {
                applyUpdatedSeller(response.data);
                setSuccessMessage('Commission updated successfully');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(response.message || 'Failed to update commission');
                setTimeout(() => setError(''), 3000);
            }
        } catch (error: any) {
            console.error('Error updating commission:', error);
            setError(error.response?.data?.message || 'Failed to update commission');
            setTimeout(() => setError(''), 3000);
        } finally {
            setIsUpdatingCommission(false);
        }
    };

    const handleToggleSetting = async (field: 'requireProductApproval' | 'viewCustomerDetails', value: boolean) => {
        if (!editingSeller) return;

        try {
            setIsUpdatingSettings(true);
            const response = await updateSeller(editingSeller._id, { [field]: value });
            if (response.success && response.data) {
                applyUpdatedSeller(response.data);
                setSuccessMessage(`${field === 'requireProductApproval' ? 'Product Approval' : 'View Customer Details'} setting updated`);
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError(response.message || 'Failed to update setting');
                setTimeout(() => setError(''), 3000);
            }
        } catch (error: any) {
            console.error('Error updating setting:', error);
            setError(error.response?.data?.message || 'Failed to update setting');
            setTimeout(() => setError(''), 3000);
        } finally {
            setIsUpdatingSettings(false);
        }
    };

    const handleApprove = async (id: number | string) => {
        const sellerId = typeof id === 'number' ? sellers.find(s => s.id === id)?._id : id;
        if (!sellerId) return;

        try {
            const response = await updateSellerStatus(sellerId, 'Approved');
            if (response.success) {
                // Update local state
                setSellers(prevSellers =>
                    prevSellers.map(seller =>
                        seller._id === sellerId
                            ? { ...seller, status: 'Approved', needApproval: false }
                            : seller
                    )
                );
                setSuccessMessage('Seller has been approved.');
                setIsEditModalOpen(false);
                setEditingSeller(null);
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError('Failed to approve seller. Please try again.');
            }
        } catch (err: any) {
            console.error('Error approving seller:', err);
            setError(err.response?.data?.message || 'Failed to approve seller. Please try again.');
        }
    };

    const handleReject = async (id: number | string) => {
        const sellerId = typeof id === 'number' ? sellers.find(s => s.id === id)?._id : id;
        if (!sellerId) return;

        try {
            const response = await updateSellerStatus(sellerId, 'Rejected');
            if (response.success) {
                // Update local state
                setSellers(prevSellers =>
                    prevSellers.map(seller =>
                        seller._id === sellerId
                            ? { ...seller, status: 'Rejected', needApproval: false }
                            : seller
                    )
                );
                setSuccessMessage('Seller has been rejected.');
                setIsEditModalOpen(false);
                setEditingSeller(null);
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError('Failed to reject seller. Please try again.');
            }
        } catch (err: any) {
            console.error('Error rejecting seller:', err);
            setError(err.response?.data?.message || 'Failed to reject seller. Please try again.');
        }
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingSeller(null);
    };

    const handleDelete = async (id: number | string) => {
        const sellerId = typeof id === 'number' ? sellers.find(s => s.id === id)?._id : id;
        if (!sellerId) return;

        if (window.confirm('Are you sure you want to delete this seller?')) {
            try {
                const response = await deleteSeller(sellerId);
                if (response.success) {
                    // Remove from local state
                    setSellers(prevSellers => prevSellers.filter(seller => seller._id !== sellerId));
                    setSuccessMessage('Seller deleted successfully.');
                    setTimeout(() => setSuccessMessage(''), 3000);
                } else {
                    setError('Failed to delete seller. Please try again.');
                }
            } catch (err: any) {
                console.error('Error deleting seller:', err);
                setError(err.response?.data?.message || 'Failed to delete seller. Please try again.');
            }
        }
    };

    const handleViewCategories = (seller: Seller) => {
        setSelectedSeller(seller);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSeller(null);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Page Content */}
            <div className="flex-1 p-3">
                {/* Main Panel */}
                <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
                    {/* Header */}
                    <div className="bg-[#A54B31] text-white px-4 py-2.5 rounded-t-lg">
                        <h2 className="text-lg font-semibold">View Seller List</h2>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="px-3 py-2 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center justify-between">
                            <p className="text-sm">{error}</p>
                            <button
                                onClick={() => setError('')}
                                className="text-red-700 hover:text-red-900 ml-4 text-lg font-bold"
                                type="button"
                            >
                                ×
                            </button>
                        </div>
                    )}
                    {/* Success Message */}
                    {successMessage && (
                        <div className="px-3 py-2 bg-green-50 border-l-4 border-green-500 text-[#A54B31] flex items-center justify-between">
                            <p className="text-sm">{successMessage}</p>
                            <button
                                onClick={() => setSuccessMessage('')}
                                className="text-[#A54B31] hover:text-green-900 ml-4 text-lg font-bold"
                                type="button"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="p-8 text-center">
                            <p className="text-neutral-600">Loading sellers...</p>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="px-3 py-2 border-b border-neutral-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gapx-3 py-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] font-bold text-neutral-500">Show</span>
                            <select
                                value={rowsPerPage}
                                onChange={(e) => {
                                    setRowsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="bg-white border border-neutral-300 rounded py-1.5 px-3 text-sm focus:ring-1 focus:ring-[#8B3D28] focus:outline-none cursor-pointer"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExport}
                                className="bg-[#A54B31] hover:opacity-90 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 transition-colors"
                            >
                                Export
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="pl-3 pr-3 py-1.5 bg-neutral-100 border-none rounded text-sm focus:ring-1 focus:ring-[#8B3D28] w-48"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    placeholder="Search..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    {!loading && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-neutral-50 text-xs font-bold text-neutral-800 border-b border-neutral-200">
                                        <th
                                            className="px-3 py-2 cursor-pointer hover:bg-[#FAF7F2] transition-colors"
                                            onClick={() => handleSort('id')}
                                        >
                                            <div className="flex items-center">
                                                Id <SortIcon column="id" />
                                            </div>
                                        </th>
                                        <th
                                            className="px-3 py-2 cursor-pointer hover:bg-[#FAF7F2] transition-colors"
                                            onClick={() => handleSort('name')}
                                        >
                                            <div className="flex items-center">
                                                Name <SortIcon column="name" />
                                            </div>
                                        </th>
                                        <th
                                            className="px-3 py-2 cursor-pointer hover:bg-[#FAF7F2] transition-colors"
                                            onClick={() => handleSort('storeName')}
                                        >
                                            <div className="flex items-center">
                                                Store Name <SortIcon column="storeName" />
                                            </div>
                                        </th>
                                        <th className="px-3 py-2">
                                            Contact
                                        </th>
                                        <th className="px-3 py-2">
                                            Logo
                                        </th>
                                        <th
                                            className="px-3 py-2 cursor-pointer hover:bg-[#FAF7F2] transition-colors"
                                            onClick={() => handleSort('balance')}
                                        >
                                            <div className="flex items-center">
                                                Balance <SortIcon column="balance" />
                                            </div>
                                        </th>
                                        <th
                                            className="px-3 py-2 cursor-pointer hover:bg-[#FAF7F2] transition-colors"
                                            onClick={() => handleSort('commission')}
                                        >
                                            <div className="flex items-center">
                                                Commission <SortIcon column="commission" />
                                            </div>
                                        </th>
                                        <th className="px-3 py-2">
                                            Category
                                        </th>
                                        <th
                                            className="px-3 py-2 cursor-pointer hover:bg-[#FAF7F2] transition-colors"
                                            onClick={() => handleSort('status')}
                                        >
                                            <div className="flex items-center">
                                                Status <SortIcon column="status" />
                                            </div>
                                        </th>
                                        <th className="px-3 py-2">
                                            Need Approval?
                                        </th>
                                        <th className="px-3 py-2">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedSellers.map((seller) => (
                                        <tr key={seller._id} className="hover:bg-neutral-50 transition-colors text-sm text-neutral-700 border-b border-neutral-200">
                                            <td className="px-3 py-2 align-middle">{seller.id || seller._id.slice(-6)}</td>
                                            <td className="px-3 py-2 align-middle">{seller.name}</td>
                                            <td className="px-3 py-2 align-middle">{seller.storeName}</td>
                                            <td className="px-3 py-2 align-middle">
                                                <div className="text-xs">
                                                    <div>{seller.phone}</div>
                                                    <div className="text-neutral-500">{seller.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 align-middle">
                                                <img
                                                    src={(seller.logo && seller.logo.trim() !== '') ? seller.logo : FALLBACK_LOGO}
                                                    alt={seller.storeName}
                                                    className="w-10 h-10 object-cover rounded"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        const img = e.currentTarget;
                                                        if (img.dataset.fallbackApplied === 'true') return;
                                                        img.dataset.fallbackApplied = 'true';
                                                        img.src = FALLBACK_LOGO;
                                                    }}
                                                />
                                            </td>
                                            <td className="px-3 py-2 align-middle">{"\u20B9"}{(seller.balance || 0).toFixed(2)}</td>
                                            <td className="px-3 py-2 align-middle">{(seller.commission || 0).toFixed(2)}%</td>
                                            <td className="px-3 py-2 align-middle">
                                                <button
                                                    onClick={() => handleViewCategories(seller)}
                                                    className="px-3 py-1.5 bg-[#A54B31] hover:opacity-90 text-white text-xs font-medium rounded transition-colors flex items-center gap-1"
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                        <circle cx="12" cy="12" r="3"></circle>
                                                    </svg>
                                                    View ({seller.categories.length})
                                                </button>
                                            </td>
                                            <td className="px-3 py-2 align-middle">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${seller.status === 'Approved'
                                                    ? 'bg-green-100 text-green-800'
                                                    : seller.status === 'Pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {seller.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 align-middle">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${seller.needApproval
                                                    ? 'bg-pink-100 text-pink-800'
                                                    : 'bg-pink-100 text-pink-800'
                                                    }`}>
                                                    {seller.needApproval ? 'Yes' : 'No'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 align-middle">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEdit(seller._id)}
                                                        className="p-1.5 text-[#A54B31] hover:bg-[#FAF7F2] rounded transition-colors"
                                                        title="Edit"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(seller._id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {displayedSellers.length === 0 && (
                                        <tr>
                                            <td colSpan={11} className="p-8 text-center text-neutral-400">
                                                No sellers found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Footer */}
                    {!loading && (
                        <div className="px-3 py-2 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                            <div className="text-xs sm:text-sm text-neutral-700">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredSellers.length)} of {filteredSellers.length} entries
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className={`p-2 border border-[#A54B31] rounded ${currentPage === 1
                                        ? 'text-neutral-400 cursor-not-allowed bg-neutral-50'
                                        : 'text-[#A54B31] hover:bg-[#FAF7F2]'
                                        }`}
                                    aria-label="Previous page"
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M15 18L9 12L15 6"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                                <button
                                    className="px-3 py-1.5 border border-[#A54B31] bg-[#A54B31] text-white rounded font-medium text-sm"
                                >
                                    {currentPage}
                                </button>
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`p-2 border border-[#A54B31] rounded ${currentPage === totalPages
                                        ? 'text-neutral-400 cursor-not-allowed bg-neutral-50'
                                        : 'text-[#A54B31] hover:bg-[#FAF7F2]'
                                        }`}
                                    aria-label="Next page"
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M9 18L15 12L9 6"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="text-center py-4 text-[12px] font-bold text-neutral-500 border-t border-neutral-200 bg-white">
                Copyright © {new Date().getFullYear()}. Developed By{' '}
                <a href="#" className="text-[#8B3D28] hover:underline">Village Basket</a>
            </footer>

            {/* Categories Modal */}
            {isModalOpen && selectedSeller && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleCloseModal}>
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-[#A54B31] text-white px-4 py-2.5 rounded-t-lg flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">Categories</h3>
                                <p className="text-sm text-teal-100 mt-1">{selectedSeller.storeName} - {selectedSeller.name}</p>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="text-white hover:text-teal-200 transition-colors p-1"
                                aria-label="Close modal"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-3 overflow-y-auto flex-1">
                            {selectedSeller.categories.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {selectedSeller.categories.map((category, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-2 px-4 py-3 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#A54B31] flex-shrink-0">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                            </svg>
                                            <span className="text-sm font-medium text-teal-900">{category}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-neutral-400">
                                    <p>No categories assigned to this seller.</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-4 py-2.5 border-t border-neutral-200 flex justify-end">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 bg-[#A54B31] hover:opacity-90 text-white rounded text-sm font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Seller Modal */}
            {isEditModalOpen && editingSeller && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={handleCloseEditModal}>
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="bg-[#A54B31] text-white px-4 py-2.5 rounded-t-lg flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">Edit Seller - {editingSeller.name}</h3>
                                <p className="text-sm text-teal-100 mt-1">View and manage seller details</p>
                            </div>
                            <button
                                onClick={handleCloseEditModal}
                                className="text-white hover:text-teal-200 transition-colors p-1"
                                aria-label="Close modal"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-3 overflow-y-auto flex-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            <style>{`
                                .edit-seller-modal::-webkit-scrollbar {
                                    display: none;
                                }
                            `}</style>

                            <div className="space-y-6">
                                {/* Status Badge */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${editingSeller.status === 'Approved'
                                            ? 'bg-green-100 text-green-800'
                                            : editingSeller.status === 'Pending'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            Status: {editingSeller.status}
                                        </span>
                                    </div>
                                    {editingSeller.status === 'Pending' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(editingSeller._id)}
                                                className="px-4 py-2 bg-[#8B3D28] hover:opacity-90 text-white rounded text-sm font-medium transition-colors flex items-center gap-2"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(editingSeller._id)}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors flex items-center gap-2"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Basic Information */}
                                <div className="bg-neutral-50 rounded-lg px-3 py-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-semibold text-neutral-700">Basic Information</h4>
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={isSavingProfile}
                                            className="px-4 py-2 bg-[#8B3D28] text-white rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isSavingProfile ? 'Saving...' : 'Save Profile'}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
                                        <div>
                                            <label className="text-xs text-neutral-500">Seller Name</label>
                                            <input
                                                type="text"
                                                value={profileForm.sellerName}
                                                onChange={(e) => handleProfileFieldChange('sellerName', e.target.value)}
                                                className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500">Store Name</label>
                                            <input
                                                type="text"
                                                value={profileForm.storeName}
                                                onChange={(e) => handleProfileFieldChange('storeName', e.target.value)}
                                                className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500">Email</label>
                                            <input
                                                type="email"
                                                value={profileForm.email}
                                                onChange={(e) => handleProfileFieldChange('email', e.target.value)}
                                                className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500">Phone</label>
                                            <input
                                                type="tel"
                                                value={profileForm.mobile}
                                                onChange={(e) => handleProfileFieldChange('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500">Category</label>
                                            <input
                                                type="text"
                                                value={profileForm.category}
                                                onChange={(e) => handleProfileFieldChange('category', e.target.value)}
                                                className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                                            />
                                        </div>
                                         <div>
                                            <label className="text-xs text-neutral-500">Commission (%)</label>
                                            <div className="flex gap-2 mt-1">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    value={tempCommission}
                                                    onChange={(e) => setTempCommission(parseFloat(e.target.value))}
                                                    className="w-full px-3 py-1.5 border border-neutral-300 rounded text-sm focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                                                />
                                                <button
                                                    onClick={handleUpdateCommission}
                                                    disabled={isUpdatingCommission || tempCommission === editingSeller.commission}
                                                    className="px-3 py-1.5 bg-[#8B3D28] text-white rounded text-xs font-bold hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                                                >
                                                    {isUpdatingCommission ? 'Saving...' : 'Update'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Address Information */}
                                <div className="bg-neutral-50 rounded-lg px-3 py-2">
                                    <h4 className="text-sm font-semibold text-neutral-700 mb-3">Address Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
                                        <div className="md:col-span-2">
                                            <label className="text-xs text-neutral-500">Address</label>
                                            <textarea
                                                value={profileForm.address}
                                                onChange={(e) => handleProfileFieldChange('address', e.target.value)}
                                                rows={3}
                                                className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-[#8B3D28] focus:border-[#8B3D28] resize-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500">City</label>
                                            <input
                                                type="text"
                                                value={profileForm.city}
                                                onChange={(e) => handleProfileFieldChange('city', e.target.value)}
                                                className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500">Serviceable Area</label>
                                            <input
                                                type="text"
                                                value={profileForm.serviceableArea}
                                                onChange={(e) => handleProfileFieldChange('serviceableArea', e.target.value)}
                                                className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                                            />
                                        </div>
                                        {editingSeller.searchLocation && editingSeller.searchLocation !== editingSeller.address && (
                                            <div className="md:col-span-2">
                                                <label className="text-xs text-neutral-500">Location</label>
                                                <p className="text-sm font-medium text-neutral-900">{editingSeller.searchLocation}</p>
                                            </div>
                                        )}
                                        {(editingSeller.latitude || editingSeller.longitude) && (
                                            <div className="md:col-span-2 grid grid-cols-2 gapx-3 py-2">
                                                <div>
                                                    <label className="text-xs text-neutral-500">Latitude</label>
                                                    <p className="text-sm font-medium text-neutral-900">{editingSeller.latitude || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-neutral-500">Longitude</label>
                                                    <p className="text-sm font-medium text-neutral-900">{editingSeller.longitude || 'N/A'}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Service Area Map */}
                                <div className="bg-neutral-50 rounded-lg px-3 py-2">
                                    <h4 className="text-sm font-semibold text-neutral-700 mb-3">Service Area Visualization</h4>
                                    {editingSeller.latitude && editingSeller.longitude ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gapx-3 py-2 items-end">
                                                <div>
                                                    <label className="text-xs text-neutral-500 mb-1 block">Service Radius (km)</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="number"
                                                            min="0.1"
                                                            max="100"
                                                            step="0.1"
                                                            value={newRadius}
                                                            onChange={(e) => setNewRadius(parseFloat(e.target.value))}
                                                            className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                                                        />
                                                        <button
                                                            onClick={handleUpdateRadius}
                                                            disabled={isUpdatingRadius || newRadius === editingSeller.serviceRadiusKm}
                                                            className="px-4 py-2 bg-[#A54B31] text-white rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                                                        >
                                                            {isUpdatingRadius ? 'Updating...' : 'Update Radius'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="h-[300px] w-full">
                                                <SellerServiceMap
                                                    latitude={parseFloat(editingSeller.latitude)}
                                                    longitude={parseFloat(editingSeller.longitude)}
                                                    radiusKm={newRadius}
                                                    storeName={editingSeller.storeName}
                                                />
                                            </div>
                                            <p className="text-xs text-neutral-500 italic">
                                                * Adjust the radius above to see the service area change dynamically.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center border-2 border-dashed border-neutral-200 rounded-lg">
                                            <p className="text-sm text-neutral-500">No coordinates available for this seller.</p>
                                            <p className="text-xs text-neutral-400 mt-1">Please update the seller's latitude and longitude to see the service map.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Tax Information */}
                                <div className="bg-neutral-50 rounded-lg px-3 py-2">
                                    <h4 className="text-sm font-semibold text-neutral-700 mb-3">Tax Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
                                        <div>
                                            <label className="text-xs text-neutral-500">PAN Card</label>
                                            <input
                                                type="text"
                                                value={profileForm.panCard}
                                                onChange={(e) => handleProfileFieldChange('panCard', e.target.value.toUpperCase())}
                                                className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500">Tax Name</label>
                                            <input
                                                type="text"
                                                value={profileForm.taxName}
                                                onChange={(e) => handleProfileFieldChange('taxName', e.target.value)}
                                                className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-xs text-neutral-500">Tax Number</label>
                                            <input
                                                type="text"
                                                value={profileForm.taxNumber}
                                                onChange={(e) => handleProfileFieldChange('taxNumber', e.target.value.toUpperCase())}
                                                className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Bank Information */}
                                <div className="bg-neutral-50 rounded-lg px-3 py-2">
                                    <h4 className="text-sm font-semibold text-neutral-700 mb-3">Bank Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
                                        <div>
                                            <label className="text-xs text-neutral-500">Account Name</label>
                                            <input
                                                type="text"
                                                value={profileForm.accountName}
                                                onChange={(e) => handleProfileFieldChange('accountName', e.target.value)}
                                                className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500">Bank Name</label>
                                            <input
                                                type="text"
                                                value={profileForm.bankName}
                                                onChange={(e) => handleProfileFieldChange('bankName', e.target.value)}
                                                className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500">Branch</label>
                                            <input
                                                type="text"
                                                value={profileForm.branch}
                                                onChange={(e) => handleProfileFieldChange('branch', e.target.value)}
                                                className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500">Account Number</label>
                                            <input
                                                type="text"
                                                value={profileForm.accountNumber}
                                                onChange={(e) => handleProfileFieldChange('accountNumber', e.target.value.replace(/\D/g, '').slice(0, 15))}
                                                className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500">IFSC Code</label>
                                            <input
                                                type="text"
                                                value={profileForm.ifsc}
                                                onChange={(e) => handleProfileFieldChange('ifsc', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
                                                className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-[#8B3D28] focus:border-[#8B3D28]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Settings */}
                                <div className="bg-neutral-50 rounded-lg px-3 py-2">
                                    <h4 className="text-sm font-semibold text-neutral-700 mb-3">Settings</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gapx-3 py-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="text-xs text-neutral-500">Require Product Approval</label>
                                                <p className="text-sm font-medium text-neutral-900">
                                                    {editingSeller.requireProductApproval ? 'Yes' : 'No'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleToggleSetting('requireProductApproval', !editingSeller.requireProductApproval)}
                                                disabled={isUpdatingSettings}
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${editingSeller.requireProductApproval ? 'bg-[#8B3D28]' : 'bg-gray-200'}`}
                                            >
                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${editingSeller.requireProductApproval ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="text-xs text-neutral-500">View Customer Details</label>
                                                <p className="text-sm font-medium text-neutral-900">
                                                    {editingSeller.viewCustomerDetails ? 'Yes' : 'No'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleToggleSetting('viewCustomerDetails', !editingSeller.viewCustomerDetails)}
                                                disabled={isUpdatingSettings}
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${editingSeller.viewCustomerDetails ? 'bg-[#8B3D28]' : 'bg-gray-200'}`}
                                            >
                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${editingSeller.viewCustomerDetails ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500">Balance</label>
                                            <p className="text-sm font-medium text-neutral-900">{"\u20B9"}{(editingSeller.balance || 0).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-neutral-500">Categories Count</label>
                                            <p className="text-sm font-medium text-neutral-900">{editingSeller.categories.length} categories</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Categories */}
                                {editingSeller.categories.length > 0 && (
                                    <div className="bg-neutral-50 rounded-lg px-3 py-2">
                                        <h4 className="text-sm font-semibold text-neutral-700 mb-3">Categories</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {editingSeller.categories.map((category, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800"
                                                >
                                                    {category}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-4 py-2.5 border-t border-neutral-200 flex justify-end gap-2">
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                className="px-4 py-2 bg-[#8B3D28] hover:opacity-90 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSavingProfile ? 'Saving...' : 'Save Profile'}
                            </button>
                            <button
                                onClick={handleCloseEditModal}
                                className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded text-sm font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}









