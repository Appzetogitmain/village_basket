import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import HomeHero from './components/HomeHero';
import { useOrders } from '../../hooks/useOrders';
import { useCart } from '../../context/CartContext';
import { getProducts } from '../../services/api/customerProductService';
import WishlistButton from '../../components/WishlistButton';
import { calculateProductPrice } from '../../utils/priceUtils';
import { getVariationColor } from '../../utils/variationUtils';
import ProductCard from './components/ProductCard';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Delivered':
      return 'bg-green-100 text-green-700';
    case 'On the way':
      return 'bg-blue-100 text-blue-700';
    case 'Accepted':
      return 'bg-yellow-100 text-yellow-700';
    case 'Received':
      return 'bg-neutral-100 text-neutral-700';
    default:
      return 'bg-neutral-100 text-neutral-700';
  }
};

export default function OrderAgain() {
  const { orders } = useOrders();
  const { cart, addToCart, updateQuantity } = useCart();
  const navigate = useNavigate();
  const [addedOrders, setAddedOrders] = useState<Set<string>>(new Set());

  const handleOrderAgain = (order: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddedOrders(prev => new Set(prev).add(order.id));

    order.items
      .filter((item: any) => item?.product)
      .forEach((item: any) => {
        const existingCartItem = cart.items.find(cartItem => cartItem?.product && (cartItem.product.id === item.product.id || cartItem.product._id === item.product._id));
        if (existingCartItem) {
          updateQuantity(item.product.id || item.product._id, existingCartItem.quantity + item.quantity);
        } else {
          addToCart(item.product);
          if (item.quantity > 1) {
            setTimeout(() => {
              updateQuantity(item.product.id || item.product._id, item.quantity);
            }, 10);
          }
        }
      });
  };

  const [bestsellerProducts, setBestsellerProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchBestsellers = async () => {
      try {
        const response = await getProducts({ sort: 'popular', limit: 6 });
        if (response.success && response.data) {
          const mapped = (response.data as any[]).map(p => ({
            ...p,
            id: p._id || p.id,
            name: (p.productName || p.name || '').replace(/\s*-\s*(Fresh|Quality|Assured|Premium|Best|Top|Hygienic|Carefully|Selected).*$/i, '').trim(),
            imageUrl: p.mainImage || p.imageUrl,
            mrp: p.mrp || p.price,
            pack: (() => {
              const v = p.variations?.[0];
              if (!v) return (p.pack || p.smallDescription || '').trim();
              const vName = (v.name || '').trim();
              const isPlaceholder = !vName || vName.toLowerCase() === 'variation' || vName.toLowerCase() === 'standard';
              return (isPlaceholder ? (v.value || v.title || vName) : vName).trim() || (p.pack || p.smallDescription || '').trim();
            })()
          }));
          setBestsellerProducts(mapped);
        }
      } catch (error) {
        console.error('Failed to fetch bestsellers:', error);
      }
    };
    fetchBestsellers();
  }, []);

  const hasOrders = orders && orders.length > 0;

  return (
    <div className="pb-24">
      <HomeHero />

      {/* Orders Section */}
      {hasOrders && (
        <div className="px-4 md:px-8 mt-4 md:mt-10 mb-6 md:mb-10">
          <div className="mb-4 md:mb-8">
            <h2 className="text-[10px] md:text-xs font-black text-[#8B3D28] uppercase tracking-[0.2em] mb-1 opacity-70">Your Journey</h2>
            <h2 className="text-xl md:text-4xl font-black text-village-umber tracking-tighter font-poppins capitalize">
              Recent Orders
            </h2>
          </div>
          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-6">
            {orders.map((order) => {
              const previewItems = (order.items || []).slice(0, 3);

              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/user/orders/${order.id}`)}
                  className="village-card paper-texture organic-radius p-4 md:p-6 active:scale-[0.98] transition-all cursor-pointer bg-white relative shadow-sm border border-neutral-100/50 hover:shadow-xl md:hover:-translate-y-1 duration-300"
                >
                  <div className="flex justify-between items-start mb-2 md:mb-4">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] md:text-[11px] font-black text-village-umber/40 uppercase tracking-tighter">Order ID</span>
                        <div className={`px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-tighter ${getStatusColor(order.status)} shadow-sm`}>
                          {order.status === 'Received' ? 'Order Placed' : order.status}
                        </div>
                      </div>
                      <h4 className="text-[10px] md:text-sm font-black text-village-umber uppercase truncate max-w-[140px] md:max-w-xs tracking-tight">#{order.id}</h4>
                      <span className="text-[10px] md:text-xs font-bold text-neutral-400 mt-1">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs md:text-xl font-black text-village-umber">{"\u20B9"}{order.totalAmount.toFixed(0)}</span>
                      </div>
                      <div className="bg-[#4b7d5a]/10 px-2 py-0.5 rounded text-[8px] md:text-[10px] font-black text-[#4b7d5a] uppercase tracking-tighter">
                        {order.totalItems} {order.totalItems === 1 ? 'item' : 'items'} Ordered
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-3 md:mt-6 pt-3 md:pt-4 border-t border-village-umber/5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center -space-x-2 md:-space-x-3">
                        {previewItems.map((item: any, idx: number) => (
                          item?.product && (
                            <div
                              key={item.product?.id || idx}
                              className="w-8 h-8 md:w-12 md:h-12 bg-white rounded-full border-2 border-white flex items-center justify-center overflow-hidden shadow-md ring-1 ring-neutral-100"
                            >
                              <img src={item.product?.imageUrl || item.product?.mainImage} alt="" className="w-full h-full object-contain p-1" />
                            </div>
                          )
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-8 h-8 md:w-12 md:h-12 bg-[#8B3D28]/5 rounded-full flex items-center justify-center text-[10px] md:text-xs font-black text-village-umber border-2 border-white shadow-md ring-1 ring-neutral-100">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                      <span className="hidden md:inline-block ml-2 text-[11px] font-black text-village-umber/40 uppercase tracking-widest px-2">
                        Items List
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleOrderAgain(order, e)}
                      disabled={addedOrders.has(order.id)}
                      className={`h-8 md:h-11 px-4 md:px-8 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-md ${
                        addedOrders.has(order.id)
                        ? 'bg-amber-100 text-amber-700 shadow-none'
                        : 'bg-[#4b7d5a] text-white hover:bg-[#3D664A] shadow-[#4b7d5a]/20 translate-y-0'
                      }`}
                    >
                      {addedOrders.has(order.id) ? 'Added!' : 'Order Again'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bestsellers Section */}
      <div className="mt-8 mb-12">
        <div className="px-4 md:px-8 mb-4 md:mb-10">
          <h2 className="text-[10px] md:text-sm font-black text-[#4b7d5a] uppercase tracking-[0.2em] mb-1 opacity-70">Special Picks</h2>
          <h2 className="text-xl md:text-4xl font-black text-village-umber tracking-tighter font-poppins capitalize">
            Bestsellers
          </h2>
        </div>

        <div className="px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-6">
            {bestsellerProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showBadge={true}
                categoryStyle={false}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
