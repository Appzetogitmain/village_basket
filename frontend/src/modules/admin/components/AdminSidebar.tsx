import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import panchayatArt from '@assets/panchayat_art.png';
import villageBasketLogo from '@assets/village_basket-removebg-preview.png';

interface SubMenuItem {
  label: string;
  path: string;
  icon: JSX.Element;
  badge?: string;
  badgeColor?: string;
}

interface MenuItem {
  label: string;
  path: string;
  hasSubmenu?: boolean;
  submenuItems?: SubMenuItem[];
  icon?: JSX.Element;
  badge?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface AdminSidebarProps {
  onClose?: () => void;
}

const menuSections: MenuSection[] = [
  {
    title: "Service Catalog",
    items: [
      {
        label: "Catalog Manager",
        path: "/admin/catalog-manager",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 4h7v7H4V4zm0 9h7v7H4v-7zm9-9h7v7h-7V4zm0 9h7v7h-7v-7z" opacity="0.4" />
            <path d="M2 2v20h20V2H2zm18 18H4V4h16v16z" />
          </svg>
        ),
      },
      {
        label: "Categories",
        path: "/admin/category",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="currentColor" fillOpacity="0.2" />
          </svg>
        ),
      },
      {
        label: "Subcategories",
        path: "/admin/subcategory",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="currentColor" fillOpacity="0.2" />
            <path d="M12 11v6m-3-3h6" strokeWidth="3" />
          </svg>
        ),
      },
      {
        label: "Products",
        path: "/admin/product/list",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill="currentColor" fillOpacity="0.2" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          </svg>
        ),
      },
      {
        label: "Taxes",
        path: "/admin/product/taxes",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.2" />
            <path d="M12 2v20m5-17H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        ),
      },
      {
        label: "Brand",
        path: "/admin/brand",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.2" />
            <path d="M12 8v8m-4-4h8" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Home Catalog",
    items: [
      {
        label: "Header Category",
        path: "/admin/category/header",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="6" rx="1" fill="currentColor" fillOpacity="0.2" />
            <path d="M3 13h18M3 18h18" />
          </svg>
        ),
      },
      {
        label: "Promo Strip",
        path: "/admin/promo-strip",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2" fill="currentColor" fillOpacity="0.2" />
            <path d="M12 6v12M2 12h20" />
          </svg>
        ),
      },
      {
        label: "Lowest Prices",
        path: "/admin/lowest-prices",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5l10-5-10-5z" fill="currentColor" fillOpacity="0.2" />
            <path d="M2 17l10 5l10-5M2 12l10 5l10-5" />
          </svg>
        ),
      },
      {
        label: "Bestseller Cards",
        path: "/admin/bestseller-cards",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87l1.18 6.88L12 17.77l-6.18 3.25L7 14.14L2 9.27l6.91-1.01L12 2z" fill="currentColor" fillOpacity="0.2" />
          </svg>
        ),
      },
      {
        label: "Home Sections",
        path: "/admin/home-section",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18M3 7h18M3 14h18" />
            <rect x="4" y="2" width="16" height="3" rx="1" fill="currentColor" fillOpacity="0.2" />
          </svg>
        ),
      },
      {
        label: "Shop by Store",
        path: "/admin/shop-by-store",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" fill="currentColor" fillOpacity="0.2" />
            <path d="M9 22V12h6v10" />
          </svg>
        ),
      },
      {
        label: "Coupon",
        path: "/admin/coupon",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5H9a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3z" fill="currentColor" fillOpacity="0.2" />
            <path d="M9 12h6" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Seller Management",
    items: [
      {
        label: "Manage Seller",
        path: "/admin/manage-seller",
        hasSubmenu: true,
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="currentColor" fillOpacity="0.2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ),
        submenuItems: [
          {
            label: "Manage Seller List",
            path: "/admin/manage-seller/list",
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" /></svg>,
          },
          {
            label: "Seller Transaction",
            path: "/admin/manage-seller/transaction",
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5l10-5-10-5zM2 17l10 5l10-5M2 12l10 5l10-5" /></svg>,
          },
        ],
      },
    ],
  },
  {
    title: "Delivery Section",
    items: [
      {
        label: "Manage Location",
        path: "/admin/manage-location",
        hasSubmenu: true,
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="currentColor" fillOpacity="0.2" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        ),
        submenuItems: [
          {
            label: "Seller Location",
            path: "/admin/manage-location/seller-location",
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" /></svg>,
          },
        ],
      },
      {
        label: "Delivery Boy",
        path: "/admin/delivery-boy",
        hasSubmenu: true,
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" fill="currentColor" fillOpacity="0.2" />
            <polygon points="16 8 20 8 23 11 23 16 16 16" fill="currentColor" fillOpacity="0.4" />
          </svg>
        ),
        submenuItems: [
          {
            label: "Manage Delivery Boy",
            path: "/admin/delivery-boy/manage",
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>,
          },
          {
            label: "Delivery Time Slots",
            path: "/admin/delivery-slots",
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" /></svg>,
          },
          {
            label: "Fund Transfer",
            path: "/admin/delivery-boy/fund-transfer",
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 2.1L6.6 7.3 11.8 12.5l1.4-1.4-2.8-2.8H21v-2h-10.6l2.8-2.8-1.4-1.4zM12.2 21.9l5.2-5.2-5.2-5.2-1.4 1.4 2.8 2.8H3v2h10.6l-2.8 2.8 1.4 1.4z" /></svg>,
          },
          {
            label: "Cash Collection",
            path: "/admin/delivery-boy/cash-collection",
            icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.82v-1.91c-1.84-.44-3.52-1.51-3.52-3.71h2.12c0 1.25 1.12 1.95 2.81 1.95 1.78 0 2.53-.94 2.53-1.6 0-1.12-1-1.69-3-2.31-2.12-.67-4.12-1.61-4.12-4.11 0-2 1.62-3.3 3.41-3.76V3h2.82v1.89c1.62.33 3.09 1.46 3.09 3.49h-2.12c0-1-.87-1.76-2.47-1.76-1.55 0-2.43.76-2.43 1.61 0 .91.82 1.42 2.65 2.04 2.47.8 4.47 1.71 4.47 4.39 0 2.01-1.42 3.12-3.41 3.52z" /></svg>,
          },
        ],
      },
    ],
  },
  {
    title: "Order Section",
    items: [
      {
        label: "Order List",
        path: "/admin/orders",
        hasSubmenu: true,
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        ),
        submenuItems: [
          { label: "All Order", path: "/admin/orders/all", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg> },
          { label: "Pending Order", path: "/admin/orders/pending", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm1 14.5h-2v-5h2v5zm0-7h-2v-2h2v2z" /></svg> },
          { label: "Received Order", path: "/admin/orders/received", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg> },
          { label: "Processed Order", path: "/admin/orders/processed", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg> },
          { label: "Shipped Order", path: "/admin/orders/shipped", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 8h-3V4H3v12h2v4h10v-4h3l4-4V8zM5 14V6h10v8H5zm10 4H7v-2h8v2zm5-4h-3v-4h2.27L20 12.73V14z" /></svg> },
          { label: "Out For Delivery", path: "/admin/orders/out-for-delivery", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 8h-3V4H3v12h2v4h10v-4h3l4-4V8zM17 12.73L18.27 14H17v-1.27z" /></svg> },
          { label: "Delivered Order", path: "/admin/orders/delivered", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg> },
          { label: "Cancelled Order", path: "/admin/orders/cancelled", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" /></svg> },
          { label: "Return", path: "/admin/return", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" /></svg> },
          { label: "Donation", path: "/admin/donations", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg> },
        ],
      },
    ],
  },
  {
    title: "Rewards System",
    items: [
      {
        label: "Manage Rewards",
        path: "/admin/rewards",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87l1.18 6.88L12 17.77l-6.18 3.25L7 14.14L2 9.27l6.91-1.01L12 2z" />
          </svg>
        ),
      },
      {
        label: "Reward Orders",
        path: "/admin/reward-orders",
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>,
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        label: "Wallet & Earnings",
        path: "/admin/wallet",
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" /></svg>,
      },
    ],
  },
  {
    title: "Setting",
    items: [
      {
        label: "Billing & Charges",
        path: "/admin/billing-settings",
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M21 7.28V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.37-1-1.72zM20 9v6h-7V9h7zM5 19V5h14v2h-6c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h6v2H5z" /></svg>,
      },
      {
        label: "Payment List",
        path: "/admin/payment-list",
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" /></svg>,
      },
      {
        label: "SMS Gateway",
        path: "/admin/sms-gateway",
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z" /></svg>,
      },
      {
        label: "System User",
        path: "/admin/system-user",
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>,
      },
      {
        label: "Customer App Policy",
        path: "/admin/customer-app-policy",
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>,
      },
      {
        label: "Delivery App Policy",
        path: "/admin/delivery-app-policy",
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>,
      },
    ],
  },
];

export default function AdminSidebar({ onClose }: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const isSubmenuActive = (submenuItems?: SubMenuItem[]) => {
    if (!submenuItems) return false;
    return submenuItems.some((item) => location.pathname === item.path || location.pathname.startsWith(item.path + "/"));
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onClose && window.innerWidth < 1024) onClose();
  };

  const toggleSubmenu = (path: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) newSet.delete(path);
      else newSet.add(path);
      return newSet;
    });
  };

  const isExpanded = (path: string) => {
    const menuItem = menuSections.flatMap((s) => s.items).find((i) => i.path === path);
    return expandedMenus.has(path) || (menuItem?.submenuItems && isSubmenuActive(menuItem.submenuItems));
  };

  const filteredSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase())),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside className="w-60 h-screen flex flex-col font-poppins shadow-xl z-50 relative overflow-hidden border-r-[3px] border-[#8B3D28]">
      {/* HEADER SECTION - Cream Background */}
      <div className="flex items-center justify-between p-3 px-4 border-b border-[#8B3D28]/10 relative z-20 bg-[#FAF7F2]">
        <div className="h-8">
          <img src={villageBasketLogo} alt="Logo" className="h-full w-auto object-contain brightness-90 saturate-150" />
        </div>
        <button onClick={onClose} className="p-1.5 text-[#8B3D28]/60 hover:text-[#8B3D28] hover:bg-[#8B3D28]/5 rounded-lg transition-all">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6L18 18" /></svg>
        </button>
      </div>

      {/* BODY SECTION - Solid Dark Terracotta */}
      <div className="flex-1 bg-[#8B3D28] relative flex flex-col overflow-hidden">
        {/* Warli Art Overlay - Very Subtle */}
        <div 
          className="absolute inset-x-0 bottom-0 top-0 opacity-[0.08] pointer-events-none z-0 bg-no-repeat bg-bottom bg-contain invert brightness-[2] contrast-50 sepia-[.1]"
          style={{ backgroundImage: `url(${panchayatArt})`, backgroundSize: '240px auto' }}
        ></div>
        
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] z-0"></div>

        {/* Search */}
        <div className="p-3 border-b border-white/10 relative z-10">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Menu..."
              className="w-full px-3 py-1.5 pl-9 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 text-xs focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-medium"
            />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
              <circle cx="11" cy="11" r="8"></circle><path d="M21 21L16.65 16.65"></path>
            </svg>
          </div>
        </div>

        {/* Dashboard Link */}
        <div className="px-3 py-2 border-b border-white/10 relative z-10">
          <button
            onClick={() => handleNavigation("/admin")}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-all ${isActive("/admin")
              ? "bg-[#FAF7F2] text-[#8B3D28] shadow-lg font-bold"
              : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h7v7H4V4zm0 9h7v7H4v-7zm9-9h7v7h-7V4zm0 9h7v7h-7v-7z" /></svg>
            <span className="text-[13px] font-semibold tracking-tight">Dashboard</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto admin-sidebar-nav scroll-smooth px-2 relative z-10" style={{ scrollbarWidth: "none" }}>
          <style>{`.admin-sidebar-nav::-webkit-scrollbar { display: none; }`}</style>
          {filteredSections.map((section, idx) => (
            <div key={idx} className="mb-4">
              <h3 className="px-3 mb-1.5 text-[10px] font-black text-white/40 uppercase tracking-widest font-outfit">{section.title}</h3>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const expanded = isExpanded(item.path);
                  const active = isActive(item.path) || isSubmenuActive(item.submenuItems);
                  return (
                    <li key={item.path} className="px-1">
                      <button
                        onClick={() => item.hasSubmenu ? toggleSubmenu(item.path) : handleNavigation(item.path)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all group ${active ? "bg-[#FAF7F2] text-[#8B3D28] shadow-lg" : "text-white/80 hover:bg-white/5 hover:text-white"}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`flex-shrink-0 transition-transform group-hover:scale-110 ${active ? "text-[#8B3D28]" : "text-white/60"}`}>{item.icon}</span>
                          <span className="text-[13px] font-bold tracking-tight">{item.label}</span>
                        </div>
                        {item.hasSubmenu && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform duration-300 ${expanded ? "rotate-90" : ""}`}><path d="M9 18l6-6-6-6" /></svg>}
                      </button>
                      {item.hasSubmenu && expanded && (
                        <ul className="mt-1 pl-9 space-y-1 relative">
                          <div className="absolute left-4 top-0 bottom-0 w-[1px] bg-white/10"></div>
                          {item.submenuItems?.map((sub) => {
                            const subActive = isActive(sub.path);
                            return (
                              <li key={sub.path}>
                                <button onClick={() => handleNavigation(sub.path)} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${subActive ? "text-[#FAF7F2] bg-white/10" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
                                  <span className={subActive ? "text-white" : "text-white/40"}>{sub.icon}</span>
                                  <span>{sub.label}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
