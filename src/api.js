import axios from "axios";

//const API_BASE = "https://localhost:7209";
 const API_BASE = 'https://acadlinkedubackend.onrender.com';

// Mock Database State with LocalStorage Persistence
const getInitialData = (key, defaultValue) => {
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : defaultValue;
};

const saveData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};
let users = getInitialData("mock_users", []);

let classes = getInitialData("mock_classes", []);

let activities = getInitialData("mock_activities", [
  {
    id: "a1",
    classId: "c1",
    title: "Neural Link Design",
    description:
      "Design a basic neural interface for robotic control. Focus on signal-to-noise ratio and biocompatibility.",
    deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
    requiredFiles: ["pdf", "png"],
  },
  {
    id: "a2",
    classId: "c1",
    title: "Kinematics Analysis",
    description:
      "Calculate joint velocities for a 6-DOF robotic arm using Denavit-Hartenberg parameters.",
    deadline: new Date(Date.now() - 86400000).toISOString(),
    requiredFiles: ["excel"],
  },
  {
    id: "a3",
    classId: "c2",
    title: "Encryption Protocol",
    description: "Implement a basic RSA encryption algorithm in Python.",
    deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
    requiredFiles: ["pdf", "doc"],
  },
  {
    id: "a4",
    classId: "c3",
    title: "Qubit Superposition",
    description: "Simulate qubit states using Qiskit.",
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    requiredFiles: ["pdf"],
  },
  {
    id: "a5",
    classId: "c1",
    title: "Neural Link Calibration",
    description: "Calibrate the neural link for optimal data transmission.",
    deadline: new Date(Date.now() - 86400000).toISOString(),
    requiredFiles: ["pdf"],
  },
  {
    id: "a6",
    classId: "c4",
    title: "Bio-Digital Synthesis",
    description:
      "Synthesize bio-digital patterns for environmental monitoring.",
    deadline: new Date(Date.now() + 432000000).toISOString(),
    requiredFiles: ["pdf", "png"],
  },
]);

let enrollments = getInitialData("mock_enrollments", [
  { id: "e1", studentId: "3", classId: "c1" },
  { id: "e2", studentId: "3", classId: "c2" },
  { id: "e3", studentId: "3", classId: "c3" },
]);

let submissions = getInitialData("mock_submissions", [
  {
    id: "s1",
    activityId: "a1",
    studentId: "3",
    fileUrl: "#",
    fileName: "neural_design.pdf",
    submittedAt: new Date().toISOString(),
    status: "finished",
  },
  {
    id: "s2",
    activityId: "a3",
    studentId: "3",
    fileUrl: "#",
    fileName: "rsa_impl.py",
    submittedAt: new Date().toISOString(),
    status: "finished",
  },
]);


let notifications = getInitialData("mock_notifications", []);

// Helper to simulate network delay
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  // Auth
  login: async (email) => {
    try {
      const res = await axios.post(`${API_BASE}/api/Users/login`, { email });
      return { user: res.data };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      try {
        const { useUIStore } = await import("./store.js");
        useUIStore.getState().showNotification(message, "error", 8000);
      } catch (e) {
        console.log("[api.login] failed to show snackbar", e && e.toString());
      }
      return { error: message };
    }
  },

  register: async (data) => {
    try {
      const response = await axios.post(`${API_BASE}/api/Users/register`, data);

      console.log("[api.register] response:", response.data);

      if (response.data?.success) {
        return {
          user: response.data.data,
          error: null,
        };
      }

      const message = response.data?.message || "Registration failed";

      const { useUIStore } = await import("./store.js");
      useUIStore.getState().showNotification(message, "error", 8000);

      return {
        user: null,
        error: message,
      };
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";

      console.log("[api.register] error:", message);

      const { useUIStore } = await import("./store.js");
      useUIStore.getState().showNotification(message, "error", 8000);

      return {
        user: null,
        error: message,
      };
    }
  },
  // Users
  getUsers: async () => {
    await delay();
    const url = `${API_BASE}/api/Users`;
    try {
      const res = await axios.get(url);
      if (Array.isArray(res.data)) {
        users = res.data;
        saveData("mock_users", users);
        return users;
      }
      if (res.data && Array.isArray(res.data.users)) {
        users = res.data.users;
        saveData("mock_users", users);
        return users;
      }

      return users;
    } catch (err) {
      console.log(
        "[api.getUsers] failed to fetch users from API, falling back to mock data",
        url,
        err && err.toString(),
      );
      return users;
    }
  },

  verifyUser: async (userId) => {
    try {
      const res = await axios.put(`${API_BASE}/api/Users/${userId}/verify`);
      return res.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data ||
        "Verification failed";
      return { error: message };
    }
  },
  revokeUser: async (userId) => {
    try {
      const res = await axios.put(`${API_BASE}/api/Users/${userId}/revoke`);
      return res.data;
    } catch (err) {
      const message =
        err.response?.data?.message || err.response?.data || "Revoke failed";
      return { error: message };
    }
  },

