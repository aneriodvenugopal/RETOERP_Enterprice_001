import React, { useState } from 'react';
import { MessageCircle, X, Phone } from 'lucide-react';

const FloatingWhatsApp = () => {
  const [isOpen, setIsOpen] = useState(false);
  const phoneNumber = '919948303060'; // Format: country code + number without + or spaces
  const message = 'Hi! I want to know more about RETOERP Real Estate Automation.';

  const openWhatsApp = () => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const callNow = () => {
    window.location.href = 'tel:+919948303060';
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {isOpen && (
          <div className="mb-4 bg-white rounded-2xl shadow-2xl p-6 w-80 animate-fadeIn">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Need Help?</h3>
                <p className="text-sm text-gray-600">We're here to assist you!</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* WhatsApp Option */}
            <button
              onClick={openWhatsApp}
              className="w-full mb-3 bg-green-500 hover:bg-green-600 text-white rounded-xl p-4 flex items-center justify-center transition-all transform hover:scale-105"
            >
              <MessageCircle className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Chat on WhatsApp</div>
                <div className="text-sm opacity-90">+91 9948303060</div>
              </div>
            </button>

            {/* Call Option */}
            <button
              onClick={callNow}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl p-4 flex items-center justify-center transition-all transform hover:scale-105"
            >
              <Phone className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Call Us Now</div>
                <div className="text-sm opacity-90">+91 9948303060</div>
              </div>
            </button>

            {/* Email Option */}
            <a
              href="mailto:enquiry@retoerp.com?subject=Enquiry about RETOERP&body=Hi, I would like to know more about RETOERP Real Estate Automation."
              className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl p-4 flex items-center justify-center transition-all block"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <div className="text-left">
                <div className="font-semibold">Email Us</div>
                <div className="text-sm text-gray-600">enquiry@retoerp.com</div>
              </div>
            </a>

            <p className="text-xs text-gray-500 text-center mt-4">
              Available 24×7 • Response within 5 minutes
            </p>
          </div>
        )}

        {/* Main WhatsApp Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-2xl transition-all transform hover:scale-110 relative"
        >
          {isOpen ? (
            <X className="w-7 h-7" />
          ) : (
            <>
              <MessageCircle className="w-7 h-7" />
              {/* Notification Badge */}
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                1
              </span>
            </>
          )}
        </button>
      </div>
    </>
  );
};

export default FloatingWhatsApp;
