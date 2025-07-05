import React, { useState } from 'react';
import { Search, Shield, AlertTriangle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ThreatScore from '@/components/ThreatScore';
import VerdictBadge from '@/components/VerdictBadge';
import ThreatLevelsTable from '@/components/ThreatLevelsTable';

const Home = () => {
  const [contractAddress, setContractAddress] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!contractAddress.trim()) return;
    
    setIsAnalyzing(true);
    // Simulate API call
    setTimeout(() => {
      setResult({
        address: contractAddress,
        threatScore: Math.floor(Math.random() * 1000),
        verdict: Math.random() > 0.5 ? 'safe' : 'malicious',
        analysis: {
          honeypotRisk: Math.random() > 0.7,
          rugPullRisk: Math.random() > 0.8,
          unusualPatterns: Math.random() > 0.6,
        }
      });
      setIsAnalyzing(false);
    }, 2000);
  };



  return (
    <div className="min-h-screen bg-transparent py-12 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="flex justify-center items-center space-x-3 mb-6">
            <div className="relative">
              <Shield className="h-16 w-16 text-green-400 animate-pulse-slow" />
              <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl"></div>
            </div>
            <h1 className="text-5xl font-bold gradient-text">Smart Contract Analyzer</h1>
          </div>
          <p className="text-xl text-gray-400 mb-4 max-w-2xl mx-auto">
            AI-powered threat detection for Ethereum smart contracts with real-time analysis
          </p>
          <p className="text-sm text-gray-500">
            Protect your investments with advanced security scanning and risk assessment
          </p>
        </div>



        {/* Analyzer */}
        <div className="glass-deep rounded-xl p-8 mb-12 animate-fade-in-up hover-lift" style={{ animationDelay: '0.4s' }}>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Analyze Smart Contract</h2>
            <p className="text-gray-400">Enter a contract address to perform comprehensive security analysis</p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
            <Input
              placeholder="Enter contract address (0x...)"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              className="flex-1 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus-ring"
            />
            <Button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || !contractAddress.trim()}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 focus-ring hover-lift neon-glow"
            >
              {isAnalyzing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4" />
                  <span>Analyze</span>
                </div>
              )}
            </Button>
          </div>

          {result && (
            <div className="animate-fade-in">
              <div className="glass-deep rounded-xl p-8 border border-gray-700/50 neon-glow">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Analysis Result</h3>
                  <VerdictBadge verdict={result.verdict} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Contract Address</p>
                    <p className="text-white font-mono text-sm break-all bg-gray-800/50 p-3 rounded-lg">
                      {result.address}
                    </p>
                  </div>
                  
                  <div>
                    <ThreatScore score={result.threatScore} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass rounded-lg p-4 border border-gray-700/50 hover-lift">
                    <div className="flex items-center space-x-3 mb-2">
                      <AlertTriangle className={`h-5 w-5 ${result.analysis.honeypotRisk ? 'text-red-400' : 'text-green-400'}`} />
                      <span className="font-medium text-white">Honeypot Risk</span>
                    </div>
                    <span className={`text-sm ${result.analysis.honeypotRisk ? 'text-red-400' : 'text-green-400'}`}>
                      {result.analysis.honeypotRisk ? 'High Risk Detected' : 'Low Risk'}
                    </span>
                  </div>
                  
                  <div className="glass rounded-lg p-4 border border-gray-700/50 hover-lift">
                    <div className="flex items-center space-x-3 mb-2">
                      <AlertTriangle className={`h-5 w-5 ${result.analysis.rugPullRisk ? 'text-red-400' : 'text-green-400'}`} />
                      <span className="font-medium text-white">Rug Pull Risk</span>
                    </div>
                    <span className={`text-sm ${result.analysis.rugPullRisk ? 'text-red-400' : 'text-green-400'}`}>
                      {result.analysis.rugPullRisk ? 'High Risk Detected' : 'Low Risk'}
                    </span>
                  </div>
                  
                  <div className="glass rounded-lg p-4 border border-gray-700/50 hover-lift">
                    <div className="flex items-center space-x-3 mb-2">
                      <Activity className={`h-5 w-5 ${result.analysis.unusualPatterns ? 'text-yellow-400' : 'text-green-400'}`} />
                      <span className="font-medium text-white">Unusual Patterns</span>
                    </div>
                    <span className={`text-sm ${result.analysis.unusualPatterns ? 'text-yellow-400' : 'text-green-400'}`}>
                      {result.analysis.unusualPatterns ? 'Patterns Detected' : 'No Patterns'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Threat Levels Table */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <ThreatLevelsTable />
        </div>
      </div>
    </div>
  );
};

export default Home;
