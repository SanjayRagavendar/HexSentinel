import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Database, Activity, FileText, Brain, Bug, Menu, X } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = [
    { path: '/', label: 'Analyzer', icon: Shield },
    { path: '/registry', label: 'Registry', icon: Database },
    { path: '/logs', label: 'Live Logs', icon: Activity },
    { path: '/docs', label: 'Docs', icon: FileText },
    { path: '/how-it-works', label: 'How It Works', icon: Brain },
    { path: '/vulns', label: 'Vulnerabilities', icon: Bug },
  ];

  return (
    <nav className="glass-deep border-b border-gray-800/50 sticky top-0 z-50 neon-glow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Shield className="h-8 w-8 text-green-400 group-hover:animate-glow transition-all duration-300" />
              <div className="absolute inset-0 bg-green-400/20 rounded-full blur-md group-hover:blur-lg transition-all duration-300"></div>
            </div>
            <span className="text-xl font-bold gradient-text group-hover:scale-105 transition-transform">HexSentinel</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 hover-lift ${
                    isActive
                      ? 'bg-green-400/20 text-green-400 border border-green-400/30 shadow-lg shadow-green-400/10 neon-glow'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/50 border border-transparent'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors focus-ring hover-lift"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden animate-fade-in">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-800/50 mt-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors hover-lift ${
                      isActive
                        ? 'bg-green-400/20 text-green-400'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
