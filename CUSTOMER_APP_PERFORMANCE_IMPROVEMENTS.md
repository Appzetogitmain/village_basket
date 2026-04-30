# Customer App — Performance Improvement Opportunities

Deep analysis of the full customer-facing codebase. Every item below is actionable.

---

## 🔴 BUNDLE & BUILD (Biggest Impact on Load Time)

### 1. Convert All Images to WebP
**Where:** `frontend/assets/landing_page/*.jpg`, `*.png`
**Problem:** JPG/PNG files are 3–10x larger than WebP equivalents
**Fix:**
```bash
# Install sharp or use squoosh CLI
npx @squoosh/cli --webp '{}' frontend/assets/landing_page/*.jpg
```
**Expected gain:** 60–80% reduction in image payload

---

### 2. Add Terser Minification (Replace esbuild)
**Where:** `frontend/vite.config.ts`
**Problem:** esbuild minification leaves more dead code than Terser
**Fix:**
```ts
build: {
  minify: 'terser',
  terserOptions: {
    compress: { drop_console: true, drop_debugger: true, pure_funcs: ['console.log'] },
    mangle: true,
  }
}
```
**Expected gain:** 10–15% smaller JS bundle, all console.logs stripped in production

---

### 3. Split Customer/Seller/Admin into Separate Entry Points
**Where:** `frontend/vite.config.ts`
**Problem:** All portals share one bundle. Customer loads admin/seller code.
**Fix:**
```ts
rollupOptions: {
  input: {
    customer: 'src/entries/customer.tsx',
    seller: 'src/entries/seller.tsx',
    admin: 'src/entries/admin.tsx',
  }
}
```
**Expected gain:** Customer bundle 40–50% smaller

---

### 4. Lazy Load Heavy Libraries (GSAP, Lottie, Leaflet)
**Where:** `HomeHero.tsx`, `PromoStrip.tsx`, `SplashScreen.tsx`, map components
**Problem:** GSAP (~100KB), Lottie (~60KB), Leaflet (~150KB) all load on first paint
**Fix:**
```ts
// Instead of top-level import
const { gsap } = await import('gsap');
const Lottie = (await import('lottie-react')).default;
```
**Expected gain:** 300KB+ off initial bundle

---

### 5. Remove Unused Dependencies
**Where:** `frontend/package.json`
**Problem:** `recharts` AND `apexcharts` AND `react-apexcharts` are all installed — customer app uses none of them
**Fix:** Move chart libraries to admin-only bundle
**Expected gain:** ~200KB off customer bundle

---

### 6. Add Compression (Brotli/Gzip) to Vite Build
**Where:** `frontend/vite.config.ts`
**Problem:** No compression plugin configured
**Fix:**
```bash
npm install vite-plugin-compression2 -D
```
```ts
import compression from 'vite-plugin-compression2';
plugins: [react(), compression({ algorithm: 'brotliCompress' })]
```
**Expected gain:** 70–80% smaller transfer size

---

## 🔴 RENDERING & RE-RENDERS

### 7. HomeHero Makes 2 Separate API Calls on Every Mount
**Where:** `frontend/src/modules/user/components/HomeHero.tsx:45–65, 85–100`
**Problem:**
```ts
// Call 1: Header categories
useEffect(() => { fetchHeaderCategories(); }, []);
// Call 2: Regular categories (for search suggestions)
useEffect(() => { fetchCategories(); }, []);
```
Both fire on every Home mount. Neither is cached.
**Fix:** Cache both with `apiCache`, combine into one call if backend supports it

---

### 8. PromoStrip Fetches Home Content Independently (Duplicate of Home.tsx)
**Where:** `frontend/src/modules/user/components/PromoStrip.tsx:130`
**Problem:** `PromoStrip` calls `getHomeContent()` separately from `Home.tsx` — same API, same data, two network requests
**Fix:** Pass `homeData` as a prop from `Home.tsx` to `PromoStrip` — zero extra API calls

---

