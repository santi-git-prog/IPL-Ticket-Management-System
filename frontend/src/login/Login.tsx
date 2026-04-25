import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const response = await axios.post(`http://localhost:5000${endpoint}`, formData);
      console.log('Success:', response.data);
      setMessage(response.data.message || 'Success!');
      
      if (isLogin) {
        // Save user email for profile circle
        localStorage.setItem('userEmail', response.data.user.email);
        localStorage.setItem('token', response.data.token);
        // Successful login -> Redirect to matches
        navigate('/matches');
      } else {
        // After signup, switch to login
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error('Error:', error.response?.data || error.message);
      setMessage(error.response?.data?.message || 'Error occurred');
    }
  };

  return (
    <div className="login-container">
      <div className="blobs">
        <div className="blob"></div>
        <div className="blob"></div>
        <div className="blob"></div>
      </div>
      
      <div className="glass-card">
        <div className="card-header">
          <div className="logo-container">
            <img src="/logo/ipl.png" alt="IPL Logo" className="login-logo" />
          </div>
          <h1>{isLogin ? 'Welcome to Satrix' : 'Join Satrix'}</h1>
          <p className="subtitle">
            {isLogin ? 'Experience the thrill of IPL with premium ticketing' : 'Register now to secure your spot in the stands'}
          </p>
          {message && (
            <div className={`status-message ${message.toLowerCase().includes('error') || message.toLowerCase().includes('invalid') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="input-group">
              <label htmlFor="username">Full Name</label>
              <div className="input-wrapper">
                <User className="input-icon" />
                <input
                  type="text"
                  id="username"
                  placeholder="Enter your name"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input
                type="email"
                id="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          </div>

          {isLogin && (
            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>
          )}

          <button type="submit" className="submit-btn" id="login-submit">
            <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
            <ArrowRight className="btn-icon" />
          </button>
        </form>

        <div className="card-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="toggle-btn">
              {isLogin ? 'Sign up now' : 'Log in here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
