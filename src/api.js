import axios from 'axios';

// const API_BASE = 'https://localhost:7209';
const API_BASE = 'https://acadlinkedubackend.onrender.com';



// Mock Database State with LocalStorage Persistence
const getInitialData = (key, defaultValue) => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : defaultValue;
};

const saveData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};
let users = getInitialData('mock_users', []);

let classes = getInitialData('mock_classes', [
  { id: "c1", name: "Advanced Robotics", description: "Building the future with AI and hardware.", teacherId: "2", inviteCode: "ROBO2026" },
  { id: "c2", name: "Cybersecurity 101", description: "Protecting the digital frontier.", teacherId: "2", inviteCode: "SECURE26" },
  { id: "c5", name: "AI Ethics & Safety", description: "Navigating the moral landscape of artificial intelligence.", teacherId: "2", inviteCode: "ETHICS26" },
  { id: "c6", name: "Space Exploration Systems", description: "Engineering for the final frontier.", teacherId: "2", inviteCode: "SPACE2026" },
  { id: "c3", name: "Quantum Computing", description: "Exploring the subatomic processing power.", teacherId: "4", inviteCode: "QUANTUM" },
  { id: "c4", name: "Neural Networks", description: "Simulating the human brain in silicon.", teacherId: "4", inviteCode: "NEURAL" },
]);

let activities = getInitialData('mock_activities', [
  { id: "a1", classId: "c1", title: "Neural Link Design", description: "Design a basic neural interface for robotic control. Focus on signal-to-noise ratio and biocompatibility.", deadline: new Date(Date.now() + 86400000 * 3).toISOString(), requiredFiles: ["pdf", "png"] },
  { id: "a2", classId: "c1", title: "Kinematics Analysis", description: "Calculate joint velocities for a 6-DOF robotic arm using Denavit-Hartenberg parameters.", deadline: new Date(Date.now() - 86400000).toISOString(), requiredFiles: ["excel"] },
  { id: "a3", classId: "c2", title: "Encryption Protocol", description: "Implement a basic RSA encryption algorithm in Python.", deadline: new Date(Date.now() + 86400000 * 5).toISOString(), requiredFiles: ["pdf", "doc"] },
  { id: "a4", classId: "c3", title: "Qubit Superposition", description: "Simulate qubit states using Qiskit.", deadline: new Date(Date.now() + 86400000 * 2).toISOString(), requiredFiles: ["pdf"] },
  { id: "a5", classId: "c1", title: "Neural Link Calibration", description: "Calibrate the neural link for optimal data transmission.", deadline: new Date(Date.now() - 86400000).toISOString(), requiredFiles: ["pdf"] },
  { id: "a6", classId: "c4", title: "Bio-Digital Synthesis", description: "Synthesize bio-digital patterns for environmental monitoring.", deadline: new Date(Date.now() + 432000000).toISOString(), requiredFiles: ["pdf", "png"] },
]);

let enrollments = getInitialData('mock_enrollments', [
  { id: "e1", studentId: "3", classId: "c1" },
  { id: "e2", studentId: "3", classId: "c2" },
  { id: "e3", studentId: "3", classId: "c3" },
]);

let submissions = getInitialData('mock_submissions', [
  { id: "s1", activityId: "a1", studentId: "3", fileUrl: "#", fileName: "neural_design.pdf", submittedAt: new Date().toISOString(), status: "finished" },
  { id: "s2", activityId: "a3", studentId: "3", fileUrl: "#", fileName: "rsa_impl.py", submittedAt: new Date().toISOString(), status: "finished" },
]);

let notifications = getInitialData('mock_notifications', [
  { id: "n1", userId: "3", title: "System Update", message: "Neural link v2.0.26 deployed. Check your dashboard for new sector updates.", type: "system", createdAt: new Date().toISOString(), isRead: false },
  { id: "n2", userId: "3", title: "New Mission", message: "Advanced Robotics assignment 'Neural Link Design' has been posted.", type: "task", createdAt: new Date().toISOString(), isRead: true },
  { id: "n3", userId: "2", title: "New Enrollment", message: "Student John Doe has joined your 'Advanced Robotics' sector.", type: "system", createdAt: new Date().toISOString(), isRead: false },
  { id: "n4", userId: "2", title: "Submission Alert", message: "New submission received for 'Neural Link Design' from John Doe.", type: "task", createdAt: new Date().toISOString(), isRead: false },
]);

