import React, { useState } from 'react';
import { Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../i18n/translations';
import './AuthScreen.css';

const AuthScreen = ({ onAuthSuccess }) => {
  const { t, language, changeLanguage } = useLanguage();
  const [mode, setMode] = useState('login'); // 'login', 'otp', 'setPassword'
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    if (mobile.length !== 10) {
      setError('Please enter valid 10-digit mobile number');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // TODO: Call backend API to send OTP
      // For now, simulate
      setTimeout(() => {
        setMode('otp');
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to send OTP');
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter 6-digit OTP');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // TODO: Call backend API to verify OTP
      // Check if user is new
      const isNew = true; // Simulate - check from backend
      
      setTimeout(() => {
        if (isNew) {
          setMode('setPassword');
          setIsFirstTime(true);
        } else {
          // User exists, login successful
          onAuthSuccess({
            id: '123',
            mobile: mobile,
            name: 'Test User',
            free_credits: 20
          });
        }
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Invalid OTP');
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // TODO: Call backend API to set password
      setTimeout(() => {
        onAuthSuccess({
          id: '123',
          mobile: mobile,
          name: 'New User',
          free_credits: 20
        });
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Failed to set password');
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (mobile.length !== 10 || password.length < 6) {
      setError('Please enter valid credentials');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // TODO: Call backend API for password login
      setTimeout(() => {
        onAuthSuccess({
          id: '123',
          mobile: mobile,
          name: 'Test User',
          free_credits: 20
        });
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-header">
        <div className="app-logo">
          <div className="logo-icon">🏡</div>
          <h1>IncomeLands</h1>
          <p>Partner by RETOERP</p>
        </div>
        
        <div className="language-selector">
          {['telugu', 'hindi', 'english'].map((lang) => (
            <button
              key={lang}
              className={`lang-btn ${language === lang ? 'active' : ''}`}
              onClick={() => changeLanguage(lang)}
            >
              {lang === 'telugu' ? 'తెలుగు' : lang === 'hindi' ? 'हिंदी' : 'English'}
            </button>
          ))}
        </div>
      </div>

      <div className="auth-container">
        {mode === 'login' && (
          <div className="auth-form">
            <h2 className="auth-title">Welcome Back!</h2>
            <p className="auth-subtitle">Login to continue</p>
            
            <div className="input-group">
              <Phone size={20} className="input-icon" />
              <input
                type="tel"
                placeholder="Mobile Number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength="10"
                className="auth-input"
              />
            </div>
            
            <div className="input-group">
              <Lock size={20} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button
              className="auth-btn primary"
              onClick={handlePasswordLogin}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            
            <div className="divider">
              <span>OR</span>
            </div>
            
            <button
              className="auth-btn secondary"
              onClick={() => {
                setPassword('');
                handleSendOTP();
              }}
              disabled={loading}
            >
              Login with OTP
            </button>
            
            {/* Quick Test Mode */}
            <button
              className="auth-btn"
              onClick={() => {
                onAuthSuccess({
                  id: 'test_' + Date.now(),
                  mobile: '9876543210',
                  name: 'Test User',
                  free_credits: 20,
                  token: 'test_token_' + Date.now()
                });
              }}
              style={{
                marginTop: '16px',
                background: '#FFA500',
                fontSize: '13px',
                padding: '10px'
              }}
            >
              🚀 Quick Test (Skip Login)
            </button>
          </div>
        )}

        {mode === 'otp' && (
          <div className="auth-form">
            <h2 className="auth-title">Enter OTP</h2>
            <p className="auth-subtitle">Sent to +91 {mobile}</p>
            
            <div className="otp-input-container">
              <input
                type="tel"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength="6"
                className="otp-input"
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button
              className="auth-btn primary"
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            
            <button
              className="resend-btn"
              onClick={handleSendOTP}
              disabled={loading}
            >
              Resend OTP
            </button>
            
            <button
              className="back-link"
              onClick={() => {
                setMode('login');
                setOtp('');
                setError('');
              }}
            >
              ← Back to Login
            </button>
          </div>
        )}

        {mode === 'setPassword' && (
          <div className="auth-form">
            <h2 className="auth-title">Set Password</h2>
            <p className="auth-subtitle">Create a password for future logins</p>
            
            <div className="input-group">
              <Lock size={20} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button
              className="auth-btn primary"
              onClick={handleSetPassword}
              disabled={loading || password.length < 6}
            >
              {loading ? 'Setting up...' : 'Continue'}
            </button>
          </div>
        )}
      </div>

      <div className="auth-footer">
        <p>For village agents across India</p>
        <p>🌾 Make real estate simple & transparent</p>
      </div>
    </div>
  );
};

export default AuthScreen;
