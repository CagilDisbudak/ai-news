import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Menu, X, Shield, ShieldAlert } from 'lucide-react';
import WeatherWidget from './WeatherWidget';

const CATEGORIES = [
    { key: 'all', label: 'Tümü' },
    { key: 'teknoloji', label: 'Teknoloji' },
    { key: 'ekonomi', label: 'Ekonomi' },
    { key: 'dünya', label: 'Dünya' },
    { key: 'spor', label: 'Spor' },
    { key: 'bilim', label: 'Bilim' },
    { key: 'donanım', label: 'Donanım' },
    { key: 'kripto', label: 'Kripto' },
];

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const [isClickbaitShieldActive, setIsClickbaitShieldActive] = useState(localStorage.getItem('clickbait-shield') === 'active');

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    if (document.documentElement.classList.contains('dark')) {
      localStorage.setItem('theme', 'dark');
    } else {
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleClickbaitShield = () => {
    const newState = !isClickbaitShieldActive;
    setIsClickbaitShieldActive(newState);
    localStorage.setItem('clickbait-shield', newState ? 'active' : 'inactive');
    window.dispatchEvent(new CustomEvent('clickbait-shield-toggle', { detail: newState }));
  };

  const handleFilterClick = (category) => {
    setActiveCategory(category);
    const event = new CustomEvent('filter-category', { detail: category });
    window.dispatchEvent(event);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white dark:bg-dark-bg border-b-2 border-black dark:border-white transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header - Editorial Logo */}
        <div className="py-4 md:py-6 flex flex-col md:block items-center border-b border-gray-200 dark:border-dark-border relative gap-4">
            {/* Weather Widget - Left Side */}
            <div className="absolute left-0 hidden md:block top-1/2 -translate-y-1/2">
                <WeatherWidget />
            </div>

            <Link to="/" className="text-center block mb-4 md:mb-0" onClick={() => handleFilterClick('all')}>
                <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-black dark:text-white uppercase">
                    The AI News
                </h1>
                <p className="text-[10px] md:text-xs font-serif uppercase tracking-widest text-gray-500 mt-1">Yapay Zeka Destekli Güncel Bülten</p>
            </Link>

            {/* Controls - Right Side */}
            <div className="flex md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 items-center gap-4 w-full md:w-auto justify-between px-2 md:px-0">
                <div className="md:hidden">
                    <WeatherWidget />
                </div>
                
                <div className="flex items-center gap-2 md:gap-4">
                    <Link to="/finans" className="text-xs font-bold uppercase tracking-widest text-black dark:text-white hover:opacity-70 flex items-center gap-1 border-2 border-black dark:border-white px-2 py-1 transition-colors">
                        Finans
                    </Link>

                    <button onClick={toggleClickbaitShield} className={`p-2 transition-colors ${isClickbaitShieldActive ? 'text-brand-500' : 'text-gray-400'}`} title="Clickbait Shield (AI Başlık Düzeltici)">
                        {isClickbaitShieldActive ? <Shield size={20} /> : <ShieldAlert size={20} />}
                    </button>

                    <button onClick={toggleTheme} className="p-2 text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Toggle Dark Mode">
                        <Moon size={20} className="dark:hidden" />
                        <Sun size={20} className="hidden dark:block" />
                    </button>
                    
                    {isHomePage && (
                    <div className="md:hidden flex items-center">
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-black dark:text-white p-2">
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                    )}
                </div>
            </div>
        </div>

        {/* Navigation Categories (Desktop) */}
        {isHomePage && (
          <div className="hidden md:flex justify-center flex-wrap gap-1 py-2">
            {CATEGORIES.map(cat => (
                <button 
                    key={cat.key} 
                    className={`filter-btn ${activeCategory === cat.key ? 'active' : ''}`}
                    onClick={() => handleFilterClick(cat.key)}
                >
                    {cat.label}
                </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Categories */}
      {isMobileMenuOpen && isHomePage && (
        <div className="md:hidden border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg font-serif">
          <div className="flex flex-col">
            {/* Mobile Weather */}
            <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-800">
                <WeatherWidget />
            </div>
            {CATEGORIES.map(cat => (
                <button 
                    key={cat.key} 
                    className={`filter-btn-mobile ${activeCategory === cat.key ? 'active' : ''}`}
                    onClick={() => handleFilterClick(cat.key)}
                >
                    {cat.label}
                </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