### 9. Search Page Fetches Home Content on Every Mount
**Where:** `frontend/src/modules/user/Search.tsx:115–130`
**Problem:** When search query is empty, fetches full home content for trending/cooking ideas
**Fix:** Cache this data, or reuse data already fetched by Home.tsx via context/prop

---

### 10. Category.tsx Has Two Separate useEffects That Both Trigger on `id` Change
**Where:** `frontend/src/modules/user/Category.tsx:50–120`
**Problem:** Category details fetch + products fetch both run independently, causing double loading states
**Fix:** Combine into one `useEffect`, fetch in parallel with `Promise.all`

---

### 11. AppLayout Adds a Scroll Listener on Every Route Change
**Where:** `frontend/src/components/AppLayout.tsx:95–105`
**Problem:**
```ts
useEffect(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // runs immediately
  return () => window.removeEventListener('scroll', handleScroll);
}, []); // runs once but handleScroll recreated on every render
```
**Fix:** Wrap `handleScroll` in `useCallback`

---

### 12. AppLayout AnimatePresence Wraps Every Route Change
**Where:** `frontend/src/components/AppLayout.tsx:200–220`
**Problem:** Every navigation triggers a full fade animation on the entire page content
**Fix:** Remove `AnimatePresence` from AppLayout, use it only on specific components that need it

---

### 13. Bottom Nav Uses `motion.div` with `layoutId` — Causes Layout Thrashing
**Where:** `frontend/src/components/AppLayout.tsx:280–310`
**Problem:** `layoutId="mobileActiveTab"` forces layout recalculation on every tab switch
**Fix:** Use CSS `transform: translateX()` instead of Framer Motion layout animations

---

### 14. HomeHero Runs 3 setTimeout Calls for Tab Indicator
**Where:** `frontend/src/modules/user/components/HomeHero.tsx:195–215`
**Problem:**
```ts
const timeout1 = setTimeout(() => updateIndicator(true), 50);
const timeout2 = setTimeout(() => updateIndicator(true), 150);
const timeout3 = setTimeout(() => updateIndicator(false), 300);
```
**Fix:** Use `ResizeObserver` + single `requestAnimationFrame`

---

### 15. PromoStrip Runs 4 Separate GSAP Animations with Deferred Timeouts
**Where:** `frontend/src/modules/user/components/PromoStrip.tsx:300–420`
**Problem:** Card animation, snowflake animation, housefull animation, product rotation — all with `setTimeout` delays
**Fix:** Use CSS animations for simple effects, keep GSAP only for complex sequences

---

### 16. Cart.tsx Recalculates Prices on Every Render
**Where:** `frontend/src/modules/user/Cart.tsx:55–80`
**Problem:** `calculateProductPrice()` called inline in JSX for every cart item on every render
**Fix:** Memoize with `useMemo` per item

---

### 17. Checkout.tsx Has 5 Separate useEffects That All Fire on Mount
**Where:** `frontend/src/modules/user/Checkout.tsx:60–200`
**Problem:** Address fetch, coupon fetch, profile fetch, delivery slots fetch, similar products fetch — all fire simultaneously on mount, causing 5 parallel API calls
**Fix:** Combine address+coupon+profile into one `Promise.all`, lazy-load similar products after checkout renders

---

## 🟡 NETWORK & API

### 18. Search Fetches on Every Keystroke After Debounce
**Where:** `frontend/src/modules/user/Search.tsx:95–115`
**Problem:** Debounce is 500ms but still fires for every URL change. No minimum query length check.
**Fix:**
```ts
if (searchQuery.trim().length < 2) return; // Skip very short queries
```

---

### 19. Category.tsx Refetches Products on Every `userLocation` Change
**Where:** `frontend/src/modules/user/Category.tsx:100`
**Problem:**
```ts
}, [id, selectedSubcategory, category?._id, userLocation]);
```
GPS drift causes product refetch
**Fix:** Use location ref pattern (same fix applied to WishlistContext)

---

### 20. Checkout Fetches Similar Products on Every Cart Length Change
**Where:** `frontend/src/modules/user/Checkout.tsx:175`
**Problem:**
```ts
}, [cart?.items?.length]);
```
Adding/removing items triggers similar products refetch
**Fix:** Fetch once on mount, don't re-fetch on quantity changes

