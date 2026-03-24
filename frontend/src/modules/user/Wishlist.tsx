import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWishlist } from '../../services/api/customerWishlistService';
import { Product } from '../../types/domain';
import { useLocation } from '../../hooks/useLocation';
import { useToast } from '../../context/ToastContext';
import { useWishlist } from '../../context/WishlistContext';
import Button from '../../components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './components/ProductCard';

export default function Wishlist() {
  const navigate = useNavigate();
  const { location } = useLocation();
  const { showToast } = useToast();
  const { wishlistItems: products, loading } = useWishlist();

  return (
    <div className="pb-24 min-h-screen">
      {/* Village Themed Header - Compact */}
      <div className="px-4 py-3 bg-[#8B3D28] border-b border-white/10 mb-4 sticky top-0 z-20 flex items-center gap-2 shadow-lg">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
        <button 
          onClick={() => navigate(-1)} 
          className="p-1.5 text-white hover:bg-white/10 rounded-full transition-all active:scale-95 z-10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[12px] font-black text-white uppercase tracking-[0.2em] font-poppins z-10">My Wishlist</h1>
        <div className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-[8px] font-black text-white uppercase tracking-tighter z-10">
          {products.length} Items
        </div>
      </div>

      <div className="px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center pt-24 gap-3">
             <div className="w-8 h-8 border-3 border-[#8B3D28]/20 border-t-[#8B3D28] rounded-full animate-spin"></div>
             <p className="text-[8px] font-black text-village-umber uppercase tracking-widest animate-pulse opacity-50">Searching your treasures...</p>
          </div>
        ) : products.length > 0 ? (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-2 gap-2.5">
              {products.map((product) => (
                <div key={product.id || product._id} className="h-full">
                  <ProductCard 
                    product={product} 
                    showHeartIcon={true}
                    categoryStyle={true}
                  />
                </div>
              ))}
            </div>
          </AnimatePresence>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center pt-16 text-center px-6"
          >
            {/* Premium 3D Heart Illustration - Compact */}
            <div className="relative mb-6">
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
                className="w-24 h-24 flex items-center justify-center"
              >
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
                  <defs>
                    <linearGradient id="heartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#FF6F91' }} />
                      <stop offset="100%" style={{ stopColor: '#FF3D68' }} />
                    </linearGradient>
                    <filter id="shadow">
                      <feDropShadow dx="0" dy="5" stdDeviation="6" floodOpacity="0.25" />
                    </filter>
                  </defs>
                  <path 
                    d="M100 160 C100 160 30 110 30 65 C30 40 50 25 70 25 C85 25 95 35 100 45 C105 35 115 25 130 25 C150 25 170 40 170 65 C170 110 100 160 100 160" 
                    fill="url(#heartGrad)"
                    filter="url(#shadow)"
                  />
                  <circle cx="85" cy="50" r="6" fill="white" fillOpacity="0.3" />
                </svg>
              </motion.div>
            </div>

            <h2 className="text-[14px] font-black text-village-umber mb-2 uppercase tracking-widest leading-none">
              Your wishlist is empty
            </h2>
            <p className="text-[10px] text-neutral-400 mb-8 font-bold leading-relaxed max-w-[200px] mx-auto italic">
              Explore our village treasures and shortlist items you love!
            </p>
            
            <Button 
              onClick={() => navigate('/user')} 
              className="bg-[#4A7C59] hover:bg-[#3D664A] text-white rounded-xl h-10 px-8 text-[11px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#4A7C59]/20 active:scale-95 transition-all"
            >
              Start Shopping
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}


