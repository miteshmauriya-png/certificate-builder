import React from 'react';
import { Menu, Search, Bell, ChevronDown } from 'lucide-react';

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
  onSearchChange?: (val: string) => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onToggleSidebar,
}) => {
  return (
    <header className="h-16 bg-[#0E204E] text-white flex items-center justify-between px-6 border-b border-slate-800 shrink-0 z-20">
      <div className="flex items-center gap-4 flex-1">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search input */}
        <div className="relative w-72 md:w-96 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-[#1A2E62]/80 border border-slate-700/60 rounded-lg pl-10 pr-4 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          type="button"
          aria-label="View notifications"
          className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#0E204E]"></span>
        </button>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-2 cursor-pointer hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center ring-2 ring-blue-500/30">
            AK
          </div>
          <span className="text-sm font-medium text-slate-200 hidden sm:inline">Admin</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </header>
  );
};
