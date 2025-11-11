import React from 'react';
import { Building, Users, Rocket, Award } from 'lucide-react';

const OurStoryImproved = () => {
  const timeline = [
    {
      phase: "Phase 1: Custom Solutions (2014-2020)",
      icon: <Building className="w-6 h-6" />,
      color: "blue",
      content: "Started with IncomeLands.in - building custom CRM and website solutions for individual real estate developers. Delivered 50+ project websites and 30+ custom CRM systems."
    },
    {
      phase: "Phase 2: Market Learning (2020-2022)",
      icon: <Users className="w-6 h-6" />,
      color: "green",
      content: "Worked closely with clients to understand pain points: lead leakage, payment tracking chaos, manual commission calculations, and multi-project management challenges."
    },
    {
      phase: "Phase 3: RETOERP Development (2022-2023)",
      icon: <Rocket className="w-6 h-6" />,
      color: "purple",
      content: "Consolidated learnings into a unified SaaS platform. Built multi-tenant architecture, automated payment tracking, visual property layouts, and WhatsApp integration."
    },
    {
      phase: "Phase 4: Launch & Growth (2024+)",
      icon: <Award className="w-6 h-6" />,
      color: "orange",
      content: "Launched RETOERP SOFTWARE as a complete real estate automation platform. Helping real estate companies manage multiple projects efficiently with zero lead leakage."
    }
  ];

  const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-500' },
    green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-500' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-500' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-500' }
  };

  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              The RETOERP Story
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              From Custom Solutions to Complete SaaS Platform
            </p>
          </div>

          {/* Timeline - Vertical Stacked */}
          <div className="space-y-6">
            {timeline.map((item, index) => {
              const colors = colorClasses[item.color];
              return (
                <div 
                  key={index}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border-l-4 ${colors.border}"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-12 h-12 ${colors.bg} rounded-full flex items-center justify-center ${colors.text}`}>
                      {item.icon}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                        {item.phase}
                      </h3>
                      <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Company Background */}
          <div className="mt-12 bg-white rounded-xl shadow-lg p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
              Powered by Eloniot Software Solutions
            </h3>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
              RETOERP is developed by <strong>Eloniot Software Solutions</strong>, a company with 10+ years of experience in building custom software for real estate, education, healthcare, and government sectors.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">10+</p>
                <p className="text-xs text-gray-600">Years</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">50+</p>
                <p className="text-xs text-gray-600">Projects</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">30+</p>
                <p className="text-xs text-gray-600">Websites</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">25+</p>
                <p className="text-xs text-gray-600">CRM Systems</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OurStoryImproved;