// Helper to simulate network delay
const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Auth
  login: async (email) => {
    try {
        const res = await axios.post(`${API_BASE}/api/Users/login`, { email });
        return { user: res.data };
    } catch (err) {
        // Grab the message property and also show snackbar notification
        const message = err.response?.data?.message || "Login failed";
        try {
          // dynamically import store to avoid circular imports at module load
          const { useUIStore } = await import('./store.js');
          useUIStore.getState().showNotification(message, 'error', 8000);
        } catch (e) {
          console.log('[api.login] failed to show snackbar', e && e.toString());
        }
        return { error: message };
    }
},
  
  register: async (data) => {
    await delay();
    const { email, name, role } = data;
    if (users.find(u => u.email === email)) throw new Error("Email already registered");
    const newUser = { id: (users.length + 1).toString(), email, name, role, isVerified: false };
    users.push(newUser);
    saveData('mock_users', users);
    return { user: newUser };
  },

  // Users
  getUsers: async () => {
    await delay();
    const url = `${API_BASE}/api/Users`;
    console.log('[api.getUsers] calling:', url);
    try {
      const res = await axios.get(url);
      console.log('[api.getUsers] response status:', res.status, 'data:', res.data);
      // Expecting the API to return an array of users
      if (Array.isArray(res.data)) {
        // update local cache for other mock operations
        users = res.data;
        saveData('mock_users', users);
        return users;
      }
      // If API returns a wrapper object, try to find users inside
      if (res.data && Array.isArray(res.data.users)) {
        users = res.data.users;
        saveData('mock_users', users);
        return users;
      }

      console.log('[api.getUsers] unexpected response shape, falling back to cached users');
      // fallback to local mock users
      return users;
    } catch (err) {
      console.log('[api.getUsers] failed to fetch users from API, falling back to mock data', url, err && err.toString());
      return users;
    }
  },
  
 verifyUser: async (userId) => {
    try {
      const res = await axios.put(`${API_BASE}/api/Users/${userId}/verify`);
      // The backend returns a DTO with Id, Email, Name, Role, IsVerified
      return res.data;
    } catch (err) {
      // Grab the backend error message if available
      const message = err.response?.data?.message || err.response?.data || "Verification failed";
      return { error: message };
    }
  },
   revokeUser: async (userId) => {
    try {
      const res = await axios.put(`${API_BASE}/api/Users/${userId}/revoke`);
      // The backend returns a DTO with Id, Email, Name, Role, IsVerified
      return res.data;
    } catch (err) {
      // Grab the backend error message if available
      const message = err.response?.data?.message || err.response?.data || "Revoke failed";
      return { error: message };
    }
  },
  
  batchVerifyUsers: async (userIds) => {
    await delay();
    users = users.map(u => userIds.includes(u.id) ? { ...u, isVerified: true } : u);
    saveData('mock_users', users);
    return { success: true };
  },
  
