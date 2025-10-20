import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Toaster } from "sonner";
import Login from "./pages/Login";
import Register from "./pages/Register";
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
import Bookings from "./pages/Bookings";
import Reports from "./pages/Reports";
import UsersManagement from "./pages/UsersManagement";
import CustomerDashboard from "./pages/CustomerDashboard";
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

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <div className="App">
          <BrowserRouter>
            <Routes>
              {/* PWA Routes */}
              <Route path="/pwa/login" element={<PWALogin />} />
              <Route path="/pwa/dashboard" element={<PWADashboard />} />
              <Route path="/pwa/notifications" element={<PWANotifications />} />
              
              {/* Regular Web Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
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
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" richColors />
        </div>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
