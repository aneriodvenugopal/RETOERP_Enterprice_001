import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { FileText, Lock, Phone, KeyRound, ArrowRightLeft, Zap, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Google Sign-In Button Component
const GoogleSignInButton = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check for OAuth callback
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      handleGoogleCallback(sessionId);
    }
  }, [searchParams]);

  const handleGoogleCallback = async (sessionId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/google/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });

      const data = await response.json();
      
      if (response.ok && data.access_token) {
        // Store token and user data
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Update auth context
        await login(data.access_token, data.user);
        
        toast.success(`Welcome${data.user.is_new_user ? '! Account created' : ' back'}, ${data.user.name}!`);
        navigate('/dashboard');
      } else {
        toast.error(data.detail || 'Google login failed');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      toast.error('Failed to complete Google sign-in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    // Redirect to Emergent Google OAuth - redirect to /auth/callback to handle session exchange
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full py-6 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 font-medium"
      onClick={handleGoogleSignIn}
      disabled={loading}
      data-testid="google-signin-btn"
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Signing in with Google...
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </div>
      )}
    </Button>
  );
};

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
  const [rememberMe, setRememberMe] = useState(false);
  
  const { login, loginWithPassword } = useAuth();
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
        ? { phone: identifier, password, remember_me: rememberMe }
        : { email: identifier, password, remember_me: rememberMe };

      const response = await authService.loginWithPassword(loginData);
      await loginWithPassword(response.access_token, response.user, rememberMe);
      
      const welcomeMsg = rememberMe 
        ? `Welcome back, ${response.user.name}! You'll stay logged in for 30 days.`
        : `Welcome back, ${response.user.name}!`;
      toast.success(welcomeMsg);
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
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center shadow-lg">
              <FileText className="w-10 h-10 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              ExlainERP
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

              {/* Remember Me Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember-me" 
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                  data-testid="remember-me-checkbox"
                />
                <label 
                  htmlFor="remember-me" 
                  className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                >
                  Remember me for 30 days
                </label>
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

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <GoogleSignInButton />

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
                <Zap className="w-5 h-5 text-indigo-600" />
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
