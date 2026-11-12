import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Award,
  BarChart3,
  Settings,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';

interface AdminSidebarProps {
  collapsed?: boolean;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed = false }) => {
  return (
    <aside
      className={`bg-[#0D1F4D] text-slate-300 flex flex-col shrink-0 transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Logo & Name */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-lg tracking-tight text-white font-sans">
            Admin System
          </span>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
        <a
          href="#dashboard"
          className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors text-sm font-medium"
        >
          <LayoutDashboard className="w-5 h-5 shrink-0 text-slate-400" />
          {!collapsed && <span>Dashboard</span>}
        </a>

        <a
          href="#users"
          className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors text-sm font-medium"
        >
          <Users className="w-5 h-5 shrink-0 text-slate-400" />
          {!collapsed && <span>Users</span>}
        </a>

        <a
          href="#courses"
          className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors text-sm font-medium"
        >
          <GraduationCap className="w-5 h-5 shrink-0 text-slate-400" />
          {!collapsed && <span>Courses</span>}
        </a>

        {/* Certificate Master (Collapsible Active Group) */}
        <div className="pt-1">
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-white bg-slate-800/80 font-medium text-sm cursor-pointer shadow-sm">
            <div className="flex items-center gap-3.5">
              <Award className="w-5 h-5 shrink-0 text-blue-400" />
              {!collapsed && <span>Certificate Master</span>}
            </div>
            {!collapsed && <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>

          {!collapsed && (
            <div className="pl-6 pr-1 mt-1 space-y-1">
              <a
                href="#theme-master"
                className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/40 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                <span>Theme Master</span>
              </a>

              <a
                href="#certificate-master"
                className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-white bg-blue-600 shadow-sm shadow-blue-600/30 transition-colors"
              >
                <Award className="w-4 h-4 text-white" />
                <span>Certificate Master</span>
              </a>
            </div>
          )}
        </div>

        <a
          href="#reports"
          className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors text-sm font-medium"
        >
          <BarChart3 className="w-5 h-5 shrink-0 text-slate-400" />
          {!collapsed && <span>Reports</span>}
        </a>

        <a
          href="#settings"
          className="flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors text-sm font-medium"
        >
          <Settings className="w-5 h-5 shrink-0 text-slate-400" />
          {!collapsed && <span>Settings</span>}
        </a>
      </nav>

      {/* System Status / Version */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Certificate Engine v2.4</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </span>
        </div>
      )}
    </aside>
  );
};
