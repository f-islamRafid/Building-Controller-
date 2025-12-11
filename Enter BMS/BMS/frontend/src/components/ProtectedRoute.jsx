import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // 1. Wait until AuthContext finishes checking localStorage
  if (loading) {
    // You can replace this with a nice spinner if you want
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  // 2. If loading is done and still no user, THEN kick them out
  if (!user) {
    console.log("Access Denied: No user logged in.");
    return <Navigate to="/login" replace />;
  }

  // 3. User is authenticated, let them in
  return children;
};

export default ProtectedRoute;