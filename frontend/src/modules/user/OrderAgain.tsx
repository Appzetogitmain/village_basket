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
        <div className="px-4 mt-4 mb-6">
          <h2 className="text-[10px] font-black text-village-umber uppercase tracking-[0.2em] mb-3 opacity-70">Recent Orders</h2>
          <div className="space-y-3">
            {orders.map((order) => {
              const previewItems = (order.items || []).slice(0, 3);

              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="village-card paper-texture organic-radius p-3 active:scale-[0.98] transition-all cursor-pointer bg-white relative shadow-sm border border-neutral-100/50"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-black text-village-umber/40 uppercase tracking-tighter">Order</span>
                      <h4 className="text-[10px] font-black text-village-umber uppercase truncate max-w-[140px]">#{order.id}</h4>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="text-xs font-black text-village-umber">₹{order.totalAmount.toFixed(0)}</span>
                      </div>
                      <span className="text-[9px] font-bold text-neutral-400 italic">
                        {order.totalItems} {order.totalItems === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-1 text-[9px] font-bold text-neutral-500">
                    {formatDate(order.createdAt)}
                  </div>

                  <div className="flex justify-between items-end mt-3 pt-2 border-t border-village-umber/5">
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded bg-neutral-100 flex items-center justify-center text-[9px] font-black text-neutral-400 border border-neutral-200 uppercase">
                        {order.status.charAt(0)}
                      </div>
                      <div className="flex items-center -space-x-2 ml-1">
                        {previewItems.map((item: any, idx: number) => (
                          item?.product && (
                            <div
                              key={item.product?.id || idx}
                              className="w-6 h-6 bg-white rounded-full border border-neutral-100 flex items-center justify-center overflow-hidden shadow-sm"
                            >
                              <img src={item.product?.imageUrl || item.product?.mainImage} alt="" className="w-full h-full object-contain" />
                            </div>
                          )
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center text-[7px] font-black text-neutral-500 border border-neutral-100">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleOrderAgain(order, e)}
                      disabled={addedOrders.has(order.id)}
                      className={`h-7 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md ${
                        addedOrders.has(order.id)
                        ? 'bg-amber-100 text-amber-700 shadow-none'
                        : 'bg-[#4A7C59] text-white hover:bg-[#3D664A] shadow-[#4A7C59]/20'
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
      <div className="px-4 py-4">
        <h2 className="text-[10px] font-black text-village-umber uppercase tracking-[0.2em] mb-4 opacity-70">Bestsellers</h2>
        <div className="flex overflow-x-auto gap-3.5 pb-2 scrollbar-hide -mx-4 px-4 snap-x">
          {bestsellerProducts.map((product) => {
            const { displayPrice, mrp, discount, hasDiscount } = calculateProductPrice(product);
            const cartItem = cart.items.find(item => item?.product && (item.product.id === product.id || item.product._id === product.id));
            const inCartQty = cartItem?.quantity || 0;

            return (
              <div key={product.id} className="village-card paper-texture organic-radius overflow-hidden flex flex-col bg-white min-w-[155px] max-w-[155px] snap-start">
                <div onClick={() => navigate(`/product/${product.id}`)} className="relative aspect-square w-full bg-neutral-50 flex items-center justify-center p-3 cursor-pointer">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain drop-shadow-md" />
                  {discount > 0 && (
                    <div className="absolute top-2 left-0 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-r-sm shadow-sm">
                      {discount}% OFF
                    </div>
                  )}
                  <WishlistButton productId={product.id} size="sm" className="top-2 right-2 shadow-sm" />
                </div>
                <div className="p-2.5 flex flex-col flex-1">
                  <h3 className="text-[10px] font-black text-village-umber uppercase tracking-tight line-clamp-2 leading-tight mb-1 h-[24px]">{product.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-xs font-black text-village-umber">₹{displayPrice}</span>
                    {hasDiscount && <span className="text-[9px] text-neutral-400 line-through font-bold">₹{mrp}</span>}
                  </div>
                  <div className="mt-auto">
                    {inCartQty === 0 ? (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product); }}
                        className="w-full h-7 bg-[#4A7C59] text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-md active:scale-95 transition-all"
                      >
                        Add
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-neutral-100 rounded-lg h-7 px-1">
                        <button onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, inCartQty - 1); }} className="w-5 h-5 flex items-center justify-center text-[#4A7C59] font-black">-</button>
                        <span className="text-[10px] font-black text-village-umber">{inCartQty}</span>
                        <button onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, inCartQty + 1); }} className="w-5 h-5 flex items-center justify-center text-[#4A7C59] font-black">+</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
