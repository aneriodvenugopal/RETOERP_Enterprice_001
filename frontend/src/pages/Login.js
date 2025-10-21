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
          {!showOTP ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-ocean-primary" />
                  Phone Number
                </label>
                <div className="relative">
                  <Input
                    type="tel"
                    placeholder="Enter 10-digit phone number"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    onBlur={() => {
                      const error = validatePhone(phone);
                      if (error) setErrors({ ...errors, phone: error });
                    }}
                    className={`glass-input ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-ocean-primary/30 focus:border-ocean-primary'}`}
                    maxLength={10}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="text-xs">⚠</span> {errors.phone}
                  </p>
                )}
              </div>

              <Button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-ocean-primary to-ocean-secondary hover:from-ocean-primary-light hover:to-ocean-secondary-light text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending OTP...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Send OTP
                  </div>
                )}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-ocean-primary" />
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={phone}
                  disabled
                  className="glass-input bg-ocean-primary/5 border-ocean-primary/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-ocean-primary" />
                  Enter OTP
                </label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    if (errors.otp) setErrors({ ...errors, otp: '' });
                  }}
                  onBlur={() => {
                    const error = validateOTP(otp);
                    if (error) setErrors({ ...errors, otp: error });
                  }}
                  className={`glass-input text-center text-2xl tracking-wider font-semibold ${errors.otp ? 'border-red-500 focus:border-red-500' : 'border-ocean-primary/30 focus:border-ocean-primary'}`}
                  maxLength={6}
                  autoFocus
                />
                {errors.otp && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="text-xs">⚠</span> {errors.otp}
                  </p>
                )}
                {generatedOTP && (
                  <div className="glass-card bg-ocean-primary/5 p-3 rounded-lg border-ocean-primary/20">
                    <p className="text-xs text-center text-ocean-primary font-semibold">
                      🔐 Development Mode: OTP is <span className="text-lg">{generatedOTP}</span>
                    </p>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-ocean-primary to-ocean-secondary hover:from-ocean-primary-light hover:to-ocean-secondary-light text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Verify & Login
                  </div>
                )}
              </Button>

              <Button
                type="button"
                onClick={() => {
                  setShowOTP(false);
                  setOtp('');
                  setGeneratedOTP('');
                  setErrors({});
                }}
                variant="ghost"
                className="w-full text-ocean-primary hover:text-ocean-primary-dark hover:bg-ocean-primary/10"
              >
                Change Phone Number
              </Button>
            </form>
          )}

          <div className="text-center pt-4 border-t border-ocean-primary/10">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="font-semibold text-ocean-primary hover:text-ocean-primary-dark transition-colors underline-offset-4 hover:underline"
              >
                Register here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
