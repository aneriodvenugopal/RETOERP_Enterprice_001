import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';

const LoginPage = () => {
  const { sendOtp, verifyOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Handle iOS keyboard - prevent content push
  useEffect(() => {
    const handleResize = () => {
      // Detect if keyboard is open on iOS
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      setKeyboardVisible(viewportHeight < windowHeight * 0.75);
    };

    // Use visualViewport API for better iOS support
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Enter a valid 10-digit number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await sendOtp(phone);
      setDemoOtp(result.demo_otp);
      setStep('otp');
    } catch (err) {
      setError('Something went wrong. Try again.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Enter 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await verifyOtp(phone, otp);
    } catch (err) {
      setError('Wrong OTP. Try again.');
    }
    setLoading(false);
  };

  return (
    <div className="login-page-container">
      {/* Main Content - Fixed position to prevent keyboard push */}
      <div className={`login-content ${keyboardVisible ? 'keyboard-open' : ''}`}>
        {/* Logo - Hide when keyboard is open */}
        {!keyboardVisible && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg mx-auto">
              <Building2 className="w-10 h-10 text-white" />
            </div>
          </motion.div>
        )}

        {/* App Name - Compact when keyboard open */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className={`text-center ${keyboardVisible ? 'mb-4' : 'mb-8'}`}
        >
          <h1 className={`font-bold text-gray-900 tracking-tight ${keyboardVisible ? 'text-xl' : 'text-3xl'}`}>AgentApex</h1>
          {!keyboardVisible && <p className="text-gray-500 mt-1">Property Intelligence</p>}
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="w-full max-w-xs mx-auto px-6"
        >
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  data-testid="phone-input"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full pl-14 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base"
                  autoComplete="tel"
                />
              </div>
              
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              
              <button
                type="submit"
                data-testid="send-otp-btn"
                disabled={loading || phone.length < 10}
                className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-xl transition-colors"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  'Get OTP'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-gray-500 text-sm">
                  Enter the 6-digit code sent to
                </p>
                <p className="text-gray-900 font-medium">+91 {phone}</p>
              </div>
              
              <input
                type="tel"
                inputMode="numeric"
                data-testid="otp-input"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-center text-xl tracking-[0.5em] font-medium"
                maxLength={6}
                autoComplete="one-time-code"
              />
              
              {demoOtp && !keyboardVisible && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                  <p className="text-amber-700 text-sm">Demo OTP: <span className="font-bold">{demoOtp}</span></p>
                </div>
              )}
              
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              
              <button
                type="submit"
                data-testid="verify-otp-btn"
                disabled={loading || otp.length !== 6}
                className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-xl transition-colors"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  'Verify'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                className="w-full py-3 text-blue-500 font-medium text-sm"
              >
                Change Number
              </button>
            </form>
          )}
        </motion.div>
      </div>

      {/* Footer - Hide when keyboard open */}
      {!keyboardVisible && (
        <div className="login-footer">
          <p className="text-gray-400 text-xs">
            By RealApex
          </p>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
