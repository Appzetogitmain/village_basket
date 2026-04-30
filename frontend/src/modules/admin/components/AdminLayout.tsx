import { useState, ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import adminArt from '@assets/admin_art.png';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default to open on desktop

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-[#FAF7F2] font-poppins relative">
      {/* Subtle background texture like other modules */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('/assets/natural-paper.png')] z-0"></div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar - Fixed */}
      <div
        className={`fixed left-0 top-0 h-screen z-50 transition-transform duration-300 ease-in-out w-60 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 w-full relative z-10 ${
        isSidebarOpen ? 'lg:ml-60' : 'lg:ml-0'
      }`}>
        {/* Header */}
        <AdminHeader onMenuClick={toggleSidebar} isSidebarOpen={isSidebarOpen} />

        {/* Page Content - With Bottom Warli Art Watermark */}
        <main className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 bg-transparent relative group">
          <div className="relative z-10">{children}</div>
          
          {/* Production-level Art Integration: Management Theme - Seamless Bottom Border */}
          <div className="pointer-events-none absolute -bottom-4 left-0 w-full h-[200px] opacity-[0.14] z-0 transition-all duration-700 group-hover:opacity-[0.25]">
            <div 
              className="w-full h-full bg-repeat-x mix-blend-multiply"
              style={{ 
                backgroundImage: `url(${adminArt})`,
                backgroundPosition: 'center bottom',
                backgroundSize: 'auto 100%',
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}




