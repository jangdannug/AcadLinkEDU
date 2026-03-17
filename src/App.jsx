import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store.js';
import Layout from './components/Layout.jsx';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import Classes from './components/Classes.jsx';
import Tasks from './components/Tasks.jsx';
import Admin from './components/Admin.jsx';
import ClassDetail from './components/ClassDetail.jsx';
import Notifications from './components/Notifications.jsx';

function ProtectedRoute({ children, role }) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { user } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login />} 
        />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="classes" element={<Classes />} />
          <Route path="classes/:classId" element={<ClassDetail />} />
          <Route path="tasks" element={<Tasks />} />
          <Route 
            path="admin" 
            element={
              <ProtectedRoute role="admin">
                <Admin />
              </ProtectedRoute>
            } 
          />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
