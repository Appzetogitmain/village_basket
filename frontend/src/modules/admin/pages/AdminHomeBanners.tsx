import { useState, useEffect, useRef } from 'react';
import {
  getHomeBanners,
  createHomeBanner,
  updateHomeBanner,
  deleteHomeBanner,
  reorderHomeBanners,
  type HomeBanner
} from '../../../services/api/admin/adminHomeBannerService';
import { getHeaderCategoriesAdmin, type HeaderCategory } from '../../../services/api/headerCategoryService';
import { uploadImage } from '../../../services/api/uploadService';
import { validateImageFile, createImagePreview } from '../../../utils/imageUpload';

export default function AdminHomeBanners() {
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [headerCategories, setHeaderCategories] = useState<HeaderCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [link, setLink] = useState('');
  const [selectedHeaderCategory, setSelectedHeaderCategory] = useState('');
  const [order, setOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Image Upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Table states
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bannersRes, headersRes] = await Promise.all([
        getHomeBanners(),
        getHeaderCategoriesAdmin()
      ]);
      if (bannersRes.success && Array.isArray(bannersRes.data)) {
        setBanners(bannersRes.data);
      }
      if (Array.isArray(headersRes)) {
        setHeaderCategories(headersRes);
      }
    } catch (error) {
      console.error('Failed to fetch banner data', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setSubtitle('');
    setImageUrl('');
    setLink('');
    setSelectedHeaderCategory('');
    setOrder(0);
    setIsActive(true);
    setEditingId(null);
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setImageFile(file);
    try {
      const preview = await createImagePreview(file);
      setImagePreview(preview);
    } catch (err) {
      console.error('Preview error', err);
    }
  };

  const handleAddOrUpdate = async () => {
    if (!imageUrl && !imageFile && !editingId) {
      alert('Please upload an image or provide an Image URL');
      return;
    }

    try {
      setLoading(true);
      let finalImageUrl = imageUrl;

      // Upload image to Cloudinary if a file was chosen
      if (imageFile) {
        setUploadingImage(true);
        const uploadRes = await uploadImage(imageFile, 'villagebasket/home_banners');
        finalImageUrl = uploadRes.secureUrl;
        setUploadingImage(false);
      }

      const payload = {
        title: title.trim() || undefined,
        subtitle: subtitle.trim() || undefined,
        imageUrl: finalImageUrl,
        link: link.trim() || undefined,
        headerCategoryId: selectedHeaderCategory || undefined,
        order,
        isActive,
      };

      if (editingId) {
        const res = await updateHomeBanner(editingId, payload);
        if (res.success) {
          alert('Home banner updated successfully!');
        } else {
          alert(res.message || 'Failed to update banner');
        }
      } else {
        const res = await createHomeBanner(payload);
        if (res.success) {
          alert('Home banner created successfully!');
        } else {
          alert(res.message || 'Failed to create banner');
        }
      }

      fetchData();
      resetForm();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const handleEdit = (banner: HomeBanner) => {
    setEditingId(banner._id);
    setTitle(banner.title || '');
    setSubtitle(banner.subtitle || '');
    setImageUrl(banner.imageUrl);
    setImagePreview(banner.imageUrl);
    setLink(banner.link || '');
    setSelectedHeaderCategory(
      typeof banner.headerCategoryId === 'object'
        ? banner.headerCategoryId?._id || ''
        : banner.headerCategoryId || ''
    );
    setOrder(banner.order);
    setIsActive(banner.isActive);
    setImageFile(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        await deleteHomeBanner(id);
        alert('Home banner deleted successfully!');
        fetchData();
      } catch (error) {
        console.error(error);
        alert('Failed to delete banner');
      }
    }
  };

  const filteredBanners = banners.filter(banner => {
    const term = searchTerm.toLowerCase();
    const tMatch = (banner.title || '').toLowerCase().includes(term);
    const sMatch = (banner.subtitle || '').toLowerCase().includes(term);
    const lMatch = (banner.link || '').toLowerCase().includes(term);
    return tMatch || sMatch || lMatch;
  });

  const totalPages = Math.ceil(filteredBanners.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const displayedBanners = filteredBanners.slice(startIndex, endIndex);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800">Home Carousel Banners</h1>
          <p className="text-sm text-neutral-500 mt-1">Configure active banner slides on the customer-facing home page.</p>
        </div>
        <div className="text-sm">
          <span className="text-[#8B3D28] hover:underline cursor-pointer">Admin</span>{' '}
          <span className="text-neutral-400">/</span> Home Banners
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Panel - Add/Edit Form */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden h-fit">
          <div className="bg-[#A54B31] text-white px-4 py-2.5">
            <h2 className="text-lg font-semibold">
              {editingId ? 'Update Home Banner' : 'Create New Home Banner'}
            </h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1">
                Title (Optional):
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Save 20% on Grocery"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B3D28]"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1">
                Subtitle (Optional):
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Fresh farm products delivered in 10 mins"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B3D28]"
              />
            </div>

            {/* Banner Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1">
                Banner Image:
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-xl px-3 py-4 flex flex-col items-center justify-center cursor-pointer transition-all
                  ${imagePreview ? 'border-teal-400 bg-teal-50' : 'border-neutral-200 bg-neutral-50 hover:bg-[#FAF7F2]'}
                `}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="relative group">
                    <img src={imagePreview} alt="Preview" className="w-full max-h-32 object-cover rounded-lg shadow-sm" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-all">
                      <span className="text-[10px] text-white font-bold bg-black/50 px-2 py-1 rounded">Update</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="p-3 bg-white rounded-full shadow-sm mb-2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-neutral-600">Click to upload banner image</span>
                    <span className="text-[10px] text-neutral-400 mt-1">PNG or JPG (Max 2MB)</span>
                  </div>
                )}

                {uploadingImage && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-bold text-[#A54B31]">Uploading...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Redirection Link */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1">
                Redirection Link / Slug (Optional):
              </label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="e.g. category/snacks-and-biscuits or product/60d... or /user/rewards"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B3D28]"
              />
              <p className="mt-1 text-[10px] text-neutral-500 italic">User clicks the banner to navigate to this page.</p>
            </div>

            {/* Linked Header Category Tab */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1">
                Linked Header Tab (Optional):
              </label>
              <select
                value={selectedHeaderCategory}
                onChange={(e) => setSelectedHeaderCategory(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B3D28]"
              >
                <option value="">All Tabs (Global / main Home)</option>
                {headerCategories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-neutral-500 italic">Restricts this banner to a specific header tab.</p>
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-1">
                Display Order:
              </label>
              <input
                type="number"
                min="0"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B3D28]"
              />
            </div>

            {/* Active Switch & Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-neutral-700">Active Status:</span>
                <div
                  onClick={() => setIsActive(!isActive)}
                  className={`
                    flex items-center w-12 h-6 rounded-full cursor-pointer transition-all p-1
                    ${isActive ? 'bg-[#8B3D28]' : 'bg-neutral-300'}
                  `}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-[#8B3D28]' : 'text-neutral-500'}`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex gap-2">
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 border border-neutral-300 text-neutral-600 rounded-lg text-sm font-bold hover:bg-neutral-50 transition"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleAddOrUpdate}
                  className="bg-[#A54B31] text-white px-6 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition shadow-md shadow-teal-900/10 active:scale-95"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Banners List */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 flex flex-col h-full overflow-hidden">
          <div className="px-3 py-2.5 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
            <h3 className="font-bold text-neutral-700 flex items-center gap-2">
              Banner Slides
              <span className="text-[10px] bg-neutral-200 px-2 py-0.5 rounded-full text-neutral-600">
                {banners.length}
              </span>
            </h3>

            <div className="relative">
              <input
                type="text"
                placeholder="Find banner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-1.5 text-xs border border-neutral-300 rounded-full w-40 focus:outline-none focus:ring-1 focus:ring-[#8B3D28] bg-white"
              />
              <svg className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="overflow-x-auto flex-1 h-[500px] custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-neutral-50 sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-200">Banner Details</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-200 text-center">Header Category</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-200 text-center">Order</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-200 text-center">Status</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest border-b border-neutral-200 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {displayedBanners.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-neutral-500">
                      No banners found. Create one to display on the Home screen carousel!
                    </td>
                  </tr>
                ) : (
                  displayedBanners.map((banner) => (
                    <tr key={banner._id} className="hover:bg-[#FAF7F2]/30 transition-colors group">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-10 bg-neutral-50 rounded-lg overflow-hidden flex items-center justify-center border border-neutral-150 flex-shrink-0">
                            <img src={banner.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-neutral-800 truncate">
                              {banner.title || 'Untitled Banner'}
                            </p>
                            {banner.subtitle && (
                              <p className="text-xs text-neutral-500 truncate">{banner.subtitle}</p>
                            )}
                            {banner.link && (
                              <p className="text-[10px] text-[#A54B31] font-medium truncate">Link: {banner.link}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-xs text-neutral-600 font-semibold">
                          {typeof banner.headerCategoryId === 'object'
                            ? banner.headerCategoryId?.name || 'All Tabs'
                            : 'All Tabs'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-xs font-bold text-neutral-600 bg-neutral-100 px-2 py-1 rounded">
                          {banner.order}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${banner.isActive ? 'bg-green-100 text-[#A54B31] border border-green-200' : 'bg-neutral-100 text-neutral-500'}`}>
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEdit(banner)}
                            className="p-1.5 text-neutral-400 hover:text-[#A54B31] hover:bg-white rounded-lg transition-all"
                            title="Edit"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button
                            onClick={() => handleDelete(banner._id)}
                            className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                            title="Delete"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-3 py-2 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
            <span className="text-[10px] text-neutral-500 font-medium">Page {currentPage} of {totalPages || 1}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 text-[10px] font-bold border border-neutral-300 rounded bg-white hover:bg-neutral-50 disabled:opacity-50"
              >Prev</button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2 py-1 text-[10px] font-bold border border-neutral-300 rounded bg-white hover:bg-neutral-50 disabled:opacity-50"
              >Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
