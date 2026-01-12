import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed">
              At ExlainERP, we collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc ml-6 mt-2 text-gray-700 space-y-2">
              <li>Name, email address, phone number, and company details</li>
              <li>Property and project information you upload</li>
              <li>Payment and billing information</li>
              <li>Communication preferences and history</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed">
              We use the information we collect to:
            </p>
            <ul className="list-disc ml-6 mt-2 text-gray-700 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process your transactions and send related information</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze trends, usage, and activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement industry-standard security measures to protect your personal information:
            </p>
            <ul className="list-disc ml-6 mt-2 text-gray-700 space-y-2">
              <li>Data encryption during transmission (SSL/TLS)</li>
              <li>Secure data storage with regular backups</li>
              <li>Access controls and authentication</li>
              <li>Regular security audits and updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing</h2>
            <p className="text-gray-700 leading-relaxed">
              We do not sell your personal information. We may share your information only:
            </p>
            <ul className="list-disc ml-6 mt-2 text-gray-700 space-y-2">
              <li>With your consent</li>
              <li>With service providers who assist in our operations</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed">
              You have the right to:
            </p>
            <ul className="list-disc ml-6 mt-2 text-gray-700 space-y-2">
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-900 font-semibold">ExlainERP</p>
              <p className="text-gray-700">
                Email: <a href="mailto:enquiry@retoerp.com" className="text-blue-600 hover:underline">enquiry@retoerp.com</a>
              </p>
              <p className="text-gray-700">
                Phone: <a href="tel:+919948303060" className="text-blue-600 hover:underline">+91-9948303060</a>
              </p>
              <p className="text-gray-700">
                WhatsApp: <a href="https://wa.me/919948303060" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">+91-9948303060</a>
              </p>
            </div>
          </section>

          <section className="border-t pt-6">
            <p className="text-sm text-gray-600">
              Last Updated: January 2025
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
