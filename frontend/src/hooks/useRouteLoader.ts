import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useLoading } from '../context/LoadingContext';

const useRouteLoader = () => {
  const location = useLocation();
  const { startRouteLoading, stopRouteLoading } = useLoading();
  const isInitialMount = useRef(true);

  useLayoutEffect(() => {
    if (!isInitialMount.current) {
      startRouteLoading();
    }

    // Small delay to simulate route processing and ensure loader visibility
    const timer = setTimeout(() => {
      stopRouteLoading();

      if (isInitialMount.current) {
        isInitialMount.current = false;
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [location.pathname, startRouteLoading, stopRouteLoading]);
};

export default useRouteLoader;
