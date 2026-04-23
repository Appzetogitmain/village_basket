import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import brandLogo from '@assets/village_basket-removebg-preview.png';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import dryfruitsImg from '@assets/landing_page/dryfruits.jpg';
import veggiesImg from '@assets/landing_page/fresh_veggies.jpg';
import fruitsImg from '@assets/landing_page/fruits.jpg';
import gheeImg from '@assets/landing_page/ghee.jpg';
import ourStoryImg from '@assets/landing_page/our_story.png';
import farmImg1 from '@assets/landing_page/farm_image_1.png';
import farmImg2 from '@assets/landing_page/farm_image_2.png';
import farmImg3 from '@assets/landing_page/farm_image_3.png';
import heroProduceImg from '@assets/landing_page/hero_produce.png';
import appHomeImg from '@assets/landing_page/app_home.png';
import appCheckoutImg from '@assets/landing_page/app_checkout.png';
import appTrackingImg from '@assets/landing_page/app_tracking.png';
import appScrnshot1 from '@assets/landing_page/app_scrnshot.png';
import appScrnshot2 from '@assets/landing_page/app_category_scrnshot.png';
import appScrnshot3 from '@assets/landing_page/app_orders_scrnshot.png';
import { submitInquiry } from '../../services/api/contactService';
import { useToast } from '../../context/ToastContext';
/* ─── Reveal Component ───────────────────────────── */
function Reveal({ children, width = "fit-content", delay = 0 }: { children: React.ReactNode, width?: "fit-content" | "100%", delay?: number }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 75 },
        visible: { opacity: 1, y: 0 },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut", delay }}
      style={{ width }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Animated Counter Hook ──────────────────────────────── */
function useCounter(target: number, duration = 2000, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);
  return count;
}

/* ─── Intersection Observer Hook ─────────────────────────── */
function useInView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── Stat Item Component ────────────────────────────────── */
function StatItem({ label, target, colorClass, started, textColorClass }: { label: string, target: number, colorClass: string, started: boolean, textColorClass: string }) {
  const count = useCounter(target, 2000, started);
  return (
    <div className={`border-l-4 ${colorClass} pl-5`}>
      <p className="text-3xl sm:text-4xl font-black text-[#3E2723]">{count.toLocaleString('en-IN')}+</p>
      <p className={`text-xs font-black uppercase tracking-widest ${textColorClass} mt-1`}>{label}</p>
    </div>
  );
}

