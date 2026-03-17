import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store.js';
import { 
  LayoutDashboard, 
  BookOpen, 
  CheckSquare, 
  Users, 
  LogOut, 
  Bell,
  Cpu,
  X
} from 'lucide-react';
import { cn } from '../utils.js';

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuthStore();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ icon: Users, label: 'User Management', path: '/admin' });
  } else if (user?.role === 'teacher') {
    menuItems.push(
      { icon: BookOpen, label: 'Classes', path: '/classes' }
    );
  } else {
    menuItems.push(
      { icon: BookOpen, label: 'Classes', path: '/classes' },
      { icon: CheckSquare, label: 'Tasks', path: '/tasks' }
    );
  }

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
  };

  return (
    <aside className="w-64 h-full glass-panel lg:m-4 lg:mr-0 flex flex-col border-r-0 lg:rounded-r-none rounded-none lg:rounded-2xl bg-cyber-black/95 lg:bg-white/5">
      <div className="p-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-neon-blue/10 rounded-lg flex items-center justify-center border border-neon-blue/30">
            <Cpu className="text-neon-blue w-5 h-5" />
          </div>
          <span className="font-bold tracking-tighter text-lg neon-text">AcadLinkEdu</span>
        </div>
        <button 
          onClick={onClose}
          className="p-2 text-white/40 hover:text-white lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
              isActive 
                ? "bg-neon-blue/10 text-neon-blue border border-neon-blue/20" 
                : "text-white/50 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon size={20} className={cn("transition-transform group-hover:scale-110")} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="bg-white/5 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple p-[1px]">
              <div className="w-full h-full rounded-full bg-cyber-black flex items-center justify-center text-xs font-bold">
                {user?.name.charAt(0)}
              </div>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user?.name}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">{user?.role}</p>
            </div>
          </div>
          {!user?.isVerified && user?.role === 'teacher' && (
            <div className="text-[9px] text-yellow-500/80 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 text-center animate-pulse">
              PENDING VERIFICATION
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Disconnect</span>
        </button>
      </div>
    </aside>
  );
}
