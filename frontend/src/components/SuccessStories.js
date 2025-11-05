import React from 'react';
import { TrendingUp, Users, DollarSign, Clock, Star } from 'lucide-react';

const SuccessStories = () => {
  const stories = [
    {
      company: "Abhinandhana Avenues",
      location: "Hyderabad",
      logo: "🏢",
      results: {
        growth: "35%",
        revenue: "3 Projects",
        time: "Zero leakage",
        rating: 5
      },
      quote: "RETOERP has completely transformed our operations. Managing 3 projects simultaneously was chaotic with Excel sheets. Now with RETOERP's multi-project dashboard, we have complete visibility. Our booking conversion rate improved by 35% within 3 months!",
      person: "Managing Director",
      designation: "Abhinandhana Avenues"
    },
    {
      company: "BRR GROUP (Janabhivrudhhi)",
      location: "Telangana",
      logo: "🏗️",
      results: {
        growth: "40%",
        revenue: "15-20 leads/week",
        time: "2 days saved/month",
        rating: 5
      },
      quote: "Before RETOERP, tracking payments and generating reports took 2 full days every month. Now everything is automated! Payment reminders via WhatsApp improved our collection speed by 40%. The website brings 15-20 genuine inquiries every week!",
      person: "Founder & CEO",
      designation: "BRR GROUP"
    },
    {
      company: "Sri Jayam Housing",
      location: "Vijayawada",
      logo: "🏠",
      results: {
        growth: "90%",
        revenue: "ROI in 2 months",
        time: "Zero disputes",
        rating: 5
      },
      quote: "Payment tracking was our biggest headache. RETOERP's payment module solved everything. Automated reminders, instant receipts, transparent commission calculations. We achieved 90% on-time payment collection. ROI was achieved in just 2 months!",
      person: "Director",
      designation: "Sri Jayam Housing"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Real Results from Real Estate Companies
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how leading developers are growing 40X faster with RETOERP
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {stories.map((story, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all">
              {/* Company Header */}
              <div className="flex items-center mb-6">
                <div className="text-5xl mr-4">{story.logo}</div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900">{story.company}</h3>
                  <p className="text-gray-600 text-sm">{story.location}</p>
                </div>
              </div>

              {/* Results Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50/30 rounded-lg p-4 text-center">
                  <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">{story.results.growth}</div>
                  <div className="text-xs text-gray-600">Growth</div>
                </div>
                <div className="bg-blue-50/30 rounded-lg p-4 text-center">
                  <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">{story.results.revenue}</div>
                  <div className="text-xs text-gray-600">Revenue</div>
                </div>
                <div className="bg-purple-50/30 rounded-lg p-4 text-center">
                  <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-lg font-bold text-purple-600">{story.results.time}</div>
                  <div className="text-xs text-gray-600">Time Saved</div>
                </div>
                <div className="bg-yellow-50/30 rounded-lg p-4 text-center">
                  <Star className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-600">{story.results.rating}.0</div>
                  <div className="text-xs text-gray-600">Rating</div>
                </div>
              </div>

              {/* Quote */}
              <div className="bg-gray-50/30 rounded-lg p-4 mb-4 relative">
                <div className="text-4xl text-blue-200 absolute -top-2 -left-2">"</div>
                <p className="text-gray-700 italic relative z-10">{story.quote}</p>
              </div>

              {/* Person */}
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                  {story.person.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{story.person}</div>
                  <div className="text-sm text-gray-600">{story.designation}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">Real Estate Companies</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">₹1000+ Cr</div>
              <div className="text-gray-600">Revenue Processed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">50,000+</div>
              <div className="text-gray-600">Properties Managed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime SLA</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
