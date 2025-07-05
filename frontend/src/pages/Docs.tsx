import React from 'react';
import { Download, FileText, ExternalLink } from 'lucide-react';

const Docs = () => {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-4">Project Documentation</h1>
          <p className="text-gray-400 text-lg">Technical whitepaper and architecture overview</p>
        </div>

        {/* PDF Viewer Placeholder */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-8 mb-8">
          <div className="text-center py-16">
            <FileText className="h-16 w-16 text-gray-600 mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-white mb-4">HexSentinel Technical Whitepaper</h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Comprehensive documentation covering our AI-powered smart contract analysis system, 
              honeypot implementation, and decentralized threat detection methodology.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center px-6 py-3 bg-green-400 hover:bg-green-500 text-black font-medium rounded-lg transition-colors">
                <Download className="h-5 w-5 mr-2" />
                Download PDF
              </button>
              <button className="inline-flex items-center px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors">
                <ExternalLink className="h-5 w-5 mr-2" />
                View Online
              </button>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">What's Inside</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                AI Analysis Methodology
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                Honeypot Architecture
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                Threat Detection Algorithms
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                On-chain Registry Design
              </li>
              <li className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                Future DAO Governance
              </li>
            </ul>
          </div>
          
          <div className="bg-gray-900/30 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Additional Resources</h3>
            <div className="space-y-4">
              <a href="#" className="block p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">API Documentation</span>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-gray-400 text-sm mt-1">Integration guide for developers</p>
              </a>
              
              <a href="#" className="block p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Smart Contract Code</span>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-gray-400 text-sm mt-1">View on GitHub</p>
              </a>
              
              <a href="#" className="block p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Research Papers</span>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-gray-400 text-sm mt-1">Academic references</p>
              </a>
            </div>
          </div>
        </div>

        {/* Abstract Preview */}
        <div className="bg-gray-900/30 rounded-xl p-8 border border-gray-800 mt-8">
          <h3 className="text-xl font-semibold text-white mb-4">Abstract</h3>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 leading-relaxed mb-4">
              HexSentinel represents a paradigm shift in smart contract security, leveraging artificial intelligence 
              and decentralized honeypot networks to proactively identify and catalog malicious contracts on the 
              Ethereum blockchain. Our system combines static code analysis with dynamic behavioral monitoring to 
              achieve unprecedented accuracy in threat detection.
            </p>
            
            <p className="text-gray-300 leading-relaxed mb-4">
              The platform employs a multi-layered approach: GPT-powered static analysis examines contract bytecode 
              for known vulnerability patterns, while our distributed honeypot network captures real-world attack 
              attempts. This dual methodology enables both preventive screening and reactive threat intelligence.
            </p>
            
            <p className="text-gray-300 leading-relaxed">
              By maintaining an on-chain registry of analyzed contracts, HexSentinel creates a transparent, 
              community-driven security infrastructure that benefits the entire DeFi ecosystem. Future iterations 
              will incorporate DAO governance for threat classification and bounty distribution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Docs;
