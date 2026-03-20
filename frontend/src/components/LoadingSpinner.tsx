import { motion } from 'framer-motion';
import { useLoading } from '../context/LoadingContext';

/**
 * Lightweight loading spinner component
 * Optimized for fast rendering with Village theme
 */
export default function LoadingSpinner({
  size = 'md',
  className = ''
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: 20,
    md: 40,
    lg: 60,
  };

  const { isRouteLoading } = useLoading();
  const currentSize = sizes[size];

  if (isRouteLoading) return null;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        style={{ width: currentSize, height: currentSize }}
        className="relative flex items-center justify-center"
      >
        {/* Village Themed Leaf Spinner */}
        <svg 
          width={currentSize} 
          height={currentSize} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M12 2C12 2 12 10 20 12C12 14 12 22 12 22C12 22 12 14 4 12C12 10 12 2 12 2Z" 
            fill="#4A7C59" 
            fillOpacity="0.2"
            stroke="#4A7C59" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2" fill="#4A7C59" />
        </svg>
      </motion.div>
    </div>
  );
}

