import React, { useState } from 'react';
import {
  Shield,
  Camera,
  Upload,
  Link as LinkIcon,
  History,
  Flag,
  Sparkles,
  Settings,
  Menu,
  X,
  LayoutDashboard,
  Radio
} from 'lucide-react';
import { NavTab } from '../../types';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  backendOnline: boolean;
  communityConnected?: boolean;
  communityClientCount?: number;
  communityAlertCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  backendOnline,
  communityConnected = false,
  communityClientCount = 0,
  communityAlertCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scan', label: 'Scanner', icon: Camera },
    { id: 'upload', label: 'Upload QR', icon: Upload },
    { id: 'manual', label: 'Inspect URL', icon: LinkIcon },
    { id: 'history', label: 'History', icon: History },
    {
      id: 'reports',
      label: 'Reports',
      icon: Flag,
      badge: communityAlertCount > 0 ? `${communityAlertCount} Live` : undefined
    },
    { id: 'demo', label: 'Demo Mode', icon: Sparkles, badge: 'Showcase' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#DCE9DE] bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tagline */}
          <button
            onClick={() => handleTabClick('dashboard')}
            className="flex items-center gap-3 text-left focus:outline-none group"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#2E8B57] text-white shadow-md shadow-[#2E8B57]/20 group-hover:bg-[#1F5135] transition duration-200">
              <Shield size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-[#1F5135]">
                  True<span className="text-[#2E8B57]">QR</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-[#EAF7EC] border border-[#DCE9DE] text-[#1F5135] font-semibold">
                  Assistant
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-[#647067] font-medium tracking-tight -mt-0.5">
                Scan. Inspect. Decide.
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'text-[#1F5135] bg-[#EAF7EC] border border-[#DCE9DE] shadow-xs'
                      : 'text-[#647067] hover:text-[#1F5135] hover:bg-[#F7FBF7]'
                  }`}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 text-[9px] font-mono uppercase bg-emerald-100 text-[#1F5135] border border-[#DCE9DE] rounded">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right side: Backend Health Indicator & Quick Scan button */}
          <div className="flex items-center gap-3">
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                backendOnline
                  ? 'bg-[#EAF7EC] text-[#15803D] border-[#DCE9DE]'
                  : 'bg-amber-50 text-[#D97706] border-amber-200'
              }`}
              title={backendOnline ? 'Backend API & SQLite connected' : 'Connecting to local API...'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendOnline ? 'bg-[#15803D] animate-pulse' : 'bg-[#D97706]'
                }`}
              />
              <span className="font-medium">{backendOnline ? 'API Active' : 'Connecting'}</span>
            </div>

            {/* Live Community Network Indicator */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                communityConnected
                  ? 'bg-[#EAF7EC] text-[#15803D] border-[#DCE9DE]'
                  : 'bg-amber-50 text-[#D97706] border-amber-200'
              }`}
              title={
                communityConnected
                  ? `Community Network Active: ${communityClientCount} device(s) online`
                  : 'Connecting to TrueQR Community Network WebSocket...'
              }
            >
              <Radio size={12} className={communityConnected ? 'text-[#15803D] animate-pulse' : 'text-[#D97706]'} />
              <span className="font-medium">
                {communityConnected ? `Live Net (${communityClientCount})` : 'Net Offline'}
              </span>
            </div>

            <button
              onClick={() => handleTabClick('scan')}
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#2E8B57] hover:bg-[#1F5135] text-white shadow-sm transition active:scale-95"
            >
              <Camera size={14} />
              <span>Scan QR</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[#647067] hover:text-[#1F5135] hover:bg-[#EAF7EC] transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#DCE9DE] bg-white px-4 pt-2 pb-4 space-y-1 shadow-md">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? 'text-[#1F5135] bg-[#EAF7EC] border border-[#DCE9DE]'
                    : 'text-[#647067] hover:text-[#1F5135] hover:bg-[#F7FBF7]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase bg-emerald-100 text-[#1F5135] rounded">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
