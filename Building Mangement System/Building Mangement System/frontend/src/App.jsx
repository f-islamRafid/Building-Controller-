import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';

// We will use this ONE dashboard for everyone (it handles both roles)
import BMS_Frontend from './BMS_Frontend'; 

import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

const Dashboard = () => {
  // Force EVERYONE to use the new BMS_Frontend.
  // The component itself handles showing/hiding buttons based on role.
  return <BMS_Frontend />;
};
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                
                  <Dashboard />
                
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;