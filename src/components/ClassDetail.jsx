import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store.js';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Plus, 
  FileText, 
  Upload, 
  AlertCircle,
  ChevronLeft,
  User,
  BarChart3,
  Edit2,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isAfter, parseISO } from 'date-fns';
import { api } from '../api.js';

export default function ClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('activities');
  const [classData, setClassData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [newActivity, setNewActivity] = useState({ title: '', description: '', deadline: '', requiredFiles: [] });
  const [selectedActivityForUpload, setSelectedActivityForUpload] = useState(null);
  const [uploadFiles, setUploadFiles] = useState({});
  const [trackingData, setTrackingData] = useState([]);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedActivityForTracking, setSelectedActivityForTracking] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const fileTypes = ['pdf', 'excel', 'word', 'png', 'zip'];

  useEffect(() => {
    const fetchData = async () => {
      const [classes, allActivities, allUsers, allSubmissions, analyticsRes] = await Promise.all([
        api.getClasses(),
        api.getActivities(),
        api.getUsers(),
        api.getSubmissions(),
        user?.role === 'teacher' ? api.getAnalytics(user.id) : Promise.resolve(null)
      ]);

      const currentClass = classes.find(c => c.id === Number(classId));
      setClassData(currentClass);

      const classActivities = allActivities.filter(a => a.classId === classId);
      setActivities(classActivities);
      
      // For now, let's just mock the student list for the class
      const classStudents = allUsers.filter(u => u.role === 'student'); // Simplified for mock
      setStudents(classStudents);

      setSubmissions(allSubmissions);
      setAnalytics(analyticsRes);

      if (user?.role === 'teacher') {
        const trackRes = await api.getClassTracking(classId);
        setTrackingData(trackRes);
      }
    };
    fetchData();
  }, [classId, user]);

  const handleCreateActivity = async () => {
    let data;
    if (editingActivity) {
      data = await api.updateActivity(editingActivity.id, { ...newActivity, classId });
      setActivities(activities.map(a => a.id === data.id ? data : a));
    } else {
      data = await api.createActivity({ ...newActivity, classId });
      setActivities([...activities, data]);
    }
    
    setShowCreateModal(false);
    setEditingActivity(null);
    setNewActivity({ title: '', description: '', deadline: '', requiredFiles: [] });
    
    if (user?.role === 'teacher') {
      const trackRes = await api.getClassTracking(classId);
      setTrackingData(trackRes);
    }
  };

  const handleFileUpload = async (activityId) => {
    if (!user) return;
    
    await api.createSubmission({
      activityId,
      studentId: user.id,
      fileUrl: '#',
      fileName: Object.values(uploadFiles).map(f => f?.name).filter(Boolean).join(', ')
    });

    alert('Neural uplink successful. Data packets transmitted to academic sector.');
    setSelectedActivityForUpload(null);
    setUploadFiles({});
    
    const allSubmissions = await api.getSubmissions();
    setSubmissions(allSubmissions);
  };

  const openEditModal = (activity) => {
    setEditingActivity(activity);
    setNewActivity({
      title: activity.title,
      description: activity.description,
      deadline: activity.deadline.slice(0, 16), // Format for datetime-local
      requiredFiles: activity.requiredFiles || []
    });
    setShowCreateModal(true);
  };

  const toggleFileType = (type) => {
    setNewActivity(prev => ({
      ...prev,
      requiredFiles: prev.requiredFiles.includes(type)
        ? prev.requiredFiles.filter(t => t !== type)
        : [...prev.requiredFiles, type]
    }));
  };

  const getStudentProgress = (studentId) => {
    const studentSubmissions = submissions.filter(s => s.studentId === studentId);
    const completedCount = activities.filter(a => 
      studentSubmissions.some(s => s.activityId === a.id)
    ).length;
    return activities.length > 0 ? Math.round((completedCount / activities.length) * 100) : 0;
  };

  if (!classData) return <div className="flex items-center justify-center h-full text-neon-blue animate-pulse">SYNCING SECTOR DATA...</div>;
  if (!user?.isVerified && user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Lock className="text-yellow-500 w-16 h-16" />
        <h2 className="text-2xl font-bold neon-text">ACCESS RESTRICTED</h2>
        <p className="text-white/50 text-center max-w-md">Your neural signature is pending administrator authorization. Access to academic sectors is restricted until verification is complete.</p>
        <button onClick={() => navigate('/classes')} className="cyber-button">RETURN TO MATRIX</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4">
        <button 
          onClick={() => navigate('/classes')}
          className="flex items-center gap-2 text-xs text-white/40 hover:text-neon-blue transition-colors uppercase tracking-widest"
        >
          <ChevronLeft size={14} />
          Back to Matrix
        </button>
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-neon-blue font-bold mb-2">Class Sector: {classData.inviteCode}</h2>
            <h1 className="text-4xl font-bold tracking-tighter">{classData.name}</h1>
          </div>
          {user?.role === 'teacher' && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="cyber-button flex items-center gap-2"
            >
              <Plus size={18} />
              NEW MISSION
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-white/5">
        {[
          { id: 'activities', label: 'Missions', icon: CheckCircle2 },
          { id: 'students', label: 'Sector Members', icon: Users },
          { id: 'progress', label: 'Analytics', icon: BarChart3, hide: user?.role === 'student' },
        ].filter(t => !t.hide).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 text-xs uppercase tracking-widest font-bold transition-all relative ${
              activeTab === tab.id ? 'text-neon-blue' : 'text-white/40 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <tab.icon size={14} />
              {tab.label}
            </div>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-neon-blue shadow-[0_0_8px_rgba(0,243,255,0.8)]"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'activities' && (
          <motion.div
            key="activities"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {activities.length === 0 && (
              <div className="glass-panel p-12 text-center text-white/30 italic">
                No active missions detected in this sector.
              </div>
            )}
            {activities.map((activity, i) => {
              const sub = submissions.find(s => s.activityId === activity.id && s.studentId === user.id);
              const expired = isAfter(new Date(), parseISO(activity.deadline));
              
              return (
                <div key={activity.id} className="glass-panel p-6 flex items-center justify-between border-l-4 border-l-neon-blue">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1">{activity.title}</h3>
                    <p className="text-sm text-white/50 mb-4">{activity.description}</p>
                    <div className="flex items-center gap-6 text-[10px] text-white/30 uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <Clock size={12} />
                        <span>Deadline: {format(parseISO(activity.deadline), 'MMM dd, HH:mm')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText size={12} />
                        <span>Required: {activity.requiredFiles?.join(', ').toUpperCase() || 'NONE'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {user?.role === 'teacher' ? (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openEditModal(activity)}
                          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold flex items-center gap-2 text-neon-blue"
                        >
                          <Edit2 size={14} />
                          EDIT
                        </button>
                        <button 
                          onClick={() => { setSelectedActivityForTracking(activity); setShowTrackingModal(true); }}
                          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold flex items-center gap-2"
                        >
                          <BarChart3 size={14} />
                          TRACK
                        </button>
                      </div>
                    ) : (
                      <>
                        {sub ? (
                          <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center gap-2">
                            <CheckCircle2 size={14} />
                            SUBMITTED
                          </div>
                        ) : expired ? (
                          <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-2">
                            <AlertCircle size={14} />
                            EXPIRED
                          </div>
                        ) : (
                          <button 
                            onClick={() => setSelectedActivityForUpload(activity)}
                            className="cyber-button text-xs flex items-center gap-2"
                          >
                            <Upload size={14} />
                            UPLOAD
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {activeTab === 'students' && (
          <motion.div
            key="students"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {students.map((student) => (
              <div key={student.id} className="glass-panel p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-neon-blue border border-white/10">
                  <User size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-bold">{student.name}</p>
                  <p className="text-xs text-white/40">{student.email}</p>
                  {user?.role === 'teacher' && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] uppercase tracking-widest mb-1">
                        <span className="text-white/30">Progress</span>
                        <span className="text-neon-blue">{getStudentProgress(student.id)}%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${getStudentProgress(student.id)}%` }}
                          className="h-full bg-neon-blue shadow-[0_0_8px_rgba(0,243,255,0.5)]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'progress' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Missions', value: activities.length, icon: CheckCircle2, color: 'text-neon-blue' },
                { label: 'Active Students', value: students.length, icon: Users, color: 'text-neon-purple' },
                { label: 'Total Submissions', value: analytics?.totalSubmissions || 0, icon: Upload, color: 'text-emerald-500' },
                { label: 'Completion Rate', value: `${analytics?.completionRate || 0}%`, icon: BarChart3, color: 'text-orange-500' },
              ].map((stat, i) => (
                <div key={i} className="glass-panel p-6 border-white/5">
                  <div className="flex justify-between items-start mb-4">
                    <stat.icon className={`${stat.color} w-6 h-6`} />
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold tracking-tighter">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="glass-panel p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <BarChart3 className="text-neon-blue" size={20} />
                Sector Performance Matrix
              </h3>
              <div className="space-y-6">
                {students.map(student => (
                  <div key={student.id} className="space-y-2">
                    <div className="flex justify-between text-xs uppercase tracking-widest">
                      <span className="text-white/60">{student.name}</span>
                      <span className="text-neon-blue">{getStudentProgress(student.id)}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${getStudentProgress(student.id)}%` }}
                        className="h-full bg-gradient-to-r from-neon-blue to-neon-purple shadow-[0_0_10px_rgba(0,243,255,0.3)]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tracking Modal */}
      {showTrackingModal && selectedActivityForTracking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 w-full max-w-2xl neon-border max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold neon-text">Mission Tracking: {selectedActivityForTracking.title}</h2>
              <button onClick={() => setShowTrackingModal(false)} className="text-white/40 hover:text-white">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              {trackingData.map(data => {
                const status = data.activities.find(a => a.activityId === selectedActivityForTracking.id);
                return (
                  <div key={data.studentId} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <p className="font-bold">{data.studentName}</p>
                      <p className="text-xs text-white/40">{data.studentEmail}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {status?.status === 'submitted' ? (
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                            <CheckCircle2 size={12} />
                            SUBMITTED
                          </span>
                          <span className="text-[10px] text-white/30">{format(parseISO(status.submittedAt), 'MMM dd, HH:mm')}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1">
                          <Clock size={12} />
                          PENDING
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 w-full max-w-md neon-border"
          >
            <h2 className="text-2xl font-bold mb-6 neon-text">
              {editingActivity ? 'Modify Mission' : 'Initialize Mission'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Mission Objective</label>
                <input 
                  type="text" 
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue"
                  placeholder="e.g. Neural Uplink Test"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Description</label>
                <textarea 
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue min-h-[100px]"
                  placeholder="Describe the mission parameters..."
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Required File Types</label>
                <div className="flex flex-wrap gap-2">
                  {fileTypes.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleFileType(type)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${
                        newActivity.requiredFiles.includes(type)
                          ? 'bg-neon-blue/20 border-neon-blue text-neon-blue'
                          : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Deadline Timestamp</label>
                <input 
                  type="datetime-local" 
                  value={newActivity.deadline}
                  onChange={(e) => setNewActivity({ ...newActivity, deadline: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-neon-blue text-white"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => { setShowCreateModal(false); setEditingActivity(null); setNewActivity({ title: '', description: '', deadline: '', requiredFiles: [] }); }}
                  className="flex-1 px-6 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
                >
                  ABORT
                </button>
                <button 
                  onClick={handleCreateActivity}
                  className="flex-1 cyber-button"
                >
                  {editingActivity ? 'UPDATE' : 'DEPLOY'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Student Upload Modal */}
      <AnimatePresence>
        {selectedActivityForUpload && (
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
                  <h2 className="text-3xl font-bold tracking-tighter mb-2">{selectedActivityForUpload.title}</h2>
                  <div className="flex items-center gap-4 text-[10px] text-white/40 uppercase tracking-[0.2em]">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Deadline: {format(parseISO(selectedActivityForUpload.deadline), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedActivityForUpload(null)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40 hover:text-white"
                >
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-neon-blue mb-3">Mission Parameters</h4>
                  <p className="text-white/70 leading-relaxed">{selectedActivityForUpload.description}</p>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-neon-blue mb-4">Required Data Uplink</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedActivityForUpload.requiredFiles?.map((type) => (
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
                    onClick={() => setSelectedActivityForUpload(null)}
                    className="flex-1 px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest"
                  >
                    RETURN TO LOG
                  </button>
                  <button 
                    onClick={() => handleFileUpload(selectedActivityForUpload.id)}
                    disabled={Object.keys(uploadFiles).length === 0}
                    className={`flex-1 cyber-button ${Object.keys(uploadFiles).length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
