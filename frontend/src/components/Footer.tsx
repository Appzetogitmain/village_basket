import { Link, useNavigate, useLocation } from 'react-router-dom';
import brandLogo from '@assets/village_basket-removebg-preview.png';
import { useAuth } from '../context/AuthContext';

interface FooterProps {
  showOnMobile?: boolean;
}

export default function Footer({ showOnMobile = true }: FooterProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isLandingPage = location.pathname === '/';

  return (
    <footer className={`bg-[#3E2723] text-white py-12 px-4 sm:px-6 w-full ${!showOnMobile ? 'hidden md:block' : ''}`}>
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
                { label: 'Shop Now', to: isAuthenticated ? '/user' : '/user/login' },
                { label: 'My Account', to: isAuthenticated ? '/user/account' : '/user/login' },
                { label: 'My Orders', to: isAuthenticated ? '/user/order-again' : '/user/login' },
                { label: 'Seller Portal', to: '/seller/login' },
                { label: 'Delivery Portal', to: '/delivery/login' },
              ].map(l => {
                const isShopNowOnHome = l.label === 'Shop Now' && (location.pathname === '/user' || location.pathname === '/user/');

                if (isShopNowOnHome) {
                  return (
                    <button
                      key={l.label}
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="text-left text-white/60 hover:text-white font-medium text-sm transition-colors"
                    >
                      {l.label}
                    </button>
                  );
                }

                return (
                  <Link
                    key={l.label}
                    to={l.to}
                    className="text-white/60 hover:text-white font-medium text-sm transition-colors"
                  >
                    {l.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-widest text-[#E5A93D] mb-4">Support</h4>
            <div className="flex flex-col gap-2">
              <Link to="/user/about-us" className="text-white/60 hover:text-white font-medium text-sm transition-colors">About Us</Link>
              <a href="/#contact" className="text-white/60 hover:text-white font-medium text-sm transition-colors">Contact Us</a>
              <Link to="/user/faq" className="text-white/60 hover:text-white font-medium text-sm transition-colors">FAQ</Link>
              <Link to="/user/privacy-policy" className="text-white/60 hover:text-white font-medium text-sm transition-colors">Privacy Policy</Link>
              <Link to="/user/terms-of-service" className="text-white/60 hover:text-white font-medium text-sm transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 font-bold text-xs uppercase tracking-widest">© {new Date().getFullYear()} VillageBasket. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (isLandingPage) {
                  navigate(isAuthenticated ? '/user' : '/user/login');
                } else {
                  navigate('/');
                }
              }}
              className="text-xs font-black text-[#3E2723] bg-white hover:bg-[#FAF7F2] px-6 py-2.5 rounded-xl transition-colors uppercase tracking-widest shadow-md"
            >
              {isLandingPage ? 'Start Shopping' : 'Explore More'}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
