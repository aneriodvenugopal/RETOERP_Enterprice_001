import React, { useState, useEffect } from 'react';
import { 
  Zap, Home, Search, Mic, ShoppingCart, List, 
  Heart, Share2, UserPlus, HelpCircle, X 
} from 'lucide-react';
import { useLanguage } from '../i18n/translations';
import './IncomeLandsDashboard.css';

const IncomeLandsDashboard = ({ user, credits, onModuleClick, onShareApp }) => {
  const { t } = useLanguage();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0);

  useEffect(() => {
    // Show onboarding on first visit
    const hasSeenOnboarding = localStorage.getItem('incomelands_onboarding_seen');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const modules = [
    {
      id: 'quick-post',
      icon: Zap,
      title: 'Quick Property Post',
      subtitle: 'Post in 5 simple questions',
      color: '#FF6B35',
      description: 'Fastest way to add property - just answer 5 questions and done!',
      gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)'
    },
    {
      id: 'post-property',
      icon: Home,
      title: 'Post Your Property',
      subtitle: 'Plot, Flat, Land',
      color: '#4CAF50',
      description: 'Choose property type and add detailed information',
      gradient: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)'
    },
    {
      id: 'search',
      icon: Search,
      title: 'Search Property',
      subtitle: 'Find what you need',
      color: '#2196F3',
      description: 'Search from thousands of properties by location, price, size',
      gradient: 'linear-gradient(135deg, #2196F3 0%, #03A9F4 100%)'
    },
    {
      id: 'voice-post',
      icon: Mic,
      title: 'Voice Property Post',
      subtitle: 'Speak to add property',
      color: '#9C27B0',
      description: 'Just speak and AI will create property listing for you',
      gradient: 'linear-gradient(135deg, #9C27B0 0%, #E91E63 100%)'
    },
    {
      id: 'buy-rent',
      icon: ShoppingCart,
      title: 'Want to Buy/Rent',
      subtitle: 'Client requirements',
      color: '#FF9800',
      description: 'Save your client requirements for easy followup',
      gradient: 'linear-gradient(135deg, #FF9800 0%, #FF5722 100%)'
    },
    {
      id: 'my-properties',
      icon: List,
      title: 'My Properties',
      subtitle: 'Your listings',
      color: '#00BCD4',
      description: 'View, edit, delete all your posted properties',
      gradient: 'linear-gradient(135deg, #00BCD4 0%, #009688 100%)'
    },
    {
      id: 'followup',
      icon: UserPlus,
      title: 'Followup',
      subtitle: 'Manage contacts',
      color: '#795548',
      description: 'Import 10 priority contacts for focused followup',
      gradient: 'linear-gradient(135deg, #795548 0%, #8D6E63 100%)'
    },
    {
      id: 'favourites',
      icon: Heart,
      title: 'Favourite Properties',
      subtitle: 'Your wishlist',
      color: '#E91E63',
      description: 'Properties you liked and want to revisit',
      gradient: 'linear-gradient(135deg, #E91E63 0%, #F06292 100%)'
    },
    {
      id: 'share-app',
      icon: Share2,
      title: 'Share App',
      subtitle: 'Earn 10 credits per friend',
      color: '#673AB7',
      description: 'Share with all your contacts at once and earn credits!',
      gradient: 'linear-gradient(135deg, #673AB7 0%, #9C27B0 100%)'
    }
  ];

  const onboardingSteps = modules.map(module => ({
    title: module.title,
    description: module.description,
    icon: module.icon,
    color: module.color
  }));

  const handleOnboardingComplete = () => {
    localStorage.setItem('incomelands_onboarding_seen', 'true');
    setShowOnboarding(false);
    setCurrentOnboardingStep(0);
  };

  const handleModuleClick = (moduleId) => {
    if (moduleId === 'share-app') {
      onShareApp();
    } else {
      onModuleClick(moduleId);
    }
  };

  return (
    <div className="incomelands-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>IncomeLands</h1>
          <p className="tagline">Your Property Pocket Diary 📖</p>
        </div>
        <div className="header-right">
          <div className="credits-badge">
            <span className="credits-icon">💰</span>
            <span className="credits-amount">{credits}</span>
          </div>
          <button 
            className="help-btn"
            onClick={() => setShowOnboarding(true)}
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="welcome-message">
        <h2>Welcome, {user?.name || 'Agent'}! 👋</h2>
        <p>What would you like to do today?</p>
      </div>

      {/* Modules Grid */}
      <div className="modules-grid">
        {modules.map((module) => {
          const IconComponent = module.icon;
          return (
            <div
              key={module.id}
              className="module-card"
              onClick={() => handleModuleClick(module.id)}
              style={{ background: module.gradient }}
            >
              <div className="module-icon">
                <IconComponent size={28} color="white" />
              </div>
              <div className="module-content">
                <h3>{module.title}</h3>
                <p>{module.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-item">
          <div className="stat-value">0</div>
          <div className="stat-label">Properties Posted</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">0</div>
          <div className="stat-label">Favourites</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">0</div>
          <div className="stat-label">Followups</div>
        </div>
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="onboarding-overlay">
          <div className="onboarding-modal">
            <button 
              className="close-onboarding"
              onClick={handleOnboardingComplete}
            >
              <X size={24} />
            </button>

            <div className="onboarding-content">
              {(() => {
                const step = onboardingSteps[currentOnboardingStep];
                const IconComponent = step.icon;
                return (
                  <>
                    <div 
                      className="onboarding-icon"
                      style={{ background: step.color }}
                    >
                      <IconComponent size={48} color="white" />
                    </div>
                    <h2>{step.title}</h2>
                    <p>{step.description}</p>
                  </>
                );
              })()}
            </div>

            <div className="onboarding-navigation">
              <div className="onboarding-dots">
                {onboardingSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`dot ${index === currentOnboardingStep ? 'active' : ''}`}
                  />
                ))}
              </div>

              <div className="onboarding-buttons">
                {currentOnboardingStep > 0 && (
                  <button
                    className="onboarding-btn secondary"
                    onClick={() => setCurrentOnboardingStep(prev => prev - 1)}
                  >
                    Previous
                  </button>
                )}
                
                {currentOnboardingStep < onboardingSteps.length - 1 ? (
                  <button
                    className="onboarding-btn primary"
                    onClick={() => setCurrentOnboardingStep(prev => prev + 1)}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    className="onboarding-btn primary"
                    onClick={handleOnboardingComplete}
                  >
                    Get Started
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomeLandsDashboard;
