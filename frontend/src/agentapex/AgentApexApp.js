import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { Toaster } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

// Lazy load pages for faster initial load
const LoginPage = lazy(() => import('./pages/LoginPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const QuickPropertyPost = lazy(() => import('./pages/QuickPropertyPost'));
const VoicePropertyPost = lazy(() => import('./pages/VoicePropertyPost'));
const QuickPropertyEdit = lazy(() => import('./pages/QuickPropertyEdit'));
const MapSearch = lazy(() => import('./pages/MapSearch'));
const MyProperties = lazy(() => import('./pages/MyProperties'));
const Favorites = lazy(() => import('./pages/Favorites'));
const FollowUps = lazy(() => import('./pages/FollowUps'));
const Requirements = lazy(() => import('./pages/Requirements'));
const Leads = lazy(() => import('./pages/Leads'));
const Profile = lazy(() => import('./pages/Profile'));
const PropertyDetail = lazy(() => import('./pages/PropertyDetail'));
const DocumentManager = lazy(() => import('./pages/DocumentManager'));

import './index.css';

// Loading Spinner
const LoadingSpinner = () => (
  <div className="fixed inset-0 bg-white flex items-center justify-center">
    <div className="text-center">
      <div className="w-10 h-10 border-3 border-gray-200 border-t-amber-500 rounded-full animate-spin mx-auto" />
      <p className="mt-3 text-gray-500 text-sm">Loading...</p>
    </div>
  </div>
);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AgentApex Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-white flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 text-sm mb-4">Please refresh the page</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-amber-500 text-white rounded-lg font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Page transition wrapper
const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
  >
    {children}
  </motion.div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/agentapex/login" replace />;
  }
  
  return <PageWrapper>{children}</PageWrapper>;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/agentapex" replace />;
  }
  
  return <PageWrapper>{children}</PageWrapper>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="post" element={<ProtectedRoute><QuickPropertyPost /></ProtectedRoute>} />
        <Route path="post/voice" element={<ProtectedRoute><VoicePropertyPost /></ProtectedRoute>} />
        <Route path="property/:id/edit" element={<ProtectedRoute><QuickPropertyEdit /></ProtectedRoute>} />
        <Route path="search" element={<ProtectedRoute><MapSearch /></ProtectedRoute>} />
        <Route path="my-properties" element={<ProtectedRoute><MyProperties /></ProtectedRoute>} />
        <Route path="favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="followups" element={<ProtectedRoute><FollowUps /></ProtectedRoute>} />
        <Route path="requirements" element={<ProtectedRoute><Requirements /></ProtectedRoute>} />
        <Route path="leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="property/:id" element={<ProtectedRoute><PropertyDetail /></ProtectedRoute>} />
        <Route path="property/:propertyId/documents" element={<ProtectedRoute><DocumentManager /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/agentapex" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function AgentApexApp() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LocationProvider>
          <div className="agentapex-app">
            <Suspense fallback={<LoadingSpinner />}>
              <AnimatedRoutes />
            </Suspense>
            <Toaster 
              position="top-center" 
              toastOptions={{
                style: {
                  background: '#262626',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  fontSize: '14px',
                  padding: '12px 16px',
                }
              }}
            />
          </div>
        </LocationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default AgentApexApp;
