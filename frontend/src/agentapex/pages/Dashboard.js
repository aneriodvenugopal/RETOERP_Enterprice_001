import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Home, Search, PlusSquare, Heart, User,
  Building2, MapPin, Users, TrendingUp, ChevronRight,
  FileText, Clock
} from 'lucide-react';

// iOS-style stagger animation
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

// iOS-style Bottom Navigation with blur
const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path) => location.pathname === `/agentapex${path}` || (path === '/' && location.pathname === '/agentapex');
  
  return (
    <nav className="bottom-nav ios-nav">
      <motion.button 
        whileTap={{ scale: 0.85 }} 
        onClick={() => navigate('/agentapex')} 
        data-testid="nav-home"
        className="flex flex-col items-center gap-1"
      >
        <Home className={`w-6 h-6 transition-all duration-200 ${isActive('/') ? 'text-blue-500' : 'text-gray-400'}`} strokeWidth={isActive('/') ? 2.5 : 1.5} />
        {isActive('/') && <motion.div layoutId="navIndicator" className="w-1 h-1 bg-blue-500 rounded-full" />}
      </motion.button>
      <motion.button 
        whileTap={{ scale: 0.85 }} 
        onClick={() => navigate('/agentapex/search')} 
        data-testid="nav-search"
        className="flex flex-col items-center gap-1"
      >
        <Search className={`w-6 h-6 transition-all duration-200 ${isActive('/search') ? 'text-blue-500' : 'text-gray-400'}`} strokeWidth={isActive('/search') ? 2.5 : 1.5} />
        {isActive('/search') && <motion.div layoutId="navIndicator" className="w-1 h-1 bg-blue-500 rounded-full" />}
      </motion.button>
      <motion.button 
        whileTap={{ scale: 0.85 }} 
        onClick={() => navigate('/agentapex/post')} 
        data-testid="nav-post"
        className="flex flex-col items-center gap-1"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
          <PlusSquare className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
      </motion.button>
      <motion.button 
        whileTap={{ scale: 0.85 }} 
        onClick={() => navigate('/agentapex/favorites')} 
        data-testid="nav-favorites"
        className="flex flex-col items-center gap-1"
      >
        <Heart className={`w-6 h-6 transition-all duration-200 ${isActive('/favorites') ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} strokeWidth={isActive('/favorites') ? 2.5 : 1.5} />
        {isActive('/favorites') && <motion.div layoutId="navIndicator" className="w-1 h-1 bg-red-500 rounded-full" />}
      </motion.button>
      <motion.button 
        whileTap={{ scale: 0.85 }} 
        onClick={() => navigate('/agentapex/profile')} 
        data-testid="nav-profile"
        className="flex flex-col items-center gap-1"
      >
        <User className={`w-6 h-6 transition-all duration-200 ${isActive('/profile') ? 'text-blue-500' : 'text-gray-400'}`} strokeWidth={isActive('/profile') ? 2.5 : 1.5} />
        {isActive('/profile') && <motion.div layoutId="navIndicator" className="w-1 h-1 bg-blue-500 rounded-full" />}
      </motion.button>
    </nav>
  );
};

// iOS-style Stat Card with spring animation
const StatCard = ({ icon: Icon, label, value, color, onClick }) => (
  <motion.button
    variants={itemVariants}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="flex-1 bg-white border border-gray-100 rounded-2xl p-4 text-left shadow-sm active:shadow-none transition-shadow"
  >
    <motion.div 
      className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}
      whileHover={{ scale: 1.05 }}
    >
      <Icon className="w-5 h-5 text-white" />
    </motion.div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-gray-500 text-sm">{label}</p>
  </motion.button>
);

// iOS-style Menu Item with smooth press effect
const MenuItem = ({ icon: Icon, label, sublabel, onClick, badge }) => (
  <motion.button
    variants={itemVariants}
    whileTap={{ scale: 0.98, backgroundColor: 'rgba(0,0,0,0.03)' }}
    onClick={onClick}
    className="w-full flex items-center gap-4 p-4 bg-white border-b border-gray-50 transition-colors"
  >
    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
      <Icon className="w-6 h-6 text-gray-600" />
    </div>
    <div className="flex-1 text-left">
      <p className="text-base font-medium text-gray-900">{label}</p>
      {sublabel && <p className="text-sm text-gray-500">{sublabel}</p>}
    </div>
    <div className="flex items-center gap-2">
      {badge && (
        <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
          {badge}
        </span>
      )}
      <ChevronRight className="w-5 h-5 text-gray-300" />
    </div>
  </motion.button>
);

const Dashboard = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ properties: 0, leads: 0, followups: 0, favorites: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api().get('/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error:', error);
      }
      setLoading(false);
    };
    fetchStats();
  }, [api]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* iOS-style Header with blur */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="ios-header border-b border-gray-100 px-4 py-3 sticky top-0 z-50"
      >
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            whileTap={{ scale: 0.97 }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">AgentApex</h1>
            </div>
          </motion.div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Welcome back</p>
            <p className="text-sm font-semibold text-gray-900">{user?.name || user?.phone}</p>
          </div>
        </div>
      </motion.header>

      {/* Stats Section with stagger animation */}
      <motion.div 
        className="p-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <div className="flex gap-3">
          <StatCard
            icon={Building2}
            label="Properties"
            value={loading ? '-' : stats.properties}
            color="bg-amber-500"
            onClick={() => navigate('/agentapex/my-properties')}
          />
          <StatCard
            icon={TrendingUp}
            label="Leads"
            value={loading ? '-' : stats.leads}
            color="bg-green-500"
            onClick={() => navigate('/agentapex/leads')}
          />
        </div>
        
        <div className="flex gap-3 mt-3">
          <StatCard
            icon={Users}
            label="Follow-ups"
            value={loading ? '-' : stats.followups}
            color="bg-blue-500"
            onClick={() => navigate('/agentapex/followups')}
          />
          <StatCard
            icon={Heart}
            label="Saved"
            value={loading ? '-' : stats.favorites}
            color="bg-pink-500"
            onClick={() => navigate('/agentapex/favorites')}
          />
        </div>
      </motion.div>

      {/* Quick Actions with spring animation */}
      <motion.div 
        className="px-4 mb-4"
        variants={itemVariants}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          onClick={() => navigate('/agentapex/post')}
          data-testid="quick-post-btn"
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-left shadow-xl shadow-blue-500/25"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-lg">Post Property</p>
              <p className="text-blue-100 text-sm">Sell your land or plot</p>
            </div>
            <motion.div 
              className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"
              whileHover={{ rotate: 90 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <PlusSquare className="w-6 h-6 text-white" />
            </motion.div>
          </div>
        </motion.button>
      </motion.div>

      {/* Menu List with stagger */}
      <motion.div 
        className="bg-white rounded-t-3xl shadow-sm"
        variants={containerVariants}
      >
        <MenuItem
          icon={MapPin}
          label="Map Search"
          sublabel="Find properties near you"
          onClick={() => navigate('/agentapex/search')}
        />
        <MenuItem
          icon={Building2}
          label="My Properties"
          sublabel={`${stats.properties} listed`}
          onClick={() => navigate('/agentapex/my-properties')}
          badge={stats.properties > 0 ? stats.properties : null}
        />
        <MenuItem
          icon={Clock}
          label="Follow-ups"
          sublabel="Manage your contacts"
          onClick={() => navigate('/agentapex/followups')}
          badge={stats.followups > 0 ? stats.followups : null}
        />
        <MenuItem
          icon={FileText}
          label="Requirements"
          sublabel="Post your property needs"
          onClick={() => navigate('/agentapex/requirements')}
        />
        <MenuItem
          icon={TrendingUp}
          label="Leads"
          sublabel="Track buyer enquiries"
          onClick={() => navigate('/agentapex/leads')}
          badge={stats.leads > 0 ? stats.leads : null}
        />
      </motion.div>

      {/* iOS-style Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Dashboard;
