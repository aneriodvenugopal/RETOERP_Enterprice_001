import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Building2, Users, BarChart3, FileText, UserCog, Home, Layers, MessageSquare } from 'lucide-react';
import NotificationCenter from '../components/notifications/NotificationCenter';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Auto-redirect customers to their dedicated portal
  useEffect(() => {
    if (user?.role === 'customer') {
      navigate('/customer-dashboard', { replace: true });
    }
  }, [user, navigate]);

  const getDashboardContent = () => {
    switch (user?.role) {
      case 'super_admin':
        return <SuperAdminDashboard />;
      case 'tenant_admin':
        return <TenantAdminDashboard />;
      case 'staff':
        return <StaffDashboard />;
      case 'customer':
        return null;
      default:
        return <DefaultDashboard />;
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-ocean-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-ocean-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <header className="glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-primary to-ocean-secondary flex items-center justify-center shadow-lg">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-ocean-primary to-ocean-secondary bg-clip-text text-transparent">RETOERP</h1>
                <p className="text-xs text-gray-500">Welcome, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationCenter />
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-ocean-primary capitalize">{typeof user?.role === 'string' ? user.role.replace('_', ' ') : 'User'}</p>
              </div>
              <Button 
                onClick={logout}
                className="bg-gradient-to-r from-ocean-primary to-ocean-secondary hover:from-ocean-primary-light hover:to-ocean-secondary-light text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {getDashboardContent()}
      </main>
    </div>
  );
};

// Super Admin Dashboard
const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Check if user is SaaS admin (phone: 9948303060)
  const isSaaSAdmin = user?.phone === '9948303060';
  
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={Building2} title="Total Tenants" value="0" gradient="from-ocean-primary to-ocean-secondary" />
        <StatCard icon={Users} title="Total Users" value="0" gradient="from-ocean-secondary to-ocean-accent" />
        <StatCard icon={BarChart3} title="Active Subscriptions" value="0" gradient="from-ocean-accent to-ocean-primary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isSaaSAdmin && (
          <>
            <ActionCard
              icon={Building2}
              title="SaaS Admin Dashboard"
              description="Manage tenants, packages & analytics"
              onClick={() => navigate('/admin/saas-dashboard')}
              gradient="from-purple-500 to-pink-500"
            />
            <ActionCard
              icon={MapPin}
              title="IncomeLands Marketplace"
              description="Monitor agents, leads & commissions"
              onClick={() => navigate('/admin/incomelands')}
              gradient="from-blue-500 to-purple-500"
            />
          </>
        )}
        <ActionCard
          icon={MessageSquare}
          title="Chat Management"
          description="View conversations & manage leads"
          onClick={() => navigate('/admin/chats')}
          gradient="from-blue-500 to-cyan-500"
        />
        <ActionCard
          icon={Home}
          title="Customer Portal"
          description="Preview customer experience"
          onClick={() => navigate('/customer-dashboard')}
        />
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-ocean-primary">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No recent activity</p>
        </CardContent>
      </Card>
    </div>
  );
};

// Tenant Admin Dashboard
const TenantAdminDashboard = () => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Tenant Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          icon={Building2} 
          title="Projects" 
          value="0" 
          gradient="from-ocean-primary to-ocean-secondary"
          onClick={() => navigate('/projects')} 
        />
        <StatCard 
          icon={Users} 
          title="Leads" 
          value="0" 
          gradient="from-ocean-secondary to-ocean-accent"
          onClick={() => navigate('/leads')} 
        />
        <StatCard 
          icon={BarChart3} 
          title="Bookings" 
          value="0" 
          gradient="from-ocean-accent to-ocean-success"
          onClick={() => navigate('/bookings')} 
        />
        <StatCard 
          icon={Users} 
          title="Team" 
          value="0" 
          gradient="from-ocean-success to-ocean-primary"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ActionCard
          icon={Building2}
          title="Projects"
          description="Manage your real estate projects"
          onClick={() => navigate('/projects')}
        />
        <ActionCard
          icon={Layers}
          title="Layouts Library"
          description="Manage property layouts and maps"
          onClick={() => navigate('/layouts')}
        />
        <ActionCard
          icon={Users}
          title="Leads"
          description="Manage and track your leads"
          onClick={() => navigate('/leads')}
        />
        <ActionCard
          icon={BarChart3}
          title="Bookings & Sales"
          description="Track bookings and payments"
          onClick={() => navigate('/bookings')}
        />
        <ActionCard
          icon={FileText}
          title="Reports & Analytics"
          description="View insights and reports"
          onClick={() => navigate('/reports')}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActionCard
          icon={UserCog}
          title="Users & Staff"
          description="Manage team members and roles"
          onClick={() => navigate('/users')}
        />
        <ActionCard
          icon={Home}
          title="Customer Portal"
          description="View customer experience"
          onClick={() => navigate('/customer-dashboard')}
        />
      </div>
    </div>
  );
};

// Staff Dashboard
const StaffDashboard = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Staff Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={Users} title="My Leads" value="0" gradient="from-ocean-primary to-ocean-secondary" />
        <StatCard icon={BarChart3} title="Conversions" value="0" gradient="from-ocean-secondary to-ocean-success" />
        <StatCard icon={Building2} title="Follow-ups Today" value="0" gradient="from-ocean-success to-ocean-accent" />
      </div>
    </div>
  );
};

// Default Dashboard
const DefaultDashboard = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-ocean-primary">Welcome to RETOERP</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Your dashboard is being set up...</p>
        </CardContent>
      </Card>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, title, value, gradient, onClick }) => {
  return (
    <Card 
      className={`glass-card hover-lift ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold mt-2 text-gray-900">{value}</p>
          </div>
          <div className={`p-4 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Action Card Component
const ActionCard = ({ icon: Icon, title, description, onClick, gradient = "from-ocean-primary to-ocean-secondary" }) => {
  return (
    <Card className="glass-card hover-lift cursor-pointer" onClick={onClick}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Dashboard;