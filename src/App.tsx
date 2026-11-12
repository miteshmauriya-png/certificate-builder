import React, { useState } from 'react';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminHeader } from './components/AdminHeader';
import { CertificateBuilder } from './modules/certificate-builder';

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans antialiased text-slate-800">
      {/* Admin Sidebar */}
      <AdminSidebar collapsed={sidebarCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Admin Header */}
        <AdminHeader onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />

        {/* Certificate Builder Module */}
        <CertificateBuilder />
      </div>
    </div>
  );
}
