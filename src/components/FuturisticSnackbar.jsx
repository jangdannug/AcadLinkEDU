import React, { useEffect } from 'react';
import { useUIStore } from '../store.js';

export default function FuturisticSnackbar() {
  const notification = useUIStore((s) => s.notification);
  const clear = useUIStore((s) => s.clearNotification);

  useEffect(() => {
    if (!notification) return;
    // auto-clear handled by store, but keep accessible
    return () => {};
  }, [notification]);

  if (!notification) return null;

  const { message, type } = notification;

  const color = type === 'error' ? 'bg-neon-red text-white' : 'bg-neon-blue text-white';

  return (
    <div style={{ position: 'fixed', zIndex: 9999, right: 24, top: 24 }}>
      <div className={`backdrop-blur-md ${color} rounded-2xl px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-white/10`}>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-white/30 animate-pulse" />
          <div className="text-sm font-mono">{message}</div>
          <button onClick={clear} className="ml-3 text-xs text-white/30 hover:text-white/70">DISMISS</button>
        </div>
      </div>
    </div>
  );
}
