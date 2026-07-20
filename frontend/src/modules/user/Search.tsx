import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductCard from './components/ProductCard';
import { getProducts } from '../../services/api/customerProductService';
import { getHomeContent } from '../../services/api/customerHomeService';
import { apiCache } from '../../utils/apiCache';
import { Product } from '../../types/domain';
import { useLocation } from '../../hooks/useLocation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoading } from '../../context/LoadingContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { location } = useLocation();
  const locationRef = useRef(location);
  useEffect(() => { locationRef.current = location; }, [location]);

  const searchQuery = searchParams.get('q') || '';
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [trendingItems, setTrendingItems] = useState<any[]>([]);
  const [cookingIdeas, setCookingIdeas] = useState<any[]>([]);
  const { isRouteLoading, startRouteLoading, stopRouteLoading } = useLoading();
  const [contentLoading, setContentLoading] = useState(true);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [isListening, setIsListening] = useState(false);

  // Sync local query with URL
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Debounced Search Logic
  useEffect(() => {
    if (localSearchQuery.trim() === searchQuery) return;

    const timer = setTimeout(() => {
      if (localSearchQuery.trim()) {
        navigate(`/user/search?q=${encodeURIComponent(localSearchQuery)}`, { replace: true });
      } else {
        navigate(`/user/search`, { replace: true });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [localSearchQuery, searchQuery, navigate]);

  // Voice Search Logic
  const handleVoiceSearch = () => {
    if (isListening) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN, hi-IN'; // Support Indian English and Hindi
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setLocalSearchQuery(transcript);
        navigate(`/user/search?q=${encodeURIComponent(transcript)}`);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone permissions.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (localSearchQuery.trim()) {
      navigate(`/user/search?q=${encodeURIComponent(localSearchQuery)}`);
    }
  };

  // Fetch products based on search query — with caching + min length check
  useEffect(() => {
    const fetchProducts = async () => {
      if (!searchQuery.trim() || searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      const loc = locationRef.current;
      const locKey =
        loc?.latitude && loc?.longitude
          ? `${loc.latitude.toFixed(3)}-${loc.longitude.toFixed(3)}`
          : "no-loc";
      const cacheKey = `search-${searchQuery.trim().toLowerCase()}-${locKey}`;
      const cached = apiCache.getSync<Product[]>(cacheKey);
      if (cached) { setSearchResults(cached); return; }

      startRouteLoading();
      try {
        const loc = locationRef.current;
        const params: any = { search: searchQuery };
        if (loc?.latitude && loc?.longitude) {
          params.latitude = loc.latitude;
          params.longitude = loc.longitude;
        }
        const response = await getProducts(params);
        const results = response.data as unknown as Product[];
        apiCache.getOrFetch(cacheKey, async () => results, 2 * 60 * 1000); // cache 2 min
        setSearchResults(results);
      } catch (error) {
        setSearchResults([]);
      } finally {
        stopRouteLoading();
      }
    };

    fetchProducts();
  }, [searchQuery, location?.latitude, location?.longitude]);

  // Fetch trending/home content — cached, only when no search query
  useEffect(() => {
    if (searchQuery.trim()) return;

    const fetchInitialContent = async () => {
      try {
        const loc = locationRef.current;
        const response = await getHomeContent(
          undefined,
          loc?.latitude,
          loc?.longitude,
          true,        // useCache
          5 * 60 * 1000 // 5 min TTL
        );
        if (response.success && response.data) {
          setTrendingItems(response.data.trending || []);
          setCookingIdeas(response.data.cookingIdeas || []);
        }
      } catch (error) {
        // silently fail
      } finally {
        setContentLoading(false);
      }
    };

    fetchInitialContent();
  }, [searchQuery]);

  return (
    <div className="pb-24 md:pb-8 bg-transparent min-h-screen">
      {/* Sticky Header with Search Bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-black/5 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <input
              type="text"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              placeholder='Search "eggs", "milk", "fresh fruits"...'
              className="w-full h-11 bg-neutral-100 border-none rounded-xl pl-11 pr-12 text-sm font-medium focus:ring-2 focus:ring-village-green/20 transition-all"
              autoFocus
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
            </div>
            
            {/* Voice Search Mic Button */}
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                isListening ? 'bg-red-50 text-red-500' : 'text-neutral-500 hover:bg-neutral-200'
              }`}
            >
              <AnimatePresence mode="wait">
                {isListening ? (
                  <motion.div
                    key="listening"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                  </motion.div>
                ) : (
                  <motion.div key="mic" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/>
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </form>
        </div>
      </div>

      {/* Search Results */}
      {searchQuery.trim() && (
        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
          <h2 className="text-lg md:text-2xl font-semibold text-neutral-900 mb-3 md:mb-6">
            Search Results {searchResults.length > 0 && `(${searchResults.length})`}
          </h2>
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {searchResults.map((product) => (
                <ProductCard
                  key={product._id || product.id}
                  product={product}
                  categoryStyle={true}
                  showBadge={true}
                  showPackBadge={false}
                  showStockInfo={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 md:py-16 text-neutral-500 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-neutral-100 mx-auto max-w-lg">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-lg font-bold text-neutral-800 mb-2">No products found for &quot;{searchQuery}&quot;</p>
              <p className="text-sm text-neutral-500 px-8">We couldn&apos;t find any matches. Try checking for typos or searching with more general terms like &quot;fruits&quot; or &quot;vegetables&quot;.</p>
            </div>
          )}
        </div>
      )}

      {/* Trending in your city */}
      {!searchQuery.trim() && (
        <>
          {contentLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="md" className="text-village-green" />
            </div>
          )}

          {!contentLoading && trendingItems.length > 0 && (
            <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
              <h2 className="text-lg md:text-2xl font-semibold text-neutral-900 mb-3 md:mb-6">Trending in your city</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4">
                {trendingItems.map((item) => (
                  <div
                    key={item.id || item._id}
                    className="bg-white/40 backdrop-blur-sm rounded-lg border-2 border-green-600 p-3 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(item.type === 'category' ? `/user/category/${item.id || item._id}` : `/user/product/${item.id || item._id}`)}
                  >
                    <div className="w-full h-24 rounded-lg mb-2 overflow-hidden bg-neutral-50 flex items-center justify-center">
                      {item.image || item.imageUrl ? (
                        <img
                          src={item.image || item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-contain bg-white rounded-sm"
                        />
                      ) : (
                        <div className="text-4xl">🔥</div>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-neutral-900 text-center line-clamp-2">
                      {item.name || item.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* See all products - Placeholder or link to popular items */}
          <div className="px-4 md:px-6 lg:px-8 py-2 md:py-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 cursor-pointer" onClick={() => navigate('/user/categories')}>
              <span className="text-sm md:text-base text-neutral-700 font-medium whitespace-nowrap">Browse all categories ▸</span>
            </div>
          </div>

          {/* Cooking ideas */}
          {!contentLoading && cookingIdeas.length > 0 && (
            <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
              <h2 className="text-lg md:text-2xl font-semibold text-neutral-900 mb-3 md:mb-6">Cooking ideas</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {cookingIdeas.map((idea, idx) => (
                  <div key={idea.id || idea._id || idx} className="relative rounded-lg overflow-hidden aspect-[4/3] bg-neutral-100 cursor-pointer" onClick={() => navigate(`/user/product/${idea.productId || idea.id}`)}>
                    {idea.image && <img src={idea.image} alt={idea.title} className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    <div className="absolute bottom-2 left-2 right-2 text-white text-xs font-bold line-clamp-2">{idea.title}</div>
                    <button className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
