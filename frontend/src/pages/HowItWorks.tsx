import React from 'react';
import { Brain, Code, Shield, Database, ArrowRight, Zap } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: Code,
      title: "Contract Submission",
      description: "User submits an Ethereum contract address for analysis",
      details: "Our system accepts any valid Ethereum address and begins the analysis pipeline"
    },
    {
      icon: Brain,
      title: "AI Static Analysis",
      description: "GPT analyzes bytecode and source code for known patterns",
      details: "Advanced NLP models trained on vulnerability databases examine the contract structure"
    },
    {
      icon: Zap,
      title: "Dynamic Testing",
      description: "Honeypot interactions reveal behavioral anomalies",
      details: "Real-world simulation environments test contract behavior under various conditions"
    },
    {
      icon: Shield,
      title: "Threat Scoring",
      description: "Multi-factor analysis generates confidence scores",
      details: "Combining static and dynamic results with historical data for accurate threat assessment"
    },
    {
      icon: Database,
      title: "Registry Update",
      description: "Results stored on-chain for community access",
      details: "Immutable record keeping ensures transparency and enables collective security intelligence"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">How HexSentinel Works</h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Understanding our AI-powered approach to smart contract security analysis
          </p>
        </div>

        {/* Process Flow */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Analysis Pipeline</h2>
          <div className="flex flex-col lg:flex-row items-center justify-center space-y-8 lg:space-y-0 lg:space-x-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={index}>
                  <div className="flex flex-col items-center text-center max-w-xs">
                    <div className="w-16 h-16 bg-green-400/20 rounded-full flex items-center justify-center mb-4 border border-green-400/30">
                      <Icon className="h-8 w-8 text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-gray-400 text-sm">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="h-6 w-6 text-green-400 hidden lg:block" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-12">
          {/* Static Analysis */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-8">
            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-blue-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Brain className="h-6 w-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-4">Static Code Analysis</h3>
                <p className="text-gray-400 mb-6">
                  Our AI engine performs comprehensive static analysis using large language models trained specifically 
                  on smart contract vulnerabilities and attack patterns.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Pattern Recognition</h4>
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>• Reentrancy vulnerabilities</li>
                      <li>• Integer overflow/underflow</li>
                      <li>• Access control issues</li>
                      <li>• Timestamp dependencies</li>
                    </ul>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Code Quality</h4>
                    <ul className="text-gray-400 text-sm space-y-1">
                      <li>• Function complexity analysis</li>
                      <li>• Gas optimization issues</li>
                      <li>• Best practice adherence</li>
                      <li>• Upgrade safety checks</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Analysis */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-8">
            <div className="flex items-start space-x-6">
              <div className="w-12 h-12 bg-yellow-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-4">Dynamic Behavioral Testing</h3>
                <p className="text-gray-400 mb-6">
                  Honeypot contracts interact with suspicious addresses to observe real-world attack patterns 
                  and behavioral anomalies.
                </p>
                
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h4 className="text-white font-medium mb-4">Honeypot Interaction Flow</h4>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center text-green-400 text-sm font-bold">
                        1
                      </div>
                      <span className="text-gray-300">Deploy bait contract with apparent vulnerabilities</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center text-green-400 text-sm font-bold">
                        2
                      </div>
                      <span className="text-gray-300">Monitor for interaction attempts from target address</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center text-green-400 text-sm font-bold">
                        3
                      </div>
                      <span className="text-gray-300">Analyze attack vectors and exploitation methods</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center text-green-400 text-sm font-bold">
                        4
                      </div>
                      <span className="text-gray-300">Generate behavioral profile and threat assessment</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Prompt Examples */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-8">
            <h3 className="text-xl font-semibold text-white mb-6">AI Analysis Prompts</h3>
            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-green-400 font-mono text-sm mb-2">Security Analysis Prompt:</h4>
                <p className="text-gray-300 text-sm font-mono leading-relaxed">
                  "Analyze this Solidity contract for security vulnerabilities. Focus on reentrancy attacks, 
                  access control issues, and potential fund drainage vectors. Rate the overall security risk 
                  from 0-100 and provide specific recommendations."
                </p>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="text-green-400 font-mono text-sm mb-2">Pattern Detection Prompt:</h4>
                <p className="text-gray-300 text-sm font-mono leading-relaxed">
                  "Examine the bytecode patterns and function signatures. Compare against known malicious 
                  contract databases. Identify any obfuscation techniques or suspicious gas usage patterns 
                  that might indicate malicious intent."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
