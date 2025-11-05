import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "sonner";
import "./App.css";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectLayoutPage from "./pages/ProjectLayoutPage";
import LayoutCreatorTool from "./pages/LayoutCreatorTool";
import LayoutCreatorToolStandalone from "./pages/LayoutCreatorToolStandalone";
import HybridLayoutCreator from "./pages/HybridLayoutCreator";
import LayoutsLibrary from "./pages/LayoutsLibrary";
import AdvancedLayoutViewer from "./pages/AdvancedLayoutViewer";
import LayoutEditor from "./pages/LayoutEditor";
import PublicLayoutView from "./pages/PublicLayoutView";
import Leads from "./pages/Leads";
import CalendarPage from "./pages/CalendarPage";
import Bookings from "./pages/Bookings";
import Reports from "./pages/Reports";
import UsersManagement from "./pages/UsersManagement";
import CustomerDashboard from "./pages/CustomerDashboard";
import ProjectManagerDashboard from "./pages/ProjectManagerDashboard";
import MarketingAgentDashboard from "./pages/MarketingAgentDashboard";
import ShareRewards from "./pages/ShareRewards";
import ResaleRequests from "./pages/ResaleRequests";
import PrivateRoute from "./components/PrivateRoute";

// PWA Pages
import PWALogin from "./pages/pwa/PWALogin";
import PWADashboard from "./pages/pwa/PWADashboard";
import PWANotifications from "./pages/pwa/PWANotifications";

// Marketing Pages
import Home from "./pages/marketing/Home";
import Pricing from "./pages/marketing/Pricing";
import About from "./pages/marketing/About";
import Features from "./pages/marketing/Features";
import Contact from "./pages/marketing/Contact";

// Content Pages
import ContentLibrary from "./pages/content/ContentLibrary";
import ArticleDetail from "./pages/content/ArticleDetail";

// Advisory Pages
import AdvisoryHub from "./pages/advisory/AdvisoryHub";
import AdvisoryChat from "./pages/advisory/AdvisoryChat";

// Admin Pages
import ContentManagement from "./pages/admin/ContentManagement";
import ResaleManagement from "./pages/admin/ResaleManagement";
import EnhancedSaaSDashboard from "./pages/admin/EnhancedSaaSDashboard";
import PackageManagement from "./pages/admin/PackageManagement";
import TenantManagement from "./pages/admin/TenantManagement";
import ChatManagement from "./pages/admin/ChatManagement";
import IncomeLandsAdminDashboard from "./pages/admin/IncomeLandsAdminDashboard";

// Public Landing Pages
import TenantLandingPage from "./pages/public/TenantLandingPage";
import ProjectLandingPage from "./pages/public/ProjectLandingPage";
import TenantsDirectory from "./pages/public/TenantsDirectory";

// Mobile App
import IncomeLandsApp from "./pages/mobile/IncomeLandsApp";

// Workforce Map
import WorkforceMap from "./pages/WorkforceMap";
import WorkforceManagement from "./pages/WorkforceManagement";

// Policy Pages
import PrivacyPolicy from "./pages/policies/PrivacyPolicy";
import TermsConditions from "./pages/policies/TermsConditions";
import RefundPolicy from "./pages/policies/RefundPolicy";
import ShippingPolicy from "./pages/policies/ShippingPolicy";
import FAQRealEstate from "./pages/FAQRealEstate";

// Solution Pages
import CRMSolution from "./pages/solutions/CRMSolution";
import PaymentsSolution from "./pages/solutions/PaymentsSolution";
import PropertyLayoutsSolution from "./pages/solutions/PropertyLayoutsSolution";
import AnalyticsSolution from "./pages/solutions/AnalyticsSolution";
import CommunicationSolution from "./pages/solutions/CommunicationSolution";
import ResaleSolution from "./pages/solutions/ResaleSolution";
import MultiProjectManagement from "./pages/solutions/MultiProjectManagement";

