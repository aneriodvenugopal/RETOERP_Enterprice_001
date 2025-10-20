import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, Share2, TrendingUp, Filter } from 'lucide-react';
import LanguageSelector from '../../components/LanguageSelector';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const ContentLibrary = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchArticles();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/content/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const url = selectedCategory 
        ? `${BACKEND_URL}/api/content/articles?category_id=${selectedCategory}`
        : `${BACKEND_URL}/api/content/articles`;
      
      const response = await fetch(url);
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Language Selector */}
      <div className="fixed top-6 right-6 z-50">
        <LanguageSelector />
      </div>

      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-6 text-gray-600 hover:text-blue-600 transition-colors font-medium">
              ← Back to Home
            </Link>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              Real Estate Growth
              <span className="block text-blue-600 mt-2">
                Knowledge Hub
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Learn how to grow your real estate business 40X faster with proven strategies
            </p>
          </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-3 rounded-full font-semibold transition-all transform hover:scale-105 ${
              selectedCategory === null
                ? 'bg-white text-purple-900 shadow-lg'
                : 'bg-white/10 backdrop-blur-md text-white hover:bg-white/20'
            }`}
          >
            <Filter className="inline mr-2 w-5 h-5" />
            All Articles
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-3 rounded-full font-semibold transition-all transform hover:scale-105 ${
                selectedCategory === category.id
                  ? 'bg-white text-purple-900 shadow-lg'
                  : 'bg-white/10 backdrop-blur-md text-white hover:bg-white/20'
              }`}
              style={{ borderColor: category.color }}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </header>

      {/* Articles Grid */}
      <section className="relative z-10 container mx-auto px-6 pb-20">
        {loading ? (
          <div className="text-center text-white text-2xl py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto"></div>
            <p className="mt-4">Loading amazing content...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center text-white text-2xl py-20">
            <p>No articles found. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article, index) => (
              <Link
                key={article.id}
                to={`/content/${article.slug}`}
                className="group animate-fadeInUp"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/50">
                  {/* Featured Image */}
                  {article.featured_image && (
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={article.featured_image}
                        alt={article.title}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      
                      {/* Category Badge */}
                      <div className="absolute top-4 right-4">
                        <span className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-bold text-purple-900 shadow-lg">
                          {categories.find(c => c.id === article.category_id)?.icon} {categories.find(c => c.id === article.category_id)?.name}
                        </span>
                      </div>

                      {/* Trending Badge */}
                      {article.view_count > 100 && (
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full text-xs font-bold text-white shadow-lg flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Trending
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-pink-300 transition-colors">
                      {article.title}
                    </h2>
                    <p className="text-white/80 mb-4 line-clamp-2">
                      {article.excerpt}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-white/60 text-sm">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {article.reading_time} min
                        </span>
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {article.view_count}
                        </span>
                        <span className="flex items-center">
                          <Share2 className="w-4 h-4 mr-1" />
                          {article.share_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-6 pb-20">
        <div className="bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 backdrop-blur-xl rounded-3xl p-12 border border-white/20 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Real Estate Business?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join hundreds of real estate companies achieving 40X faster growth
          </p>
          <Link
            to="/register"
            className="inline-block px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            Start Free Trial Now →
          </Link>
        </div>
      </section>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
};

export default ContentLibrary;