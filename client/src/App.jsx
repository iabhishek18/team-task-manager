import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CustomToaster from './components/CustomToaster';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Profile from './pages/Profile';
import Layout from './components/Layout';

function Guard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-page)'}}><div style={{width:20,height:20,border:'2px solid var(--border)',borderTopColor:'var(--text)',borderRadius:'50%',animation:'spin 0.6s linear infinite'}} /></div>;
  return user ? children : <Navigate to="/login" />;
}

function Public({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" /> : children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Public><Login /></Public>} />
            <Route path="/signup" element={<Public><Signup /></Public>} />
            <Route path="/" element={<Guard><Layout /></Guard>}>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/:projectId" element={<ProjectDetail />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
          <CustomToaster />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
