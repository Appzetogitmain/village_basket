import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import brandLogo from '@assets/village_basket-removebg-preview.png';
import dairyImg from '@assets/landing_page/dairy.jpg';
import veggiesImg from '@assets/landing_page/fresh_veggies.jpg';
import fruitsImg from '@assets/landing_page/fruits.jpg';
import spicesImg from '@assets/landing_page/spices.jpg';
import ourStoryImg from '@assets/landing_page/our_story.png';
import farmImg1 from '@assets/landing_page/farm_image_1.png';
import farmImg2 from '@assets/landing_page/farm_image_2.png';
import farmImg3 from '@assets/landing_page/farm_image_3.png';
import heroProduceImg from '@assets/landing_page/hero_produce.png';

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
      <p className="text-4xl font-black text-[#3E2723]">{count.toLocaleString('en-IN')}+</p>
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
    <div className="relative w-full h-[400px] lg:h-[500px] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
      {images.map((src, idx) => (
        <img
          key={idx}
          src={src}
          alt="Slider"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        />
      ))}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
        {images.map((_, idx) => (
          <div key={idx} className={`w-3 h-3 rounded-full transition-all ${idx === currentSlide ? 'bg-white scale-125' : 'bg-white/50'}`}></div>
        ))}
      </div>
    </div>
  );
}

