import { useState, useEffect } from 'react';
import { useAuthStore } from '../store.js';
import { 
  Bell, 
  Search, 
  Trash2, 
  CheckCircle, 
  Mail, 
  MailOpen,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { api } from '../api.js';

export default function Notifications() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      const data = await api.getNotifications(user.id);
      setNotifications(data);
    };
    fetchNotifications();
  }, [user]);

  const handleToggleRead = async (id, currentStatus) => {
    await api.toggleNotificationRead(id, !currentStatus);
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: !currentStatus } : n));
  };

  const handleDelete = async (id) => {
    await api.deleteNotification(id);
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         n.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !n.isRead) || 
                         (filter === 'read' && n.isRead);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-neon-blue font-bold mb-2">Neural Communications</h2>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter">Inbox</h1>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="glass-panel px-4 py-2 flex items-center gap-2 flex-1 sm:flex-none justify-center">
            <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
            <span className="text-xs font-bold text-neon-blue uppercase tracking-widest">
              {notifications.filter(n => !n.isRead).length} UNREAD
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
          <input 
            type="text" 
            placeholder="Search communications..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 lg:py-4 text-sm focus:outline-none focus:border-neon-blue transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          {['all', 'unread', 'read'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap ${
                filter === f 
                  ? 'bg-neon-blue/10 border-neon-blue text-neon-blue' 
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-panel p-6 flex gap-6 group transition-all duration-300 ${!n.isRead ? 'border-l-4 border-l-neon-blue bg-neon-blue/5' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-colors ${!n.isRead ? 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue' : 'bg-white/5 border-white/10 text-white/20'}`}>
                    {n.isRead ? <MailOpen size={24} /> : <Mail size={24} />}
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className={`font-bold transition-colors ${!n.isRead ? 'text-white' : 'text-white/60'}`}>
                      {n.title}
                    </h3>
                    <span className="text-[10px] text-white/20 uppercase font-mono">
                      {format(new Date(n.createdAt), 'MMM dd, HH:mm')}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed transition-colors ${!n.isRead ? 'text-white/80' : 'text-white/40'}`}>
                    {n.message}
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                      n.type === 'system' ? 'text-neon-purple border-neon-purple/20 bg-neon-purple/10' : 'text-neon-blue border-neon-blue/20 bg-neon-blue/10'
                    }`}>
                      {n.type}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleToggleRead(n.id, n.isRead)}
                    className={`p-2 rounded-lg bg-white/5 border border-white/10 transition-all ${n.isRead ? 'text-white/20 hover:text-neon-blue' : 'text-neon-blue hover:text-white/60'}`}
                    title={n.isRead ? "Mark as unread" : "Mark as read"}
                  >
                    {n.isRead ? <Mail size={18} /> : <CheckCircle size={18} />}
                  </button>
                  <button 
                    onClick={() => handleDelete(n.id)}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/30 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="glass-panel p-20 text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                <Mail className="text-white/10 w-8 h-8" />
              </div>
              <p className="text-white/20 italic uppercase tracking-widest text-xs">
                No neural transmissions found in this sector.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
