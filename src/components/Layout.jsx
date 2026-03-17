import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import { Bell, Search, Menu, X } from 'lucide-react';
import { cn } from '../utils.js';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-cyber-black">
      <div className="scanline" />
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-4 lg:px-8 z-10 border-b border-white/5">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-white/60 hover:text-neon-blue lg:hidden transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="relative w-40 sm:w-64 lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input 
                type="text" 
                placeholder="Search neural network..." 
                className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-neon-blue/50 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-6">
            <button className="relative p-2 text-white/40 hover:text-neon-blue transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-neon-blue rounded-full shadow-[0_0_8px_rgba(0,243,255,0.8)]" />
            </button>
            <div className="hidden sm:block h-8 w-[1px] bg-white/5" />
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-white/40 uppercase tracking-widest">System Time</p>
                <p className="text-xs font-mono text-neon-blue">2026.03.17_13:44</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 pt-4 lg:pt-0 scrollbar-hide">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
