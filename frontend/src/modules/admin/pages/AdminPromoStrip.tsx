import { useState, useEffect } from "react";
import {
  getPromoStrips,
  createPromoStrip,
  updatePromoStrip,
  deletePromoStrip,
  type PromoStrip,
  type PromoStripFormData,
  type CategoryCard,
} from "../../../services/api/admin/adminPromoStripService";
import { getCategories, getSubcategories, type Category, type SubCategory } from "../../../services/api/categoryService";
import { getHeaderCategoriesAdmin, type HeaderCategory } from "../../../services/api/headerCategoryService";
import { getProducts as getAdminProducts, type Product } from "../../../services/api/admin/adminProductService";
import { motion, AnimatePresence } from "framer-motion";

// --- Icons ---
const SearchIcon = ({ className }: { className?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path>
  </svg>
);

const EditIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

// --- Compact Preview Component for List Items ---
const CompactPromoPreview = ({ strip }: { strip: PromoStrip }) => {
  const startDate = new Date(strip.startDate);
  const endDate = new Date(strip.endDate);
  const dateRange = `${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <div className="mt-4 mb-6 rounded-[1.5rem] overflow-hidden border border-neutral-100 bg-[#8B3D28] shadow-lg relative paper-texture">
      {/* Slim Header Ribbon */}
      <div className="px-3 py-2 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-white animate-pulse"></div>
          <p className="text-white font-black text-[9px] uppercase tracking-widest">{strip.heading}</p>
          <div className="h-2 w-[1px] bg-white/20"></div>
          <span className="text-[8px] font-bold text-white/50 uppercase">{strip.saleText}</span>
        </div>
        <div className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10">
          <span className="text-white/60 text-[7px] font-black uppercase tracking-tight">{dateRange}</span>
        </div>
      </div>

      {/* Horizontal List Preview */}
      <div className="px-3 pb-3 relative z-10 flex gap-2 overflow-x-auto scrollbar-hide no-scrollbar">
        {/* Deal Card */}
        <div className="flex-shrink-0 w-28 h-28 bg-white rounded-2xl p-2 flex flex-col justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="bg-[#4A7C59] text-white text-[6px] font-black px-1.5 py-0.5 rounded-full inline-block uppercase self-start">
               {strip.crazyDealsTitle || "CRAZY DEALS"}
            </span>
          </div>
          <div className="text-[20px] mx-auto">📦</div>
          <div className="w-full bg-[#8B3D28] rounded-lg py-0.5 px-1.5 flex items-center justify-center gap-1">
            <span className="text-white/40 text-[6px] font-black line-through">₹999</span>
            <span className="text-white text-[8px] font-black">₹499</span>
          </div>
        </div>

        {/* Regular Cards */}
        {(strip.categoryCards || []).slice(0, 3).map((card, idx) => (
          <div key={idx} className="flex-shrink-0 w-24 h-28 bg-white rounded-2xl p-2 flex flex-col items-center justify-start shadow-sm border border-neutral-50/50">
            <span className="bg-[#4A7C59] text-white text-[5px] font-black px-1.5 py-0.5 rounded-full inline-block uppercase self-start mb-1">
              {card.badge || "SAVE BIG"}
            </span>
            <p className="text-[7px] font-black text-village-umber uppercase italic line-clamp-2 text-center w-full mb-1 leading-tight">
              {card.title}
            </p>
            <div className="mt-auto grid grid-cols-2 gap-0.5 w-full">
               {(card.images?.length ? card.images.slice(0, 4) : [null, null, null, null]).map((img, i) => (
                 <div key={i} className="aspect-square bg-neutral-50 rounded-md border border-neutral-100 flex items-center justify-center overflow-hidden">
                   {img ? <img src={img} className="w-full h-full object-cover" /> : <span className="text-[6px]">📦</span>}
                 </div>
               ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AdminPromoStrip() {
  // --- Form state ---
  const [headerCategorySlug, setHeaderCategorySlug] = useState("");
  const [productCategoryId, setProductCategoryId] = useState("");
  const [heading, setHeading] = useState("");
  const [saleText, setSaleText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryCards, setCategoryCards] = useState<CategoryCard[]>([
    { subCategoryId: "", productId: "", title: "", badge: "", images: [], discountPercentage: 0, order: 0, _id: undefined },
    { subCategoryId: "", productId: "", title: "", badge: "", images: [], discountPercentage: 0, order: 1, _id: undefined },
    { subCategoryId: "", productId: "", title: "", badge: "", images: [], discountPercentage: 0, order: 2, _id: undefined },
    { subCategoryId: "", productId: "", title: "", badge: "", images: [], discountPercentage: 0, order: 3, _id: undefined },
  ]);
  const [featuredProducts, setFeaturedProducts] = useState<string[]>([]);
  const [crazyDealsTitle, setCrazyDealsTitle] = useState("CRAZY DEALS");
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState(0);

  // --- Data state ---
  const [promoStrips, setPromoStrips] = useState<PromoStrip[]>([]);
  const [headerCategories, setHeaderCategories] = useState<HeaderCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cardProducts, setCardProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productSubCategoryId, setProductSubCategoryId] = useState("");
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [subcategoryProducts, setSubcategoryProducts] = useState<Product[]>([]);
  const [cardSearchIndex, setCardSearchIndex] = useState<number | null>(null);
  const [cardSearchQuery, setCardSearchQuery] = useState("");
  const [cardProductFilters, setCardProductFilters] = useState<string[]>(["", "", "", ""]); // Search query for each card
  const [listSearchQuery, setListSearchQuery] = useState(""); // Search for the promo strips list

  // Persistent map for product names {id: name}
  const [productNames, setProductNames] = useState<Record<string, string>>({});

  // --- UI state ---
  const [loading, setLoading] = useState(false);
  const [loadingPromoStrips, setLoadingPromoStrips] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Pagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch initial data
  useEffect(() => {
    fetchPromoStrips();
    fetchHeaderCategories();
    fetchCategories();
  }, []);

  // Fetch subcategories when product category changes
  useEffect(() => {
    if (productCategoryId) {
      fetchSubcategories(productCategoryId);
      fetchCategoryProducts(productCategoryId);
      setProductSubCategoryId(""); // Reset subcat filter when main cat changes
    } else {
      setSubcategories([]);
      setCategoryProducts([]);
      setSubcategoryProducts([]);
      setProductSubCategoryId("");
    }
  }, [productCategoryId]);

  // Fetch subcategory products when subcat changes
  useEffect(() => {
    if (productSubCategoryId) {
      fetchSubcategoryProducts(productSubCategoryId);
    } else {
      setSubcategoryProducts([]);
    }
  }, [productSubCategoryId]);

  // Fetch products for Crazy Deals search
  useEffect(() => {
    if (productSearch.length > 2) {
      const timeoutId = setTimeout(() => {
        fetchProducts(productSearch, setProducts);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [productSearch]);

  // Fetch products for card shortcuts search
  useEffect(() => {
    if (cardSearchQuery.length > 2) {
      const timeoutId = setTimeout(() => {
        fetchProducts(cardSearchQuery, setCardProducts);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setCardProducts([]);
    }
  }, [cardSearchQuery]);

  const fetchPromoStrips = async () => {
    try {
      setLoadingPromoStrips(true);
      const data = await getPromoStrips();
      setPromoStrips(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch PromoStrips");
    } finally {
      setLoadingPromoStrips(false);
    }
  };

  const fetchHeaderCategories = async () => {
    try {
      const data = await getHeaderCategoriesAdmin();
      setHeaderCategories(data);
      // Auto-select HOME header if exists
      const homeHeader = data.find(h => h.name?.toUpperCase() === "HOME");
      if (homeHeader && !editingId && !headerCategorySlug) {
        setHeaderCategorySlug(homeHeader.slug);
      }
    } catch (err: any) {
      console.error("Failed to fetch header categories:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch categories:", err);
    }
  };
  const fetchSubcategories = async (catId: string) => {
    try {
      const response = await getSubcategories(catId);
      if (response.success && response.data) {
        setSubcategories(response.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch subcategories:", err);
    }
  };

  const fetchCategoryProducts = async (catId: string) => {
    try {
      const response = await getAdminProducts({ category: catId, limit: 100 });
      if (response.success && response.data) {
        const fetchedProducts = Array.isArray(response.data) ? response.data : [];
        setCategoryProducts(fetchedProducts);

        // Update name map
        const newNames = { ...productNames };
        fetchedProducts.forEach(p => {
          newNames[p._id] = p.productName;
        });
        setProductNames(newNames);
      }
    } catch (err: any) {
      console.error("Failed to fetch category products:", err);
    }
  };

  const fetchSubcategoryProducts = async (subId: string) => {
    try {
      const response = await getAdminProducts({ subcategory: subId, limit: 100 });
      if (response.success && response.data) {
        const fetchedProducts = Array.isArray(response.data) ? response.data : [];
        setSubcategoryProducts(fetchedProducts);

        // Update name map
        const newNames = { ...productNames };
        fetchedProducts.forEach(p => {
          newNames[p._id] = p.productName;
        });
        setProductNames(newNames);
      }
    } catch (err: any) {
      console.error("Failed to fetch subcategory products:", err);
    }
  };

  const fetchProducts = async (search: string, setter: (products: Product[]) => void) => {
    try {
      const params: any = { search, limit: 20 };
      if (productCategoryId) params.category = productCategoryId;
      if (productSubCategoryId) params.subcategory = productSubCategoryId;

      const response = await getAdminProducts(params);
      if (response.success && response.data) {
        const fetchedProducts = Array.isArray(response.data) ? response.data : [];
        setter(fetchedProducts);

        // Update name map
        const newNames = { ...productNames };
        fetchedProducts.forEach(p => {
          newNames[p._id] = p.productName;
        });
        setProductNames(newNames);
      }
    } catch (err: any) {
      console.error("Failed to fetch products:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!headerCategorySlug || !heading || !saleText || !startDate || !endDate) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate cards: a card is valid if it has a link OR images
    const validCards = categoryCards.filter(c => c.subCategoryId || c.productId || (c.images && c.images.length > 0));
    
    if (validCards.length === 0) {
      setError("Please add at least one box (link or images) to the shortcut section");
      return;
    }

    // Validate 4 featured products
    if (featuredProducts.length < 4) {
      setError("Please select at least 4 products for the Crazy Deals section");
      return;
    }

    const formData: PromoStripFormData = {
      headerCategorySlug,
      productCategoryId,
      heading,
      saleText,
      startDate,
      endDate,
      categoryCards: validCards.map(c => ({
        ...c,
        title: c.title || "Limited Offer", // Backend requires title
        badge: c.badge || "OFFERS", // Backend requires badge
        discountPercentage: c.discountPercentage || 0
      })),
      featuredProducts,
      crazyDealsTitle,
      isActive,
      order,
    };

    try {
      setLoading(true);
      if (editingId) {
        await updatePromoStrip(editingId, formData);
        setSuccess("Campaign updated successfully!");
      } else {
        await createPromoStrip(formData);
        setSuccess("Campaign launched successfully!");
      }
      resetForm();
      fetchPromoStrips();
    } catch (err: any) {
      setError(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (strip: PromoStrip) => {
    setHeaderCategorySlug(strip.headerCategorySlug);
    setProductCategoryId(typeof strip.productCategoryId === 'string' ? strip.productCategoryId : (strip.productCategoryId as any)?._id || "");
    setHeading(strip.heading);
    setSaleText(strip.saleText);
    setStartDate(strip.startDate.split("T")[0]);
    setEndDate(strip.endDate.split("T")[0]);

    // Process cards
    const cards = strip.categoryCards.map(c => {
      const subId = typeof c.subCategoryId === 'string' ? c.subCategoryId : (c.subCategoryId as any)?._id || "";
      const prodId = typeof c.productId === 'string' ? c.productId : (c.productId as any)?._id || "";

      if (prodId && typeof c.productId === 'object') {
        const p = c.productId as any;
        setProductNames(prev => ({ ...prev, [p._id]: p.productName }));
      }

      return {
        subCategoryId: subId,
        productId: prodId,
        title: c.title,
        badge: c.badge,
        images: Array.isArray(c.images) ? c.images : ((c as any).imageUrl ? [(c as any).imageUrl] : []),
        discountPercentage: c.discountPercentage,
        order: c.order,
        _id: c._id
      };
    });

    while (cards.length < 4) {
      cards.push({ subCategoryId: "", productId: "", title: "", badge: "", images: [], discountPercentage: 0, order: cards.length, _id: undefined });
    }
    setCategoryCards(cards.slice(0, 4));

    setFeaturedProducts(strip.featuredProducts.map(p => {
      const id = typeof p === 'string' ? p : (p as any)?._id || p;
      const name = typeof p === 'object' ? (p as any).productName : "";
      if (name) setProductNames(prev => ({ ...prev, [id]: name }));
      return id;
    }));
    setCrazyDealsTitle(strip.crazyDealsTitle || "CRAZY DEALS");
    setIsActive(strip.isActive);
    setOrder(strip.order);
    setEditingId(strip._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string, slug: string) => {
    if (slug === 'all') {
      alert("The HOME campaign is a system default and cannot be deleted. You can only Edit or Deactivate it.");
      return;
    }
    if (window.confirm("Delete this campaign?")) {
      try {
        await deletePromoStrip(id);
        setSuccess("Deleted successfully");
        fetchPromoStrips();
      } catch (err: any) {
        setError("Delete failed");
      }
    }
  };

  const resetForm = () => {
    setHeaderCategorySlug("");
    setProductCategoryId("");
    setHeading("");
    setSaleText("");
    setStartDate("");
    setEndDate("");
    setCategoryCards([
      { subCategoryId: "", productId: "", title: "", badge: "", images: [], discountPercentage: 0, order: 0, _id: undefined },
      { subCategoryId: "", productId: "", title: "", badge: "", images: [], discountPercentage: 0, order: 1, _id: undefined },
      { subCategoryId: "", productId: "", title: "", badge: "", images: [], discountPercentage: 0, order: 2, _id: undefined },
      { subCategoryId: "", productId: "", title: "", badge: "", images: [], discountPercentage: 0, order: 3, _id: undefined },
    ]);
    setFeaturedProducts([]);
    setCrazyDealsTitle("CRAZY DEALS");
    setIsActive(true);
    setOrder(0);
    setProductSubCategoryId("");
    setSubcategoryProducts([]);
    setProductSubCategoryId("");
    setSubcategoryProducts([]);
    setCardProductFilters(["", "", "", ""]);
    setEditingId(null);
  };

  const updateCardField = async (index: number, field: keyof CategoryCard, value: any) => {
    const updated = [...categoryCards];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-fill images and title if subcategory is selected
    if (field === "subCategoryId" && value) {
      updated[index].productId = ""; // Clear product if subcat selected
      const selectedSub = subcategories.find(s => s._id === value);
      if (selectedSub) {
        updated[index].title = selectedSub.subcategoryName || "";
        updated[index].badge = "FLAT 50% OFF"; 

        try {
          const response = await getAdminProducts({ subcategory: value, limit: 4 });
          if (response.success && response.data) {
            const products = Array.isArray(response.data) ? response.data : [];
            const images = products
              .map(p => typeof p.mainImage === 'string' ? p.mainImage : (p.mainImage as any)?.url)
              .filter(img => !!img) as string[];
            updated[index].images = images;
          }
        } catch (err) {
          console.error("Failed to fetch subcategory images:", err);
        }
      }
    }

    // Auto-fill if product is selected
    if (field === "productId" && value) {
      updated[index].subCategoryId = ""; // Clear subcat
      const selectedProd = categoryProducts.find(p => p._id === value) || cardProducts.find(p => p._id === value);
      if (selectedProd) {
        updated[index].title = selectedProd.productName || "";
        updated[index].badge = "BEST DEAL";
        
        const mainImg = typeof selectedProd.mainImage === 'string' ? selectedProd.mainImage : (selectedProd.mainImage as any)?.url;
        const galleryImgs = (selectedProd.galleryImages || []).map(img => typeof img === 'string' ? img : (img as any)?.url).filter(Boolean);
        const allImgs = [mainImg, ...galleryImgs].filter(Boolean).slice(0, 4);
        updated[index].images = allImgs;
      }
    }

    setCategoryCards(updated);
  };

  const toggleProductImage = (cardIdx: number, p: Product) => {
    const card = categoryCards[cardIdx];
    const img = typeof p.mainImage === 'string' ? p.mainImage : (p.mainImage as any)?.url;
    if (!img) return;

    let newImgs = [...card.images];
    const exists = newImgs.includes(img);

    if (exists) {
      newImgs = newImgs.filter(i => i !== img);
    } else if (newImgs.length < 4) {
      newImgs.push(img);
    } else {
      // If 4 already, replace the last one or just do nothing
      return;
    }

    updateCardField(cardIdx, "images", newImgs);
    
    // Auto-link to the first product if destination is empty
    if (!card.subCategoryId && !card.productId && newImgs.length === 1 && !exists) {
      updateCardField(cardIdx, "productId", p._id);
    }
  };

  // Pagination logic
  const filteredStrips = promoStrips.filter(s => 
    s.heading.toLowerCase().includes(listSearchQuery.toLowerCase()) ||
    s.headerCategorySlug.toLowerCase().includes(listSearchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filteredStrips.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const displayedStrips = filteredStrips.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 uppercase-none selection:bg-[#8B3D28]/10">
      {/* Header Section */}
      <div className="p-4 md:p-8">
        <div className="flex justify-between items-end mb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-black text-village-umber tracking-tighter">Promo Strips</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] bg-[#8B3D28] text-white px-2 py-0.5 rounded font-black uppercase tracking-widest">Marketing Hub</span>
              <div className="h-1 w-1 rounded-full bg-neutral-300"></div>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight">Campaign Designer & Preview</p>
            </div>
          </motion.div>
          <div className="text-[10px] font-black text-neutral-300 tracking-widest uppercase">
            Admin <span className="mx-2 text-neutral-200">/</span> Marketing <span className="mx-2 text-neutral-200">/</span> Promo Strips
          </div>
        </div>

        {/* Alerts - Refined */}
        <AnimatePresence>
          {(success || error) && (
            <motion.div 
              initial={{ height: 0, opacity: 0, y: -20 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -20 }}
              className={`mb-8 px-5 py-4 rounded-[1.5rem] border text-sm font-black flex items-center justify-between shadow-sm overflow-hidden ${
                success ? "bg-[#8B3D28]/5 border-[#8B3D28]/20 text-[#8B3D28]" : "bg-rose-50 border-rose-200 text-rose-700"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-2.5 h-2.5 rounded-full ${success ? "bg-[#8B3D28] animate-pulse" : "bg-rose-500"}`}></div>
                {success || error}
              </div>
              <button onClick={() => { setSuccess(""); setError(""); }} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <XIcon className="w-4 h-4 opacity-50" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* LEFT: Management Form - Campaign Designer */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-neutral-200/50 p-6 md:p-8 sticky top-6 paper-texture overflow-hidden">
              <h2 className="text-2xl font-black text-village-umber mb-10 flex items-center gap-5">
                <div className="w-14 h-14 bg-[#8B3D28]/5 rounded-2xl flex items-center justify-center text-[#8B3D28] shadow-inner">
                  <PlusIcon className="w-7 h-7" />
                </div>
                <div>
                   <span className="block leading-none">{editingId ? "Edit Campaign" : "New Campaign"}</span>
                   <span className="block text-[11px] text-[#8B3D28]/60 font-black uppercase tracking-[0.2em] mt-2">Design System Alpha</span>
                </div>
              </h2>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Core Identities */}
                <div className="space-y-5">
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black bg-neutral-900 text-white w-5 h-5 rounded-full flex items-center justify-center">1</span>
                      <h3 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Campaign Core</h3>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase ml-1">Header Placement</label>
                        <div className="relative">
                          <select
                            value={headerCategorySlug}
                            onChange={(e) => setHeaderCategorySlug(e.target.value)}
                            className="w-full px-4 py-3.5 bg-neutral-50 border-2 border-neutral-100 rounded-2xl font-black text-xs focus:ring-4 focus:ring-[#8B3D28]/5 focus:border-[#8B3D28]/30 outline-none transition-all appearance-none text-village-umber"
                            required
                          >
                            <option value="">Placement...</option>
                            {headerCategories.map(hc => (
                              <option key={hc._id} value={hc.slug}>{hc.name}</option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30"><PlusIcon className="w-3 h-3 rotate-45" /></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase ml-1">Badge Text</label>
                        <input
                          value={saleText}
                          onChange={(e) => setSaleText(e.target.value)}
                          placeholder="e.g. FLAT 50% OFF"
                          className="w-full px-4 py-3.5 bg-neutral-50 border-2 border-neutral-100 rounded-2xl font-black text-xs focus:ring-4 focus:ring-[#8B3D28]/5 focus:border-[#8B3D28]/30 outline-none transition-all shadow-inner placeholder:text-neutral-300"
                          required
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase ml-1">Campaign Heading</label>
                        <input
                          value={heading}
                          onChange={(e) => setHeading(e.target.value)}
                          placeholder="e.g. SALE ONN!!"
                          className="w-full px-4 py-3.5 bg-neutral-50 border-2 border-neutral-100 rounded-2xl font-black text-xs focus:ring-4 focus:ring-[#8B3D28]/5 focus:border-[#8B3D28]/30 outline-none transition-all shadow-inner placeholder:text-neutral-300"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase ml-1">Product Category</label>
                        <div className="relative">
                          <select
                            value={productCategoryId}
                            onChange={(e) => setProductCategoryId(e.target.value)}
                            className="w-full px-4 py-3.5 bg-neutral-50 border-2 border-neutral-100 rounded-2xl font-black text-xs focus:ring-4 focus:ring-[#8B3D28]/5 focus:border-[#8B3D28]/30 outline-none transition-all appearance-none text-village-umber"
                            required
                          >
                            <option value="">Link Category...</option>
                            {categories.map(c => (
                              <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30"><PlusIcon className="w-3 h-3 rotate-45" /></div>
                        </div>
                      </div>
                   </div>
                </div>

                {/* Section 2: Timeline */}
                <div className="space-y-5 pt-6 border-t border-neutral-100">
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black bg-neutral-900 text-white w-5 h-5 rounded-full flex items-center justify-center">2</span>
                      <h3 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Duration</h3>
                   </div>
                   <div className="grid grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Starts On</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-4 py-3.5 bg-neutral-50 border-2 border-neutral-100 rounded-2xl font-black text-xs transition-all focus:border-[#8B3D28]/30"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase ml-1">Ends On</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-4 py-3.5 bg-neutral-50 border-2 border-neutral-100 rounded-2xl font-black text-xs transition-all focus:border-[#8B3D28]/30"
                          required
                        />
                      </div>
                   </div>
                </div>

                {/* Section 3: Shortcut Boxes */}
                <div className="space-y-6 pt-6 border-t border-neutral-100">
                  <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black bg-neutral-900 text-white w-5 h-5 rounded-full flex items-center justify-center">3</span>
                       <h3 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Shortcut Boxes</h3>
                    </div>
                    <span className="text-[8px] font-black text-[#8B3D28] bg-[#8B3D28]/5 px-2.5 py-1 rounded-full border border-[#8B3D28]/10 uppercase tracking-widest">Multi-Choice Active</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5">
                    {categoryCards.map((card, idx) => (
                      <div key={idx} className="p-4 bg-neutral-50/50 rounded-[2rem] border-2 border-neutral-100 relative group transition-all hover:border-[#8B3D28]/20 hover:bg-white hover:shadow-xl">
                        <span className="absolute -top-2 -left-2 w-8 h-8 bg-village-umber text-white rounded-2xl flex items-center justify-center text-[11px] font-black shadow-lg z-10 border-2 border-white">{idx + 1}</span>

                        <div className="space-y-4">
                           {/* Choice Grid */}
                           <div className="space-y-2">
                              {subcategories.length > 0 && (
                                <select
                                  value={typeof card.subCategoryId === 'string' ? card.subCategoryId : (card.subCategoryId as any)?._id || ""}
                                  onChange={(e) => updateCardField(idx, "subCategoryId", e.target.value)}
                                  className="w-full bg-white border border-neutral-200 py-2.5 px-3 rounded-xl text-[10px] font-black outline-none focus:border-[#8B3D28]/30 transition-colors uppercase"
                                >
                                  <option value="">Sub-Category...</option>
                                  {subcategories.map(s => <option key={s._id} value={s._id}>{s.name || s.subcategoryName}</option>)}
                                </select>
                              )}
                              <select
                                value={typeof card.productId === 'string' ? card.productId : (card.productId as any)?._id || ""}
                                onChange={(e) => updateCardField(idx, "productId", e.target.value)}
                                className="w-full bg-white border border-neutral-200 py-2.5 px-3 rounded-xl text-[10px] font-black outline-none focus:border-[#8B3D28]/30 transition-colors uppercase"
                              >
                                <option value="">Product Link...</option>
                                {categoryProducts.map(p => <option key={p._id} value={p._id}>{p.productName}</option>)}
                              </select>
                           </div>

                           {/* Label Inputs */}
                           <div className="grid grid-cols-2 gap-2">
                              <input
                                placeholder="Title"
                                value={card.title}
                                onChange={(e) => updateCardField(idx, "title", e.target.value)}
                                className="bg-white border border-neutral-200 p-2.5 rounded-xl text-[9px] font-black uppercase text-center focus:border-[#8B3D28]/30 outline-none"
                              />
                              <input
                                placeholder="Badge"
                                value={card.badge}
                                onChange={(e) => updateCardField(idx, "badge", e.target.value)}
                                className="bg-white border border-neutral-200 p-2.5 rounded-xl text-[9px] font-black uppercase text-center focus:border-[#8B3D28]/30 outline-none"
                              />
                           </div>

                           {/* Images Preview - Modern */}
                           <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-white rounded-2xl border border-neutral-200/50">
                              {(card.images?.length ? card.images.slice(0, 4) : [null, null, null, null]).map((img, i) => (
                                <div key={i} className="aspect-square bg-neutral-50 rounded-lg border border-neutral-100 flex items-center justify-center overflow-hidden transition-all hover:scale-105 active:scale-95 cursor-pointer">
                                  {img ? <img src={img} className="w-full h-full object-cover" /> : <span className="text-[8px] opacity-20">📦</span>}
                                </div>
                              ))}
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 4: Crazy Deals */}
                <div className="space-y-6 pt-6 border-t border-neutral-100">
                   <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] font-black bg-neutral-900 text-white w-5 h-5 rounded-full flex items-center justify-center">4</span>
                         <h3 className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Crazy Deals Header</h3>
                      </div>
                   </div>
                   <input
                      value={crazyDealsTitle}
                      onChange={(e) => setCrazyDealsTitle(e.target.value)}
                      placeholder="e.g. CRAZY DEALS"
                      className="w-full px-4 py-3.5 bg-neutral-50 border-2 border-neutral-100 rounded-2xl font-black text-xs transition-all focus:border-[#8B3D28]/30"
                   />
                </div>

                <div className="flex gap-4 pt-10 border-t border-neutral-100">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#8B3D28] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#8B3D28]/20 disabled:opacity-50 transition-all"
                  >
                    {loading ? "Processing..." : (editingId ? "Update Campaign" : "Launch Now")}
                  </motion.button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-8 py-4 border-2 border-neutral-100 rounded-2xl font-black text-xs text-neutral-400 hover:bg-neutral-50 transition-all uppercase"
                    >
                      Cancel
                    </button>
                  )}
                </div>

              </form>
            </div>
          </div>

          {/* RIGHT: Preview & Campaigns List */}
          <div className="lg:col-span-7 space-y-8">


            {/* List Header */}
            <div className="bg-white p-3 rounded-lg border border-neutral-200 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-800">Live Campaigns</h3>
                <p className="text-[10px] font-bold text-[#A54B31] uppercase">{promoStrips.length} TOTAL</p>
              </div>
              <div className="flex bg-neutral-50 p-1 rounded-lg gap-1">
                {[10, 20, 50].map(v => (
                  <button
                    key={v}
                    onClick={() => { setRowsPerPage(v); setCurrentPage(1); }}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${rowsPerPage === v ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-800"}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* List Content */}
            {loadingPromoStrips ? (
              <div className="bg-white p-20 rounded-lg text-center border border-neutral-100 flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-neutral-50 border-t-teal-500 rounded-full animate-spin mb-4"></div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Crunching data...</p>
              </div>
            ) : displayedStrips.length === 0 ? (
              <div className="bg-white p-20 rounded-lg text-center border-2 border-dashed border-neutral-200">
                <p className="text-neutral-400 font-bold">No active campaigns found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gapx-3 py-2">
                {displayedStrips.map(strip => (
                  <div key={strip._id} className="bg-white p-3 rounded-lg border border-neutral-200 shadow-sm hover:border-teal-200 transition-all group overflow-hidden relative">
                    {/* Status */}
                    <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-lg text-[10px] font-bold uppercase ${strip.isActive ? "bg-[#A54B31] text-white" : "bg-neutral-100 text-neutral-400"
                      }`}>
                      {strip.isActive ? "ACTIVE" : "INACTIVE"}
                    </div>

                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <span className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">
                          {strip.headerCategorySlug === 'all' ? "HOME MAIN" : `${strip.headerCategorySlug} PLACEMENT`}
                        </span>
                        <h3 className="text-xl font-bold text-neutral-800 leading-tight">{strip.heading}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-bold bg-teal-50 text-teal-700 px-3 py-1 rounded-full">{strip.saleText}</span>
                          <span className="text-neutral-300">|</span>
                          <span className="text-[10px] font-bold text-neutral-400">PRIORITY: {strip.order}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(strip)} className="w-9 h-9 flex items-center justify-center bg-neutral-50 text-neutral-400 hover:bg-[#FAF7F2] hover:text-[#A54B31] rounded-lg transition-all">
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleDelete(strip._id, strip.headerCategorySlug)}
                          className="w-9 h-9 flex items-center justify-center bg-neutral-50 text-neutral-400 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-all"
                          title="Delete Campaign"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </div>

                    <div className="px-1 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <div className="h-[1px] flex-1 bg-neutral-100"></div>
                      <span>Visual Preview</span>
                      <div className="h-[1px] flex-1 bg-neutral-100"></div>
                    </div>

                    <CompactPromoPreview strip={strip} />

                    <div className="grid grid-cols-3 gapx-3 py-2 pb-8 border-b border-neutral-50 mb-6">
                      <div className="bg-neutral-50/50 px-3 py-2 rounded-xl border border-neutral-50">
                        <p className="text-[9px] font-bold text-neutral-400 uppercase mb-1">Shortcut Boxes</p>
                        <p className="text-sm font-bold text-neutral-700">{strip.categoryCards.length} SUB-CATS</p>
                      </div>
                      <div className="bg-neutral-50/50 px-3 py-2 rounded-xl border border-neutral-50">
                        <p className="text-[9px] font-bold text-neutral-400 uppercase mb-1">Featured Deals</p>
                        <p className="text-sm font-bold text-neutral-700">{strip.featuredProducts.length} PRODUCTS</p>
                      </div>
                      <div className="bg-neutral-50/50 px-3 py-2 rounded-xl border border-neutral-50">
                        <p className="text-[9px] font-bold text-neutral-400 uppercase mb-1">Duration</p>
                        <p className="text-sm font-bold text-neutral-700">{new Date(strip.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 group-hover:gap-3 cursor-pointer transition-all" onClick={() => handleEdit(strip)}>
                        <span className="text-[10px] font-bold text-[#A54B31] uppercase">Edit Campaign Details</span>
                        <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center text-[#A54B31]">
                          <EditIcon />
                        </div>
                      </div>
                      {typeof strip.productCategoryId === 'object' && (strip.productCategoryId as any)?.name && (
                        <div className="bg-neutral-800 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase">
                          {(strip.productCategoryId as any).name}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-lg border border-neutral-200 shadow-sm mt-8">
                <p className="text-[10px] font-bold text-neutral-400 uppercase">
                  Showing {startIndex + 1} - {Math.min(startIndex + rowsPerPage, promoStrips.length)} of {promoStrips.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-10 h-10 flex items-center justify-center border border-neutral-200 rounded-lg text-neutral-400 hover:bg-neutral-50 disabled:opacity-20 transition-all font-bold"
                  >
                    ←
                  </button>
                  <div className="flex items-center px-4 bg-neutral-800 text-white rounded-lg text-xs font-bold shadow-sm">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 flex items-center justify-center border border-neutral-200 rounded-lg text-neutral-400 hover:bg-neutral-50 disabled:opacity-20 transition-all font-bold"
                  >
                    →
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}







