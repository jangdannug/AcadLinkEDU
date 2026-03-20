import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store.js';
import { 
  Plus, 
  Search, 
  Users, 
  ExternalLink, 
  MoreVertical,
  Code,
  BookOpen,
  Lock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../api.js';

export default function Classes() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newClassDescription, setNewClassDescription] = useState('New academic frontier.');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allClasses = await api.getClasses(user?.role === 'student' ? user.id : null);
        const allUsers = await api.getUsers();
        // Map teacherId → teacherName
        const classesWithTeachers = allClasses.map(c => {
          const teacher = allUsers.find(u => u.id === c.teacherId && u.role === 'teacher');
          return {
            ...c,
            teacherName: teacher ? teacher.name : "Unknown Authority",
            teacherEmail: teacher ? teacher.email : null
          };
        });

        // If current user is a teacher, show only their classes
        const finalClasses = user?.role === 'teacher'
          ? classesWithTeachers.filter(c => c.teacherId === user.id)
          : classesWithTeachers;

        setClasses(finalClasses);
        setUsers(allUsers);
      } catch (err) {
        console.error('Failed to fetch classes or users:', err);
      }
    };

    fetchData();
  }, [user]);

  // Filter classes by search query
  const filteredClasses = classes.filter(c => 
    c.name?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
    (c.description?.toLowerCase().includes(searchQuery?.toLowerCase()))
  );

  // Group classes by teacher
  const groupedClasses = filteredClasses.reduce((acc, cls) => {
    const teacher = cls.teacherName;
    if (!acc[teacher]) acc[teacher] = [];
    acc[teacher].push(cls);
    return acc;
  }, {});

  // Join class