deleteUser: async (userId) => {
  try {
    await axios.delete(`${API_BASE}/api/Users/${userId}`);

    return { success: true }; // manually return success
  } catch (err) {
    const message = err.response?.data?.message || "Delete failed";
    return { error: message };
  }
},

  // Classes
  getClasses: async (studentId) => {
    await delay();
    return classes.map(c => {
      const teacher = users.find(u => u.id === c.teacherId);
      const classMissions = activities.filter(a => a.classId === c.id);
      
      let stats = null;
      if (studentId) {
        const studentSubmissions = submissions.filter(s => s.studentId === studentId);
        const submittedIds = studentSubmissions.map(s => s.activityId);
        const submittedCount = classMissions.filter(a => submittedIds.includes(a.id)).length;
        
        stats = {
          total: classMissions.length,
          submitted: submittedCount,
          pending: classMissions.length - submittedCount
        };
      }

      return {
        ...c,
        teacherName: teacher?.name || "Unknown Authority",
        isEnrolled: studentId ? enrollments.some(e => e.studentId === studentId && e.classId === c.id) : false,
        stats
      };
    });
  },
  
  createClass: async (data) => {
    await delay();
    const newClass = { 
      ...data, 
      id: `c${classes.length + 1}`, 
      inviteCode: Math.random().toString(36).substring(7).toUpperCase() 
    };
    classes.push(newClass);
    saveData('mock_classes', classes);
    return newClass;
  },

  // Activities
  getActivities: async (classId) => {
    await delay();
    if (classId) return activities.filter(a => a.classId === classId);
    return activities;
  },
  
  createActivity: async (data) => {
    await delay();
    const newActivity = { ...data, id: `a${activities.length + 1}` };
    activities.push(newActivity);
    saveData('mock_activities', activities);
    
    // Notify students
    const classStudents = enrollments.filter(e => e.classId === newActivity.classId);
    classStudents.forEach(s => {
      notifications.push({
        id: `n${notifications.length + 1}`,
        userId: s.studentId,
        title: "New Mission Deployed",
        message: `New activity: ${newActivity.title} in your class!`,
        type: "task",
        isRead: false,
        createdAt: new Date().toISOString()
      });
    });
    saveData('mock_notifications', notifications);
    
    return newActivity;
  },
  
  updateActivity: async (id, data) => {
    await delay();
    const index = activities.findIndex(a => a.id === id);
    if (index !== -1) {
      activities[index] = { ...activities[index], ...data };
      saveData('mock_activities', activities);
      return activities[index];
    }
    throw new Error("Activity not found");
  },

  // Enrollments
  joinClass: async (studentId, inviteCode) => {
    await delay();
    const targetClass = classes.find(c => c.inviteCode === inviteCode);
    if (targetClass) {
      const existing = enrollments.find(e => e.studentId === studentId && e.classId === targetClass.id);
      if (existing) throw new Error("Already joined");
      
      const newEnrollment = { id: `e${enrollments.length + 1}`, studentId, classId: targetClass.id };
      enrollments.push(newEnrollment);
      saveData('mock_enrollments', enrollments);
      return newEnrollment;
    }
    throw new Error("Invalid invite code");
  },

  // Analytics
  getAnalytics: async (teacherId) => {
    await delay();
    const teacherClasses = classes.filter(c => c.teacherId === teacherId);
    const classIds = teacherClasses.map(c => c.id);
    const classActivities = activities.filter(a => classIds.includes(a.classId));
    const activityIds = classActivities.map(a => a.id);
    const classSubmissions = submissions.filter(s => activityIds.includes(s.activityId));
    
    return {
      totalClasses: teacherClasses.length,
      totalStudents: enrollments.filter(e => classIds.includes(e.classId)).length,
      totalSubmissions: classSubmissions.length,
      completionRate: classActivities.length > 0 ? Math.round((classSubmissions.length / (classActivities.length * 10)) * 100) : 0
    };
  },

  // Tracking
  getClassTracking: async (classId) => {
    await delay();
    const classEnrollments = enrollments.filter(e => e.classId === classId);
    const classActivities = activities.filter(a => a.classId === classId);
    
    return classEnrollments.map(e => {
      const student = users.find(u => u.id === e.studentId);
      const studentSubmissions = submissions.filter(s => s.studentId === e.studentId);
      
      const activityStatuses = classActivities.map(a => {
        const submission = studentSubmissions.find(s => s.activityId === a.id);
        return {
          activityId: a.id,
          activityTitle: a.title,
          status: submission ? "submitted" : "pending",
          submittedAt: submission?.submittedAt || null
        };
      });

      return {
        studentId: student?.id,
        studentName: student?.name,
        studentEmail: student?.email,
        activities: activityStatuses
      };
    });
  },

  // Submissions
  getSubmissions: async (studentId) => {
    await delay();
    if (studentId) return submissions.filter(s => s.studentId === studentId);
    return submissions;
  },
  
  createSubmission: async (data) => {
    await delay();
    const newSubmission = { 
      ...data, 
      id: `s${submissions.length + 1}`, 
      submittedAt: new Date().toISOString(), 
      status: "finished" 
    };
    submissions.push(newSubmission);
    saveData('mock_submissions', submissions);
    return newSubmission;
  },

  // Notifications
  getNotifications: async (userId) => {
    await delay();
    return notifications.filter(n => n.userId === userId);
  },
  
  toggleNotificationRead: async (id, isRead) => {
    await delay();
    notifications = notifications.map(n => n.id === id ? { ...n, isRead } : n);
    saveData('mock_notifications', notifications);
    return { success: true };
  },
  
  deleteNotification: async (id) => {
    await delay();
    notifications = notifications.filter(n => n.id !== id);
    saveData('mock_notifications', notifications);
    return { success: true };
  }
};