---

### 21. PromoStrip Fetches Subcategory Images in Batches After Render
**Where:** `frontend/src/modules/user/components/PromoStrip.tsx:80–115`
**Problem:** Makes N/2 batched API calls for subcategory images after every render
**Fix:** Cache subcategory images in `apiCache`, only fetch if not cached

---

### 22. HomeHero Fetches Header Categories Without Caching
**Where:** `frontend/src/modules/user/components/HomeHero.tsx:45`
**Problem:** `getHeaderCategoriesPublic()` called without cache on every mount
**Fix:** Add `apiCache.getOrFetch()` wrapper

---

### 23. Cart Images Have No `loading="lazy"`
**Where:** `frontend/src/modules/user/Cart.tsx:65`
**Problem:**
```tsx
<img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover rounded-lg" />
```
No lazy loading
**Fix:** Add `loading="lazy"` and `decoding="async"`

---

### 24. Trending/Cooking Idea Images in Search Have No Lazy Loading
**Where:** `frontend/src/modules/user/Search.tsx:200–240`
**Problem:** All trending item images load immediately
**Fix:** Add `loading="lazy"` to all `<img>` tags

---

## 🟡 UX PERFORMANCE (Perceived Speed)

### 25. No Skeleton Screens — Only Spinners
**Where:** Home, Category, Search, Orders pages
**Problem:** Blank white screen or spinner while data loads — feels slow
**Fix:** Add skeleton placeholders that match the layout:
```tsx
// ProductCard skeleton
<div className="animate-pulse bg-neutral-100 rounded-2xl h-48 w-full" />
```

---

### 26. Home Page Shows `<PageLoader />` Instead of Skeleton
**Where:** `frontend/src/modules/user/Home.tsx:250`
**Problem:**
```tsx
if (loading && !products.length && !homeData.homeSections?.length) {
  return <PageLoader />;
}
```
Full-page loader blocks all content
**Fix:** Show skeleton grid immediately, fill in data as it arrives

---

### 27. No Optimistic UI for Cart Operations
**Where:** `frontend/src/modules/user/Cart.tsx`
**Problem:** Cart updates wait for API response before updating UI (even though CartContext does optimistic updates, Cart.tsx re-renders after API)
**Fix:** Already partially done in CartContext — ensure Cart.tsx reflects optimistic state immediately

---

### 28. SplashScreen Blocks App for 3.2 Seconds
**Where:** `frontend/src/components/SplashScreen.tsx:10`
**Problem:**
```ts
timerRef.current = setTimeout(() => setVisible(false), 3200);
```
3.2 seconds is too long
**Fix:** Reduce to 1.5–2 seconds, or hide as soon as Home data is ready

---

### 29. Search Has No Results Caching
**Where:** `frontend/src/modules/user/Search.tsx`
**Problem:** Searching "tomato", going back, searching "tomato" again = 2 API calls
**Fix:** Cache search results in `apiCache` with 2-minute TTL

---

### 30. Category Filter Options Recalculated on Every Render
**Where:** `frontend/src/modules/user/Category.tsx:280–380`
**Problem:** `getFilterOptions()` is called directly in JSX — runs on every render, iterates all products
**Fix:**
```ts
const filterOptions = useMemo(() => getFilterOptions(), [products, selectedFilterCategory]);
```

---

## 🟡 MEMORY & CLEANUP

### 31. HomeHero Scroll Listener Not Properly Memoized
**Where:** `frontend/src/modules/user/components/HomeHero.tsx:155`
**Problem:** `handleScroll` function recreated on every render, causing listener re-registration
**Fix:** Wrap in `useCallback`

---

### 32. PromoStrip Product Rotation Interval Not Cleared on Unmount
**Where:** `frontend/src/modules/user/components/PromoStrip.tsx:450`
**Problem:** `setInterval` for product rotation — if component unmounts during interval, state update on unmounted component
**Fix:** Already has cleanup but verify it runs before GSAP animations complete

---

