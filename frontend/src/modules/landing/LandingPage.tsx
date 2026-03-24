import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import brandLogo from '@assets/village_basket-removebg-preview.png';

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

/* ─── Simple Intersection Observer Hook ─────────────────── */
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

/* ─── FAQ Item ───────────────────────────────────────────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#8B3D28]/10 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 group"
      >
        <span className="text-[#3E2723] font-bold text-sm group-hover:text-[#8B3D28] transition-colors">{q}</span>
        <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 border-[#8B3D28]/30 flex items-center justify-center transition-transform duration-300 ${open ? 'rotate-45 bg-[#8B3D28] border-[#8B3D28]' : ''}`}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={open ? 'white' : '#8B3D28'} strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-48 pb-4' : 'max-h-0'}`}>
        <p className="text-[#3E2723]/70 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

/* ─── Main Landing Page ──────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scroll detection for navbar
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Stats section in-view
  const { ref: statsRef, inView: statsInView } = useInView(0.4);
  const customers = useCounter(10000, 2000, statsInView);
  const sellers = useCounter(500, 2000, statsInView);
  const orders = useCounter(50000, 2000, statsInView);

  const features = [
    { icon: '🌿', title: '100% Organic', desc: 'Sourced directly from local village farmers' },
    { icon: '⏰', title: 'Flexible Shifts', desc: 'Morning (5–9 AM) or Evening (5–9 PM) delivery' },
    { icon: '💰', title: 'Best Prices', desc: 'No middlemen. Farm-fresh at fair prices' },
    { icon: '🚀', title: 'Fast Delivery', desc: 'Reliable delivery partners, on schedule' },
    { icon: '🤝', title: 'Support Local', desc: 'Every purchase empowers a village farmer' },
    { icon: '📱', title: 'Easy to Use', desc: 'Order in 3 taps from any device' },
  ];

  const steps = [
    { num: '01', icon: '🛍️', title: 'Browse & Add', desc: 'Explore farm-fresh products and add to cart' },
    { num: '02', icon: '⏰', title: 'Pick Your Shift', desc: 'Choose Morning (5–9 AM) or Evening (5–9 PM)' },
    { num: '03', icon: '🚚', title: 'Fresh Delivery', desc: 'Your order arrives at your doorstep on time' },
  ];

  const faqs = [
    { q: 'What are the available delivery shifts?', a: 'We offer two daily slots: Morning (5:00 AM – 9:00 AM) and Evening (5:00 PM – 9:00 PM). You pick your preferred slot at checkout.' },
    { q: 'Are the products really from local farmers?', a: 'Yes! All products are sourced directly from registered village sellers and local farmers, ensuring you get the freshest produce with no middlemen.' },
    { q: 'How do I become a seller on VillageBasket?', a: 'Click "Become a Seller" and sign up. Once your profile is verified, you can start listing your products and receiving orders.' },
    { q: 'Can I join as a delivery partner?', a: 'Absolutely! Head to the Delivery Partner section, sign up, complete your profile and you can start accepting delivery assignments on your chosen shift.' },
    { q: 'Is there a minimum order value?', a: 'No minimum order required! Order as little or as much as you need, with flat delivery charges regardless of order size.' },
  ];

  const navLinks = [
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Join Us', href: '#join-us' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-poppins overflow-x-hidden" style={{ backgroundImage: "linear-gradient(rgba(250,247,242,0.92),rgba(250,247,242,0.92)),url('/assets/warli_pattern.png')", backgroundSize: '320px', backgroundAttachment: 'fixed' }}>

      {/* ── Navbar ──────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#8B3D28]/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-white p-1.5 rounded-xl shadow-md">
              <img src={brandLogo} alt="Village Basket" className="h-8 w-auto object-contain" />
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} className={`text-sm font-semibold transition-colors ${scrolled ? 'text-white/80 hover:text-white' : 'text-[#3E2723]/80 hover:text-[#8B3D28]'}`}>
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className={`text-sm font-bold px-4 py-2 rounded-xl transition-all ${scrolled ? 'text-white hover:bg-white/10' : 'text-[#8B3D28] hover:bg-[#8B3D28]/10'}`}>
              Login
            </Link>
            <Link to="/user" className="text-sm font-black px-5 py-2.5 bg-[#4A7C59] text-white rounded-xl shadow-md hover:bg-[#3d6b4a] active:scale-95 transition-all">
              Shop Now
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button onClick={() => setMobileMenuOpen(v => !v)} className={`md:hidden p-2 rounded-xl ${scrolled ? 'text-white' : 'text-[#8B3D28]'}`}>
            {mobileMenuOpen
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            }
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#8B3D28] px-6 py-6 flex flex-col gap-4 border-t border-white/10">
            {navLinks.map(link => (
              <a key={link.label} href={link.href} onClick={() => setMobileMenuOpen(false)} className="text-white/90 font-semibold text-sm">
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-3 border-t border-white/10">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-white/80 font-bold text-sm text-center py-2">Login</Link>
              <Link to="/user" onClick={() => setMobileMenuOpen(false)} className="bg-[#4A7C59] text-white font-black text-sm text-center py-3 rounded-xl">Shop Now</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#8B3D28]/10 text-[#8B3D28] text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6">
              <span>🌾</span> Farm to Doorstep
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#3E2723] leading-tight mb-6">
              Fresh From the<br />
              <span className="text-[#8B3D28]">Village,</span> at{' '}
              <span className="text-[#4A7C59]">Your Doorstep</span>
            </h1>
            <p className="text-[#3E2723]/70 text-lg leading-relaxed mb-8 max-w-lg">
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
              <Link
                to="/user"
                className="px-8 py-4 bg-[#8B3D28] text-white font-black rounded-2xl shadow-lg hover:bg-[#7a3323] active:scale-95 transition-all text-sm uppercase tracking-wider"
              >
                Start Shopping →
              </Link>
              <a
                href="#join-us"
                className="px-8 py-4 border-2 border-[#8B3D28] text-[#8B3D28] font-black rounded-2xl hover:bg-[#8B3D28]/5 active:scale-95 transition-all text-sm uppercase tracking-wider"
              >
                Become a Seller
              </a>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative hidden lg:flex items-center justify-center">
            <div className="w-72 h-72 rounded-full bg-[#8B3D28]/8 flex items-center justify-center relative">
              <div className="w-56 h-56 rounded-full bg-[#8B3D28]/12 flex items-center justify-center animate-pulse">
                <span className="text-[120px]">🧺</span>
              </div>
              {/* Floating badges */}
              <div className="absolute top-4 right-0 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2 animate-bounce" style={{ animationDuration: '3s' }}>
                <span className="text-xl">🌿</span>
                <div>
                  <p className="text-[9px] font-black text-[#3E2723] uppercase tracking-widest">100% Organic</p>
                  <p className="text-[11px] font-bold text-[#4A7C59]">Farm Fresh</p>
                </div>
              </div>
              <div className="absolute bottom-8 left-0 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
                <span className="text-xl">🚚</span>
                <div>
                  <p className="text-[9px] font-black text-[#3E2723] uppercase tracking-widest">On-time</p>
                  <p className="text-[11px] font-bold text-[#8B3D28]">Daily Shifts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ──────────────────────────────────── */}
      <div ref={statsRef} className="bg-[#8B3D28] py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { val: customers, suffix: '+', label: 'Happy Customers' },
            { val: sellers, suffix: '+', label: 'Local Sellers' },
            { val: orders, suffix: '+', label: 'Orders Delivered' },
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-3xl sm:text-4xl font-black text-white">
                {stat.val.toLocaleString('en-IN')}{stat.suffix}
              </p>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── How It Works ─────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-[#8B3D28] text-xs font-black uppercase tracking-[0.25em] mb-3">Simple Process</p>
          <h2 className="text-3xl sm:text-4xl font-black text-[#3E2723]">How It Works</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.num} className="relative text-center bg-white rounded-3xl p-8 shadow-sm border border-[#8B3D28]/8 hover:shadow-md transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-[#FAF7F2] border-2 border-[#8B3D28]/15 mx-auto mb-5 flex items-center justify-center text-3xl">
                {step.icon}
              </div>
              <div className="absolute top-6 right-6 text-[#8B3D28]/15 text-4xl font-black">{step.num}</div>
              <h3 className="font-black text-[#3E2723] text-base mb-2">{step.title}</h3>
              <p className="text-[#3E2723]/60 text-sm leading-relaxed">{step.desc}</p>
              {i < steps.length - 1 && (
                <div className="hidden sm:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-[#8B3D28]/30 text-2xl z-10">→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────── */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#8B3D28] text-xs font-black uppercase tracking-[0.25em] mb-3">Why Us</p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#3E2723]">Why Choose VillageBasket?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-[#FAF7F2] rounded-3xl p-7 border border-[#8B3D28]/8 hover:border-[#8B3D28]/25 hover:shadow-md transition-all group cursor-default">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform inline-block">{f.icon}</div>
                <h3 className="font-black text-[#3E2723] text-sm mb-2 uppercase tracking-wider">{f.title}</h3>
                <p className="text-[#3E2723]/60 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Join CTA ─────────────────────────────────────── */}
      <section id="join-us" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Seller Card */}
          <div className="bg-[#8B3D28] rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.06] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
            <div className="relative z-10">
              <div className="text-5xl mb-5">🧑‍🌾</div>
              <h3 className="text-xl font-black mb-3">Sell Your Products</h3>
              <p className="text-white/75 text-sm leading-relaxed mb-6">
                Connect with thousands of customers. List your farm-fresh products and grow your business.
              </p>
              <Link to="/seller/signup" className="inline-flex items-center gap-2 bg-white text-[#8B3D28] font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-white/90 active:scale-95 transition-all">
                Apply as Seller →
              </Link>
            </div>
          </div>

          {/* Delivery Card */}
          <div className="bg-[#4A7C59] rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.06] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
            <div className="relative z-10">
              <div className="text-5xl mb-5">🚴</div>
              <h3 className="text-xl font-black mb-3">Join as Delivery Partner</h3>
              <p className="text-white/75 text-sm leading-relaxed mb-6">
                Flexible morning or evening shifts. Earn daily and be part of your local community.
              </p>
              <Link to="/delivery/signup" className="inline-flex items-center gap-2 bg-white text-[#4A7C59] font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-white/90 active:scale-95 transition-all">
                Apply as Partner →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[#8B3D28] text-xs font-black uppercase tracking-[0.25em] mb-3">Got Questions?</p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#3E2723]">Frequently Asked</h2>
          </div>
          <div className="bg-[#FAF7F2] rounded-3xl px-8 py-2 border border-[#8B3D28]/8">
            {faqs.map(faq => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="py-20 px-4 text-center bg-[#8B3D28] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
        <div className="relative z-10 max-w-xl mx-auto">
          <p className="text-white/70 text-xs font-black uppercase tracking-[0.25em] mb-4">Ready to Shop?</p>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">
            Get Farm-Fresh Delivered Today
          </h2>
          <p className="text-white/70 text-sm mb-8">
            Join thousands of happy customers enjoying village-fresh products every day.
          </p>
          <Link
            to="/user"
            className="inline-flex items-center gap-2 bg-white text-[#8B3D28] font-black text-sm uppercase tracking-widest px-10 py-4 rounded-2xl shadow-xl hover:bg-white/90 active:scale-95 transition-all"
          >
            Start Shopping Now →
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="bg-[#3E2723] text-white py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 mb-10">
            {/* Brand */}
            <div>
              <div className="bg-white p-2 rounded-xl inline-block mb-4">
                <img src={brandLogo} alt="Village Basket" className="h-8 w-auto object-contain" />
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                Fresh from the village. Delivered to your doorstep with care and authenticity.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-black text-xs uppercase tracking-widest text-white/40 mb-4">Quick Links</h4>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Shop Now', to: '/user' },
                  { label: 'My Account', to: '/user/account' },
                  { label: 'My Orders', to: '/user/orders' },
                  { label: 'Seller Login', to: '/seller/login' },
                  { label: 'Delivery Login', to: '/delivery/login' },
                ].map(l => (
                  <Link key={l.label} to={l.to} className="text-white/60 hover:text-white text-sm transition-colors">{l.label}</Link>
                ))}
              </div>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-black text-xs uppercase tracking-widest text-white/40 mb-4">Support</h4>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'About Us', to: '/user/about-us' },
                  { label: 'FAQ', href: '#faq' },
                ].map(l => (
                  'to' in l
                    ? <Link key={l.label} to={l.to as string} className="text-white/60 hover:text-white text-sm transition-colors">{l.label}</Link>
                    : <a key={l.label} href={(l as any).href} className="text-white/60 hover:text-white text-sm transition-colors">{l.label}</a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-xs">© {new Date().getFullYear()} VillageBasket. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/user')} className="text-xs font-bold text-[#8B3D28] bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors uppercase tracking-wider">
                Shop Now
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
