import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'verify-otp';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await axios.post('http://localhost:5000/api/auth/send-otp', { email: formData.email });
      setMode('verify-otp');
      setMessage('OTP has been sent to your email');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          setMessage('Error: Passwords do not match');
          setLoading(false);
          return;
        }
        // Instead of signup directly, we send OTP first
        await axios.post('http://localhost:5000/api/auth/send-otp', { email: formData.email });
        setMode('verify-otp');
        setMessage('Verification code sent to your email');
      } else if (mode === 'login') {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem('userEmail', response.data.user.email);
        localStorage.setItem('username', response.data.user.username);
        localStorage.setItem('token', response.data.token);
        navigate('/matches');
      } else if (mode === 'verify-otp') {
        // If we were in signup, we now call signup
        // If we were in forgot-password, we now call reset-password
        // But wait, forgot-password needs a new password input too.
        // Let's adjust forgot-password behavior
        const response = await axios.post('http://localhost:5000/api/auth/signup', {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          otp: formData.otp
        });
        setMessage(response.data.message);
        setMode('login');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setMessage('Error: Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/reset-password', {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.password
      });
      setMessage(response.data.message);
      setMode('login');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error occurred');
    } finally {
      setLoading(false);
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
        {mode !== 'login' && (
          <button className="back-btn-minimal" onClick={() => setMode('login')}>
            <ArrowLeft size={16} />
            <span>Back to Login</span>
          </button>
        )}

        <div className="card-header">
          <div className="logo-container">
            <img src="/logo/ipl.png" alt="IPL Logo" className="login-logo" />
          </div>
          <h1>
            {mode === 'login' && 'Welcome to Satrix'}
            {mode === 'signup' && 'Join Satrix'}
            {mode === 'forgot-password' && 'Reset Password'}
            {mode === 'verify-otp' && 'Verify Account'}
          </h1>
          <p className="subtitle">
            {mode === 'login' && 'Experience the thrill of IPL with premium ticketing'}
            {mode === 'signup' && 'Ready for the stands? Verify your email to register.'}
            {mode === 'forgot-password' && 'Enter your email to receive a secure OTP'}
            {mode === 'verify-otp' && `We've sent a 6-digit code to ${formData.email}`}
          </p>
          {message && (
            <div className={`status-message ${message.toLowerCase().includes('error') || message.toLowerCase().includes('invalid') || message.toLowerCase().includes('fail') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
        </div>

        {mode === 'login' && (
          <form onSubmit={handleSubmit} className="auth-form">
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

            <div className="form-options">
              <span />
              <button type="button" onClick={() => setMode('forgot-password')} className="forgot-password" style={{background: 'none', border:'none', cursor:'pointer'}}>
                Forgot password?
              </button>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              <span>{loading ? 'Verifying...' : 'Sign In'}</span>
              <ArrowRight className="btn-icon" />
            </button>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSubmit} className="auth-form">
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

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              <span>{loading ? 'Sending OTP...' : 'Get OTP & Sign Up'}</span>
              <ArrowRight className="btn-icon" />
            </button>
          </form>
        )}

        {mode === 'forgot-password' && (
          <form onSubmit={handleSendOTP} className="auth-form">
            <div className="input-group">
              <label htmlFor="reset-email">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" />
                <input
                  type="email"
                  id="reset-email"
                  placeholder="Enter registered email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              <span>{loading ? 'Processing...' : 'Generate OTP'}</span>
              <ArrowRight className="btn-icon" />
            </button>
          </form>
        )}

        {mode === 'verify-otp' && (
          <form onSubmit={formData.username ? handleSubmit : handleResetPassword} className="auth-form">
            <div className="input-group">
              <label htmlFor="otp">Enter 6-Digit OTP</label>
              <div className="input-wrapper">
                <ShieldCheck className="input-icon" />
                <input
                  type="text"
                  id="otp"
                  maxLength={6}
                  placeholder="123456"
                  value={formData.otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                  required
                  style={{ letterSpacing: '8px', textAlign: 'center', paddingLeft: '1rem' }}
                />
              </div>
            </div>

            {!formData.username && (
              <>
                <div className="input-group">
                  <label htmlFor="new-password">New Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" />
                    <input
                      type="password"
                      id="new-password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label htmlFor="confirm-new-password">Confirm New Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" />
                    <input
                      type="password"
                      id="confirm-new-password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              <span>{loading ? 'Verifying...' : (formData.username ? 'Verify & Create Account' : 'Reset My Password')}</span>
              <ArrowRight className="btn-icon" />
            </button>
            <button type="button" onClick={() => setMode('signup')} className="submit-btn secondary-action">
              <span>Resend OTP</span>
            </button>
          </form>
        )}

        <div className="card-footer">
          <p>
            {mode === 'login' ? (
              <>
                Don't have an account? 
                <button onClick={() => setMode('signup')} className="toggle-btn">Sign up now</button>
              </>
            ) : mode === 'signup' ? (
              <>
                Already have an account? 
                <button onClick={() => setMode('login')} className="toggle-btn">Log in here</button>
              </>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
