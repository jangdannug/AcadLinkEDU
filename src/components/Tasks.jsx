import { useState, useEffect } from 'react';
import { useAuthStore } from '../store.js';
import { 
  CheckCircle2, 
  Clock, 
  FileText, 
  Upload, 
  AlertCircle,
  Plus,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isAfter, parseISO } from 'date-fns';
import { api } from '../api.js';

export default function Tasks() {
  const { user } = useAuthStore();
  const [activities, setActivities] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const [filter, setFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [uploadFiles, setUploadFiles] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const [allActivities, allSubmissions, allClasses] = await Promise.all([
        api.getActivities(),
        api.getSubmissions(user.id),
        api.getClasses(user.id),
      ]);

      let filteredActivities = [];
      if (user?.role === 'student') {
        const myClasses = allClasses.filter(c => c.isEnrolled);
        const myClassIds = myClasses.map(c => c.id);
        filteredActivities = allActivities.filter(a => myClassIds.includes(a.classId));
      } else if (user?.role === 'teacher') {
        const myClassIds = allClasses.filter(c => c.teacherId === user.id).map(c => c.id);
        filteredActivities = allActivities.filter(a => myClassIds.includes(a.classId));
      }

      setActivities(filteredActivities);
      setSubmissions(allSubmissions);
    };
    fetchData();
  }, [user]);

  const getStatus = (activityId) => {
    const sub = submissions.find(s => s.activityId === activityId && s.studentId === user.id);
    return sub ? 'finished' : 'ongoing';
  };

  const isExpired = (deadline) => {
    return isAfter(new Date(), parseISO(deadline));
  };

  const filteredActivities = activities.filter(a => {
    const status = getStatus(a.id);
    const expired = isExpired(a.deadline);
    if (filter === 'all') return true;
    if (filter === 'completed') return status === 'finished';
    if (filter === 'pending') return status === 'ongoing' && !expired;
    if (filter === 'expired') return status === 'ongoing' && expired;
    return true;
  });

 const handleFileUpload = async (activityId) => {
  if (!user) return;

  try {
    const formData = new FormData();

    // append files
    Object.entries(uploadFiles).forEach(([type, file]) => {
      if (file) formData.append(type, file);
    });

    // append metadata
    formData.append("activityId", activityId);
    formData.append("studentId", user.id);

    const response = await api.createSubmission({
  activityId: selectedTask.id,
  studentId: user.id,
  files: uploadFiles, // the object from <input type="file">
});

if (!response) throw new Error("Upload failed");

    alert("Neural uplink successful. Data packets transmitted to academic sector.");
    setSelectedTask(null);
    setUploadFiles({});

    // refresh submissions
    const allSubmissions = await api.getSubmissions(user.id);
    setSubmissions(allSubmissions);
  } catch (err) {
    const message = err.response?.data?.message || "Failed to upload submission";
    const { useUIStore } = await import("../store.js");
    useUIStore.getState().showNotification(message, "error", 8000);
  }
};

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-neon-blue font-bold mb-2">Mission Log</h2>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tighter">Activities</h1>
        </div>
      </header>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-4 border-b border-white/5 scrollbar-hide">
        {['all', 'pending', 'completed', 'expired'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all whitespace-nowrap border ${
              filter === f ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/20' : 'text-white/40 border-transparent hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredActivities.map((activity, i) => {
          const status = getStatus(activity.id);
          const expired = isExpired(activity.deadline);
          
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedTask(activity)}
              className={`glass-panel p-6 flex flex-col md:flex-row items-center gap-6 border-l-4 cursor-pointer hover:neon-border transition-all ${
                status === 'finished' ? 'border-l-emerald-500' : expired ? 'border-l-red-500' : 'border-l-neon-blue'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold tracking-tight">{activity.title}</h3>
                  {status === 'finished' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 uppercase">
                      <CheckCircle2 size={12} />
                      Completed
                    </span>
                  ) : expired ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 uppercase">
                      <AlertCircle size={12} />
                      Expired
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-neon-blue bg-neon-blue/10 px-2 py-1 rounded border border-neon-blue/20 uppercase">
                      <Clock size={12} />
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/50 mb-4 line-clamp-1">{activity.description}</p>
                <div className="flex items-center gap-6 text-[10px] text-white/30 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <Clock size={12} />
                    <span>Deadline: {format(parseISO(activity.deadline), 'MMM dd, HH:mm')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText size={12} />
                    <span>Files: {activity.requiredFiles?.length || 0} Required</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="cyber-button text-xs flex items-center gap-2">
                  <ExternalLink size={14} />
                  VIEW DETAILS
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel p-8 w-full max-w-2xl neon-border relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-blue animate-pulse" />
              
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-bold tracking-tighter mb-2">{selectedTask.title}</h2>
                  <div className="flex items-center gap-4 text-[10px] text-white/40 uppercase tracking-[0.2em]">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Deadline: {format(parseISO(selectedTask.deadline), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white"
                >
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-neon-blue mb-3">Mission Parameters</h4>
                  <p className="text-white/70 leading-relaxed">{selectedTask.description}</p>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-neon-blue mb-4">Required Data Uplink</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTask.requiredFiles?.map((type) => (
                      <div key={type} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:border-neon-blue/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-neon-blue/10 rounded-lg">
                            <FileText size={16} className="text-neon-blue" />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest">{type} Document</span>
                        </div>
                        <label className="cursor-pointer p-2 hover:bg-neon-blue/10 rounded-lg transition-colors text-white/40 hover:text-neon-blue">
                          <Upload size={16} />
                          <input 
                            type="file" 
                            className="hidden" 
                            onChange={(e) => setUploadFiles(prev => ({ ...prev, [type]: e.target.files?.[0] || null }))}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                  {Object.keys(uploadFiles).length > 0 && (
                    <div className="mt-4 p-4 bg-neon-blue/5 border border-neon-blue/20 rounded-xl">
                      <h5 className="text-[10px] font-bold text-neon-blue uppercase mb-2">Staged for Uplink:</h5>
                      <div className="space-y-1">
                        {Object.entries(uploadFiles).map(([type, file]) => file && (
                          <div key={type} className="text-[10px] text-white/60 flex justify-between">
                            <span>{type.toUpperCase()}: {file.name}</span>
                            <span>{(file.size / 1024).toFixed(1)} KB</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-white/5 flex gap-4">
                  <button 
                    onClick={() => setSelectedTask(null)}
                    className="flex-1 px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest"
                  >
                    RETURN TO LOG
                  </button>
                  <button 
                    onClick={() => handleFileUpload(selectedTask.id)}
                    disabled={Object.keys(uploadFiles).length === 0 || isExpired(selectedTask.deadline)}
                    className={`flex-1 cyber-button ${Object.keys(uploadFiles).length === 0 || isExpired(selectedTask.deadline) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    INITIATE UPLINK
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
