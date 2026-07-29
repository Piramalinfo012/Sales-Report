import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { NavigationTab } from '../dashboard/DashboardContainer';
import {
  LayoutDashboard,
  Target,
  Sun,
  Moon,
  Navigation,
  Clock,
  Users,
  FileSpreadsheet,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  X,
  ShieldCheck,
  UserPlus
} from 'lucide-react';

interface SidebarProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  isOpenMobile: boolean;
  closeMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isOpenMobile,
  closeMobile,
}) => {
  const { authState, logout, themeMode, toggleTheme } = useAuth();
  const user = authState.user;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'target', label: 'Target', icon: Target },
    { id: 'morning_plan', label: 'Morning Follow up', icon: Sun },
    { id: 'evening_report', label: 'Evening Report', icon: Moon },
    { id: 'gps_tracking', label: 'GPS Tracking', icon: Navigation },

    { id: 'references', label: 'References', icon: UserPlus },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const sidebarContent = (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-800/80 text-slate-200">
      {/* Brand & Logo Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shadow-md shadow-sky-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[0.65rem] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-sky-600" />
            </div>
          </div>
          <div>
            <h2 className="font-bold text-sm tracking-tight text-white leading-tight">
              SALES PORTAL
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">Enterprise Reporting</p>
          </div>
        </div>

        {/* Close button for mobile */}
        <button
          onClick={closeMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Badge Pill */}
      <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-sky-600" />
          <span className="text-xs font-semibold text-slate-300">
            {user?.role === 'Admin' ? 'Administrator' : 'Sales Representative'}
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950 text-sky-600 border border-sky-800 font-mono">
          {user?.id}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id as NavigationTab);
                closeMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-600 border border-sky-500/30 shadow-md shadow-sky-950/20 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Controls: Theme Toggle & Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all"
        >
          <div className="flex items-center gap-2">
            {themeMode === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
            <span>{themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 font-mono text-slate-400">
            {themeMode === 'dark' ? 'Dark' : 'Light'}
          </span>
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800/50 border border-slate-700/60 text-slate-300 text-xs font-semibold transition-all group"
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-400 transition-colors" />
          <span>Logout</span>
        </button>

        <div className="pt-2 text-[9px] text-center text-slate-500 font-mono tracking-wider font-semibold">
          DEVELOPED BY DEEPAK SAHU
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={closeMobile}
          />
          <div className="relative w-64 max-w-xs h-full z-10 animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};


