import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

// Base API URL - adjust based on your backend URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

// Socket.io base URL - extract from API_BASE_URL by removing /api/v1
// Socket connections need the base server URL without the API path
export const getSocketBaseURL = (): string => {
  // Use VITE_API_URL if explicitly set (for socket connections)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Otherwise, extract base URL from VITE_API_BASE_URL
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

  // Remove /api/v1 or /api from the end
  const socketUrl = apiBaseUrl.replace(/\/api\/v\d+$|\/api$/, '');

  return socketUrl || "http://localhost:5000";
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Role-specific storage keys
const AUTH_TOKEN_KEYS: Record<string, string> = {
  admin: "adminAuthToken",
  seller: "sellerAuthToken",
  delivery: "deliveryAuthToken",
  customer: "authToken",
};

const USER_DATA_KEYS: Record<string, string> = {
  admin: "adminUserData",
  seller: "sellerUserData",
  delivery: "deliveryUserData",
  customer: "userData",
};

const safeGetStorage = (key: string): string | null => {
  try {
    const local = localStorage.getItem(key);
    if (local) return local;
  } catch (_e) {
    // Ignore storage access errors (common in restricted webviews)
  }

  try {
    return sessionStorage.getItem(key);
  } catch (_e) {
    return null;
  }
};

const safeSetStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (_e) {
    // Ignore and fallback
  }
  try {
    sessionStorage.setItem(key, value);
  } catch (_e) {
    // Ignore
  }
};

const safeRemoveStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (_e) {
    // Ignore
  }
  try {
    sessionStorage.removeItem(key);
  } catch (_e) {
    // Ignore
  }
};

// Determine the role based on URL or current path
const getRole = (url?: string): string => {
  const currentPath = window.location.pathname;
  const targetUrl = url || "";

  // The order of these checks matters, but strict checks should be used to avoid
  // partial matches (e.g. "/delivery/location/sellers-in-radius" catching on "/sellers")

  // Check currentPath primarily for the app context
  if (currentPath.startsWith("/admin")) return "admin";
  if (currentPath.startsWith("/seller")) return "seller";
  if (currentPath.startsWith("/delivery")) return "delivery";

  // Fallback to targetUrl matching carefully
  if (targetUrl.startsWith("/admin") || targetUrl.match(/^\/api\/v\d+\/admin/)) return "admin";
  
  if (
      targetUrl.startsWith("/seller") || 
      targetUrl.match(/^\/api\/v\d+\/seller/) ||
      // Need a stricter check for /sellers endpoint, ensure it's at the boundary
      targetUrl.match(/^\/sellers\b/) || 
      targetUrl.match(/^\/api\/v\d+\/sellers\b/)
  ) return "seller";

  if (targetUrl.startsWith("/delivery") || targetUrl.match(/^\/api\/v\d+\/delivery/)) return "delivery";

  return "customer";
};

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const role = getRole(config.url);
    const token = getAuthToken(role);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: any) => {
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes("/auth/");
      const hadToken = error.config?.headers?.Authorization;

      if (!isAuthEndpoint && hadToken) {
        const currentPath = window.location.pathname;
        if (currentPath.includes("/login") || currentPath.includes("/signup")) {
          return Promise.reject(error);
        }

        const role = getRole(error.config?.url);
        let redirectPath = "/login";

        if (role === "admin") {
          redirectPath = "/admin/login";
        } else if (role === "seller") {
          redirectPath = "/seller/login";
        } else if (role === "delivery") {
          redirectPath = "/delivery/login";
        }

        const failedToken = typeof hadToken === "string" && hadToken.startsWith("Bearer ")
          ? hadToken.slice(7)
          : null;
        const currentStoredToken = getAuthToken(role);

        // Ignore stale request 401s: if request used an old token, don't logout current session.
        if (failedToken && currentStoredToken && failedToken !== currentStoredToken) {
          return Promise.reject(error);
        }

        removeAuthToken(role);
        window.location.href = redirectPath;
      }
    }
    return Promise.reject(error);
  }
);

// Token management helpers
export const setAuthToken = (token: string, role?: string) => {
  const userRole = role || getRole();
  safeSetStorage(AUTH_TOKEN_KEYS[userRole], token);
};

export const setUserData = (userData: any, role?: string) => {
  const userRole = role || getRole();
  safeSetStorage(USER_DATA_KEYS[userRole], JSON.stringify(userData));
};

export const getAuthToken = (role?: string): string | null => {
  const userRole = role || getRole();
  return safeGetStorage(AUTH_TOKEN_KEYS[userRole]);
};

export const getUserData = (role?: string): any | null => {
  const userRole = role || getRole();
  const data = safeGetStorage(USER_DATA_KEYS[userRole]);
  return data ? JSON.parse(data) : null;
};

export const removeAuthToken = (role?: string) => {
  const userRole = role || getRole();
  safeRemoveStorage(AUTH_TOKEN_KEYS[userRole]);
  safeRemoveStorage(USER_DATA_KEYS[userRole]);
};

export default api;
