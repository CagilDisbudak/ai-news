import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    if (document.documentElement.classList.contains('dark')) {
      localStorage.setItem('theme', 'dark');
    } else {
      localStorage.setItem('theme', 'light');
    }
  };

  const handleFilterClick = (category) => {
    const event = new CustomEvent('filter-category', { detail: category });
    window.dispatchEvent(event);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white dark:bg-dark-bg border-b-2 border-black dark:border-white transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header - Editorial Logo */}
        <div className="py-6 flex justify-center items-center border-b border-gray-200 dark:border-dark-border relative">
            <Link to="/" className="text-center" onClick={() => handleFilterClick('all')}>
                <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-black dark:text-white uppercase">
                    The AI News
                </h1>
                <p className="text-xs font-serif uppercase tracking-widest text-gray-500 mt-1">Yapay Zeka Destekli Güncel Bülten</p>
            </Link>

            {/* Controls */}
            <div className="absolute right-0 flex items-center gap-3">
                <button onClick={toggleTheme} className="p-2 text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors" aria-label="Toggle Dark Mode">
                    <Moon size={20} className="dark:hidden" />
                    <Sun size={20} className="hidden dark:block" />
                </button>
                
                {/* Mobile Menu Button */}
                {isHomePage && (
                <div className="md:hidden flex items-center">
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-black dark:text-white p-2">
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
                )}
            </div>
        </div>

        {/* Navigation Categories (Desktop) - Only show on Home page */}
        {isHomePage && (
          <div className="hidden md:flex justify-center space-x-8 py-2">
            <button className="filter-btn active" onClick={(e) => {
              document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
              e.target.classList.add('active');
              handleFilterClick('all');
            }}>Tümü</button>
            <button className="filter-btn" onClick={(e) => {
              document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
              e.target.classList.add('active');
              handleFilterClick('teknoloji');
            }}>Teknoloji</button>
            <button className="filter-btn" onClick={(e) => {
              document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
              e.target.classList.add('active');
              handleFilterClick('ekonomi');
            }}>Ekonomi</button>
            <button className="filter-btn" onClick={(e) => {
              document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
              e.target.classList.add('active');
              handleFilterClick('dünya');
            }}>Dünya</button>
          </div>
        )}
      </div>

      {/* Mobile Categories */}
      {isMobileMenuOpen && isHomePage && (
        <div className="md:hidden border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg font-serif">
          <div className="flex flex-col">
            <button className="filter-btn-mobile" onClick={() => handleFilterClick('all')}>Tümü</button>
            <button className="filter-btn-mobile" onClick={() => handleFilterClick('teknoloji')}>Teknoloji</button>
            <button className="filter-btn-mobile" onClick={() => handleFilterClick('ekonomi')}>Ekonomi</button>
            <button className="filter-btn-mobile" onClick={() => handleFilterClick('dünya')}>Dünya</button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
