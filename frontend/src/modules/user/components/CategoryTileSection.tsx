import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

interface CategoryTile {
  id: string;
  name: string;
  productImages?: (string | undefined)[];
  image?: string; // Support single image property
  productCount?: number;
  categoryId?: string;
  subcategoryId?: string;
  productId?: string;
  sellerId?: string;
  bgColor?: string;
  slug?: string;
  type?: "subcategory" | "product" | "category" | "shop" | "seller";
}

interface CategoryTileSectionProps {
  title: string;
  tiles: CategoryTile[];
  columns?: 2 | 3 | 4 | 6 | 8; // Support all column options
  showProductCount?: boolean; // Show product count only for bestsellers
}

export default function CategoryTileSection({
  title,
  tiles,
  columns = 4,
  showProductCount = false,
}: CategoryTileSectionProps) {
  const navigate = useNavigate();

  const handleTileClick = (tile: CategoryTile) => {
    if (tile.subcategoryId || tile.type === "subcategory") {
      // Navigate to subcategory page or category with subcategory filter
      if (tile.categoryId) {
        navigate(
          `/user/category/${tile.categoryId}?subcategory=${tile.subcategoryId || tile.id
          }`
        );
      } else if (tile.slug) {
        navigate(`/user/category/${tile.slug}`);
      } else {
        navigate(`/user/category/subcategory/${tile.subcategoryId || tile.id}`);
      }
      return;
    }
    if (tile.type === "shop" || tile.type === "seller" || (tile as any).sellerId) {
      navigate(`/user/store/${tile.categoryId || (tile as any).sellerId || tile.id}`);
      return;
    }
    if (tile.type === "category") {
      navigate(`/user/category/${tile.slug || tile.categoryId || tile.id}`);
      return;
    }
    if (tile.categoryId) {
      navigate(`/user/category/${tile.categoryId}`);
      return;
    }
    if (tile.productId) {
      navigate(`/user/product/${tile.productId}`);
      return;
    }
    // Otherwise just log for now
    console.log("Clicked tile", tile.id);
  };

  // Dynamic grid classes based on column count
  const getGridCols = () => {
    switch (columns) {
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3";
      case 4:
        return "grid-cols-4";
      case 6:
        return "grid-cols-6";
      case 8:
        return "grid-cols-8";
      default:
        return "grid-cols-4";
    }
  };

  const gridCols = getGridCols();
  const gapClass = columns >= 6 ? "gap-1.5 md:gap-2.5" : "gap-2.5 md:gap-4";

  return (
    <div className="mb-6 md:mb-8 mt-0 overflow-visible">
      <h2 className="text-lg md:text-2xl font-bold text-village-umber mb-3 md:mb-6 px-4 md:px-6 lg:px-8 tracking-tight font-poppins">
        {title}
      </h2>
      <div className="px-4 md:px-6 lg:px-8 overflow-visible">
        <div className={`grid ${gridCols} ${gapClass} overflow-visible auto-rows-fr`}>
          {tiles.map((tile) => {
            // Prioritize the main image (logo/banner) if available, otherwise fallback to product grid
            const images = tile.image
              ? [tile.image]
              : (tile.productImages && tile.productImages.length > 0 ? tile.productImages : []);

            const hasImages = images.length > 0 && images.some(img => !!img);

            const isShopOrSeller = tile.type === "shop" || tile.type === "seller" || (tile as any).sellerId;

            return (
              <motion.div
                key={tile.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex flex-col">
                <Link
                  to={
                    tile.subcategoryId || tile.type === "subcategory"
                      ? tile.categoryId
                        ? `/user/category/${tile.categoryId}?subcategory=${tile.subcategoryId || tile.id
                        }`
                        : tile.slug
                          ? `/user/category/${tile.slug}`
                          : `/user/category/subcategory/${tile.subcategoryId || tile.id
                          }`
                      : tile.productId
                        ? `/user/product/${tile.productId}`
                        : isShopOrSeller
                          ? `/user/store/${tile.categoryId || (tile as any).sellerId || tile.id}`
                          : tile.type === "category"
                            ? tile.slug
                              ? `/user/category/${tile.slug}`
                              : tile.categoryId
                                ? `/user/category/${tile.categoryId}`
                                : "#"
                            : tile.categoryId
                               ? `/user/category/${tile.categoryId}`
                               : "#"
                  }
                  onClick={(e) => {
                    if (
                      !tile.categoryId &&
                      !tile.productId &&
                      !tile.subcategoryId &&
                      !(tile as any).sellerId
                    ) {
                      e.preventDefault();
                      handleTileClick(tile);
                    }
                  }}
                  className={`block transition-all h-full group ${showProductCount ? "px-2 py-2 bg-white/40 border border-village-umber/5 shadow-sm rounded-2xl" : "px-1"
                    }`}>
                  {/* Image Container - Enlarged, Rounded, and Standardized */}
                  <div
                    className={`w-full overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 ${showProductCount ? "h-32 md:h-40 mb-3 bg-white/40 border border-village-umber/5 shadow-sm rounded-3xl" : "aspect-square rounded-[2rem] border-2 border-village-umber/5 bg-transparent"
                      }`}>
                    {hasImages ? (
                      showProductCount ? (
                        // Bestsellers: Enhanced 2x2 grid
                        <div className="w-full h-full grid grid-cols-2 gap-1 p-1">
                          {images.slice(0, 4).map((img, idx) =>
                            img ? (
                              <img
                                key={idx}
                                src={img}
                                alt=""
                                className="w-full h-full object-cover rounded-xl"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div
                                key={idx}
                                className="w-full h-full bg-neutral-100 rounded-xl flex items-center justify-center text-[10px] text-neutral-400">
                                {idx + 1}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        // Standard Category: Large filling rounded image
                        <img
                          src={images[0]}
                          alt={tile.name}
                          className="w-full h-full object-cover rounded-[1.9rem]"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xl font-black text-village-umber/20 uppercase tracking-tighter">${tile.name.charAt(0)}</div>`;
                            }
                          }}
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-black text-village-umber/20 uppercase tracking-tighter">
                        {tile.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Product count - (only for bestsellers) */}
                  {showProductCount && tile.productCount && (
                    <div className="mb-1.5 flex justify-center">
                      <span className="inline-block bg-white text-village-umber text-[9px] font-black px-2 py-0.5 rounded-full ring-1 ring-village-umber/5 shadow-sm">
                        +{tile.productCount} Items
                      </span>
                    </div>
                  )}

                  {/* Tile name inside card for bestsellers */}
                  {showProductCount && (
                    <div className="text-[10px] md:text-[11px] font-black text-village-umber uppercase tracking-tight line-clamp-2 text-center w-full block leading-tight min-h-[2.2em]">
                      {tile.name}
                    </div>
                  )}
                </Link>

                {/* Category name - outside card for non-bestsellers */}
                {!showProductCount && (
                  <div className="mt-2 text-center overflow-visible min-h-[2.4em] flex items-start justify-center">
                    <span className="text-[10px] md:text-[11px] font-black text-village-umber uppercase tracking-tight line-clamp-2 block leading-tight break-words px-0.5">
                      {tile.name}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
