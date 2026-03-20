import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useLoading } from '../context/LoadingContext';

const useRouteLoader = () => {
  const location = useLocation();
  const { startRouteLoading, stopRouteLoading } = useLoading();
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Start loader on navigation, but SKIP for admin and delivery routes 
    // to avoid double/clashing loaders as these modules manage their own animations
    const isExcludedRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/delivery');

    if (!isInitialMount.current && !isExcludedRoute) {
      startRouteLoading();
    }

    // Small delay to simulate route processing and ensure loader visibility
    const timer = setTimeout(() => {
      // Only stop if we started it (or if it's initial mount)
      if (!isExcludedRoute || isInitialMount.current) {
        stopRouteLoading();
      }

      if (isInitialMount.current) {
        isInitialMount.current = false;
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [location.pathname, startRouteLoading, stopRouteLoading]);
};

export default useRouteLoader;