batchVerifyUsers: async (userIds) => {
  try {
    const res = await axios.put(`${API_BASE}/api/Users/batch-verify`, userIds);

    if (res.data?.success) {
      users = users.map(u =>
        userIds.includes(u.id) ? { ...u, isVerified: true } : u
      );
      saveData("mock_users", users);

      return { success: true };
    }

    return { success: false, error: res.data?.message || "Batch verify failed" };

  } catch (err) {
    const message = err.response?.data?.message || "Batch verify failed";
    console.error("[api.batchVerifyUsers] error:", message);
    return { success: false, error: message };
  }
},

  deleteUser: async (userId) => {
    try {
      await axios.delete(`${API_BASE}/api/Users/${userId}`);

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Delete failed";
      return { error: message };
    }
  },

  // Notifications
  getNotifications: async (userId) => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/Notifications/${userId}`,
      );
      if (response.data) {
        return response.data;
      } else {
        console.error("Failed to fetch notifications", response.data);
        return [];
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to fetch notifications";
      return { error: message };
    }
  },

   toggleNotificationRead: async (id, isRead) => {
    try {
    axios.patch(`${API_BASE}/api/Notifications/${id}/Read`, null, { params: { isRead: isRead } });
      return response.data; // { success: true }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update notification";
      return { error: message };
    }
  },

  deleteNotification: async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/api/Notifications/${id}`);
      return response.data; // { success: true }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete notification";
      return { error: message };
    }
  },

  // Classes
   getClasses: async (studentId) => {
    try {
      const response = await axios.get(`${API_BASE}/api/Classes`, {
        params: studentId ? { studentId } : {},
      });
      if (response.data) {
        return response.data;
      } else {
        console.error("Failed to fetch classes", response.data);
        return [];
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to fetch classes";
      return { error: message };
    }
  },

createClass: async (data) => {
    try {
      const response = await axios.post(`${API_BASE}/api/Classes/Create`, data);
      console.log("[api.createClass] response:", response.data);
      return response.data;
    } catch (err) {
      console.error("Failed to create class:", err);
      throw new Error(err.response?.data?.message || "Failed to create class");
    }
  },

  // Activities
  getActivities: async (classId) => {
    await delay();
    if (classId) return activities.filter((a) => a.classId === classId);
    return activities;
  },

  createActivity: async (data) => {
    await delay();
    const newActivity = { ...data, id: `a${activities.length + 1}` };
    activities.push(newActivity);
    saveData("mock_activities", activities);

    // Notify students
    const classStudents = enrollments.filter(
      (e) => e.classId === newActivity.classId,
    );
    classStudents.forEach((s) => {
      notifications.push({
        id: `n${notifications.length + 1}`,
        userId: s.studentId,
        title: "New Mission Deployed",
        message: `New activity: ${newActivity.title} in your class!`,
        type: "task",
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    });
    saveData("mock_notifications", notifications);

    return newActivity;
  },

  updateActivity: async (id, data) => {
    await delay();
    const index = activities.findIndex((a) => a.id === id);
    if (index !== -1) {
      activities[index] = { ...activities[index], ...data };
      saveData("mock_activities", activities);
      return activities[index];
    }
    throw new Error("Activity not found");
  },

  // Enrollments
  joinClass: async (studentId, inviteCode) => {
    await delay();
    const targetClass = classes.find((c) => c.inviteCode === inviteCode);
    if (targetClass) {
      const existing = enrollments.find(
        (e) => e.studentId === studentId && e.classId === targetClass.id,
      );
      if (existing) throw new Error("Already joined");

      const newEnrollment = {
        id: `e${enrollments.length + 1}`,
        studentId,
        classId: targetClass.id,
      };
      enrollments.push(newEnrollment);
      saveData("mock_enrollments", enrollments);
      return newEnrollment;
    }
    throw new Error("Invalid invite code");
  },

  // Analytics
  getAnalytics: async (teacherId) => {
    await delay();
    const teacherClasses = classes.filter((c) => c.teacherId === teacherId);
    const classIds = teacherClasses.map((c) => c.id);
    const classActivities = activities.filter((a) =>
      classIds.includes(a.classId),
    );
    const activityIds = classActivities.map((a) => a.id);
    const classSubmissions = submissions.filter((s) =>
      activityIds.includes(s.activityId),
    );

    return {
      totalClasses: teacherClasses.length,
      totalStudents: enrollments.filter((e) => classIds.includes(e.classId))
        .length,
      totalSubmissions: classSubmissions.length,
      completionRate:
        classActivities.length > 0
          ? Math.round(
              (classSubmissions.length / (classActivities.length * 10)) * 100,
            )
          : 0,
    };
  },

  // Tracking
  getClassTracking: async (classId) => {
    await delay();
    const classEnrollments = enrollments.filter((e) => e.classId === classId);
    const classActivities = activities.filter((a) => a.classId === classId);

    return classEnrollments.map((e) => {
      const student = users.find((u) => u.id === e.studentId);
      const studentSubmissions = submissions.filter(
        (s) => s.studentId === e.studentId,
      );

      const activityStatuses = classActivities.map((a) => {
        const submission = studentSubmissions.find(
          (s) => s.activityId === a.id,
        );
        return {
          activityId: a.id,
          activityTitle: a.title,
          status: submission ? "submitted" : "pending",
          submittedAt: submission?.submittedAt || null,
        };
      });

      return {
        studentId: student?.id,
        studentName: student?.name,
        studentEmail: student?.email,
        activities: activityStatuses,
      };
    });
  },

  // Submissions
  getSubmissions: async (studentId) => {
    await delay();
    if (studentId) return submissions.filter((s) => s.studentId === studentId);
    return submissions;
  },

  createSubmission: async (data) => {
    await delay();
    const newSubmission = {
      ...data,
      id: `s${submissions.length + 1}`,
      submittedAt: new Date().toISOString(),
      status: "finished",
    };
    submissions.push(newSubmission);
    saveData("mock_submissions", submissions);
    return newSubmission;
  },
};
