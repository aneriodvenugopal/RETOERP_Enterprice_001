import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Building2, MapPin, ArrowRight, Building } from 'lucide-react';
import ChatWidget from '../../components/ChatWidget';
import HeroCarousel from '../../components/HeroCarousel';
import StickyNavbar from '../../components/StickyNavbar';
import FloatingWhatsApp from '../../components/FloatingWhatsApp';
import SuccessStories from '../../components/SuccessStories';
import ROICalculator from '../../components/ROICalculator';
import WhoBenefits from '../../components/WhoBenefits';
import FeatureHighlights from '../../components/FeatureHighlights';
import Testimonials from '../../components/Testimonials';
import ImplementationSupport from '../../components/ImplementationSupport';
import OurStory from '../../components/OurStory';
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
      {/* Sticky Navigation */}
      <StickyNavbar />
      
      {/* Hero Carousel */}
      <HeroCarousel />
      
      {/* Our Story */}
      <OurStory />
      
      {/* Stats Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
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

      {/* Multi-Project Management Highlight Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              {/* Left side - Content */}
              <div className="text-white">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Manage Multiple Projects, One Seamless Experience
                </h2>
                <p className="text-xl mb-4 opacity-90">
                  Work on multiple real estate projects simultaneously without losing context
                </p>
                <p className="text-lg mb-6 opacity-80 leading-relaxed">
                  Switch effortlessly between properties, leads, and developments. RETOERP keeps all your projects organized and accessible - so you can focus on what matters most: closing deals and growing your business.
                </p>
                
                {/* Key Benefits */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✓</span>
                    <div>
                      <p className="font-semibold">Unified Dashboard</p>
                      <p className="text-sm opacity-80">See all projects, leads, and bookings in one place</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✓</span>
                    <div>
                      <p className="font-semibold">Context Switching Made Easy</p>
                      <p className="text-sm opacity-80">Jump between projects without losing track of important details</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✓</span>
                    <div>
                      <p className="font-semibold">Cross-Project Analytics</p>
                      <p className="text-sm opacity-80">Compare performance across all your developments</p>
                    </div>
                  </div>
                </div>
                
                <Link
                  to="/features"
                  className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
                >
                  Explore All Features →
                </Link>
              </div>
              
              {/* Right side - Visual */}
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <div className="space-y-4">
                    {/* Project Cards Mockup */}
                    <div className="bg-white rounded-lg p-4 shadow-xl transform hover:scale-105 transition">
                      <div className="flex items-center gap-3 mb-2">
                        <Building className="w-6 h-6 text-blue-600" />
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">Green Valley Apartments</p>
                          <p className="text-xs text-gray-600">15 Leads • 8 Bookings • ₹2.4Cr</p>
                        </div>
                        <span className="text-green-600 text-xs font-semibold">Active</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-xl transform hover:scale-105 transition">
                      <div className="flex items-center gap-3 mb-2">
                        <Building className="w-6 h-6 text-purple-600" />
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">Sunrise Villas</p>
                          <p className="text-xs text-gray-600">23 Leads • 12 Bookings • ₹5.1Cr</p>
                        </div>
                        <span className="text-green-600 text-xs font-semibold">Active</span>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-xl transform hover:scale-105 transition">
                      <div className="flex items-center gap-3 mb-2">
                        <Building className="w-6 h-6 text-orange-600" />
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">Palm Residency</p>
                          <p className="text-xs text-gray-600">8 Leads • 3 Bookings • ₹1.2Cr</p>
                        </div>
                        <span className="text-green-600 text-xs font-semibold">Active</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-white/90 text-sm font-semibold">
                      Switch between projects with a single click
                    </p>
                  </div>
                </div>
              </div>
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
            <div className="bg-white rounded-xl p-8 shadow-md border border-red-100 hover:shadow-xl transition-all">
              <div className="text-5xl mb-4">📉</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lead Leakage</h3>
              <p className="text-gray-600 mb-4">
                Losing qualified leads due to poor follow-up and manual processes
              </p>
              <Link 
                to="/examples/lead-leakage"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
              >
                Learn More →
              </Link>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-md border border-red-100 hover:shadow-xl transition-all">
              <div className="text-5xl mb-4">⏰</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Slow Processes</h3>
              <p className="text-gray-600 mb-4">
                Manual work, delayed payments, and inefficient operations
              </p>
              <Link 
                to="/examples/slow-processes"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
              >
                Learn More →
              </Link>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-md border border-red-100 hover:shadow-xl transition-all">
              <div className="text-5xl mb-4">💸</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Revenue Loss</h3>
              <p className="text-gray-600 mb-4">
                Missing commissions, payment delays, and poor customer experience
              </p>
              <Link 
                to="/examples/revenue-loss"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
              >
                Learn More →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              RETOERP SOFTWARE: The Complete Solution
            </h2>
            <p className="text-xl text-gray-600">
              Like AI transformed software development, we transform real estate operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature Cards */}
            {[
              {
                icon: '🏢',
                title: 'Multi-Project Management',
                description: 'Seamlessly manage multiple projects simultaneously - switch between developments without losing context'
              },
              {
                icon: '👥',
                title: 'FREE 24×7 Expert Advisory',
                description: 'Free expert advisory from experienced professionals - available 24×7 for budget, location, and investment guidance'
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

      {/* Services Showcase Carousel */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Real Estate Solutions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to manage and grow your real estate business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Service Cards */}
            {[
              {
                icon: '📊',
                title: 'Smart CRM & Lead Management',
                description: 'Track leads, automate follow-ups, and never miss an opportunity',
                features: ['Lead scoring', 'Auto-assignment', 'Follow-up reminders', 'Conversion tracking'],
                link: '/solutions/crm'
              },
              {
                icon: '💰',
                title: 'Payment & Booking Automation',
                description: 'Streamline bookings, payments, and commission tracking',
                features: ['Online payments', 'EMI management', 'Commission splits', 'Payment reminders'],
                link: '/solutions/payments'
              },
              {
                icon: '🗺️',
                title: 'Visual Property Layouts',
                description: 'Interactive property maps with real-time availability',
                features: ['DXF/SVG import', 'Interactive maps', 'Live availability', 'Virtual tours'],
                link: '/solutions/property-layouts'
              },
              {
                icon: '👥',
                title: 'FREE 24×7 Expert Advisory',
                description: 'Free expert advisory from experienced professionals - available 24×7 for budget, location, and investment guidance',
                features: ['Budget advisory', 'Location insights', 'Investment analysis', 'Multi-language'],
                link: '/advisory'
              },
              {
                icon: '📧',
                title: 'Communication Hub',
                description: 'Automated SMS, Email, WhatsApp campaigns',
                features: ['Bulk messaging', 'Event triggers', 'Multi-language', 'Delivery reports'],
                link: '/solutions/communication'
              },
              {
                icon: '📈',
                title: 'Analytics & Insights',
                description: 'Data-driven decisions with comprehensive reports',
                features: ['Sales dashboard', 'Revenue reports', 'Team performance', 'Custom reports'],
                link: '/solutions/analytics'
              }
            ].map((service, index) => (
              <Link 
                key={index} 
                to={service.link}
                className="bg-white/80 rounded-xl p-8 hover:shadow-xl transition-all border border-gray-200/50 group cursor-pointer block"
              >
                <div className="text-6xl mb-4">{service.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                <ul className="space-y-2 mb-4">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm text-gray-700">
                      <span className="text-blue-600 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="text-blue-600 font-semibold group-hover:underline">
                  Learn More →
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link 
              to="/features" 
              className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all"
            >
              Explore All Features →
            </Link>
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
                  Multi-project workspace - Manage unlimited projects simultaneously
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Multi-tenant SaaS architecture for enterprise scale
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Complete CRM and lead management with zero leakage
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Booking and payment automation across all projects
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  Cross-project commission tracking and reports
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

      {/* FREE 24×7 Expert Advisory CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              {/* Left side - Expert Team Image */}
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <img 
                    src="https://customer-assets.emergentagent.com/job_e1c4c75b-1560-4c52-a1d3-ae57271eccb9/artifacts/oyr6re22_ChatGPT%20Image%20Nov%201%2C%202025%2C%2009_59_36%20PM.png" 
                    alt="Expert Real Estate Advisory Team - Indian Women Professionals" 
                    className="rounded-xl shadow-2xl w-full"
                  />
                  <div className="absolute -bottom-4 -right-4 bg-white text-blue-600 px-6 py-3 rounded-lg shadow-xl font-bold">
                    🎯 10+ Years Experience
                  </div>
                </div>
              </div>
              
              {/* Right side - Content */}
              <div className="text-white">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  FREE 24×7 Expert Advisory
                </h2>
                <p className="text-xl md:text-2xl mb-4 opacity-90">
                  Get instant, personalized guidance from our team of real estate experts
                </p>
                <p className="text-lg mb-6 opacity-80">
                  Our experienced advisors analyze your requirements and provide tailored recommendations within seconds
                </p>
                
                {/* Services List */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">💰</span>
                    <span>Budget Advisory</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📍</span>
                    <span>Location Insights</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">⭐</span>
                    <span>Best Projects</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📈</span>
                    <span>Investment Analysis</span>
                  </div>
                </div>
                
                <Link
                  to="/advisory"
                  className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
                >
                  Talk to Our Experts Now →
                </Link>
                
                <p className="mt-6 text-sm opacity-75">
                  ✓ Available 24×7 &nbsp;&nbsp; ✓ Completely Free &nbsp;&nbsp; ✓ Instant Response &nbsp;&nbsp; ✓ Multi-language Support
                </p>
              </div>
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

      {/* Success Stories */}
      <SuccessStories />

      {/* Client Testimonials */}
      <Testimonials />

      {/* Implementation & Support */}
      <ImplementationSupport />

      {/* Who Benefits - Complete Ecosystem */}
      <WhoBenefits />

      {/* Feature Highlights */}
      <FeatureHighlights />

      {/* ROI Calculator */}
      <ROICalculator />

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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">RETOERP</h3>
              <p className="text-gray-600">
                Transforming real estate operations with expert advisory and automation
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/features" className="text-gray-600 hover:text-blue-600">Features</Link></li>
                <li><Link to="/pricing" className="text-gray-600 hover:text-blue-600">Pricing</Link></li>
                <li><Link to="/content" className="text-gray-600 hover:text-blue-600">Knowledge Hub</Link></li>
                <li><Link to="/advisory" className="text-gray-600 hover:text-blue-600">FREE 24×7 Expert Advisory</Link></li>
                <li><Link to="/tenants" className="text-gray-600 hover:text-blue-600">Our Partners</Link></li>
                <li><Link to="/faq" className="text-gray-600 hover:text-blue-600">FAQ for Companies</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-600 hover:text-blue-600">About Us</Link></li>
                <li><Link to="/contact" className="text-gray-600 hover:text-blue-600">Contact Us</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Legal & Policies</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy-policy" className="text-gray-600 hover:text-blue-600">Privacy Policy</Link></li>
                <li><Link to="/terms-conditions" className="text-gray-600 hover:text-blue-600">Terms & Conditions</Link></li>
                <li><Link to="/refund-policy" className="text-gray-600 hover:text-blue-600">Cancellation & Refund</Link></li>
                <li><Link to="/shipping-policy" className="text-gray-600 hover:text-blue-600">Shipping Policy</Link></li>
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
          
          <div className="border-t border-gray-200 mt-8 pt-8">
            <div className="text-center mb-4">
              <p className="text-gray-600 mb-2">
                © 2025 RETOERP. All rights reserved. | 10+ Years in Real Estate Excellence
              </p>
              <p className="text-sm text-gray-500">
                Secure payments powered by Razorpay & Stripe | Data protected with industry-standard encryption
              </p>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Floating WhatsApp Button */}
      <FloatingWhatsApp />
      
      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default Home;
