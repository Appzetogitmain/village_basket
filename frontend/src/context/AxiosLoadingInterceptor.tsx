import React, { useEffect } from 'react';
import api from '../services/api/config';
import { useLoading } from './LoadingContext';

// Routes that should NOT show the global loader (background/silent requests)
const SILENT_ROUTES = [
  '/customer/location',
  '/customer/home',
  '/fcm-tokens',
  '/customer/wishlist',
  '/categories/',
];

const isSilentRequest = (url?: string): boolean => {
  if (!url) return false;
  return SILENT_ROUTES.some(route => url.includes(route));
};

export const AxiosLoadingInterceptor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const skip = (config as any).skipLoader || isSilentRequest(config.url);
        if (!skip) {
          (config as any)._hasStartedLoading = true;
          startLoading();
        }
        return config;
      },
      (error) => {
        if ((error.config as any)?._hasStartedLoading) {
          stopLoading();
        }
        return Promise.reject(error);
      }
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => {
        if ((response.config as any)?._hasStartedLoading) {
          stopLoading();
        }
        return response;
      },
      (error) => {
        if ((error.config as any)?._hasStartedLoading) {
          stopLoading();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [startLoading, stopLoading]);

  return <>{children}</>;
};
