import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const CATEGORIES_CONFIG = {
  budget: {
    name: 'Budget Advisory',
    icon: '💰',
    fields: [
      { key: 'budget', label: 'Your Budget (₹)', type: 'text', placeholder: 'e.g., 50 Lakhs' },
      { key: 'location', label: 'Preferred Location', type: 'text', placeholder: 'e.g., Hyderabad' },
      { key: 'property_type', label: 'Property Type', type: 'select', options: ['Apartment', 'Villa', 'Plot', 'Farm Land'] }
    ]
  },
  location: {
    name: 'Location Highlights',
    icon: '📍',
    fields: [
      { key: 'location', label: 'Interested Location', type: 'text', placeholder: 'e.g., Gachibowli' },
      { key: 'work_location', label: 'Work Location', type: 'text', placeholder: 'e.g., Hi-Tech City' },
      { key: 'priorities', label: 'Priorities', type: 'text', placeholder: 'e.g., Schools, Hospitals' }
    ]
  },
  numerology: {
    name: 'Numerology Advisory',
    icon: '🔢',
    fields: [
      { key: 'dob', label: 'Date of Birth', type: 'date' },
      { key: 'lucky_numbers', label: 'Lucky Numbers', type: 'text', placeholder: 'e.g., 3, 7, 9' },
      { key: 'direction', label: 'Preferred Direction', type: 'select', options: ['North', 'South', 'East', 'West', 'Any'] }
    ]
  },
  best_project: {
    name: 'Best Project Advisory',
    icon: '⭐',
    fields: [
      { key: 'requirements', label: 'Your Requirements', type: 'textarea', placeholder: 'Describe what you need...' },
      { key: 'timeline', label: 'Purchase Timeline', type: 'select', options: ['Immediate', '3-6 months', '6-12 months', '1+ year'] },
      { key: 'priorities', label: 'Priority Factors', type: 'text', placeholder: 'e.g., Investment, Location' }
    ]
  },
  investment: {
    name: 'Future Investment Advisory',
    icon: '📈',
    fields: [
      { key: 'investment_amount', label: 'Investment Amount (₹)', type: 'text', placeholder: 'e.g., 1 Crore' },
      { key: 'timeline', label: 'Investment Timeline', type: 'select', options: ['Short-term (1-2 years)', 'Medium-term (3-5 years)', 'Long-term (5+ years)'] },
      { key: 'roi_expectations', label: 'Expected ROI', type: 'text', placeholder: 'e.g., 20% in 3 years' }
    ]
  }
};

