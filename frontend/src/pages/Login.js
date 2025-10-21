import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Waves, Lock, Phone, KeyRound, ArrowRightLeft } from 'lucide-react';

const Login = () => {
  // Login mode: 'password' or 'otp'
  const [loginMode, setLoginMode] = useState('password');
  
  // Form fields
  const [identifier, setIdentifier] = useState(''); // Phone or Email
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Form validation errors
  const [errors, setErrors] = useState({});

  const validateIdentifier = (value) => {
    if (!value) return 'Phone number or email is required';
    // Check if it's a phone number (10 digits) or email
    const isPhone = /^\d{10}$/.test(value);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!isPhone && !isEmail) return 'Enter valid phone number (10 digits) or email';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const validateOTP = (value) => {
    if (!value) return 'OTP is required';
    if (!/^\d{6}$/.test(value)) return 'OTP must be 6 digits';
    return '';
  };

  // Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    
    const identifierError = validateIdentifier(identifier);
    const passwordError = validatePassword(password);
    
    if (identifierError || passwordError) {
      setErrors({ identifier: identifierError, password: passwordError });
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      // Check if identifier is phone or email
      const isPhone = /^\d{10}$/.test(identifier);
      const loginData = isPhone 
        ? { phone: identifier, password }
        : { email: identifier, password };

      const response = await authService.loginWithPassword(loginData);
      await login(response.access_token, response.user);
      toast.success(`Welcome back, ${response.user.name}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // OTP Login - Send OTP
  const handleSendOTP = async () => {
    const identifierError = validateIdentifier(identifier);
    if (identifierError) {
      setErrors({ identifier: identifierError });
      return;
    }
    setErrors({});

    // Only allow phone numbers for OTP
    if (!/^\d{10}$/.test(identifier)) {
      toast.error('OTP login only works with phone numbers');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.sendOTP(identifier);
      setGeneratedOTP(data.otp);
      setShowOTP(true);
      toast.success(`OTP sent to ${identifier}! (Dev: ${data.otp})`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // OTP Login - Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    const identifierError = validateIdentifier(identifier);
    const otpError = validateOTP(otp);
    
    if (identifierError || otpError) {
      setErrors({ identifier: identifierError, otp: otpError });
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const data = await login(identifier, otp);
      toast.success(`Welcome ${data.user.name}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // Toggle between login modes
  const toggleLoginMode = () => {
    setLoginMode(loginMode === 'password' ? 'otp' : 'password');
    setErrors({});
    setPassword('');
    setOtp('');
    setShowOTP(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/5 rounded-full blur-3xl"></div>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-blue-200 relative z-10 bg-white/95 backdrop-blur">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
              <Waves className="w-10 h-10 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              RETOERP
            </CardTitle>
            <CardDescription className="text-base mt-2 text-gray-600">
              Real Estate Automation Software
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Login Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              {loginMode === 'password' ? (
                <>
                  <Lock className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Password Login</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">OTP Login</span>
                </>
              )}
            </div>
            <button
              onClick={toggleLoginMode}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
              type="button"
            >
              <ArrowRightLeft className="w-4 h-4" />
              {loginMode === 'password' ? 'Use OTP' : 'Use Password'}
            </button>
          </div>

          {/* Password Login Form */}
          {loginMode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  Phone Number or Email
                </label>
                <Input
                  type="text"
                  placeholder="Enter phone (10 digits) or email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.identifier && (
                  <p className="text-sm text-red-500">{errors.identifier}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 rounded-lg shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Logging in...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Lock className="w-5 h-5" />
                    Login with Password
                  </div>
                )}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <KeyRound className="w-4 h-4" />
                  Forgot Password?
                </button>
                <button
                  type="button"
                  onClick={toggleLoginMode}
                  className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Login with OTP →
                </button>
              </div>
            </form>
          )}

          {/* OTP Login Form */}
          {loginMode === 'otp' && !showOTP && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>💡 Tip:</strong> Use password login to save SMS costs. OTP login is available if you forgot your password.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="Enter 10-digit phone number"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  maxLength={10}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.identifier && (
                  <p className="text-sm text-red-500">{errors.identifier}</p>
                )}
              </div>

              <Button
                onClick={handleSendOTP}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 rounded-lg shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending OTP...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="w-5 h-5" />
                    Send OTP
                  </div>
                )}
              </Button>
            </div>
          )}

          {/* OTP Verification Form */}
          {loginMode === 'otp' && showOTP && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  ✓ OTP sent to {identifier}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Development Mode: {generatedOTP}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  Enter OTP
                </label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-center text-2xl tracking-widest"
                />
                {errors.otp && (
                  <p className="text-sm text-red-500">{errors.otp}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6 rounded-lg shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <KeyRound className="w-5 h-5" />
                    Verify OTP
                  </div>
                )}
              </Button>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  disabled={loading}
                >
                  Resend OTP
                </button>
                <p className="text-sm text-gray-500">
                  or{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setShowOTP(false);
                      setOtp('');
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Change Phone Number
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Register Link */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                Register here
              </Link>
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 pt-4">
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Lock className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Secure</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Waves className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Fast</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-xs text-gray-600 font-medium">Flexible</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