// Example Pages
import LeadLeakageExample from "./pages/examples/LeadLeakageExample";
import SlowProcessesExample from "./pages/examples/SlowProcessesExample";
import RevenueLossExample from "./pages/examples/RevenueLossExample";

// Demo Pages
import CRMDemo from "./pages/demos/CRMDemo";

// PWA Components
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import AvatarAssistant from "./components/AvatarAssistant";
import PropertyChatbot from "./components/PropertyChatbot";

// Custom Hooks
import useScrollToTop from "./hooks/useScrollToTop";

// Scroll to top component wrapper
function ScrollToTop() {
  useScrollToTop();
  return null;
}

// Conditional Assistant Renderer
function ConditionalAssistant() {
  const location = useLocation();
  
  // Check if on tenant or project detail pages
  const isTenantOrProjectPage = 
    location.pathname.startsWith('/public/tenant/') || 
    location.pathname.startsWith('/public/project/');
  
  // Show Property Chatbot on tenant/project pages, RETOERP Assistant on ALL other pages (including homepage)
  if (isTenantOrProjectPage) {
    return <PropertyChatbot />;
  } else {
    return <AvatarAssistant />;
  }
}

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <LanguageProvider>
          <div className="App">
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                {/* Marketing Routes - Public */}
                <Route path="/" element={<Home />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/about" element={<About />} />
                <Route path="/features" element={<Features />} />
                <Route path="/contact" element={<Contact />} />
                
                {/* Content Routes - Public */}
                <Route path="/content" element={<ContentLibrary />} />
                <Route path="/content/:slug" element={<ArticleDetail />} />
                <Route path="/learn" element={<ContentLibrary />} />
                
                {/* Advisory Routes - Public */}
                <Route path="/advisory" element={<AdvisoryHub />} />
                <Route path="/advisory/:category" element={<AdvisoryChat />} />
                
                {/* Policy Routes - Public */}
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-conditions" element={<TermsConditions />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="/shipping-policy" element={<ShippingPolicy />} />
                <Route path="/faq" element={<FAQRealEstate />} />
                
                {/* Solution Routes - Public */}
                <Route path="/solutions/crm" element={<CRMSolution />} />
                <Route path="/solutions/multi-project-management" element={<MultiProjectManagement />} />
                <Route path="/solutions/payments" element={<PaymentsSolution />} />
                <Route path="/solutions/property-layouts" element={<PropertyLayoutsSolution />} />
                <Route path="/solutions/analytics" element={<AnalyticsSolution />} />
                <Route path="/solutions/communication" element={<CommunicationSolution />} />
                <Route path="/solutions/resale" element={<ResaleSolution />} />
                
                {/* Example Routes - Public */}
                <Route path="/examples/lead-leakage" element={<LeadLeakageExample />} />
                <Route path="/examples/slow-processes" element={<SlowProcessesExample />} />
                <Route path="/examples/revenue-loss" element={<RevenueLossExample />} />
                
                {/* Demo Routes - Public */}
                <Route path="/demo/solutions/crm" element={<CRMDemo />} />
                <Route path="/demo/solutions/payments" element={<CRMDemo />} />
                <Route path="/demo/solutions/analytics" element={<CRMDemo />} />
                <Route path="/demo/solutions/property-layouts" element={<CRMDemo />} />
                <Route path="/demo/solutions/communication" element={<CRMDemo />} />
                <Route path="/demo/solutions/resale" element={<CRMDemo />} />
                
                {/* Public Landing Pages */}
                <Route path="/tenants" element={<TenantsDirectory />} />
                <Route path="/public/tenant/:tenantId" element={<TenantLandingPage />} />
                <Route path="/public/project/:projectId" element={<ProjectLandingPage />} />
                
                {/* IncomeLands Mobile App */}
                <Route path="/incomelands" element={<IncomeLandsApp />} />
                
                {/* Workforce Map - Public */}
                <Route path="/workforce-map" element={<WorkforceMap />} />
                
                {/* Admin Routes - Protected */}
                <Route 
                  path="/admin/content" 
                  element={
                    <PrivateRoute>
                      <ContentManagement />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/admin/resale" 
                  element={
                    <PrivateRoute>
                      <ResaleManagement />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/resale" 
                  element={
                    <PrivateRoute>
                      <ResaleRequests />
                    </PrivateRoute>
                  } 
                />
                
                {/* PWA Routes */}
                <Route path="/pwa/login" element={<PWALogin />} />
                <Route path="/pwa/dashboard" element={<PWADashboard />} />
                <Route path="/pwa/notifications" element={<PWANotifications />} />
                
                {/* Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <PrivateRoute>
                    <Projects />
                  </PrivateRoute>
                }
              />
              <Route
                path="/projects/:projectId"
                element={
                  <PrivateRoute>
                    <ProjectDetail />
                  </PrivateRoute>
                }
              />
              <Route
                path="/projects/:projectId/layout"
                element={
                  <PrivateRoute>
                    <ProjectLayoutPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/public/layout/:projectId"
                element={<PublicLayoutView />}
              />
              <Route
                path="/leads"
                element={
                  <PrivateRoute>
                    <Leads />
                  </PrivateRoute>
                }
              />
              <Route
                path="/calendar"
                element={
                  <PrivateRoute>
                    <CalendarPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/bookings"
                element={
                  <PrivateRoute>
                    <Bookings />
                  </PrivateRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <PrivateRoute>
                    <Reports />
                  </PrivateRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <PrivateRoute>
                    <UsersManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/customer-dashboard"
                element={
                  <PrivateRoute>
                    <CustomerDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/project-manager-dashboard"
                element={
                  <PrivateRoute>
                    <ProjectManagerDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/marketing-agent-dashboard"
                element={
                  <PrivateRoute>
                    <MarketingAgentDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/share-rewards"
                element={
                  <PrivateRoute>
                    <ShareRewards />
                  </PrivateRoute>
                }
              />
              <Route
                path="/layouts"
                element={
                  <PrivateRoute>
                    <LayoutsLibrary />
                  </PrivateRoute>
                }
              />
              <Route
                path="/layouts/create"
                element={
                  <PrivateRoute>
                    <HybridLayoutCreator />
                  </PrivateRoute>
                }
              />
              <Route
                path="/layouts/create-manual"
                element={
                  <PrivateRoute>
                    <LayoutCreatorToolStandalone />
                  </PrivateRoute>
                }
              />
              <Route
                path="/layouts/:layoutId/view"
                element={
                  <PrivateRoute>
                    <AdvancedLayoutViewer />
                  </PrivateRoute>
                }
              />
              <Route
                path="/layouts/:layoutId/edit"
                element={
                  <PrivateRoute>
                    <LayoutEditor />
                  </PrivateRoute>
                }
              />
              <Route
                path="/projects/:projectId/layout/create"
                element={
                  <PrivateRoute>
                    <LayoutCreatorTool />
                  </PrivateRoute>
                }
              />
              
              {/* SaaS Admin Routes */}
              <Route
                path="/admin/saas-dashboard"
                element={
                  <PrivateRoute>
                    <EnhancedSaaSDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/packages"
                element={
                  <PrivateRoute>
                    <PackageManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/tenants"
                element={
                  <PrivateRoute>
                    <TenantManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/chats"
                element={
                  <PrivateRoute>
                    <ChatManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/incomelands"
                element={
                  <PrivateRoute>
                    <IncomeLandsAdminDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/workforce"
                element={
                  <PrivateRoute>
                    <WorkforceManagement />
                  </PrivateRoute>
                }
              />
            </Routes>
            <ConditionalAssistant />
          </BrowserRouter>
          <Toaster position="top-right" richColors />
          <PWAInstallPrompt />
        </div>
        </LanguageProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
