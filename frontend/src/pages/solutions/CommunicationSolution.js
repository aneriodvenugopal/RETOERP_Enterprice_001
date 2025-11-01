import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, MessageCircle, Mail, Smartphone, Send, Clock, Globe } from 'lucide-react';
import EnquiryForm from '../../components/EnquiryForm';
import StickyNavbar from '../../components/StickyNavbar';

const CommunicationSolution = () => {
  const features = [
    { icon: <MessageCircle className="w-8 h-8" />, title: 'WhatsApp Business API', description: 'Official verified business account with automated messaging' },
    { icon: <Smartphone className="w-8 h-8" />, title: 'Bulk SMS', description: 'Send updates to thousands of customers instantly' },
    { icon: <Mail className="w-8 h-8" />, title: 'Email Campaigns', description: 'Personalized email campaigns with templates' },
    { icon: <Send className="w-8 h-8" />, title: 'Event Triggers', description: 'Auto-send messages on booking, payment, follow-up' },
    { icon: <Globe className="w-8 h-8" />, title: 'Multi-language', description: 'Send in Telugu, Hindi, English automatically' },
    { icon: <Clock className="w-8 h-8" />, title: 'Scheduled Messages', description: 'Schedule messages for optimal engagement times' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <StickyNavbar />
      <div className="pt-24 pb-16 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="container mx-auto px-6">
          <Link to="/" className="inline-flex items-center text-white hover:text-gray-200 mb-8"><ArrowLeft className="w-5 h-5 mr-2" />Back to Home</Link>
          <div className="max-w-4xl"><h1 className="text-5xl md:text-6xl font-bold text-white mb-6">Communication Hub</h1><p className="text-2xl text-white/90 mb-8">Automated WhatsApp, SMS, and Email campaigns. Get 80% better engagement and 50% cost savings.</p></div>
        </div>
      </div>
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <section className="bg-white rounded-xl shadow-md p-8"><h2 className="text-3xl font-bold text-gray-900 mb-4">The Problem</h2><ul className="space-y-3 text-gray-700"><li className="flex items-start"><span className="text-red-500 mr-3 mt-1">❌</span><span>Manual SMS/Email costing time and money</span></li><li className="flex items-start"><span className="text-red-500 mr-3 mt-1">❌</span><span>Low engagement due to generic messages</span></li><li className="flex items-start"><span className="text-red-500 mr-3 mt-1">❌</span><span>Missing important customer communications</span></li></ul></section>
            <section className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8"><h2 className="text-3xl font-bold text-gray-900 mb-6">The Solution</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{features.map((f, i) => <div key={i} className="bg-white rounded-lg p-6 shadow-sm"><div className="text-blue-600 mb-3">{f.icon}</div><h3 className="font-bold text-gray-900 mb-2">{f.title}</h3><p className="text-gray-600 text-sm">{f.description}</p></div>)}</div></section>
          </div>
          <div className="lg:col-span-1"><div className="sticky top-24"><EnquiryForm solutionName="Communication Hub" /></div></div>
        </div>
      </div>
    </div>
  );
};
export default CommunicationSolution;