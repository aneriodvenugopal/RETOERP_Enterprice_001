import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { Toaster } from "sonner";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectLayoutPage from "./pages/ProjectLayoutPage";
import PublicLayoutView from "./pages/PublicLayoutView";
import Leads from "./pages/Leads";
import Bookings from "./pages/Bookings";
import Reports from "./pages/Reports";
import UsersManagement from "./pages/UsersManagement";
import CustomerDashboard from "./pages/CustomerDashboard";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <div className="App">
          <BrowserRouter>
            <Routes>
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
