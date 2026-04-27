import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredUserType?: "Admin" | "Seller" | "Customer" | "Delivery";
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredUserType,
  redirectTo = "/user/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, user, token } = useAuth();
  const location = useLocation();

  // Not authenticated — redirect to login, saving the intended URL
  if (!isAuthenticated || !token) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check user type if required
  if (requiredUserType && user) {
    const userType = (user as any).userType || (user as any).role;

    if (requiredUserType === "Admin") {
      const isAdmin = userType === "Admin" || userType === "Super Admin";
      if (!isAdmin) return <Navigate to="/user/home" replace />;
    } else if (requiredUserType === "Customer") {
      // Customer check: must be authenticated as Customer
      if (userType && userType !== "Customer") {
        // Seller/Delivery/Admin trying to access customer routes
        if (userType === "Seller") return <Navigate to="/seller" replace />;
        if (userType === "Delivery") return <Navigate to="/delivery" replace />;
        if (userType === "Admin" || userType === "Super Admin") return <Navigate to="/admin" replace />;
      }
    } else if (userType && userType !== requiredUserType) {
      if (requiredUserType === "Seller") return <Navigate to="/seller/login" replace />;
      if (requiredUserType === "Delivery") return <Navigate to="/delivery/login" replace />;
      return <Navigate to="/user/home" replace />;
    }
  }

  // Check role if required (for Admin users)
  if (requiredRole && user) {
    const userRole = (user as any).role;
    if (!userRole || userRole !== requiredRole) {
      return <Navigate to="/user/home" replace />;
    }
  }

  return <>{children}</>;
}
