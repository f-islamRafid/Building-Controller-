import React, { useState } from 'react';
// We remove 'useNavigate' because we are using window.location for a hard fix
import { Link } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext';
import '../App.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      console.log("Submitting login for:", email); // Debug Log
      
      // 1. Wait for the login API call to finish
      const success = await login(email, password);

      // 2. FORCE NAVIGATION (The Fix)
      // Instead of navigate(), we force the browser to go to dashboard.
      // This ensures AuthContext reads the token from localStorage fresh.
      if (success) {
        console.log("Login success! Redirecting...");
        window.location.href = '/dashboard';
      }

    } catch (err) {
      console.error("Login Error:", err);
      // Show a clear error message on the screen
      setError(err.message || "Failed to sign in. Check backend connection.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p className="subtitle">Enter credentials to sign in.</p>

        {/* Error Message Box */}
        {error && (
            <div style={{
                backgroundColor: '#ff6b6b', 
                color: 'white', 
                padding: '10px', 
                borderRadius: '5px', 
                marginBottom: '15px', 
                fontSize: '0.9rem'
            }}>
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="name@company.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="options">
            <label className="checkbox-container">
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" className="forgot-pass">Forgot Password?</a>
          </div>

          <button type="submit" className="login-btn">Sign In</button>
        </form>

        <p className="signup-link">
            Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;