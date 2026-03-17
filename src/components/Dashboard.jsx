import { useState, useEffect } from 'react';
import { useAuthStore } from '../store.js';
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  ArrowUpRight,
  TrendingUp,
  Activity as ActivityIcon,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../api.js';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [stats, setStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const fetchDashboardData = async () => {
      const [allClasses, allActivities] = await Promise.all([
        api.getClasses(user.role === 'student' ? user.id : null),
        api.getActivities()
      ]);

      const classIds = allClasses.map(c => c.id);
      setRecentActivities(allActivities.filter(a => classIds.includes(a.classId)).slice(0, 5));

      if (user.role === 'student') {
        const enrolled = allClasses.filter(c => c.isEnrolled);
        const totalMissions = enrolled.reduce((acc, c) => acc + (c.stats?.total || 0), 0);
        const completedMissions = enrolled.reduce((acc, c) => acc + (c.stats?.submitted || 0), 0);
        
        setStats([
          { label: 'Active Sectors', value: enrolled.length, icon: BookOpen, color: 'text-blue-400' },
          { label: 'Total Missions', value: totalMissions, icon: Zap, color: 'text-purple-400' },
          { label: 'Completed', value: completedMissions, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Pending', value: totalMissions - completedMissions, icon: Clock, color: 'text-orange-400' },
        ]);
      } else if (user.role === 'teacher') {
        const teacherClasses = allClasses.filter(c => c.teacherId === user.id);
        const analytics = await api.getAnalytics(user.id);
        
        setStats([
          { label: 'Managed Sectors', value: teacherClasses.length, icon: BookOpen, color: 'text-blue-400' },
          { label: 'Total Students', value: analytics.totalStudents, icon: Users, color: 'text-purple-400' },
          { label: 'Submissions', value: analytics.totalSubmissions, icon: ActivityIcon, color: 'text-emerald-400' },
          { label: 'Completion', value: `${analytics.completionRate}%`, icon: TrendingUp, color: 'text-orange-400' },
        ]);
      } else {
        const allUsers = await api.getUsers();
        setStats([
          { label: 'Total Identities', value: allUsers.length, icon: Users, color: 'text-blue-400' },
          { label: 'Active Sectors', value: allClasses.length, icon: BookOpen, color: 'text-purple-400' },
          { label: 'Pending Auth', value: allUsers.filter(u => !u.isVerified).length, icon: ShieldAlert, color: 'text-orange-400' },
          { label: 'System Health', value: '98.4%', icon: ActivityIcon, color: 'text-emerald-400' },
        ]);
      }
    };

    fetchDashboardData();
  }, [user]);

  const handleJoin = async () => {
    if (!user?.isVerified) return;
    try {
      await api.joinClass(user.id, inviteCode);
      alert('Neural link established with class.');
      setShowJoinModal(false);
      setInviteCode('');
      window.location.reload();
    } catch (err) {
      alert(err.message || 'Invalid access code.');
    }
  };

  const handleCreate = async () => {
    if (!user?.isVerified) return;
    await api.createClass({ name: newClassName, teacherId: user.id, description: 'New academic frontier.' });
    alert('Class sector initialized.');
    setShowCreateModal(false);
    setNewClassName('');
    window.location.reload();
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-neon-blue font-bold mb-2">System Overview</h2>
          <h1 className="text-4xl font-bold tracking-tighter">Welcome back, <span className="neon-text">{user?.name.split(' ')[0]}</span></h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/40 font-mono uppercase">Neural Sync Status</p>
          <div className="flex items-center gap-2 justify-end">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-sm font-bold text-emerald-500">OPTIMAL</span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-6 group hover:neon-border transition-all duration-500"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <ArrowUpRight size={16} className="text-white/20 group-hover:text-neon-blue transition-colors" />
            </div>
            <p className="text-2xl lg:text-3xl font-bold tracking-tighter mb-1">{stat.value}</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ActivityIcon size={20} className="text-neon-blue" />
              Recent Activity
            </h3>
            <button className="text-xs text-neon-blue hover:underline uppercase tracking-widest">View Archives</button>
          </div>
          
          <div className="space-y-4">
            {recentActivities.length === 0 && (
              <div className="p-12 text-center text-white/20 italic">
                No recent activity detected.
              </div>
            )}
            {recentActivities.map((activity, i) => (
              <div key={activity.id} className="glass-panel p-4 flex items-center gap-4 border-l-4 border-l-neon-blue/30">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neon-blue border border-white/10">
                  <TrendingUp size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New mission deployed: {activity.title}</p>
                  <p className="text-[10px] text-white/30 uppercase mt-1">Recently • Automated Notification</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions / Status */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold">{isAdmin ? 'Authority Status' : 'Quick Access'}</h3>
          <div className="glass-panel p-6 space-y-4">
            {isAdmin ? (
              <div className="space-y-4">
                <div className="p-4 bg-neon-purple/10 border border-neon-purple/20 rounded-xl text-center">
                  <p className="text-xs text-neon-purple font-bold uppercase tracking-widest">Admin Console Active</p>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">
                  As a Central Authority, you have full control over neural identities and sector verifications. Use the User Management console to authorize new members.
                </p>
              </div>
            ) : (
              <>
                {user?.role === 'teacher' && (
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    disabled={!user.isVerified}
                    className={`w-full cyber-button text-sm py-3 ${!user.isVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {user.isVerified ? 'CREATE NEW CLASS' : 'AWAITING VERIFICATION'}
                  </button>
                )}
                
                {user?.role === 'student' && (
                  <button 
                    onClick={() => setShowJoinModal(true)}
                    disabled={!user.isVerified}
                    className={`w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg py-3 text-sm font-bold transition-colors ${!user.isVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {user.isVerified ? 'JOIN VIA CODE' : 'AWAITING VERIFICATION'}
                  </button>
                )}
              </>
            )}
            
            <div className="pt-6 border-t border-white/5">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-4">System Health</p>
              <div className="space-y-3">
                {[
                  { label: 'Database Sync', status: '100%' },
                  { label: 'Neural Uplink', status: 'Active' },
                  { label: 'Storage Matrix', status: '82%' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-xs text-white/60">{item.label}</span>
                    <span className="text-xs font-mono text-neon-blue">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {(showCreateModal || showJoinModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 w-full max-w-md neon-border"
          >
            <h2 className="text-2xl font-bold mb-6 neon-text">
              {showCreateModal ? 'Initialize New Class' : 'Enter Access Code'}
            </h2>
            
            <div className="space-y-4">
              {showCreateModal ? (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Class Designation</label>
                  <input 
                    type="text" 
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue"
                    placeholder="e.g. Quantum Mechanics"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Invite Code</label>
                  <input 
                    type="text" 
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue font-mono uppercase"
                    placeholder="XXXXXX"
                  />
                </div>
              )}
              
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => { setShowCreateModal(false); setShowJoinModal(false); }}
                  className="flex-1 px-6 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
                >
                  CANCEL
                </button>
                <button 
                  onClick={showCreateModal ? handleCreate : handleJoin}
                  className="flex-1 cyber-button"
                >
                  CONFIRM
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