/* ─── Image Slider Component ────────────────────────────── */
function ImageSlider({ images }: { images: string[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(c => (c + 1) % images.length), 3000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <div className="relative w-full h-[300px] sm:h-[380px] md:h-[440px] lg:h-[500px] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
      {images.map((src, idx) => (
        <img
          key={idx}
          src={src}
          alt="Slider"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        />
      ))}
    </div>
  );
}

/* ─── App Mockup Component ───────────────────────────────── */
function AppMockupSlider({
  images,
  width = "w-[280px]",
  height = "h-[580px]",
  padding = "p-3",
  innerPadding = "p-0",
  objectFit = "object-cover",
  borderRadiusOuter = "rounded-[3.5rem]",
  borderRadiusInner = "rounded-[2.8rem]",
  borderWidth = "border-4"
}: {
  images: string[],
  width?: string,
  height?: string,
  padding?: string,
  innerPadding?: string,
  objectFit?: "object-cover" | "object-contain",
  borderRadiusOuter?: string,
  borderRadiusInner?: string,
  borderWidth?: string
}) {
  const [activeAppSlide, setActiveAppSlide] = useState(0);
  const screenshots = images;

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveAppSlide((prev) => (prev + 1) % screenshots.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [screenshots.length]);

  return (
    <div className="relative flex justify-center h-[420px] sm:h-[520px] md:h-[580px] w-full items-center overflow-hidden">
      {screenshots.map((src, idx) => {
        let diff = idx - activeAppSlide;
        if (diff < -1) diff += 3;
        if (diff > 1) diff -= 3;
        const isCenter = diff === 0;
        const isLeft = diff === -1;

        return (
          <div
            key={idx}
            className={`absolute transition-all duration-1000 ease-in-out cursor-pointer ${isCenter
              ? 'z-30 scale-100 opacity-100 translate-x-0'
              : isLeft
                ? 'z-20 scale-[0.80] opacity-40 -translate-x-[55%] sm:-translate-x-[40%]'
                : 'z-20 scale-[0.80] opacity-40 translate-x-[55%] sm:translate-x-[40%]'
              }`}
            onClick={() => setActiveAppSlide(idx)}
          >
            <div
              className={`w-[180px] h-[360px] sm:w-[220px] sm:h-[440px] md:${width} md:${height} bg-[#3E2723] ${borderRadiusOuter} ${padding} shadow-2xl ${borderWidth} border-gray-100 relative overflow-hidden group`}
            >
              {/* Device Notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 sm:w-28 h-5 sm:h-6 bg-gray-100 rounded-b-2xl z-20"></div>

              {/* Screen Content */}
              <div className={`w-full h-full ${borderRadiusInner} overflow-hidden bg-white relative flex flex-col items-center justify-center ${innerPadding}`}>
                <motion.img
                  initial={{ scale: 1 }}
                  animate={{ scale: isCenter ? 1 : 0.95 }}
                  transition={{ duration: 0.8 }}
                  src={src}
                  alt={`App Screen ${idx + 1}`}
                  className={`w-full h-full ${objectFit}`}
                />

                {/* Overlay for inactive screens */}
                {!isCenter && <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>}
              </div>
            </div>
          </div>
        );
      })}

      {/* Slide Indicators */}
      <div className="absolute -bottom-8 sm:-bottom-10 flex gap-2">
        {screenshots.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${i === activeAppSlide ? 'bg-[#8B3D28] w-6' : 'bg-[#8B3D28]/20 w-2'}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Main Landing Page ──────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scroll Progress Logic
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Parallax Y for background elements
  const bgY1 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const bgY2 = useTransform(scrollYProgress, [0, 1], [0, -300]);

  // Scroll detection for navbar
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Stats section
  const { ref: statsRef, inView: statsInView } = useInView(0.4);

  // Automatic Screen Cycling for Features Stack
  const [featureIter, setFeatureIter] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setFeatureIter(i => (i + 1) % 3), 4000);
    return () => clearInterval(timer);
  }, []);

  // Contact Form State
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      showToast('Please fill all fields', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await submitInquiry(formData);
      showToast('Inquiry submitted! We will get back to you soon.', 'success');
      setFormData({ name: '', email: '', message: '' });
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to submit inquiry', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navLinks = [
    { label: 'Categories', href: '#categories' },
    { label: 'Why Us', href: '#why-us' },
    { label: 'App', href: '#download-app' },
    { label: 'Our Story', href: '#our-story' },
    { label: 'Contact', href: '#contact' }
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-poppins relative overflow-x-hidden" style={{ backgroundImage: "linear-gradient(rgba(250,247,242,0.92),rgba(250,247,242,0.92)),url('/assets/warli_pattern.png')", backgroundSize: '320px', backgroundAttachment: 'fixed' }}>

      {/* Scroll Progress Bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-[#4A7C59] origin-left z-[60]" style={{ scaleX }} />

      {/* Parallax Floating Assets */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div style={{ y: bgY1 }} className="absolute top-[15%] left-[5%] text-4xl opacity-10">🌿</motion.div>
        <motion.div style={{ y: bgY2 }} className="absolute top-[40%] right-[10%] text-5xl opacity-5">🌾</motion.div>
        <motion.div style={{ y: bgY1 }} className="absolute bottom-[20%] left-[8%] text-3xl opacity-10 rotate-45">🍂</motion.div>
        <motion.div style={{ y: bgY2 }} className="absolute bottom-[10%] right-[5%] text-6xl opacity-5">🌱</motion.div>
      </div>

      {/* ── Navbar ──────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#8B3D28] shadow-lg py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-white p-1.5 rounded-xl shadow-md">
              <img src={brandLogo} alt="Village Basket" className="h-8 md:h-10 w-auto object-contain" />
            </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} className={`text-sm font-semibold transition-colors ${scrolled ? 'text-white/80 hover:text-white' : 'text-[#3E2723]/80 hover:text-[#8B3D28]'}`}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-3">
            {!isAuthenticated && (
              <Link to="/user/login" className={`text-sm font-bold px-4 py-2 rounded-xl transition-all ${scrolled ? 'text-white hover:bg-white/10' : 'text-[#8B3D28] hover:bg-[#8B3D28]/10'}`}>Login</Link>
            )}
            <Link to={isAuthenticated ? "/user" : "/user/login"} className="text-sm font-black px-5 py-2.5 bg-[#4A7C59] text-white rounded-xl shadow-md hover:bg-[#3d6b4a] active:scale-95 transition-all">Shop Now</Link>
          </div>
          <button onClick={() => setMobileMenuOpen(v => !v)} className={`lg:hidden p-2 rounded-xl ${scrolled ? 'text-white' : 'text-[#8B3D28]'}`}>
            {mobileMenuOpen
              ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            }
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#8B3D28] px-6 py-6 flex flex-col gap-4 border-t border-white/10 mt-2">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} onClick={() => setMobileMenuOpen(false)} className="text-white/90 font-semibold text-sm">{link.label}</a>
            ))}
            <div className="flex flex-col gap-3 pt-3 border-t border-white/10">
              {!isAuthenticated && (
                <Link to="/user/login" onClick={() => setMobileMenuOpen(false)} className="text-white/80 font-bold text-sm text-center py-2">Login</Link>
              )}
              <Link to={isAuthenticated ? "/user" : "/user/login"} onClick={() => setMobileMenuOpen(false)} className="bg-[#4A7C59] text-white font-black text-sm text-center py-3 rounded-xl">Shop Now</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── 1. Hero Section ─────────────────────────────── */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[90vh] flex items-center relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">

          <div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-[#8B3D28]/10 text-[#8B3D28] text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6 border border-[#8B3D28]/20"
            >
              <span>🌾</span> Farm to Doorstep
            </motion.div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-[#3E2723] leading-[1.1] mb-6">
              Fresh From the<br />
              <span className="text-[#8B3D28]">Village,</span> at{' '}
              <span className="text-[#4A7C59]">Your Doorstep</span>
            </h1>
            <p className="text-[#3E2723]/70 text-lg sm:text-xl leading-relaxed mb-8 max-w-lg">
              Organic produce, dairy, spices & more — delivered by local farmers straight to you.
              Choose your preferred delivery shift at checkout.
            </p>

            {/* Shift Pills */}
            <div className="flex flex-wrap gap-3 mb-10">
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-2 md:px-4 md:py-2.5 rounded-2xl shadow-sm">
                <span className="text-xl">☀️</span>
                <div>
                  <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Morning Shift</p>
                  <p className="text-[11px] font-bold text-amber-700">5:00 AM – 9:00 AM</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-2 md:px-4 md:py-2.5 rounded-2xl shadow-sm">
                <span className="text-xl">🌙</span>
                <div>
                  <p className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">Evening Shift</p>
                  <p className="text-[11px] font-bold text-indigo-700">5:00 PM – 9:00 PM</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-10 lg:mb-0">
              <Link to={isAuthenticated ? "/user" : "/user/login"} className="px-8 py-4 bg-[#8B3D28] text-white font-black rounded-2xl shadow-xl hover:bg-[#7a3323] active:scale-95 transition-all text-sm uppercase tracking-wider">
                Start Shopping →
              </Link>
              <a href="#our-story" className="px-8 py-4 bg-white border-2 border-[#8B3D28] text-[#8B3D28] font-black rounded-2xl hover:bg-[#8B3D28]/5 active:scale-95 transition-all text-sm uppercase tracking-wider">
                Our Story
              </a>
            </div>

            {/* Mobile Hero Visual - Hidden on Desktop */}
            <div className="lg:hidden mt-8 w-full max-w-sm mx-auto">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative bg-white p-3 rounded-[3rem] shadow-[0_20px_40px_rgba(139,61,40,0.1)] border border-[#8B3D28]/5"
              >
                <div className="w-full aspect-square rounded-[2.5rem] overflow-hidden bg-stone-50 relative">
                  <img
                    src={heroProduceImg}
                    alt="Fresh Produce"
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle gradient overlay to make image pop */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                </div>

                {/* Floating Badge for Mobile */}
                <div className="absolute -bottom-4 -right-2 bg-[#4A7C59] text-white rounded-[1.5rem] shadow-lg px-4 py-2 flex items-center gap-2 z-20 border-2 border-white">
                  <span className="text-lg">🌿</span>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest leading-none mb-0.5 opacity-80">Strictly</p>
                    <p className="text-xs font-bold leading-none">Organic</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Hero Visual - Premium Focus */}
          <div className="relative hidden lg:flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative z-10"
            >
              {/* Image Frame */}
              <div className="w-[440px] h-[440px] bg-white p-4 rounded-[4.5rem] shadow-[0_30px_80px_rgba(139,61,40,0.12)] relative group">
                <div className="w-full h-full rounded-[3.5rem] overflow-hidden bg-stone-50">
                  <motion.img
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.8 }}
                    src={heroProduceImg}
                    alt="Fresh Produce"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Elegant Floating Badges */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-6 -right-6 bg-[#4A7C59] text-white rounded-[2rem] shadow-xl px-6 py-4 flex items-center gap-3 z-20 border-4 border-white"
                >
                  <span className="text-2xl">🌿</span>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-1 opacity-80">Strictly</p>
                    <p className="text-sm font-bold">Organic</p>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-6 -left-6 bg-white text-[#8B3D28] rounded-[2rem] shadow-xl px-6 py-4 flex items-center gap-3 z-20 border border-[#8B3D28]/10"
                >
                  <span className="text-2xl">🚚</span>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#3E2723]/40 leading-none mb-1">Morning & Evening</p>
                    <p className="text-sm font-black text-[#3E2723]">Daily Shifts</p>
                  </div>
                </motion.div>

                {/* Soft backdrop glow */}
                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#8B3D28]/5 rounded-full blur-3xl"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. Categories ───────────────────────────────── */}
      <section id="categories" className="py-20 bg-white px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-[#3E2723] mb-4">Village Harvest</h2>
            <p className="text-[#3E2723]/60 max-w-2xl mx-auto">Discover our range of authentic, unadulterated products straight from the heart of rural farms.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 lg:gap-8">
            {[
              { title: 'Fresh Veggies', img: veggiesImg, path: '/user/category/vegetables' },
              { title: 'Dryfruits', img: dryfruitsImg, path: '/user/category/dryfruits' },
              { title: 'Oil & Ghee', img: gheeImg, path: '/user/category/oil-and-ghee' },
              { title: 'Organic Fruits', img: fruitsImg, path: '/user/category/fruits' },
            ].map((cat) => (
              <Link key={cat.title} to={cat.path} className="group cursor-pointer block">
                <div className="relative overflow-hidden rounded-[2rem] mb-4 aspect-square shadow-xl group-hover:shadow-[#8B3D28]/10 transition-all border border-[#8B3D28]/5">
                  <img src={cat.img} alt={cat.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#3E2723]/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  <div className="absolute bottom-6 left-6 right-6 text-white transform group-hover:-translate-y-2 transition-transform duration-500 text-left">
                    <h3 className="font-bold text-lg sm:text-xl tracking-wide leading-tight max-w-[120px] sm:max-w-[150px]">{cat.title}</h3>
                  </div>
                  
                  {/* Premium Hover Detail */}
                  <div className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                    <span className="text-white text-lg font-black">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link to="/user/categories" className="inline-block text-[#8B3D28] font-black uppercase tracking-widest text-sm hover:underline">View All Categories →</Link>
          </div>
        </div>
      </section>

      {/* ── 3. Why Choose Us ────────────────────────────── */}
      <section id="why-us" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#8B3D28] text-xs font-black uppercase tracking-[0.25em] mb-3">The Village Edge</p>
          <h2 className="text-3xl sm:text-4xl font-black text-[#3E2723]">Why Choose Us?</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: 'Direct from Farmers', icon: '🧑‍🌾', desc: 'No middlemen. Fair prices for farmers, fresh organic produce for you.' },
            { title: '100% Unadulterated', icon: '🌿', desc: 'We guarantee purity. Our products are grown organically without harmful chemicals.' },
            { title: 'Empowering Villages', icon: '🤝', desc: 'Every purchase you make directly uplifts and supports rural farming communities.' },
          ].map((item) => (
            <div key={item.title} className="bg-white p-8 rounded-[2rem] border border-[#8B3D28]/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(139,61,40,0.08)] transition-all text-center group">
              <div className="w-16 h-16 bg-[#FAF7F2] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 group-hover:-translate-y-2 transition-transform">{item.icon}</div>
              <h3 className="font-black text-[#3E2723] text-xl mb-3">{item.title}</h3>
              <p className="text-[#3E2723]/60 leading-relaxed text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Download Our App ──────────────────────────── (Repositioned & Refined) */}
      <section id="download-app" className="py-24 px-4 sm:px-6 relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto bg-[#FAF7F2] rounded-[4rem] p-8 md:p-20 relative shadow-[0_10px_60px_rgba(139,61,40,0.06)] overflow-hidden border border-[#8B3D28]/5 group">
          {/* Decorative floating shapes */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#8B3D28]/3 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-14">
            <div className="flex-1 text-center lg:text-left">
              <span className="inline-block bg-[#8B3D28]/10 text-[#8B3D28] px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] mb-8">Better on Mobile</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#3E2723] mb-8 leading-[1.05] tracking-tight">
                Pure Freshness, <br />
                <span className="text-[#8B3D28]">One Tap Away.</span>
              </h2>
              <p className="text-[#3E2723]/60 text-lg mb-12 max-w-xl leading-relaxed font-medium">
                Download the VillageBasket app for a seamless farm-to-table journey. Get real-time harvest alerts, shift delivery tracking, and exclusive rewards.
              </p>

              {/* Store Buttons - Improved with White Theme */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-12">
                <a href="#" className="bg-white border border-[#3E2723]/10 px-8 py-3.5 rounded-2xl flex items-center gap-4 hover:shadow-lg hover:border-[#3E2723]/20 transition-all active:scale-95 group/btn">
                  <div className="text-[#3E2723]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.5 12c0 2.2-1.4 4.1-3.3 4.9.4.5.7 1.1.7 1.8 0 1.2-.8 2.2-1.9 2.2h-2c-1.1 0-1.9-1-1.9-2.2 0-.7.3-1.3.7-1.8-1.9-.8-3.3-2.7-3.3-4.9 0-2.9 2.4-5.2 5.3-5.2 2.9 0 5.3 2.3 5.3 5.2zM12 2.5c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5-1.5-.7-1.5-1.5.7-1.5 1.5-1.5z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-[#3E2723]/40 font-black uppercase tracking-widest leading-none mb-1">Download on the</p>
                    <p className="text-lg text-[#3E2723] font-black leading-none">App Store</p>
                  </div>
                </a>
                <a href="#" className="bg-white border border-[#3E2723]/10 px-8 py-3.5 rounded-2xl flex items-center gap-4 hover:shadow-lg hover:border-[#3E2723]/20 transition-all active:scale-95 group/btn">
                  <div className="text-[#4A7C59]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.5 3h17c.8 0 1.5.7 1.5 1.5v15c0 .8-.7 1.5-1.5 1.5h-17c-.8 0-1.5-.7-1.5-1.5v-15c0-.8.7-1.5 1.5-1.5zm11.2 5.5l-4.7-2.7v5.4l4.7-2.7zm-4.7 6.3l4.7-2.7-4.7-2.7v5.4z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-[#3E2723]/40 font-black uppercase tracking-widest leading-none mb-1">Get it on</p>
                    <p className="text-lg text-[#3E2723] font-black leading-none">Google Play</p>
                  </div>
                </a>
              </div>

              {/* Trust Badge */}
              <div className="flex items-center gap-3 py-4 border-t border-[#3E2723]/5 inline-flex">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-amber-100 flex items-center justify-center text-[10px] font-black shadow-sm">👤</div>
                  ))}
                </div>
                <p className="text-xs text-[#3E2723]/30 font-bold uppercase tracking-widest leading-none">Join 50,000+ village partners</p>
              </div>
            </div>

            {/* Visual Right - App Screenshots Slider */}
            <div className="flex-1 w-full lg:w-auto flex justify-center lg:justify-end relative">
              <div className="relative w-full">
                {/* QR Code Case - Only visible on large screens to avoid overlap */}
                <div className="absolute top-10 left-0 lg:-left-12 transform -translate-x-1/2 hidden lg:block bg-white p-4 rounded-3xl shadow-xl z-40 border border-[#8B3D28]/5 animate-bounce" style={{ animationDuration: '5s' }}>
                  <div className="w-16 h-16 bg-stone-50 rounded-xl grid grid-cols-4 grid-rows-4 gap-1 p-2">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className={`rounded-sm ${(i * 17) % 4 === 0 ? 'bg-[#3E2723]' : 'bg-[#FAF7F2]'}`}></div>
                    ))}
                  </div>
                  <p className="text-[7px] font-black text-center mt-2 text-[#3E2723]/30 uppercase tracking-[0.2em]">Scan for App</p>
                </div>

                <AppMockupSlider
                  images={[appScrnshot1, appScrnshot2, appScrnshot3]}
                  width="w-[240px]"
                  height="h-[480px]"
                  padding="p-1.5"
                  innerPadding="p-1"
                  objectFit="object-contain"
                  borderRadiusOuter="rounded-[3rem]"
                  borderRadiusInner="rounded-[2.5rem]"
                  borderWidth="border-[2px]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 Removed */}
      {/* ── 5. Customer Testimonial ─────────────────────── */}
      <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto bg-white my-12 rounded-[3rem] shadow-sm border border-[#8B3D28]/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FAF7F2] rounded-bl-full -z-10"></div>
        <div className="text-center mb-12">
          <span className="text-4xl text-[#8B3D28]/20 block mb-4">❝</span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#3E2723]">Voices of Our Village</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: 'Priya S.', role: 'Homemaker', review: 'The freshness is unmatched. It feels like getting vegetables directly from my grandfather’s farm. Truly organic!' },
            { name: 'Rahul M.', role: 'Fitness Coach', review: 'I was looking for unadulterated dairy and staples. VillageBasket has been a blessing. The desi ghee is phenomenal.' },
            { name: 'Anjali T.', role: 'Working Professional', review: 'I love the evening shift delivery option. I arrive from work, and my completely fresh organic groceries are waiting.' },
          ].map((test) => (
            <div key={test.name} className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#8B3D28]/10 relative">
              <div className="flex text-[#E5A93D] mb-4 text-sm">★★★★★</div>
              <p className="text-[#3E2723]/70 font-medium italic mb-6 leading-relaxed">"{test.review}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#8B3D28]/20 flex items-center justify-center text-[#8B3D28] font-black">{test.name.charAt(0)}</div>
                <div>
                  <h4 className="font-black text-[#3E2723] text-sm">{test.name}</h4>
                  <p className="text-xs text-[#3E2723]/50 font-bold">{test.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Stats Section with Image Slider ──────────── */}
      <section ref={statsRef} className="py-20 px-4 sm:px-6 bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Stats Left */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#3E2723] leading-tight mb-6 text-left">
              A Growing Movement of <span className="text-[#4A7C59]">Healthy Living</span>
            </h2>
            <p className="text-[#3E2723]/70 mb-10 leading-relaxed text-lg text-left">
              We started with a handful of farmers and a vision. Today, we are proud to bridge the gap between rural cultivators and thousands of urban families craving authentic purity.
            </p>
            <div className="grid sm:grid-cols-2 gap-8">
              <StatItem label="Happy Families" target={10000} colorClass="border-[#8B3D28]" textColorClass="text-[#8B3D28]" started={statsInView} />
              <StatItem label="Local Farmers" target={500} colorClass="border-[#4A7C59]" textColorClass="text-[#4A7C59]" started={statsInView} />
              <div className="sm:col-span-2">
                <StatItem label="Deliveries Made" target={50000} colorClass="border-[#E5A93D]" textColorClass="text-[#E5A93D]" started={statsInView} />
              </div>
            </div>
          </div>
          {/* Image Slider Right (Optimized standalone component) */}
          <ImageSlider images={[farmImg1, farmImg2, farmImg3]} />
        </div>
      </section>

      {/* ── 7. App Features ─────────────────────────────── */}
      <section id="app-features" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 w-full relative h-[500px] sm:h-[620px] md:h-[680px] flex items-center justify-center overflow-visible">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-[#8B3D28]/3 rounded-full blur-[120px] -z-10"></div>

            {/* The "Premium Stack" of Screenshots */}
            <div className="relative w-full max-w-[200px] sm:max-w-[260px] md:max-w-[280px] aspect-[9/19]">
              {/* Back Screenshot (Category) - Tilted Left */}
              <motion.div 
                animate={{ y: [0, -10, 0], x: [0, -5, 0], rotate: [-12, -14, -12] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-6 sm:top-10 -left-10 sm:-left-16 md:-left-20 w-full h-full bg-[#3E2723] rounded-[2.5rem] sm:rounded-[3rem] shadow-xl border border-white/20 p-1.5 sm:p-2 overflow-hidden opacity-30 -z-10"
              >
                <div className="w-full h-full rounded-[1.8rem] sm:rounded-[2.5rem] p-1 overflow-hidden">
                  <div className="w-full h-full rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden relative">
                    <AnimatePresence mode="wait">
                      <motion.img 
                        key={featureIter}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        src={[appScrnshot2, appScrnshot3, appScrnshot1][featureIter]} 
                        alt="App Screen" 
                        className="w-full h-full object-cover grayscale-[30%]" 
                      />
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              {/* Middle Screenshot (Orders) - Tilted Right */}
              <motion.div 
                animate={{ y: [0, 8, 0], x: [0, 6, 0], rotate: [8, 10, 8] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-12 sm:top-20 -right-10 sm:-right-16 md:-right-20 w-full h-full bg-[#3E2723] rounded-[2.5rem] sm:rounded-[3rem] shadow-xl border border-white/20 p-1.5 sm:p-2 overflow-hidden opacity-40 -z-10"
              >
                <div className="w-full h-full rounded-[1.8rem] sm:rounded-[2.5rem] p-1 overflow-hidden">
                  <div className="w-full h-full rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden relative">
                    <AnimatePresence mode="wait">
                      <motion.img 
                        key={featureIter}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        src={[appScrnshot3, appScrnshot1, appScrnshot2][featureIter]} 
                        alt="App Screen" 
                        className="w-full h-full object-cover grayscale-[20%]" 
                      />
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              {/* Front Main Screenshot (Home) - Centered & Sharp (Matching Download-App slider) */}
              <motion.div 
                whileHover={{ scale: 1.02, rotate: 0 }}
                animate={{ y: [0, -5, 0], rotate: [0, -1, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 w-full h-full bg-[#3E2723] p-1.5 rounded-[2.2rem] sm:rounded-[3.2rem] shadow-[0_40px_80px_-15px_rgba(62,39,35,0.25)] border-[2px] border-gray-100 cursor-pointer group"
              >
                <div className="w-full h-full rounded-[1.8rem] sm:rounded-[2.5rem] bg-white p-1 overflow-hidden relative">
                  <div className="w-full h-full rounded-[1.5rem] sm:rounded-[2.2rem] overflow-hidden relative">
                    <AnimatePresence mode="wait">
                      <motion.img 
                        key={featureIter}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        src={[appScrnshot1, appScrnshot2, appScrnshot3][featureIter]} 
                        alt="App Screen" 
                        className="w-full h-full object-cover" 
                      />
                    </AnimatePresence>
                  </div>
                  {/* Subtle glass reflection overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
                </div>

                {/* Floating "Premium" Tooltip on the Phone */}
                <div className="absolute top-12 -right-4 sm:-right-8 bg-[#4A7C59] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 z-30 border-2 border-white">
                  <span>✨</span> Verified Pure
                </div>
              </motion.div>
            </div>

            {/* Floating Glassmorphism Badges - Repositioned */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[15%] right-0 md:-right-10 z-20 bg-white/80 backdrop-blur-xl border border-white p-3 rounded-2xl shadow-xl hidden md:flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-[#4A7C59] text-white rounded-lg flex items-center justify-center text-sm shadow-md">🛍️</div>
              <p className="text-[11px] font-black text-[#3E2723]">Quick Buy</p>
            </motion.div>

            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-[10%] left-0 md:-left-12 z-20 bg-white/80 backdrop-blur-xl border border-white p-3 rounded-2xl shadow-xl flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-[#8B3D28] text-white rounded-lg flex items-center justify-center text-sm shadow-md">🔔</div>
              <p className="text-[11px] font-black text-[#3E2723]">Live Alerts</p>
            </motion.div>

          </div>
          {/* Features Text */}
          <div className="order-1 lg:order-2">
            <p className="text-[#8B3D28] text-xs font-black uppercase tracking-[0.25em] mb-3">Modern Village Lifestyle</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#3E2723] mb-8 leading-tight">Effortless Tech for <br /><span className="text-[#4A7C59]">Timeless Purity.</span></h2>
            <div className="space-y-6">
              {[
                { title: 'Intuitive Experience', desc: 'A clean, simple interface designed for everyone—from urban chefs to village elders.' },
                { title: 'Personalized Delivery', desc: 'Working professionals love our flexible time slots. Your harvest, your time.' },
                { title: 'Direct Transparency', desc: 'Know exactly where your food comes from with our partner farmer profiles.' },
                { title: 'Universal Security', desc: 'World-class payment encryption paired with simple, accessible checkout options.' },
              ].map((feat, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="w-2 h-10 bg-[#8B3D28]/10 group-hover:bg-[#8B3D28] transition-colors rounded-full mt-1"></div>
                  <div>
                    <h3 className="font-black text-[#3E2723] text-lg mb-1">{feat.title}</h3>
                    <p className="text-[#3E2723]/70 text-sm leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <Link to="/user" className="inline-block bg-[#4A7C59] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#3d664a] transition-all hover:shadow-xl hover:-translate-y-1 shadow-lg shadow-[#4A7C59]/10">Launch Digital Market →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Our Story ────────────────────────────────── */}
      <section id="our-story" className="py-24 bg-white px-4 sm:px-6 relative border-y border-[#8B3D28]/10 border-dashed">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-1/2">
            <img src={ourStoryImg} alt="Our Story" className="rounded-[3rem] w-full h-auto object-cover shadow-lg" />
          </div>
          <div className="w-full md:w-1/2">
            <p className="text-[#8B3D28] text-xs font-black uppercase tracking-[0.25em] mb-2">Our Roots</p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#3E2723] mb-6">Born from the Soil. Built for the People.</h2>
            <p className="text-[#3E2723]/70 leading-relaxed mb-4 text-sm md:text-base">
              VillageBasket was born out of a stark realization: urban kitchens were lacking true, unadulterated freshness, while rural farmers were struggling to find fair markets for their organic yields.
            </p>
            <p className="text-[#3E2723]/70 leading-relaxed mb-8 text-sm md:text-base">
              We traveled deep into the villages, speaking with agriculturists, dairy farmers, and artisans. The solution was simple—connect the village directly to the city, cutting out middlemen, cold storages, and chemical treatments. Today, we are proud to be the bridge that empowers villages and nourishes families.
            </p>
            <div className="p-4 bg-[#FAF7F2] rounded-2xl border-l-4 border-[#4A7C59]">
              <p className="font-bold text-[#3E2723] italic text-sm">"We don't just deliver groceries; we deliver the essence of the village."</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. Contact Us ───────────────────────────────── */}
      <section id="contact" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="bg-[#8B3D28] rounded-[3rem] p-8 md:p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
          <div className="relative z-10 flex flex-col lg:flex-row gap-10 lg:gap-12 text-white">
            <div className="flex-1">
              <h2 className="text-3xl sm:text-5xl font-black mb-4">Get in Touch</h2>
              <p className="text-white/70 leading-relaxed mb-8 max-w-sm">
                Have questions about our sourcing, delivery shifts, or want to partner with us? Reach out directly.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black">✉</div>
                  <p className="font-bold text-sm tracking-wide">support@villagebasket.in</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black">✆</div>
                  <p className="font-bold text-sm tracking-wide">+91 98765 43210</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-black">📍</div>
                  <p className="font-bold text-sm tracking-wide">Headquarters, Farmers Lane, IN</p>
                </div>
              </div>
            </div>

            {/* Contact Form Placeholder */}
            <div className="flex-1 bg-white p-6 md:p-8 rounded-[2rem] shadow-xl text-[#3E2723]">
              <h3 className="font-black text-xl mb-6">Send a Message</h3>
              <form className="space-y-4" onSubmit={handleInquirySubmit}>
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-[#3E2723]/50 ml-1">Your Name</label>
                  <input 
                    type="text" 
                    className="w-full mt-1 bg-[#FAF7F2] border border-[#8B3D28]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#8B3D28] font-medium" 
                    placeholder="John Doe" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-[#3E2723]/50 ml-1">Email Address</label>
                  <input 
                    type="email" 
                    className="w-full mt-1 bg-[#FAF7F2] border border-[#8B3D28]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#8B3D28] font-medium" 
                    placeholder="john@example.com" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-[#3E2723]/50 ml-1">Message</label>
                  <textarea 
                    rows={3} 
                    className="w-full mt-1 bg-[#FAF7F2] border border-[#8B3D28]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#8B3D28] font-medium resize-none" 
                    placeholder="How can we help?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  ></textarea>
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#3E2723] text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-[#8B3D28] transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>


      {/* ── 11. Footer ──────────────────────────────────── */}
      <Footer showOnMobile={true} />
    </div>
  );
}
