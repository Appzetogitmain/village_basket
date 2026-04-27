import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { menuSections, type MenuItem, type MenuSection, type SubMenuItem } from "../data/adminMenu";
import panchayatArt from '@assets/panchayat_art.png';
import villageBasketLogo from '@assets/village_basket-removebg-preview.png';

interface AdminSidebarProps {
  onClose?: () => void;
}



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
        
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('/assets/natural-paper.png')] z-0"></div>

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
