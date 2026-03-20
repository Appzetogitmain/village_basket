import { ReactNode } from 'react';
import { useLoading } from '../context/LoadingContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * Minimal loading state that matches page background
 * Prevents flash by using same background as pages
 */
export default function PageLoader({ children }: { children?: ReactNode }) {
  const { isRouteLoading } = useLoading();

  if (isRouteLoading) return null;

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      {children || (
        <div className="flex flex-col items-center gap-4 text-center">
          <LoadingSpinner size="lg" />
          <div className="space-y-1">
            <h3 className="text-village-umber font-black text-[10px] uppercase tracking-[0.3em] opacity-80">
              Fresh Harvest
            </h3>
            <p className="text-stone-400 text-[8px] font-black uppercase tracking-[0.1em]">
              Arriving at your doorstep
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