const AdvisoryChat = () => {
  const { category } = useParams();
  const config = CATEGORIES_CONFIG[category];
  
  const [step, setStep] = useState('input'); // input, response, lead
  const [formData, setFormData] = useState({});
  const [aiResponse, setAiResponse] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [leadData, setLeadData] = useState({ name: '', email: '', phone: '' });

  if (!config) {
    return <div className="p-8 text-center">Invalid advisory category</div>;
  }

  const handleInputChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleGetAdvice = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/advisory/get-advice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          user_inputs: formData
        })
      });
      
      const data = await response.json();
      setAiResponse(data.ai_response);
      setSessionId(data.id);
      setStep('response');
    } catch (error) {
      toast.error('Failed to get advice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await fetch(`${BACKEND_URL}/api/advisory/capture-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          ...leadData
        })
      });
      
      toast.success(\"Thank you! We'll contact you soon.\");
      setStep('complete');
    } catch (error) {
      toast.error('Failed to submit. Please try again.');
    }
  };

  return (
    <div className=\"min-h-screen bg-gray-50\">
      <header className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <Link to="/advisory" className="inline-flex items-center text-gray-600 hover:text-blue-600">
            <ArrowLeft className="mr-2 w-5 h-5" />
            Back to Advisory Hub
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-lg p-8">\n          <div className=\"text-center mb-8\">\n            <div className=\"text-6xl mb-4\">{config.icon}</div>\n            <h1 className=\"text-3xl font-bold text-gray-900\">{config.name}</h1>\n          </div>\n\n          {step === 'input' && (\n            <form onSubmit={handleGetAdvice}>\n              {config.fields.map((field) => (\n                <div key={field.key} className=\"mb-6\">\n                  <label className=\"block text-gray-700 font-medium mb-2\">\n                    {field.label}\n                  </label>\n                  {field.type === 'select' ? (\n                    <select\n                      required\n                      value={formData[field.key] || ''}\n                      onChange={(e) => handleInputChange(field.key, e.target.value)}\n                      className=\"w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent\"\n                    >\n                      <option value=\"\">Select...</option>\n                      {field.options.map((opt) => (\n                        <option key={opt} value={opt}>{opt}</option>\n                      ))}\n                    </select>\n                  ) : field.type === 'textarea' ? (\n                    <textarea\n                      required\n                      value={formData[field.key] || ''}\n                      onChange={(e) => handleInputChange(field.key, e.target.value)}\n                      placeholder={field.placeholder}\n                      rows={4}\n                      className=\"w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent\"\n                    />\n                  ) : (\n                    <input\n                      type={field.type}\n                      required\n                      value={formData[field.key] || ''}\n                      onChange={(e) => handleInputChange(field.key, e.target.value)}\n                      placeholder={field.placeholder}\n                      className=\"w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent\"\n                    />\n                  )}\n                </div>\n              ))}\n              \n              <button\n                type=\"submit\"\n                disabled={loading}\n                className=\"w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-all disabled:bg-gray-400\"\n              >\n                {loading ? (\n                  <span className=\"flex items-center justify-center\">\n                    <Loader className=\"animate-spin mr-2\" />\n                    Getting AI Advice...\n                  </span>\n                ) : (\n                  'Get Free AI Advice'\n                )}\n              </button>\n            </form>\n          )}\n\n          {step === 'response' && (\n            <div>\n              <div className=\"bg-blue-50 border-l-4 border-blue-600 p-6 mb-6\">\n                <h2 className=\"text-xl font-bold text-gray-900 mb-4\">AI Advisory Response:</h2>\n                <div className=\"whitespace-pre-wrap text-gray-700 leading-relaxed\">\n                  {aiResponse}\n                </div>\n              </div>\n              \n              <button\n                onClick={() => setStep('lead')}\n                className=\"w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-all\"\n              >\n                Talk to Our Sales Team\n              </button>\n            </div>\n          )}\n\n          {step === 'lead' && (\n            <form onSubmit={handleLeadSubmit}>\n              <h2 className=\"text-2xl font-bold text-gray-900 mb-6\">Get in Touch</h2>\n              <div className=\"mb-4\">\n                <input\n                  type=\"text\"\n                  required\n                  placeholder=\"Your Name\"\n                  value={leadData.name}\n                  onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}\n                  className=\"w-full px-4 py-3 border rounded-lg\"\n                />\n              </div>\n              <div className=\"mb-4\">\n                <input\n                  type=\"email\"\n                  placeholder=\"Email\"\n                  value={leadData.email}\n                  onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}\n                  className=\"w-full px-4 py-3 border rounded-lg\"\n                />\n              </div>\n              <div className=\"mb-6\">\n                <input\n                  type=\"tel\"\n                  required\n                  placeholder=\"Phone\"\n                  value={leadData.phone}\n                  onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}\n                  className=\"w-full px-4 py-3 border rounded-lg\"\n                />\n              </div>\n              <button\n                type=\"submit\"\n                className=\"w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg\"\n              >\n                Submit\n              </button>\n            </form>\n          )}\n\n          {step === 'complete' && (\n            <div className=\"text-center\">\n              <div className=\"text-6xl mb-4\">✅</div>\n              <h2 className=\"text-2xl font-bold text-gray-900 mb-4\">Thank You!</h2>\n              <p className=\"text-gray-600 mb-6\">Our team will contact you soon.</p>\n              <Link\n                to=\"/advisory\"\n                className=\"inline-block px-8 py-3 bg-blue-600 text-white font-bold rounded-lg\"\n              >\n                Get More Advice\n              </Link>\n            </div>\n          )}\n        </div>\n      </div>\n    </div>\n  );\n};\n\nexport default AdvisoryChat;"}
</invoke>