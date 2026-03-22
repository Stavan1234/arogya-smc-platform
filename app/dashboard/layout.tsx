'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Map, 
  Hospital, 
  Bell, 
  Settings, 
  User, 
  Activity,
  ChevronLeft,
  Menu,
  ShieldAlert,
  FileText,
  Search,
  LogOut,
  ChevronRight,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import DashboardToaster from './toaster';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Disease Surveillance\n(S,P,L Forms)', href: '/dashboard/surveillance', icon: FileText },
  { name: 'Outbreak Management', href: '/dashboard/outbreaks', icon: ShieldAlert },
  { name: 'Resource & Inventory', href: '/dashboard/resources', icon: Hospital },
  { name: 'Facility Performance', href: '/dashboard/facilities', icon: Activity },
  { name: 'ASHA Worker Portal', href: '/dashboard/asha', icon: User },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Admin', href: '/dashboard/admin', icon: Settings },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col shadow-xl z-20 text-slate-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Toggle Button */}
        <div className="h-10 flex items-center justify-end px-2 border-b border-slate-700 bg-slate-900 shrink-0">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 text-sm transition-colors group relative border-l-4",
                  isActive 
                    ? "bg-[#2A4365] text-white border-blue-400 font-semibold" 
                    : "border-transparent hover:bg-slate-700 hover:text-white font-medium"
                )}
                title={isCollapsed ? item.name.replace('\n', ' ') : undefined}
              >
                <item.icon className={cn(
                  "h-5 w-5 shrink-0",
                  isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-300"
                )} />
                {!isCollapsed && (
                  <span className="ml-3 truncate whitespace-pre-line leading-tight">
                    {item.name}
                    {isActive && <span className="ml-1 text-xs text-blue-300">(Active)</span>}
                  </span>
                )}
                {!isCollapsed && isActive && (
                  <ChevronRight className="h-4 w-4 absolute right-3 text-blue-400 opacity-50" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-900">
          {!isCollapsed ? (
            <div className="flex items-center space-x-3">
              <Database className="h-4 w-4 text-emerald-500" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-emerald-500">SYSTEM ONLINE</span>
                <span className="text-[10px] text-slate-400">v3.2.1 • SMC Server</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Global Header (Dark Blue) */}
        <header className="h-16 bg-[#1e3a8a] border-b border-[#172554] flex items-center justify-between px-6 shrink-0 shadow-md z-10 text-white">
          <div className="flex flex-col justify-center">
            <h1 className="text-[10px] md:text-xs font-bold tracking-wider text-blue-200 uppercase leading-none mb-1">
              GOVERNMENT OF MAHARASHTRA, SOLAPUR MUNICIPAL CORPORATION (SMC)
            </h1>
            <h2 className="text-sm md:text-base font-bold tracking-tight leading-none">
              INTEGRATED HEALTH INFORMATION PLATFORM (IHIP)
            </h2>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Search Bar */}
            <div className="hidden md:flex relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
              <Input 
                type="text" 
                placeholder="Search" 
                className="h-8 w-64 bg-white/10 border-white/20 text-white placeholder:text-white/50 pl-9 rounded-sm focus-visible:ring-1 focus-visible:ring-white/50 text-sm"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative text-blue-200 hover:text-white cursor-pointer transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 text-[9px] font-bold flex items-center justify-center rounded-full border border-[#1e3a8a]">
                  7
                </span>
              </div>
              
              <div className="h-8 w-px bg-white/20" />
              
              {/* User Profile Summary */}
              <div className="flex items-center space-x-3">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-semibold">Welcome, Dr. A. K. Singh</span>
                  <span className="text-[10px] text-blue-200">(DMO, Solapur)</span>
                </div>
                <div className="h-8 w-8 rounded-sm bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                  <User className="h-5 w-5 text-blue-200" />
                </div>
                <LogOut className="h-4 w-4 text-blue-200 hover:text-white cursor-pointer ml-1" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-auto bg-slate-100">
          <div className="p-4 md:p-6 mx-auto h-full flex flex-col">
            {children}
            <DashboardToaster />
          </div>
        </main>
      </div>
    </div>
  );
}