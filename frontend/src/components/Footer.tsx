import React from 'react';
import { Github, Twitter, Mail, Shield } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="glass border-t border-gray-800/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-green-400" />
              <span className="text-xl font-bold gradient-text">HexSentinel</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Advanced AI-powered smart contract security analysis platform. 
              Protect your investments with real-time threat detection.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800/50"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800/50"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="mailto:contact@hexsentinel.com"
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800/50"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="/" className="text-gray-400 hover:text-white transition-colors">
                  Analyzer
                </a>
              </li>
              <li>
                <a href="/registry" className="text-gray-400 hover:text-white transition-colors">
                  Registry
                </a>
              </li>
              <li>
                <a href="/docs" className="text-gray-400 hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="/how-it-works" className="text-gray-400 hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a href="/docs" className="text-gray-400 hover:text-white transition-colors">
                  API Documentation
                </a>
              </li>
              <li>
                <a href="mailto:support@hexsentinel.com" className="text-gray-400 hover:text-white transition-colors">
                  Contact Support
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800/50 mt-8 pt-8 text-center">
          <p className="text-gray-500 text-sm">
            © 2024 HexSentinel. All rights reserved. Built with advanced AI for blockchain security.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
