import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export interface HomeBannerData {
  _id: string;
  title?: string;
  subtitle?: string;
  imageUrl: string;
  link?: string;
}

interface HomeBannersCarouselProps {
  banners: HomeBannerData[];
}

export default function HomeBannersCarousel({ banners }: HomeBannersCarouselProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // Filter banners to make sure we have at least 1 and up to 4
  const displayBanners = (banners || []).slice(0, 4);

  useEffect(() => {
    if (displayBanners.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % displayBanners.length;
        scrollToIndex(next);
        return next;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [displayBanners.length]);

  const scrollToIndex = (index: number) => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.offsetWidth;
    container.scrollTo({
      left: index * width,
      behavior: 'smooth',
    });
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    scrollToIndex(index);
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.offsetWidth;
    if (width === 0) return;

    const newIndex = Math.round(container.scrollLeft / width);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < displayBanners.length) {
      setCurrentIndex(newIndex);
    }
  };

  // Drag-to-scroll implementation for desktop/mouse users
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    isDragging.current = true;
    startX.current = e.pageX - container.offsetLeft;
    scrollLeft.current = container.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX.current) * 1.5; // scroll-speed multiplier
    container.scrollLeft = scrollLeft.current - walk;
  };

  const handleBannerClick = (link?: string) => {
    if (!link) return;
    const cleaned = link.trim().toLowerCase();
    
    // Check pathing conventions
    if (cleaned.startsWith('category/')) {
      const slug = link.substring('category/'.length);
      navigate(`/user/category/${slug}`);
    } else if (cleaned.startsWith('product/')) {
      const id = link.substring('product/'.length);
      navigate(`/user/product/${id}`);
    } else if (cleaned.startsWith('/') || cleaned.startsWith('http')) {
      if (cleaned.startsWith('http')) {
        window.open(link, '_blank');
      } else {
        navigate(link);
      }
    } else {
      // Fallback
      navigate(`/user/${link}`);
    }
  };

  if (displayBanners.length === 0) return null;

  return (
    <div className="w-full px-4 md:px-6 max-w-[1550px] mx-auto mt-4 mb-2 relative z-15">
      {/* Wrapper with subtle premium shadow and border-radius matching design system */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-neutral-150/40 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        
        {/* Horizontal scroll container with scroll snap */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className="flex overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar cursor-grab active:cursor-grabbing"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {displayBanners.map((banner, index) => (
            <div
              key={banner._id}
              onClick={() => handleBannerClick(banner.link)}
              className="w-full flex-shrink-0 snap-start snap-always relative overflow-hidden select-none cursor-pointer"
              style={{ minHeight: '120px', aspectRatio: '16/6' }}
            >
              {/* Image banner */}
              <img
                src={banner.imageUrl}
                alt={banner.title || 'Village Basket Promo'}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                loading="eager"
              />

              {/* Gradient Overlay for Text Readability */}
              {(banner.title || banner.subtitle) && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-transparent flex flex-col justify-center px-6 md:px-12 text-white">
                  {banner.title && (
                    <h3 className="text-sm md:text-2xl font-black tracking-tight drop-shadow-md">
                      {banner.title}
                    </h3>
                  )}
                  {banner.subtitle && (
                    <p className="text-[10px] md:text-sm text-neutral-200 mt-1 max-w-[70%] drop-shadow-sm font-medium">
                      {banner.subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Carousel Indicator Dots */}
        {displayBanners.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/10 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
            {displayBanners.map((_, index) => {
              const isActive = index === currentIndex;
              return (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isActive ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
