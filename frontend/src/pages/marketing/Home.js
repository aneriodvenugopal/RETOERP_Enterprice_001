import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import LanguageSelector from '../../components/LanguageSelector';

const Home = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleEmailSubscribe = async (e) => {
    e.preventDefault();
    // TODO: Implement email subscription backend API
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900">
      {/* Language Selector - Fixed Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1599090738077-75-1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaGZvcnwyXHxwcm8xcm8zcG9ydHwsIHRoZSBsYXN0IGZpcnN0IGltYWdlKQ==&q=85)' }}
        />
        
        {/* Content */}
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Real Estate, <span className="text-cyan-300">40X Faster</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
            Transform your real estate business with AI-powered automation. 
            Zero leakage, maximum profits.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link 
              to="/register" 
              className="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all"
            >
              Get Started Free
            </Link>
            <Link 
              to="/login" 
              className="px-8 py-4 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-semibold rounded-lg border-2 border-white/30 transition-all"
            >
              Sign In
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <div className="text-4xl font-bold text-cyan-300 mb-2">10+</div>
              <div className="text-white">Years Experience</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <div className="text-4xl font-bold text-cyan-300 mb-2">40X</div>
              <div className="text-white">Faster Growth</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <div className="text-4xl font-bold text-cyan-300 mb-2">0%</div>
              <div className="text-white">Lead Leakage</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-gray-900/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              The Real Estate Problem
            </h2>
            <p className="text-xl text-gray-300">
              Traditional real estate operations lose money every day
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-red-900/30 backdrop-blur-md rounded-lg p-8 border border-red-500/30">
              <div className="text-5xl mb-4">📉</div>
              <h3 className="text-xl font-bold text-white mb-3">Lead Leakage</h3>
              <p className="text-gray-300">
                Losing qualified leads due to poor follow-up and manual processes
              </p>
            </div>
            
            <div className="bg-red-900/30 backdrop-blur-md rounded-lg p-8 border border-red-500/30">
              <div className="text-5xl mb-4">⏰</div>
              <h3 className="text-xl font-bold text-white mb-3">Slow Processes</h3>
              <p className="text-gray-300">
                Manual work, delayed payments, and inefficient operations
              </p>
            </div>
            
            <div className="bg-red-900/30 backdrop-blur-md rounded-lg p-8 border border-red-500/30">
              <div className="text-5xl mb-4">💸</div>
              <h3 className="text-xl font-bold text-white mb-3">Revenue Loss</h3>
              <p className="text-gray-300">
                Missing commissions, payment delays, and poor customer experience
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              RETOERP: The Complete Solution
            </h2>
            <p className="text-xl text-gray-300">
              Like AI transformed software development, we transform real estate operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature Cards */}
            {[
              {
                icon: '🤖',
                title: 'AI-Powered Advisory',
                description: 'Free AI advisory for budget, location, numerology, and investment'
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
              <div key={index} className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 hover:bg-white/20 transition-all">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="py-20 bg-gradient-to-br from-cyan-900/50 to-blue-900/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Complete Real Estate Ecosystem
            </h2>
            <p className="text-xl text-gray-300">
              Everything you need to succeed in one platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4">For Real Estate Companies</h3>
              <ul className="space-y-3 text-gray-200">
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-2">✓</span>
                  Multi-tenant SaaS architecture
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-2">✓</span>
                  Complete CRM and lead management
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-2">✓</span>
                  Booking and payment automation
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-2">✓</span>
                  Commission tracking and reports
                </li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-4">For Customers</h3>
              <ul className="space-y-3 text-gray-200">
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-2">✓</span>
                  Free AI-powered property advisory
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-2">✓</span>
                  Customer portal for bookings & payments
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-2">✓</span>
                  Referral rewards and benefits
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-2">✓</span>
                  Educational content and insights
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Real Estate Business?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join hundreds of real estate companies using RETOERP
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              to="/register" 
              className="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all"
            >
              Start Free Trial
            </Link>
            <Link 
              to="/pricing" 
              className="px-8 py-4 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-semibold rounded-lg border-2 border-white/20 transition-all"
            >
              View Pricing
            </Link>
          </div>

          {/* Email Subscription */}
          <div className="max-w-md mx-auto">
            <h3 className="text-xl text-white mb-4">Get Real Estate Tips & Updates</h3>
            <form onSubmit={handleEmailSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
              />
              <button 
                type="submit"
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-all"
              >
                Subscribe
              </button>
            </form>
            {subscribed && (
              <p className="text-green-400 mt-2">Thank you! You're subscribed to our newsletter.</p>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900/50 py-12 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">RETOERP</h3>
              <p className="text-gray-400">
                Transforming real estate operations with AI and automation
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/features" className="text-gray-400 hover:text-cyan-400">Features</Link></li>
                <li><Link to="/pricing" className="text-gray-400 hover:text-cyan-400">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-cyan-400">About Us</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-3">Get Started</h4>
              <ul className="space-y-2">
                <li><Link to="/register" className="text-gray-400 hover:text-cyan-400">Sign Up</Link></li>
                <li><Link to="/login" className="text-gray-400 hover:text-cyan-400">Login</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 RETOERP. All rights reserved. | 10+ Years in Real Estate Excellence
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
