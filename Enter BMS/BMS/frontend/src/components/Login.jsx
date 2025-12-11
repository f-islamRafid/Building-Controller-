import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Importing your existing Auth Context
import '../App.css'; // Ensuring styles are applied

const Login = () => {
  // 1. State to hold the user's input
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 2. Hooks for navigation and auth
  const navigate = useNavigate();
  const { login } = useAuth(); // Assuming your AuthContext exposes a 'login' function

  // 3. Function to handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    try {
      // Call the login function from your AuthContext
      await login(email, password);
      // If successful, redirect to the dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Failed to sign in. Please check your credentials.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p className="subtitle">Please enter your details to sign in.</p>

        {/* Display error message if login fails */}
        {error && <div className="error-message" style={{color: '#ff6b6b', marginBottom: '15px'}}>{error}</div>}

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