### 33. AppLayout Creates New `handleSearchChange` on Every Render
**Where:** `frontend/src/components/AppLayout.tsx:75`
**Problem:** Function passed to child components without `useCallback`
**Fix:** Wrap in `useCallback([navigate, location.pathname, setSearchParams])`

---

## 🟢 QUICK WINS (Easy, High Visibility)

### 34. Add `fetchpriority="high"` to Hero Images
**Where:** LandingPage, HomeHero
**Fix:**
```tsx
<img src={heroProduceImg} fetchpriority="high" loading="eager" />
```

---

### 35. Add `rel="preconnect"` for External Domains
**Where:** `index.html`
**Fix:**
```html
<link rel="preconnect" href="https://maps.googleapis.com" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://www.transparenttextures.com" />
<link rel="dns-prefetch" href="https://res.cloudinary.com" />
```

---

### 36. Replace External Texture URL with Local Asset
**Where:** Throughout app (HomeHero, Orders, PromoStrip, etc.)
**Problem:**
```tsx
bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]
```
External HTTP request on every component mount
**Fix:** Download the texture, put it in `public/assets/`, use local path

---

### 37. Reduce SplashScreen Animation Duration
**Where:** `frontend/src/components/SplashScreen.tsx`
**Problem:** 3.2s splash + 0.5s exit = 3.7s before user sees anything
**Fix:** 1.5s splash, 0.3s exit

---

### 38. Add `will-change: transform` to Animated Elements
**Where:** ProductCard hover, bottom nav, PromoStrip cards
**Fix:**
```tsx
className="... will-change-transform"
```
Promotes elements to GPU layer before animation starts

---

### 39. Virtualize Long Product Lists
**Where:** Category.tsx, Search.tsx (can have 100+ products)
**Problem:** All products rendered in DOM simultaneously
**Fix:** Use `react-window` or `react-virtual`:
```bash
npm install @tanstack/react-virtual
```

---

### 40. Add Service Worker for Asset Caching (PWA)
**Where:** `frontend/public/`
**Problem:** Only Firebase messaging SW exists — no asset caching
**Fix:**
```bash
npm install vite-plugin-pwa -D
```
Cache JS/CSS/images for instant repeat visits

---

## 📊 Priority Matrix

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| 🔴 P0 | Convert images to WebP (#1) | Low | Very High |
| 🔴 P0 | PromoStrip duplicate API call (#8) | Low | High |
| 🔴 P0 | Lazy load GSAP/Lottie/Leaflet (#4) | Medium | Very High |
| 🔴 P0 | Remove unused chart deps (#5) | Low | High |
| 🔴 P0 | Add Brotli compression (#6) | Low | Very High |
| 🔴 P1 | Skeleton screens (#25, #26) | Medium | High |
| 🔴 P1 | Checkout 5 parallel fetches (#17) | Low | Medium |
| 🔴 P1 | Category double useEffect (#10) | Low | Medium |
| 🟡 P2 | Virtualize product lists (#39) | Medium | High |
| 🟡 P2 | Cache search results (#29) | Low | Medium |
| 🟡 P2 | Replace texture URL with local (#36) | Low | Medium |
| 🟡 P2 | Add preconnect hints (#35) | Very Low | Medium |
| 🟡 P2 | Reduce splash duration (#37) | Very Low | High |
| 🟡 P3 | Service Worker / PWA (#40) | Medium | Very High |
| 🟡 P3 | Split entry points (#3) | High | Very High |
| 🟢 P4 | will-change on animations (#38) | Very Low | Low |
| 🟢 P4 | fetchpriority on hero images (#34) | Very Low | Low |

---

## 📈 Expected Improvements After All Fixes

| Metric | Current | After |
|--------|---------|-------|
| Initial JS Bundle | ~2.5MB | ~800KB |
| First Contentful Paint | 3–4s | 0.8–1.2s |
| Time to Interactive | 6–8s | 2–3s |
| API calls on Home load | 8–12 | 2–3 |
| Repeat visit load | 3–4s | <0.5s (cached) |
| Lighthouse Score | ~45–55 | ~85–90 |
