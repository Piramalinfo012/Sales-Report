import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NavigationTab } from '../dashboard/DashboardContainer';
import {
  Bell,
  LogOut,
  User,
  Menu,
  Sparkles,
  Compass,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  toggleSidebarMobile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onTabChange, toggleSidebarMobile }) => {
  const { authState, logout, captureGPSLocation, themeMode, toggleTheme } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const user = authState.user;

  const handleQuickGps = async () => {
    setIsCapturing(true);
    await captureGPSLocation('Header Quick Ping');
    setIsCapturing(false);
  };

  const sampleNotifications = [
    {
      id: 1,
      title: 'Morning Plan Reminder',
      desc: 'Submit today\'s meetings before 10:00 AM',
      time: '09:00 AM',
      icon: Clock,
      color: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
    },
    {
      id: 2,
      title: 'Pending Follow-up Alert',
      desc: 'Reliance Retail contract renewal follow-up due today',
      time: '11:30 AM',
      icon: AlertCircle,
      color: 'text-sky-400 bg-sky-950/40 border-sky-800/40',
    },
    {
      id: 3,
      title: 'Evening Report Reminder',
      desc: 'Update visit logs and upload photos by 06:00 PM',
      time: '05:00 PM',
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
    },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between text-slate-100">
      {/* Left section: Hamburger toggle & Live Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebarMobile}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            System Online & Synced
          </span>
        </div>

        <button
          onClick={handleQuickGps}
          disabled={isCapturing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-medium text-slate-200 hover:text-sky-400 transition-all shadow-sm"
          title="Capture Current GPS Coordinates"
        >
          <Compass className={`w-3.5 h-3.5 text-sky-400 ${isCapturing ? 'animate-spin' : ''}`} />
          <span>{isCapturing ? 'Locating...' : 'Ping GPS'}</span>
        </button>
      </div>

      {/* Right Section: Notifications, Theme Switcher & User Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {themeMode === 'dark' ? (
            <>
              <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" />
              <span className="hidden sm:inline text-amber-300">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-5 h-5 text-indigo-400" />
              <span className="hidden sm:inline text-indigo-600 font-bold">Dark</span>
            </>
          )}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-400 ring-2 ring-slate-900" />
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 text-slate-200"
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <span>Daily System Reminders</span>
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800">
                    3 Active
                  </span>
                </div>

                <div className="space-y-2.5">
                  {sampleNotifications.map((n) => {
                    const Icon = n.icon;
                    return (
                      <div
                        key={n.id}
                        className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex items-start gap-2.5"
                      >
                        <div className={`p-1.5 rounded-lg border ${n.color} shrink-0 mt-0.5`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-slate-100">{n.title}</h4>
                            <span className="text-[10px] text-slate-500">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{n.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-800"
          >
            <img
              src={user?.profileUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={user?.userName}
              className="w-8 h-8 rounded-xl object-cover ring-2 ring-sky-500/30"
            />
            <div className="hidden md:block text-left leading-none">
              <div className="text-xs font-semibold text-white truncate max-w-[120px]">
                {user?.userName || 'User'}
              </div>
              <div className="text-[10px] text-sky-400 font-medium mt-0.5">
                {user?.role || 'Sales'}
              </div>
            </div>
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 text-slate-200"
              >
                <div className="flex items-center gap-3 pb-3 mb-3 border-b border-slate-800">
                  <img
                    src={user?.profileUrl}
                    alt={user?.userName}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-sky-500/40"
                  />
                  <div className="overflow-hidden">
                    <h4 className="font-semibold text-sm text-white truncate">{user?.userName}</h4>
                    <p className="text-xs text-slate-400 truncate">ID: {user?.id}</p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/60 font-medium">
                      Manager: {user?.manager}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => {
                      onTabChange('profile');
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <User className="w-4 h-4 text-sky-400" />
                    <span>My Profile & Security</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

