import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import Button from '../../components/ui/button';
import { appConfig } from '../../services/configService';
import { calculateProductPrice } from '../../utils/priceUtils';
import QuantityInput from '../../components/ui/QuantityInput';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  const deliveryFee = cart.total >= appConfig.freeDeliveryThreshold ? 0 : appConfig.deliveryFee;
  const platformFee = appConfig.platformFee;
  const totalAmount = cart.total + deliveryFee + platformFee;

  const handleCheckout = () => {
    navigate('/user/checkout');
  };

  if (cart.items.length === 0) {
    return (
      <div className="px-4 py-8 md:py-16 text-center">
        <div className="text-6xl md:text-8xl mb-4">🛒</div>
        <h2 className="text-xl md:text-2xl font-bold text-neutral-900 mb-2">Your cart is empty</h2>
        <p className="text-neutral-600 mb-6 md:mb-8 md:text-lg">Add some items to get started!</p>
        <Link to="/user">
          <Button variant="default" size="lg" className="md:px-8 md:py-3 md:text-lg bg-[#8B3D28] hover:bg-[#722F1E] font-black font-poppins uppercase tracking-widest">
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-4 md:pb-8">
      {/* Header */}
      <div className="px-4 md:px-6 lg:px-8 py-5 bg-[#8B3D28] border-b border-white/10 mb-4 md:mb-6 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl md:text-2xl font-bold text-white font-poppins">Your Basket</h1>
          {cart.items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm md:text-base text-white/80 font-bold hover:text-white transition-colors bg-white/10 px-3 py-1 rounded-full"
            >
              Clear All
            </button>
          )}
        </div>

      </div>

      {/* Cart Items */}
      <div className="px-4 md:px-6 lg:px-8 space-y-4 md:space-y-6 mb-4 md:mb-6">
        {cart.items.map((item) => {
          const { displayPrice, mrp, hasDiscount } = calculateProductPrice(item.product, item.variant);
          const variationName = item.variant || (item.product as any).variantTitle || (item.product as any).pack || item.product.pack;

          return (
            <div
              key={`${item.product.id}-${variationName}`}
              className="bg-white rounded-lg border border-neutral-200 p-4 md:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4 md:gap-6">
                {/* Product Image */}
                <div className="w-20 h-20 md:w-24 md:h-24 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {item.product.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-2xl text-neutral-400">
                      {item.product.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900 mb-0.5 md:mb-1 line-clamp-2 md:text-lg">
                    {item.product.name}
                  </h3>
                  {variationName && (
                    <div className="mb-2">
                      <span className="inline-block bg-neutral-100 text-neutral-600 text-[10px] md:text-xs font-bold px-2 py-0.5 rounded border border-neutral-200 uppercase tracking-wide">
                        {variationName}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <span className="text-base md:text-lg font-bold text-neutral-900">
                      {"\u20B9"}{displayPrice.toLocaleString('en-IN')}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs md:text-sm text-neutral-500 line-through">
                        {"\u20B9"}{mrp.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 md:gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant)}
                      className="w-8 h-8 md:w-10 md:h-10 p-0 border-[#8B3D28]/30 text-[#8B3D28] hover:border-[#8B3D28] hover:bg-[#8B3D28]/5 md:text-lg font-black"
                    >
                      −
                    </Button>
                     <QuantityInput
                      value={item.quantity}
                      onChange={(val) => updateQuantity(item.product.id, val, item.variant)}
                      className="text-base md:text-lg font-black text-[#8B3D28] w-12 md:w-16 text-center font-poppins bg-transparent border-none focus:outline-none"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant)}
                      className="w-8 h-8 md:w-10 md:h-10 p-0 border-[#8B3D28]/30 text-[#8B3D28] hover:border-[#8B3D28] hover:bg-[#8B3D28]/5 md:text-lg font-black"
                    >
                      +
                    </Button>
                    <div className="ml-auto text-right">
                      <div className="text-sm md:text-base font-bold text-neutral-900">
                        {"\u20B9"}{(displayPrice * item.quantity).toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFromCart(item.product.id, item.variant)}
                  className="text-neutral-400 hover:text-red-600 transition-colors self-start"
                  aria-label="Remove item"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Summary */}
      <div className="px-4 md:px-6 lg:px-8 mb-24 md:mb-8">
        <div className="bg-white rounded-xl border border-neutral-200 p-4 md:p-6 shadow-sm md:max-w-md md:ml-auto">
          <h2 className="text-lg md:text-xl font-bold text-neutral-900 mb-4 md:mb-6">Order Summary</h2>
          <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
            <div className="flex justify-between text-neutral-700 md:text-base">
              <span>Subtotal</span>
              <span className="font-medium">{"\u20B9"}{cart.total.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-neutral-700 md:text-base">
              <span>Platform Fee</span>
              <span className="font-medium">{"\u20B9"}{platformFee.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-neutral-700 md:text-base">
              <span>Delivery Charges</span>
              <span className={`font-black font-poppins ${deliveryFee === 0 ? 'text-[#8B3D28]' : ''}`}>
                {deliveryFee === 0 ? 'FREE' : `\u20B9${deliveryFee.toLocaleString('en-IN')}`}
              </span>
            </div>
            {cart.total < appConfig.freeDeliveryThreshold && (
              <div className="text-xs md:text-sm text-[#8B3D28] bg-[#8B3D28]/5 px-2 py-1.5 rounded font-bold font-poppins border border-[#8B3D28]/10">
                Add {"\u20B9"}{(appConfig.freeDeliveryThreshold - cart.total).toLocaleString('en-IN')} more for free delivery
              </div>
            )}
          </div>
          <div className="border-t border-neutral-200 pt-4 md:pt-6">
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <span className="text-lg md:text-xl font-bold text-neutral-900">Total</span>
              <span className="text-xl md:text-2xl font-bold text-neutral-900">
                {"\u20B9"}{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <Button
              variant="default"
              size="lg"
              onClick={handleCheckout}
              className="w-full md:py-3 md:text-lg bg-[#8B3D28] hover:bg-[#722F1E] font-black font-poppins uppercase tracking-widest py-4 mt-2"
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