const handleJoin = async () => {
  if (!user?.isVerified) return;

  const { useUIStore } = await import("../store.js");

  try {
    await api.joinClass(user.id, inviteCode);

    useUIStore.getState().showNotification(
      "Neural link established with class.",
      "success",
      4000
    );

    setShowJoinModal(false);

    // Refresh classes
    const refreshedClasses = await api.getClasses(user.id);
    setClasses(refreshedClasses);

  } catch (err) {
    useUIStore.getState().showNotification(
      err.message || "Invalid access code.",
      "error",
      8000
    );
  }
};

  // Create class
 const handleCreate = async () => {
  if (!user?.isVerified) return;
  try {
    await api.createClass({ 
      name: newClassName, 
      teacherId: user.id, 
      description: newClassDescription,
    });

    // Close modal & reset inputs
    setShowCreateModal(false);
    setNewClassName('');
    setNewClassDescription('New academic frontier.');

    // Fetch latest classes from backend
    const refreshedClasses = await api.getClasses(user?.role === 'student' ? user.id : null);
    const classesWithTeachers = refreshedClasses.map(c => {
      const teacher = users.find(u => u.id === c.teacherId && u.role === 'teacher');
      return {
        ...c,
        teacherName: teacher ? teacher.name : "Unknown Authority",
        teacherEmail: teacher ? teacher.email : null
      };
    });

    const finalClasses = user?.role === 'teacher'
      ? classesWithTeachers.filter(c => c.teacherId === user.id)
      : classesWithTeachers;

    setClasses(finalClasses);

  } catch (err) {
    console.error('Failed to create class:', err);
    alert('Failed to create class.');
  }
};

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-neon-blue font-bold mb-2">Academic Matrix</h2>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter">Classes</h1>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          {user?.role === 'teacher' && (
            <button 
              onClick={() => setShowCreateModal(true)}
              disabled={!user.isVerified}
              className={`cyber-button flex-1 sm:flex-none flex items-center justify-center gap-2 ${!user.isVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Plus size={18} />
              <span className="text-xs">{user.isVerified ? 'INITIALIZE CLASS' : 'AWAITING VERIFICATION'}</span>
            </button>
          )}
          {user?.role === 'student' && (
            <button 
              onClick={() => setShowJoinModal(true)}
              disabled={!user.isVerified}
              className={`cyber-button flex-1 sm:flex-none flex items-center justify-center gap-2 ${!user.isVerified ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Code size={18} />
              <span className="text-xs">{user.isVerified ? 'JOIN CLASS' : 'AWAITING VERIFICATION'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Verification notice */}
      {!user?.isVerified && user?.role !== 'admin' && (
        <div className="glass-panel p-4 lg:p-6 border-yellow-500/30 bg-yellow-500/5 flex items-center gap-4">
          <Lock className="text-yellow-500 flex-shrink-0" size={24} />
          <div>
            <p className="text-yellow-500 font-bold uppercase tracking-widest text-[10px] sm:text-sm">Verification Required</p>
            <p className="text-[10px] sm:text-xs text-white/60">Your neural signature is pending administrator authorization. Access to academic sectors is restricted.</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
        <input 
          type="text" 
          placeholder="Search academic sectors..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 lg:py-4 text-sm focus:outline-none focus:border-neon-blue transition-all"
        />
      </div>

      {/* Classes Grid */}
      <div className="space-y-12">
        {Object.entries(groupedClasses).map(([teacher, teacherClasses]) => (
          <div key={teacher} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/5" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 text-center">
                Teacher: <span className="text-white/60">{teacher}</span>
              </h3>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {teacherClasses.map((cls, i) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-panel overflow-hidden group hover:neon-border transition-all duration-500 flex flex-col"
                >
                  <div className="h-32 bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                    <div className="absolute top-4 right-4">
                      <button className="p-2 bg-black/40 rounded-lg text-white/60 hover:text-white transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold tracking-tight group-hover:text-neon-blue transition-colors">{cls.name}</h3>
                        <p className="text-[10px] font-mono text-neon-blue/60 mt-1">CODE: {cls.inviteCode || 'N/A'}</p>
                      </div>
                      <div className="p-2 bg-neon-blue/10 rounded-lg border border-neon-blue/20">
                        <BookOpen size={16} className="text-neon-blue" />
                      </div>
                    </div>
                    
                    <p className="text-sm text-white/50 mb-6 line-clamp-2">{cls.description}</p>
                    
                    {cls.stats && (
                      <div className="grid grid-cols-3 gap-2 mb-6">
                        <div className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                          <p className="text-[10px] text-white/30 uppercase mb-1">Total</p>
                          <p className="text-sm font-bold">{cls.stats.total}</p>
                        </div>
                        <div className="bg-emerald-500/5 rounded-lg p-2 text-center border border-emerald-500/10">
                          <p className="text-[10px] text-emerald-500/40 uppercase mb-1">Done</p>
                          <p className="text-sm font-bold text-emerald-500">{cls.stats.submitted}</p>
                        </div>
                        <div className="bg-orange-500/5 rounded-lg p-2 text-center border border-orange-500/10">
                          <p className="text-[10px] text-orange-500/40 uppercase mb-1">Pending</p>
                          <p className="text-sm font-bold text-orange-500">{cls.stats.pending}</p>
                        </div>
                      </div>
                    )}

                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-widest">
                        <Users size={14} />
                        <span>Sector Members</span>
                      </div>
                      {user?.role === 'student' && !cls.isEnrolled ? (
                        <button 
                          onClick={() => { setInviteCode(cls.inviteCode); setShowJoinModal(true); }}
                          className="flex items-center gap-2 text-xs font-bold text-neon-purple hover:underline"
                        >
                          JOIN SECTOR
                          <ExternalLink size={14} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => navigate(`/classes/${cls.id}`)}
                          className="flex items-center gap-2 text-xs font-bold text-neon-blue hover:underline"
                        >
                          ENTER SECTOR
                          <ExternalLink size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
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
          <div className="space-y-4">
            {/* Class Name */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                Class Designation
              </label>
              <input 
                type="text" 
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue"
                placeholder="e.g. Quantum Mechanics"
              />
            </div>

            {/* Class Description */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                Class Description
              </label>
              <textarea
                value={newClassDescription}
                onChange={(e) => setNewClassDescription(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue"
                placeholder="Enter a brief description"
                rows={3}
              />
            </div>
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
        
        {/* Modal Actions */}
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