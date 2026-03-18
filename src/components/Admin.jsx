import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  Search,
  CheckSquare,
  Square,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api.js';



export default function Admin() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);

  const fetchUsers = async () => {
  const data = await api.getUsers();
  setUsers(data);
};

  useEffect(() => {
  fetchUsers();
}, []);

  const handleVerify = async (userId) => {
    const data = await api.verifyUser(userId);
    if (data) {
      setUsers(prev =>
        prev.map(u =>
          u.id === userId ? { ...u, isVerified: true } : u
        )
      );
    }
  };

  const handleBatchVerify = async () => {
    const data = await api.batchVerifyUsers(selectedUsers);
    if (data.success) {
      setUsers(prev =>
        prev.map(u =>
          selectedUsers.includes(u.id)
            ? { ...u, isVerified: true }
            : u
        )
      );
      setSelectedUsers([]);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to terminate this neural identity?')) return;

    const data = await api.deleteUser(userId);

    if (data.success || data === undefined) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleRevoke = async (userId) => {
    const data = await api.revokeUser(userId);
    if (data?.success || data === undefined) {
      setUsers(prev =>
        prev.map(u =>
          u.id === userId ? { ...u, isVerified: false } : u
        )
      );
    }
    await fetchUsers();
  };

  const toggleSelect = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-neon-blue font-bold mb-2">Central Authority</h2>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter">User Management</h1>
        </div>
        <AnimatePresence>
          {selectedUsers.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex gap-4 w-full sm:w-auto"
            >
              <button 
                onClick={handleBatchVerify}
                className="cyber-button flex-1 sm:flex-none flex items-center justify-center gap-2 bg-neon-blue/20"
              >
                <UserCheck size={18} />
                <span className="text-xs">VERIFY SELECTED ({selectedUsers.length})</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
          <input 
            type="text" 
            placeholder="Search neural identities..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 lg:py-4 text-sm focus:outline-none focus:border-neon-blue transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
          {['all', 'student', 'teacher', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border whitespace-nowrap ${
                roleFilter === role 
                  ? 'bg-neon-blue/10 border-neon-blue text-neon-blue' 
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
              }`}
            >
              {role}s
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 w-12">
                  <button onClick={toggleSelectAll} className="text-white/20 hover:text-neon-blue transition-colors">
                    {selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Identity</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Sector (Role)</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-white/40 font-bold text-right">Authorization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
            {filteredUsers.map((user, i) => (
              <motion.tr 
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`hover:bg-white/2 transition-colors group ${selectedUsers.includes(user.id) ? 'bg-neon-blue/5' : ''}`}
              >
                <td className="px-6 py-4">
                  <button 
                    onClick={() => toggleSelect(user.id)}
                    className={`transition-colors ${selectedUsers.includes(user.id) ? 'text-neon-blue' : 'text-white/10 group-hover:text-white/30'}`}
                  >
                    {selectedUsers.includes(user.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold border border-white/10">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{user.name}</p>
                      <p className="text-xs text-white/30">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${
                    user.role === 'admin' ? 'text-neon-purple border-neon-purple/20 bg-neon-purple/10' :
                    user.role === 'teacher' ? 'text-neon-blue border-neon-blue/20 bg-neon-blue/10' :
                    'text-white/40 border-white/10 bg-white/5'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.isVerified ? (
                    <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase">
                      <ShieldCheck size={14} />
                      Verified
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-500 text-xs font-bold uppercase">
                      <ShieldAlert size={14} />
                      Pending
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-4">
                    {!user.isVerified && (
                      <button 
                        onClick={() => handleVerify(user.id)}
                        className="text-xs font-bold text-neon-blue hover:underline uppercase tracking-widest"
                      >
                        Authorize
                      </button>
                    )}
                    {user.isVerified && user.role !== 'admin' && (
                      <button 
                        onClick={() => handleRevoke(user.id)}
                        className="text-xs font-bold text-yellow-500 hover:underline uppercase tracking-widest"
                      >
                        Revoke
                      </button>
                    )}
                    {user.role !== 'admin' && (
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="text-xs font-bold text-red-400/50 hover:text-red-400 hover:underline uppercase tracking-widest"
                      >
                        Terminate
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center text-white/20 italic">
            No matching neural identities found in the database.
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
