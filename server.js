import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock Database State
  let users = [
    { id: "1", email: "admin@acadlink.edu", name: "System Admin", role: "admin", isVerified: true },
    { id: "2", email: "teacher@acadlink.edu", name: "Prof. Xavier", role: "teacher", isVerified: true },
    { id: "3", email: "student@acadlink.edu", name: "John Doe", role: "student", isVerified: true },
    { id: "4", email: "new_teacher@acadlink.edu", name: "Dr. Strange", role: "teacher", isVerified: true },
  ];

  let classes = [
    { id: "c1", name: "Advanced Robotics", description: "Building the future with AI and hardware.", teacherId: "2", inviteCode: "ROBO2026" },
    { id: "c2", name: "Cybersecurity 101", description: "Protecting the digital frontier.", teacherId: "2", inviteCode: "SECURE26" },
    { id: "c5", name: "AI Ethics & Safety", description: "Navigating the moral landscape of artificial intelligence.", teacherId: "2", inviteCode: "ETHICS26" },
    { id: "c6", name: "Space Exploration Systems", description: "Engineering for the final frontier.", teacherId: "2", inviteCode: "SPACE2026" },
    { id: "c3", name: "Quantum Computing", description: "Exploring the subatomic processing power.", teacherId: "4", inviteCode: "QUANTUM" },
    { id: "c4", name: "Neural Networks", description: "Simulating the human brain in silicon.", teacherId: "4", inviteCode: "NEURAL" },
  ];

  let activities = [
    { id: "a1", classId: "c1", title: "Neural Link Design", description: "Design a basic neural interface for robotic control. Focus on signal-to-noise ratio and biocompatibility.", deadline: new Date(Date.now() + 86400000 * 3).toISOString(), requiredFiles: ["pdf", "png"] },
    { id: "a2", classId: "c1", title: "Kinematics Analysis", description: "Calculate joint velocities for a 6-DOF robotic arm using Denavit-Hartenberg parameters.", deadline: new Date(Date.now() - 86400000).toISOString(), requiredFiles: ["excel"] },
    { id: "a3", classId: "c2", title: "Encryption Protocol", description: "Implement a basic RSA encryption algorithm in Python.", deadline: new Date(Date.now() + 86400000 * 5).toISOString(), requiredFiles: ["pdf", "doc"] },
    { id: "a4", classId: "c3", title: "Qubit Superposition", description: "Simulate qubit states using Qiskit.", deadline: new Date(Date.now() + 86400000 * 2).toISOString(), requiredFiles: ["pdf"] },
    { id: "a5", classId: "c1", title: "Neural Link Calibration", description: "Calibrate the neural link for optimal data transmission.", deadline: new Date(Date.now() - 86400000).toISOString(), requiredFiles: ["pdf"] },
    { id: "a6", classId: "c4", title: "Bio-Digital Synthesis", description: "Synthesize bio-digital patterns for environmental monitoring.", deadline: new Date(Date.now() + 432000000).toISOString(), requiredFiles: ["pdf", "png"] },
  ];

  let enrollments = [
    { id: "e1", studentId: "3", classId: "c1" },
    { id: "e2", studentId: "3", classId: "c2" },
    { id: "e3", studentId: "3", classId: "c3" },
  ];

  let submissions = [
    { id: "s1", activityId: "a1", studentId: "3", fileUrl: "#", fileName: "neural_design.pdf", submittedAt: new Date().toISOString(), status: "finished" },
    { id: "s2", activityId: "a3", studentId: "3", fileUrl: "#", fileName: "rsa_impl.py", submittedAt: new Date().toISOString(), status: "finished" },
  ];

  let notifications = [
    { id: "n1", userId: "3", title: "System Update", message: "Neural link v2.0.26 deployed. Check your dashboard for new sector updates.", type: "system", createdAt: new Date().toISOString(), isRead: false },
    { id: "n2", userId: "3", title: "New Mission", message: "Advanced Robotics assignment 'Neural Link Design' has been posted.", type: "task", createdAt: new Date().toISOString(), isRead: true },
    { id: "n3", userId: "2", title: "New Enrollment", message: "Student John Doe has joined your 'Advanced Robotics' sector.", type: "system", createdAt: new Date().toISOString(), isRead: false },
    { id: "n4", userId: "2", title: "Submission Alert", message: "New submission received for 'Neural Link Design' from John Doe.", type: "task", createdAt: new Date().toISOString(), isRead: false },
  ];

  // API Routes
  app.post("/api/register", (req, res) => {
    const { email, name, role } = req.body;
    const existing = users.find(u => u.email === email);
    if (existing) return res.status(400).json({ error: "Email already registered" });
    
    const newUser = { 
      id: (users.length + 1).toString(), 
      email, 
      name, 
      role, 
      isVerified: false // All new users need verification now
    };
    users.push(newUser);
    res.json({ user: newUser });
  });

  app.post("/api/users/batch-verify", (req, res) => {
    const { userIds } = req.body;
    users = users.map(u => userIds.includes(u.id) ? { ...u, isVerified: true } : u);
    res.json({ success: true });
  });

  app.post("/api/login", (req, res) => {
    const { email } = req.body;
    const user = users.find(u => u.email === email);
    if (user) {
      res.json({ user });
    } else {
      res.status(401).json({ error: "Identity email not found in neural database." });
    }
  });

  app.get("/api/users", (req, res) => res.json(users));
  
  app.post("/api/users/verify", (req, res) => {
    const { userId } = req.body;
    const user = users.find(u => u.id === userId);
    if (user) {
      user.isVerified = true;
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  app.delete("/api/users/:userId", (req, res) => {
    const { userId } = req.params;
    users = users.filter(u => u.id !== userId);
    res.json({ success: true });
  });

  app.get("/api/classes", (req, res) => {
    const { studentId } = req.query;
    
    const classesWithTeacher = classes.map(c => {
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

    res.json(classesWithTeacher);
  });
  
  app.post("/api/classes", (req, res) => {
    const newClass = { ...req.body, id: `c${classes.length + 1}`, inviteCode: Math.random().toString(36).substring(7).toUpperCase() };
    classes.push(newClass);
    res.json(newClass);
  });

  app.get("/api/activities", (req, res) => res.json(activities));
  
  app.put("/api/activities/:id", (req, res) => {
    const { id } = req.params;
    const index = activities.findIndex(a => a.id === id);
    if (index !== -1) {
      activities[index] = { ...activities[index], ...req.body };
      res.json(activities[index]);
    } else {
      res.status(404).json({ error: "Activity not found" });
    }
  });
  
  app.post("/api/activities", (req, res) => {
    const newActivity = { ...req.body, id: `a${activities.length + 1}` };
    activities.push(newActivity);
    
    // Notify students in the class
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
    
    res.json(newActivity);
  });

  app.get("/api/enrollments", (req, res) => res.json(enrollments));
  
  app.post("/api/enrollments/join", (req, res) => {
    const { studentId, inviteCode } = req.body;
    const targetClass = classes.find(c => c.inviteCode === inviteCode);
    if (targetClass) {
      const existing = enrollments.find(e => e.studentId === studentId && e.classId === targetClass.id);
      if (existing) return res.status(400).json({ error: "Already joined" });
      
      const newEnrollment = { id: `e${enrollments.length + 1}`, studentId, classId: targetClass.id };
      enrollments.push(newEnrollment);
      res.json(newEnrollment);
    } else {
      res.status(404).json({ error: "Invalid invite code" });
    }
  });

  app.get("/api/analytics", (req, res) => {
    const { teacherId } = req.query;
    const teacherClasses = classes.filter(c => c.teacherId === teacherId);
    const classIds = teacherClasses.map(c => c.id);
    const classActivities = activities.filter(a => classIds.includes(a.classId));
    const activityIds = classActivities.map(a => a.id);
    const classSubmissions = submissions.filter(s => activityIds.includes(s.activityId));
    
    res.json({
      totalClasses: teacherClasses.length,
      totalStudents: enrollments.filter(e => classIds.includes(e.classId)).length,
      totalSubmissions: classSubmissions.length,
      completionRate: classActivities.length > 0 ? Math.round((classSubmissions.length / (classActivities.length * 10)) * 100) : 0 // Mock calc
    });
  });

  app.get("/api/classes/:classId/tracking", (req, res) => {
    const { classId } = req.params;
    const classEnrollments = enrollments.filter(e => e.classId === classId);
    const classActivities = activities.filter(a => a.classId === classId);
    
    const trackingData = classEnrollments.map(e => {
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

    res.json(trackingData);
  });
  
  app.get("/api/submissions", (req, res) => res.json(submissions));

  app.post("/api/submissions", (req, res) => {
    const newSubmission = { ...req.body, id: `s${submissions.length + 1}`, submittedAt: new Date().toISOString(), status: "finished" };
    submissions.push(newSubmission);
    res.json(newSubmission);
  });

  app.get("/api/notifications/:userId", (req, res) => {
    res.json(notifications.filter(n => n.userId === req.params.userId));
  });

  app.post("/api/notifications/:id/toggle-read", (req, res) => {
    const { id } = req.params;
    const { isRead } = req.body;
    notifications = notifications.map(n => n.id === id ? { ...n, isRead } : n);
    res.json({ success: true });
  });

  app.delete("/api/notifications/:id", (req, res) => {
    const { id } = req.params;
    notifications = notifications.filter(n => n.id !== id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
