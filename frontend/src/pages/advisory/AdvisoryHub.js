import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LanguageSelector from '../../components/LanguageSelector';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const AdvisoryHub = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/advisory/categories`);
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-6 right-6 z-50">
        <LanguageSelector />
      </div>

      <header className="bg-white border-b">
        <div className="container mx-auto px-6 py-12">
          <Link to="/" className="inline-block mb-6 text-gray-600 hover:text-blue-600 transition-colors font-medium">
            <ArrowLeft className="inline mr-2" />
            Back to Home
          </Link>
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              FREE 24×7 Expert Advisory
              <span className="block text-blue-600 mt-2">For All Your Real Estate Needs</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get expert guidance on your real estate decisions - available 24×7, completely free! Our AI-powered advisory system provides personalized recommendations based on your unique requirements.
            </p>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/advisory/${category.slug}`}
              className="group"
            >
              <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100 hover:border-blue-400 hover:shadow-xl transition-all h-full">
                <div className="text-5xl mb-4">{category.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h3>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <span className="text-blue-600 font-medium">Get Free Advice →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Why Choose Our 24×7 Expert Advisory?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div>
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="font-bold mb-2">AI-Powered Insights</h3>
              <p className="opacity-90">Advanced AI analyzes thousands of properties 24×7</p>
            </div>
            <div>
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-bold mb-2">Personalized Recommendations</h3>
              <p className="opacity-90">Tailored advice based on your unique needs</p>
            </div>
            <div>
              <div className="text-4xl mb-3">💯</div>
              <h3 className="font-bold mb-2">Always Available</h3>
              <p className="opacity-90">Get expert guidance anytime, anywhere - 24×7</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdvisoryHub;