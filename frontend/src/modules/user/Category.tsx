import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import ProductCard from "./components/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  getProducts,
  getCategoryById,
  Category as ApiCategory,
} from "../../services/api/customerProductService";
import { useLocation as useLocationContext } from "../../hooks/useLocation";

export default function Category() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { location: userLocation } = useLocationContext();
  const locationRef = useRef(userLocation);
  useEffect(() => { locationRef.current = userLocation; }, [userLocation]);

  const [category, setCategory] = useState<ApiCategory | null>(null);
  const [subcategories, setSubcategories] = useState<ApiCategory[]>([]);
  const hasRealSubcategories = useMemo(() => {
    return subcategories.filter(s => s._id !== 'all' && s.id !== 'all').length > 0;
  }, [subcategories]);
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState("relevance");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [filterSearchQuery, setFilterSearchQuery] = useState("");
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("Type");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sortOptions = [
    { id: "relevance", label: "Relevance" },
    { id: "price-low", label: "Price: Low to High" },
    { id: "price-high", label: "Price: High to Low" },
    { id: "rating", label: "Customer Rating" },
    { id: "newest", label: "Newest First" },
  ];

  // Combined fetch: category details + products in parallel
  useEffect(() => {
    if (!id) return;

    const fetchAll = async () => {
      setCategoryLoading(true);
      setLoading(true);
      setError(null);

      try {
        // Fetch category details first to get the real category ID
        const catResponse = await getCategoryById(id);
        if (!catResponse.success || !catResponse.data) {
          setError("Category not found or failed to load details.");
          return;
        }

        const { category: cat, subcategories: subs, currentSubcategory } = catResponse.data;
        let finalSubcategories = subs || [];

        if (!finalSubcategories.length) {
          try {
            const { getCategories } = await import("../../services/api/customerProductService");
            const allCatsResponse = await getCategories();
            if (allCatsResponse.success && allCatsResponse.data) {
              finalSubcategories = allCatsResponse.data.filter((c: any) =>
                c.parent === cat._id || (c.parent && c.parent._id === cat._id)
              );
            }
          } catch (_) {}
        }

        setCategory(cat);
        setSubcategories([
          { _id: "all", id: "all", name: "All", icon: "📦", isActive: true } as any,
          ...finalSubcategories,
        ]);

        const subcategoryFromUrl = searchParams.get("subcategory");
        const resolvedSubcat = subcategoryFromUrl || (currentSubcategory ? (currentSubcategory._id || currentSubcategory.id) : "all");
        if (subcategoryFromUrl) setSelectedSubcategory(subcategoryFromUrl);
        else if (currentSubcategory) setSelectedSubcategory(currentSubcategory._id || currentSubcategory.id);

        setCategoryLoading(false);

        // Now fetch products using resolved category ID
        const loc = locationRef.current;
        const params: any = { category: cat._id || id };
        if (resolvedSubcat !== "all") params.subcategory = resolvedSubcat;
        if (loc?.latitude && loc?.longitude) {
          params.latitude = loc.latitude;
          params.longitude = loc.longitude;
        }

        const prodResponse = await getProducts(params);
        if (prodResponse.success) {
          const uniqueProducts = Array.from(
            new Map(prodResponse.data.map((p: any) => [p._id || p.id, p])).values()
          );
          setProducts(uniqueProducts.map((p: any) => ({
            ...p,
            tags: Array.isArray(p.tags) ? p.tags : [],
            nameParts: p.name ? p.name.toLowerCase().split(" ") : [],
          })));
        } else {
          setError("Failed to fetch products for this category.");
        }
      } catch (err) {
        setError("Network error while loading category.");
      } finally {
        setLoading(false);
        setCategoryLoading(false);
      }
    };

    fetchAll();
  }, [id, searchParams]);

  // Refetch products when subcategory filter changes (not on initial load)
  const isFirstSubcatChange = useRef(true);
  useEffect(() => {
    if (isFirstSubcatChange.current) { isFirstSubcatChange.current = false; return; }
    if (!id || !category) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const loc = locationRef.current;
        const params: any = { category: category._id || id };
        if (selectedSubcategory !== "all") params.subcategory = selectedSubcategory;
        if (loc?.latitude && loc?.longitude) {
          params.latitude = loc.latitude;
          params.longitude = loc.longitude;
        }
        const response = await getProducts(params);
        if (response.success) {
          const uniqueProducts = Array.from(
            new Map(response.data.map((p: any) => [p._id || p.id, p])).values()
          );
          setProducts(uniqueProducts.map((p: any) => ({
            ...p,
            tags: Array.isArray(p.tags) ? p.tags : [],
            nameParts: p.name ? p.name.toLowerCase().split(" ") : [],
          })));
        }
      } catch (_) {
        setError("Network error while loading products.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedSubcategory]);

  // Apply sorting and filtering to products
  const categoryProducts = useMemo(() => {
    let result = [...products];

    // Apply Filters (if any)
    if (selectedFilters.length > 0) {
      result = result.filter((product) => {
        return selectedFilters.every((filter) => {
          const name = (product.name || product.productName || "").toLowerCase();
          const tags = product.tags || [];
          
          // Check Properties first
          if (filter === "Organic") {
            return name.includes("organic") || tags.some((t: string) => t.toLowerCase().includes("organic"));
          }
          if (filter === "Discounted") {
            return product.discount > 0 || (product.mrp > product.price);
          }
          if (filter === "In Stock") {
            return product.stock > 0 || product.variations?.some((v: any) => v.stock > 0);
          }
          if (filter === "Premium") {
            return name.includes("premium");
          }

          // Default: check if name contains the filter (for "Type" filters)
          // Handle common variations (e.g. "Tomato" filter should match "Tomatoes")
          const filterLower = filter.toLowerCase();
          if (name.includes(filterLower)) return true;
          
          // Singular/Plural matching fallback
          if (filterLower.endsWith('o')) { // Tomato -> Tomatoes
             if (name.includes(filterLower + 'es')) return true;
          }
          if (filterLower.endsWith('y')) { // Berry -> Berries
             if (name.includes(filterLower.slice(0, -1) + 'ies')) return true;
          }
          if (!filterLower.endsWith('s')) {
             if (name.includes(filterLower + 's')) return true;
          }

          return false;
        });
      });
    }

    // Apply Sorting
    switch (selectedSort) {
      case "price-low":
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price-high":
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      default:
        // Relevance - keep original order from API
        break;
    }

    return result;
  }, [products, selectedSort, selectedFilters]);

  // getIconForFilter — defined before early returns so filterOptions useMemo can use it
  const getIconForFilter = (name: string): string => {
    const iconMap: Record<string, string> = {
      Tomato: "🍅", Potato: "🥔", Chilli: "🌶️", Spinach: "🥬", Brinjal: "🍆",
      Onion: "🧅", Peanuts: "🥜", Lemon: "🍋", Mushroom: "🍄", Capsicum: "🫑",
      Ginger: "🫚", Carrot: "🥕", Fenugreek: "🌿", Broccoli: "🥦", Cucumber: "🥒",
      Cabbage: "🥬", Cauliflower: "🥦", Apple: "🍎", Banana: "🍌", Orange: "🍊",
      Mango: "🥭", Organic: "🍃", Discounted: "🏷️", "In Stock": "📦", Premium: "⭐",
    };
    return iconMap[name] || "🥬";
  };

  // filterOptions — must be before early returns (Rules of Hooks)
  const filterOptions = useMemo(() => {
    const filterMap = new Map<string, number>();
    if (selectedFilterCategory === "Type") {
      products.forEach((product) => {
        const name = (product.name || product.productName || "").toLowerCase();
        const cleanName = name.replace(/^(fresh|organic|premium|best|new)\s+/i, "").trim();
        const commonTypes = [
          { keywords: ["tomato", "tomatoes"], display: "Tomato" },
          { keywords: ["potato", "potatoes"], display: "Potato" },
          { keywords: ["chilli", "chili", "chilies"], display: "Chilli" },
          { keywords: ["spinach", "palak"], display: "Spinach" },
          { keywords: ["brinjal", "eggplant"], display: "Brinjal" },
          { keywords: ["onion", "onions"], display: "Onion" },
          { keywords: ["peanut", "peanuts"], display: "Peanuts" },
          { keywords: ["lemon", "lemons"], display: "Lemon" },
          { keywords: ["mushroom", "mushrooms"], display: "Mushroom" },
          { keywords: ["capsicum", "bell pepper", "pepper"], display: "Capsicum" },
          { keywords: ["ginger"], display: "Ginger" },
          { keywords: ["carrot", "carrots"], display: "Carrot" },
          { keywords: ["fenugreek", "methi"], display: "Fenugreek" },
          { keywords: ["broccoli"], display: "Broccoli" },
          { keywords: ["cucumber", "cucumbers"], display: "Cucumber" },
          { keywords: ["cabbage"], display: "Cabbage" },
          { keywords: ["cauliflower"], display: "Cauliflower" },
          { keywords: ["ladyfinger", "okra", "bhindi"], display: "Ladyfinger" },
          { keywords: ["beans"], display: "Beans" },
          { keywords: ["peas", "matar"], display: "Peas" },
          { keywords: ["garlic", "lehsun"], display: "Garlic" },
          { keywords: ["apple", "apples"], display: "Apple" },
          { keywords: ["banana", "bananas"], display: "Banana" },
          { keywords: ["orange", "oranges"], display: "Orange" },
          { keywords: ["mango", "mangoes"], display: "Mango" },
        ];
        for (const type of commonTypes) {
          if (type.keywords.some((keyword) => cleanName.includes(keyword))) {
            filterMap.set(type.display, (filterMap.get(type.display) || 0) + 1);
            break;
          }
        }
      });
    } else if (selectedFilterCategory === "Properties") {
      const properties = [
        { name: "Organic", check: (p: any) => (p.name || p.productName || "").toLowerCase().includes("organic") || (p.tags || []).some((t: string) => t.toLowerCase().includes("organic")) },
        { name: "Discounted", check: (p: any) => p.discount > 0 || (p.mrp > p.price) },
        { name: "In Stock", check: (p: any) => p.stock > 0 || p.variations?.some((v: any) => v.stock > 0) },
        { name: "Premium", check: (p: any) => (p.name || p.productName || "").toLowerCase().includes("premium") },
      ];
      properties.forEach(prop => {
        const count = products.filter(prop.check).length;
        if (count > 0) filterMap.set(prop.name, count);
      });
    }
    return Array.from(filterMap.entries())
      .map(([name, count]) => ({ name, count, icon: getIconForFilter(name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, selectedFilterCategory]);

  const filteredOptions = useMemo(
    () => filterOptions.filter(o => o.name.toLowerCase().includes(filterSearchQuery.toLowerCase())),
    [filterOptions, filterSearchQuery]
  );

  if ((categoryLoading || loading) && !products.length && !category) {
    return null;
  }

  if (error && !products.length && !category) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center bg-white">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
        <p className="text-gray-600 mb-6 max-w-xs">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors"
        >
          Try Refreshing
        </button>
      </div>
    );
  }

  if (!category && !categoryLoading) {
    return (
      <div className="pb-24 md:pb-8 bg-transparent min-h-screen">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-4">
          Category not found
        </h1>
        <p className="text-neutral-600 md:text-lg">
          The category you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  const handleFilterToggle = (filterName: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filterName)
        ? prev.filter((f) => f !== filterName)
        : [...prev, filterName]
    );
  };

  const handleClearFilters = () => {
    setSelectedFilters([]);
  };

  const handleApplyFilters = () => {
    // Apply filters logic here
    setIsFiltersOpen(false);
  };


  return (
    <div className="flex bg-transparent h-screen overflow-hidden">
      {/* Left Sidebar - Only show if has real subcategories */}
      {hasRealSubcategories && (
        <div className="w-[72px] bg-white border-r border-neutral-100 overflow-y-auto scrollbar-hide flex-shrink-0 py-1 shadow-sm">
          <div className="space-y-1">
            {subcategories.map((subcat) => {
              const isSelected =
                selectedSubcategory === (subcat.id || subcat._id);
              return (
                <button
                  key={subcat.id || subcat._id}
                  type="button"
                  onClick={() => {
                    console.log("Clicked subcategory:", subcat.id || subcat._id);
                    setSelectedSubcategory(subcat.id || subcat._id);
                  }}
                  className={`w-full flex flex-col items-center justify-center py-1 relative transition-all duration-200 group ${isSelected ? "bg-[#4A7C59]/10" : "hover:bg-neutral-50"
                    }`}
                  style={{
                    minHeight: "64px",
                  }}>
                  {/* Active Indicator - curved blob on left */}
                  {isSelected && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-10 bg-[#4A7C59] rounded-r-full"></div>
                  )}

                  {/* Image Container */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg mb-1 flex-shrink-0 overflow-hidden transition-all duration-200 ${isSelected
                      ? "ring-2 ring-[#4A7C59] bg-white shadow-md"
                      : "bg-[#F5F5F3] border border-neutral-100/50 group-hover:shadow-sm"
                      }`}>
                    {subcat.image ? (
                      <img
                        src={subcat.image}
                        alt={subcat.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            parent.textContent =
                              subcat.icon || subcat.name?.charAt(0) || "📦";
                          }
                        }}
                      />
                    ) : (
                      <span className="text-2xl">{subcat.icon || "📦"}</span>
                    )}
                  </div>

                  {/* Text Label */}
                  <span
                    className={`text-[8px] text-center leading-tight px-0.5 transition-colors ${isSelected
                      ? "font-black text-[#4A7C59]"
                      : "font-bold text-neutral-500 group-hover:text-black"
                      }`}
                    style={{
                      wordBreak: "break-word",
                      maxWidth: "100%",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}>
                    {subcat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[#8B3D28] shadow-lg md:top-[60px] border-b border-white/10 flex-shrink-0">
          <div className="px-3 py-2 md:py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
                  aria-label="Go back">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M15 18L9 12L15 6"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div
                  onClick={() => navigate('/user/home')}
                  className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
                >
                  <h1 className="text-base md:text-xl font-bold text-white font-poppins capitalize">
                    {category?.name}
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Filter/Sort Bar - Updated layout */}
        <div className="px-3 py-1.5 bg-[#8B3D28]/95 backdrop-blur-md border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-3 px-3 scroll-smooth">
            {/* Filters Button */}
            <button
              onClick={() => setIsFiltersOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border transition-all flex-shrink-0 whitespace-nowrap active:scale-95 shadow-sm ${selectedFilters.length > 0
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                }`}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0">
                <path
                  d="M3 6h18M6 12h12M10 18h4"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <span>Filters</span>
              {selectedFilters.length > 0 && (
                <span className="flex items-center justify-center w-4 h-4 bg-green-600 text-white text-[9px] font-black rounded-full ml-0.5">
                  {selectedFilters.length}
                </span>
              )}
            </button>

            {/* Sort Button */}
            <button
              onClick={() => setIsSortOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-700 bg-white border border-neutral-200 rounded-full hover:bg-neutral-50 transition-all flex-shrink-0 whitespace-nowrap active:scale-95 shadow-sm">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0">
                <path
                  d="M7 8l5-5 5 5M7 16l5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{sortOptions.find(opt => opt.id === selectedSort)?.label || 'Sort'}</span>
              <span className="text-neutral-400 text-[10px] ml-0.5">▾</span>
            </button>

            {/* Category Buttons */}
            {subcategories
              .filter((subcat) => (subcat.id || subcat._id) !== "all")
              .map((subcat) => {
                const subId = subcat.id || subcat._id;
                const isSelected = selectedSubcategory === subId;
                return (
                  <button
                    key={subId}
                    onClick={() => setSelectedSubcategory(subId)}
                    className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors flex-shrink-0 whitespace-nowrap ${isSelected
                      ? "bg-white border border-neutral-300 text-neutral-900"
                      : "bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                      }`}>
                    <span className="text-sm flex-shrink-0">
                      {subcat.image ? (
                        <img
                          src={subcat.image}
                          alt=""
                          className="w-4 h-4 object-cover rounded-full"
                        />
                      ) : (
                        subcat.icon || "📦"
                      )}
                    </span>
                    <span>{subcat.name}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide bg-transparent">
          {/* Products Grid */}
          {categoryProducts.length > 0 ? (
            <div className="px-3 md:px-6 lg:px-8 py-4 md:py-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
                {categoryProducts.map((product) => (
                  <ProductCard
                    key={product._id || product.id}
                    product={product}
                    showHeartIcon={false}
                    showStockInfo={false}
                    showBadge={true}
                    showOptionsText={true}
                    categoryStyle={true}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="px-4 md:px-6 lg:px-8 py-8 md:py-12 text-center">
              <p className="text-neutral-500 md:text-lg">
                No products found in this category.
              </p>
            </div>
          )}
        </div>
      </div>


      <AnimatePresence>
        {isSortOpen && (
          <>
            <div className="fixed inset-0 z-[100]">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40"
                onClick={() => setIsSortOpen(false)}
              />

              {/* Sort Modal */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl flex flex-col">
                <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                  <h2 className="text-base font-bold text-neutral-900">Sort By</h2>
                  <button
                    onClick={() => setIsSortOpen(false)}
                    className="p-1 hover:bg-neutral-100 rounded-full transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-2">
                  {sortOptions.map((option) => {
                    const isSelected = selectedSort === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSelectedSort(option.id);
                          setIsSortOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-neutral-50 rounded-xl transition-colors text-left">
                        <span className={`text-sm font-medium ${isSelected ? "text-green-700 font-bold" : "text-neutral-700"}`}>
                          {option.label}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="h-6" /> {/* Bottom safe area spacer */}
              </motion.div>
            </div>
          </>
        )}

        {isFiltersOpen && (
          <>
            {/* Hide footer when modal is open */}
            <style>{`
              nav[class*="fixed bottom-0"] {
                display: none !important;
              }
            `}</style>
            <div className="fixed inset-0 z-[100]">
              {/* Backdrop - Semi-transparent overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/40"
                onClick={() => setIsFiltersOpen(false)}
              />

              {/* Modal - Slides up from bottom, compact size matching image */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 border-b border-neutral-200">
                  <h2 className="text-base font-bold text-neutral-900">
                    Filters
                  </h2>
                </div>

                {/* Search Bar */}
                <div className="px-5 py-3 border-b border-neutral-200">
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search across filters..."
                      value={filterSearchQuery}
                      onChange={(e) => setFilterSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm text-neutral-700 placeholder:text-neutral-400"
                    />
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex flex-1 overflow-hidden min-h-0">
                  {/* Left Column - Filter Categories */}
                  <div className="w-24 border-r border-neutral-200 flex-shrink-0 bg-neutral-50">
                    <button
                      onClick={() => setSelectedFilterCategory("Type")}
                      className={`w-full px-3 py-3 text-left text-sm font-medium transition-colors ${selectedFilterCategory === "Type"
                        ? "bg-green-50 text-green-700"
                        : "text-neutral-600 hover:bg-neutral-100"
                        }`}>
                      Type
                    </button>
                    <button
                      onClick={() => setSelectedFilterCategory("Properties")}
                      className={`w-full px-3 py-3 text-left text-sm font-medium transition-colors ${selectedFilterCategory === "Properties"
                        ? "bg-green-50 text-green-700"
                        : "text-neutral-600 hover:bg-neutral-100"
                        }`}>
                      Properties
                    </button>
                  </div>

                  {/* Right Column - Filter Options */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-2">
                      {filteredOptions.map((option) => {
                        const isSelected = selectedFilters.includes(option.name);
                        return (
                          <button
                            key={option.name}
                            onClick={() => handleFilterToggle(option.name)}
                            className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all active:scale-[0.98] ${isSelected
                              ? "border-green-600 bg-green-50/50"
                              : "border-neutral-100 bg-white hover:border-neutral-200"
                              }`}>
                            <div className="flex items-center gap-3">
                              <span className="text-xl leading-none">{option.icon}</span>
                              <div className="flex flex-col items-start">
                                <span className={`text-sm font-bold ${isSelected ? "text-green-800" : "text-neutral-800"}`}>
                                  {option.name}
                                </span>
                                <span className="text-[10px] font-medium text-neutral-400">
                                  {option.count} products
                                </span>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected
                              ? "bg-green-600 border-green-600"
                              : "border-neutral-300"
                              }`}>
                              {isSelected && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="px-5 py-4 border-t border-neutral-200 flex gap-3 bg-white">
                  <button
                    onClick={handleClearFilters}
                    className="flex-1 px-4 py-2.5 border border-green-600 text-green-600 rounded-lg font-medium text-sm hover:bg-green-50 transition-colors bg-white">
                    Clear Filter
                  </button>
                  <button
                    onClick={handleApplyFilters}
                    className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors bg-green-600 text-white hover:bg-green-700">
                    Apply
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