/* ─── App Mockup Component ───────────────────────────────── */
function AppMockupSlider() {
  const [activeAppSlide, setActiveAppSlide] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveAppSlide((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="order-2 lg:order-1 relative flex justify-center h-[600px] w-full items-center">
      {[0, 1, 2].map((idx) => {
        let diff = idx - activeAppSlide;
        if (diff < -1) diff += 3;
        if (diff > 1) diff -= 3;
        const isCenter = diff === 0;
        const isLeft = diff === -1;

        return (
          <div
            key={idx}
            className={`absolute transition-all duration-700 ease-in-out cursor-pointer ${isCenter ? 'z-30 scale-100 opacity-100 translate-x-0' :
              isLeft ? 'z-20 scale-[0.85] opacity-50 -translate-x-[30%] sm:-translate-x-[40%]' :
                'z-20 scale-[0.85] opacity-50 translate-x-[30%] sm:translate-x-[40%]'
              }`}
            onClick={() => setActiveAppSlide(idx)}
          >
            <div className="w-[280px] h-[580px] bg-[#3E2723] rounded-[3rem] p-3 shadow-2xl border-4 border-gray-200 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-28 h-6 bg-gray-200 rounded-b-2xl z-20"></div>
              <div className="w-full h-full rounded-[2rem] overflow-hidden bg-[#FAF7F2] relative flex flex-col items-center">
                {idx === 0 && (
                  <div className="w-full h-full flex flex-col p-4 pt-14">
                    <div className="w-full flex justify-between items-center mb-6">
                      <div className="bg-white p-1 rounded-lg shadow-sm"><img src={brandLogo} alt="Logo" className="w-[80px]" /></div>
                      <div className="w-8 h-8 rounded-full bg-white shadow flex justify-center items-center font-black">👤</div>
                    </div>
                    <h4 className="font-black text-[#3E2723] text-lg mb-4 text-left w-full">Fresh Arrivals</h4>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="aspect-square bg-white rounded-xl shadow-sm border border-[#8B3D28]/10 flex flex-col p-2">
                        <div className="w-full h-20 bg-[#4A7C59]/20 rounded-lg mb-2"></div>
                        <div className="w-3/4 h-2 bg-gray-200 rounded mb-1"></div>
                        <div className="w-1/2 h-2 bg-gray-200 rounded"></div>
                      </div>
                      <div className="aspect-square bg-white rounded-xl shadow-sm border border-[#8B3D28]/10 flex flex-col p-2">
                        <div className="w-full h-20 bg-[#E5A93D]/20 rounded-lg mb-2"></div>
                        <div className="w-3/4 h-2 bg-gray-200 rounded mb-1"></div>
                        <div className="w-1/2 h-2 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                )}
                {/* ... existing screen 2 and 3 logic ... */}
                {idx === 1 && (
                  <div className="w-full h-full flex flex-col p-4 pt-14">
                    <div className="text-center mb-6">
                      <h4 className="font-black text-[#3E2723] text-lg">Checkout</h4>
                    </div>
                    <div className="w-full bg-white rounded-xl shadow-sm p-4 mb-4 border border-[#8B3D28]/10">
                      <h5 className="font-black text-xs text-[#8B3D28] mb-3 uppercase">Delivery Shift</h5>
                      <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2 flex items-center justify-between">
                        <div>
                          <p className="font-black text-[10px] text-amber-800 text-left">Morning</p>
                          <p className="font-bold text-[8px] text-amber-600">5:00 - 9:00 AM</p>
                        </div>
                        <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-white text-[8px]">✓</div>
                      </div>
                    </div>
                    <div className="mt-auto w-full bg-[#8B3D28] text-white text-center py-4 rounded-xl font-black text-[10px] uppercase shadow-lg">Complete Payment</div>
                  </div>
                )}
                {idx === 2 && (
                  <div className="w-full h-full flex flex-col p-4 bg-[#4A7C59]/5 relative">
                    <div className="absolute inset-x-0 top-0 h-48 bg-[#4A7C59] flex flex-col justify-center items-center text-white rounded-b-[2rem] pt-8">
                      <span className="text-3xl mb-2">🎉</span>
                      <h4 className="font-black text-lg">Confirmed</h4>
                    </div>
                    <div className="mt-40 w-full bg-white rounded-2xl shadow-xl p-5 relative z-10 border border-[#4A7C59]/10">
                      <h5 className="font-black text-[10px] text-gray-500 uppercase tracking-widest mb-4">Tracking</h5>
                      <div className="flex gap-3 mb-4">
                        <div className="flex flex-col items-center"><div className="w-2 h-2 rounded-full bg-[#4A7C59]"></div><div className="w-0.5 h-6 bg-[#4A7C59]"></div><div className="w-2 h-2 rounded-full border-2 border-[#4A7C59]"></div></div>
                        <div className="flex-1 text-left"><p className="font-black text-[10px]">Harvested</p><p className="font-black text-[10px] mt-3">Out for delivery</p></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Landing Page ──────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
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
            <Link to="/user/login" className={`text-sm font-bold px-4 py-2 rounded-xl transition-all ${scrolled ? 'text-white hover:bg-white/10' : 'text-[#8B3D28] hover:bg-[#8B3D28]/10'}`}>Login</Link>
            <Link to="/user" className="text-sm font-black px-5 py-2.5 bg-[#4A7C59] text-white rounded-xl shadow-md hover:bg-[#3d6b4a] active:scale-95 transition-all">Shop Now</Link>
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
              <Link to="/user/login" onClick={() => setMobileMenuOpen(false)} className="text-white/80 font-bold text-sm text-center py-2">Login</Link>
              <Link to="/user" onClick={() => setMobileMenuOpen(false)} className="bg-[#4A7C59] text-white font-black text-sm text-center py-3 rounded-xl">Shop Now</Link>
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
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#3E2723] leading-[1.1] mb-6">
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
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-2xl shadow-sm">
                <span className="text-xl">☀️</span>
                <div>
                  <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Morning Shift</p>
                  <p className="text-[11px] font-bold text-amber-700">5:00 AM – 9:00 AM</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-4 py-2.5 rounded-2xl shadow-sm">
                <span className="text-xl">🌙</span>
                <div>
                  <p className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">Evening Shift</p>
                  <p className="text-[11px] font-bold text-indigo-700">5:00 PM – 9:00 PM</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link to="/user" className="px-8 py-4 bg-[#8B3D28] text-white font-black rounded-2xl shadow-xl hover:bg-[#7a3323] active:scale-95 transition-all text-sm uppercase tracking-wider">
                Start Shopping →
              </Link>
              <a href="#our-story" className="px-8 py-4 bg-white border-2 border-[#8B3D28] text-[#8B3D28] font-black rounded-2xl hover:bg-[#8B3D28]/5 active:scale-95 transition-all text-sm uppercase tracking-wider">
                Our Story
              </a>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {[
              { title: 'Fresh Veggies', img: veggiesImg, icon: '' },
              { title: 'Dairy & Staples', img: dairyImg, icon: '' },
              { title: 'Pure Spices', img: spicesImg, icon: '' },
              { title: 'Organic Fruits', img: fruitsImg, icon: '' },
            ].map((cat) => (
              <div key={cat.title} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-[2rem] mb-4 aspect-square shadow-sm">
                  <img src={cat.img} alt={cat.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-3xl mb-2 block">{cat.icon}</span>
                    <h3 className="font-black text-lg tracking-wide">{cat.title}</h3>
                  </div>
                </div>
              </div>
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

            {/* Visual Right - Refined with lighter frame */}
            <div className="flex-1 w-full lg:w-auto flex justify-center lg:justify-end relative">
              <div className="relative w-full max-w-[360px]">
                {/* QR Code Optimized */}
                <div className="absolute top-10 -left-6 transform -translate-x-1/2 hidden md:block bg-white p-5 rounded-3xl shadow-xl z-20 border border-[#8B3D28]/5 animate-bounce" style={{ animationDuration: '5s' }}>
                  <div className="w-20 h-20 bg-stone-50 rounded-xl grid grid-cols-4 grid-rows-4 gap-1 p-2">
                    {[...Array(16)].map((_, i) => (
                      <div key={i} className={`rounded-sm ${(i * 17) % 4 === 0 ? 'bg-[#3E2723]' : 'bg-[#FAF7F2]'}`}></div>
                    ))}
                  </div>
                  <p className="text-[8px] font-black text-center mt-3 text-[#3E2723]/30 uppercase tracking-[0.2em]">Scan to Get App</p>
                </div>
                {/* App Frame - Modern Cream/White style */}
                <div className="w-[280px] h-[560px] bg-white rounded-[3.5rem] p-3 shadow-[0_30px_70px_rgba(139,61,40,0.15)] border-4 border-[#8B3D28]/10 mx-auto rotate-2 group-hover:rotate-0 transition-transform duration-1000">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-[#FAF7F2] rounded-b-2xl z-20"></div>
                  <div className="w-full h-full rounded-[2.8rem] overflow-hidden bg-[#FAF7F2] relative">
                    <img src={veggiesImg} alt="App" className="w-full h-full object-cover opacity-90" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#3E2723]/90 via-[#3E2723]/20 to-transparent"></div>
                    <div className="absolute bottom-10 left-6 right-6 text-white">
                      <p className="text-[9px] font-black text-[#E5A93D] uppercase tracking-widest mb-1 opacity-80">Farmer Connect</p>
                      <h4 className="text-xl font-black mb-3 leading-tight tracking-tight">Village Basket <br /> Harvest Tracker.</h4>
                      <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="w-3/4 h-full bg-[#E5A93D] shadow-[0_0_10px_#E5A93D]"></div>
                      </div>
                    </div>
                  </div>
                </div>
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
          <AppMockupSlider />
          {/* Features Text */}
          <div className="order-1 lg:order-2">
            <p className="text-[#8B3D28] text-xs font-black uppercase tracking-[0.25em] mb-3">Seamless Experience</p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#3E2723] mb-8">Shopping made simple.</h2>
            <div className="space-y-8">
              {[
                { title: 'Easy Ordering', desc: 'Browse hundreds of village products and add to your cart with a single tap.' },
                { title: 'Shift Delivery Selection', desc: 'Working professionals love this! Choose between Morning (5-9 AM) or Evening (5-9 PM) delivery.' },
                { title: 'Real-time Tracking', desc: 'Track your village partner as they bring fresh produce straight to your door.' },
                { title: 'Secure Payments', desc: 'Pay safely online or choose Cash on Delivery. Your data is strictly encrypted.' },
              ].map((feat, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#8B3D28] text-white flex items-center justify-center font-black flex-shrink-0 mt-1 shadow-md">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-black text-[#3E2723] text-lg mb-1">{feat.title}</h3>
                    <p className="text-[#3E2723]/70 text-sm leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <Link to="/user" className="inline-block bg-[#4A7C59] text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#3d664a] transition-colors shadow-lg shadow-[#4A7C59]/20">Explore Features Online</Link>
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
          <div className="relative z-10 flex flex-col md:flex-row gap-12 text-white">
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
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-[#3E2723]/50 ml-1">Your Name</label>
                  <input type="text" className="w-full mt-1 bg-[#FAF7F2] border border-[#8B3D28]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#8B3D28] font-medium" placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-[#3E2723]/50 ml-1">Email Address</label>
                  <input type="email" className="w-full mt-1 bg-[#FAF7F2] border border-[#8B3D28]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#8B3D28] font-medium" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-[#3E2723]/50 ml-1">Message</label>
                  <textarea rows={3} className="w-full mt-1 bg-[#FAF7F2] border border-[#8B3D28]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#8B3D28] font-medium resize-none" placeholder="How can we help?"></textarea>
                </div>
                <button className="w-full bg-[#3E2723] text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-[#8B3D28] transition-colors mt-2">
                  Submit Inquiry
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>


      {/* ── 11. Footer ──────────────────────────────────── */}
      <footer className="bg-[#3E2723] text-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="bg-white py-1.5 px-3 rounded-xl inline-block mb-4">
                <img src={brandLogo} alt="Village Basket" className="h-8 md:h-10 w-auto object-contain" />
              </div>
              <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                Fresh from the village. Delivered to your doorstep with care and authenticity. Join our mission to empower rural farmers.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-black text-xs uppercase tracking-widest text-[#E5A93D] mb-4">Quick Links</h4>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Shop Now', to: '/user' },
                  { label: 'My Account', to: '/user/account' },
                  { label: 'My Orders', to: '/user/orders' },
                  { label: 'Seller Portal', to: '/seller/login' },
                  { label: 'Delivery Portal', to: '/delivery/login' },
                ].map(l => (
                  <Link key={l.label} to={l.to} className="text-white/60 hover:text-white font-medium text-sm transition-colors">{l.label}</Link>
                ))}
              </div>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-black text-xs uppercase tracking-widest text-[#E5A93D] mb-4">Support</h4>
              <div className="flex flex-col gap-2">
                <a href="#about" className="text-white/60 hover:text-white font-medium text-sm transition-colors">About Us</a>
                <a href="#contact" className="text-white/60 hover:text-white font-medium text-sm transition-colors">Contact Us</a>
                <a href="#faq" className="text-white/60 hover:text-white font-medium text-sm transition-colors">FAQ</a>
                <a href="#privacy" className="text-white/60 hover:text-white font-medium text-sm transition-colors">Privacy Policy</a>
                <a href="#terms" className="text-white/60 hover:text-white font-medium text-sm transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 font-bold text-xs uppercase tracking-widest">© {new Date().getFullYear()} VillageBasket. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/user')} className="text-xs font-black text-[#3E2723] bg-white hover:bg-[#FAF7F2] px-6 py-2.5 rounded-xl transition-colors uppercase tracking-widest shadow-md">
                Start Shopping
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
