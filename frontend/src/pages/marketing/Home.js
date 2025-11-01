import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Building2, MapPin, ArrowRight } from 'lucide-react';
import LanguageSelector from '../../components/LanguageSelector';
import ChatWidget from '../../components/ChatWidget';
import { usePageTranslation } from '../../hooks/usePageTranslation';
import apiInstance from '../../services/api';

const Home = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [featuredTenants, setFeaturedTenants] = useState([]);

  // Fetch featured tenants on component mount
  useEffect(() => {
    fetchFeaturedTenants();
  }, []);

  const fetchFeaturedTenants = async () => {
    try {
      const response = await apiInstance.get('/public/tenants?limit=6');
      if (response.data.success) {
        setFeaturedTenants(response.data.tenants);
      }
    } catch (error) {
      console.error('Failed to load featured tenants:', error);
    }
  };

  // Translation content
  const t = usePageTranslation({
    hero_title: "Real Estate",
    hero_subtitle: "40X Faster",
    hero_description: "Streamline your real estate business with our comprehensive ERP solution. Manage leads, properties, payments, and teams all in one place.",
    get_started: "Get Started Free",
    learn_more: "Learn More",
    trusted_by: "Trusted by 500+ Real Estate Professionals",
    features_title: "Everything You Need to Grow Your Real Estate Business",
    features_subtitle: "Powerful features designed for modern real estate professionals",
    // Features
    lead_management: "Lead Management",
    lead_desc: "Never lose a lead. Capture, track, and convert with intelligent workflows.",
    property_management: "Property Management",
    property_desc: "Manage unlimited properties with interactive layouts and virtual tours.",
    payment_tracking: "Payment Tracking",
    payment_desc: "Automated payment tracking, invoicing, and commission calculations.",
    team_collaboration: "Team Collaboration",
    team_desc: "Role-based access, task management, and real-time notifications.",
    analytics: "Analytics & Reports",
    analytics_desc: "Comprehensive insights into your business performance.",
    mobile_app: "Mobile App",
    mobile_desc: "Manage your business on-the-go with our PWA mobile app.",
    // Stats
    stat_properties: "Properties Managed",
    stat_leads: "Leads Tracked",
    stat_revenue: "Revenue Processed",
    stat_clients: "Happy Clients",
    // CTA
    cta_title: "Ready to Transform Your Real Estate Business?",
    cta_subtitle: "Join thousands of real estate professionals using RETOERP",
    cta_button: "Start Your Free Trial",
    // Footer
    footer_subscribe: "Subscribe to our newsletter",
    footer_email_placeholder: "Enter your email",
    footer_subscribe_button: "Subscribe",
    footer_subscribed: "Thank you for subscribing!",
    all_rights: "All rights reserved"
  });

  const handleEmailSubscribe = async (e) => {
    e.preventDefault();
    // TODO: Implement email subscription backend API
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Language Selector - Fixed Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-cyan-50 py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            {t.hero_title}, <span className="text-blue-600">{t.hero_subtitle}</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {t.hero_description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link 
              to="/register" 
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-all"
            >
              {t.get_started} →
            </Link>
            <Link 
              to="/login" 
              className="px-8 py-4 bg-white hover:bg-gray-50 text-blue-600 font-semibold rounded-lg border-2 border-blue-200 transition-all"
            >
              {t.learn_more}
            </Link>
          </div>
          
          <p className="text-gray-500 text-sm">
            ✨ {t.trusted_by}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
              <div className="text-5xl font-bold text-blue-600 mb-2">10+</div>
              <div className="text-gray-600 font-medium">Years Experience</div>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
              <div className="text-5xl font-bold text-blue-600 mb-2">40X</div>
              <div className="text-gray-600 font-medium">Faster Growth</div>
            </div>
            <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
              <div className="text-5xl font-bold text-blue-600 mb-2">0%</div>
              <div className="text-gray-600 font-medium">Lead Leakage</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              The Real Estate Problem
            </h2>
            <p className="text-xl text-gray-600">
              Traditional real estate operations lose money every day
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-md border border-red-100">
              <div className="text-5xl mb-4">📉</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lead Leakage</h3>
              <p className="text-gray-600">
                Losing qualified leads due to poor follow-up and manual processes
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-md border border-red-100">
              <div className="text-5xl mb-4">⏰</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Slow Processes</h3>
              <p className="text-gray-600">
                Manual work, delayed payments, and inefficient operations
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-md border border-red-100">
              <div className="text-5xl mb-4">💸</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Revenue Loss</h3>
              <p className="text-gray-600">
                Missing commissions, payment delays, and poor customer experience
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              RETOERP: The Complete Solution
            </h2>
            <p className="text-xl text-gray-600">
              Like AI transformed software development, we transform real estate operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature Cards */}
            {[
              {
                icon: '🤖',
                title: 'FREE 24×7 Expert Advisory',
                description: 'Free expert advisory available 24×7 for budget, location, numerology, and investment decisions'
              },
              {
                icon: '📊',
                title: 'Smart CRM',
                description: 'Track every lead, automate follow-ups, zero leakage'
              },
              {
                icon: '💳',
                title: 'Payment Automation',
                description: 'Automated reminders, receipts, and commission tracking'
              },
              {
                icon: '🔗',
                title: 'Referral System',
                description: 'Turn customers into brand ambassadors with rewards'
              },
              {
                icon: '📱',
                title: 'Mobile App',
                description: 'PWA mobile app for on-the-go access'
              },
              {
                icon: '🌐',
                title: 'Multi-Language',
                description: 'English, Telugu, Hindi, and more'
              },
              {
                icon: '📧',
                title: 'Omni-Channel',
                description: 'SMS, Email, WhatsApp notifications'
              },
              {
                icon: '🎯',
                title: 'Visual Layouts',
                description: 'Interactive property layouts with real-time status'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100 hover:shadow-lg transition-all">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Complete Real Estate Ecosystem
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to succeed in one platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Real Estate Companies</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Multi-tenant SaaS architecture
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Complete CRM and lead management
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Booking and payment automation
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Commission tracking and reports
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Customers</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  FREE 24×7 Expert Advisory - Get instant property guidance anytime
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Customer portal for bookings & payments
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Referral rewards and benefits
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Educational content and insights
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Partners Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Leading Real Estate Companies
            </h2>
            <p className="text-xl text-gray-600">
              Discover companies powered by RETOERP across India
            </p>
          </div>

          {featuredTenants.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                {featuredTenants.slice(0, 6).map((tenant) => (
                  <div
                    key={tenant.id}
                    onClick={() => navigate(`/public/tenant/${tenant.id}`)}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105 border-2 border-transparent hover:border-blue-500"
                  >
                    {/* Company Header */}
                    <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-6 text-white">
                      <div className="flex items-center gap-4">
                        {tenant.logo_url ? (
                          <img
                            src={tenant.logo_url}
                            alt={tenant.company_name}
                            className="h-14 w-14 bg-white rounded-full object-contain p-2"
                          />
                        ) : (
                          <div className="h-14 w-14 bg-white rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-xl">
                              {tenant.company_name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-bold truncate">{tenant.company_name}</h3>
                          {(tenant.city || tenant.state) && (
                            <div className="flex items-center gap-1 text-sm text-blue-100 mt-1">
                              <MapPin size={14} />
                              <span className="truncate">
                                {tenant.city}{tenant.city && tenant.state && ', '}{tenant.state}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Company Stats */}
                    <div className="p-6">
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center">
                          <p className="text-xl font-bold text-blue-600">{tenant.project_count || 0}</p>
                          <p className="text-xs text-gray-600">Projects</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-green-600">{tenant.property_count || 0}</p>
                          <p className="text-xs text-gray-600">Properties</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-purple-600">{tenant.booking_count || 0}</p>
                          <p className="text-xs text-gray-600">Bookings</p>
                        </div>
                      </div>

                      <button className="w-full py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition font-semibold text-sm flex items-center justify-center gap-2">
                        View Company <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={() => navigate('/tenants')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
                >
                  <Building2 size={20} />
                  View All Companies
                  <ArrowRight size={20} />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Building2 size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Featured companies will appear here</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Transform Your Real Estate Business?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join hundreds of real estate companies using RETOERP
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link 
                to="/register" 
                className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 shadow-lg transition-all"
              >
                Start Free Trial
              </Link>
              <Link 
                to="/pricing" 
                className="px-8 py-4 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition-all"
              >
                View Pricing
              </Link>
            </div>

            {/* Email Subscription */}
            <div className="max-w-md mx-auto">
              <h3 className="text-xl mb-4">Get Real Estate Tips & Updates</h3>
              <form onSubmit={handleEmailSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-4 py-3 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:border-white"
                />
                <button 
                  type="submit"
                  className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-all"
                >
                  Subscribe
                </button>
              </form>
              {subscribed && (
                <p className="text-green-200 mt-2">Thank you! You're subscribed to our newsletter.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 border-t border-gray-200">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">RETOERP</h3>
              <p className="text-gray-600">
                Transforming real estate operations with AI and automation
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/features" className="text-gray-600 hover:text-blue-600">Features</Link></li>
                <li><Link to="/pricing" className="text-gray-600 hover:text-blue-600">Pricing</Link></li>
                <li><Link to="/content" className="text-gray-600 hover:text-blue-600">Knowledge Hub</Link></li>
                <li><Link to="/advisory" className="text-gray-600 hover:text-blue-600">Free AI Advisory</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-600 hover:text-blue-600">About Us</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Get Started</h4>
              <ul className="space-y-2">
                <li><Link to="/register" className="text-gray-600 hover:text-blue-600">Sign Up</Link></li>
                <li><Link to="/login" className="text-gray-600 hover:text-blue-600">Login</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-gray-600">
              © 2025 RETOERP. All rights reserved. | 10+ Years in Real Estate Excellence
            </p>
          </div>
        </div>
      </footer>
      
      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default Home;
