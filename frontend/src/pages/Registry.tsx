import React, { useState, useEffect } from 'react';
import { ExternalLink, Search, Filter } from 'lucide-react';
import VerdictBadge from '../components/VerdictBadge';

interface ThreatEntry {
  address: string;
  verdict: 'safe' | 'suspicious' | 'malicious';
  confidence: number;
  flaggedTimestamp: string;
  threatScore: number;
}

const Registry = () => {
  const [entries, setEntries] = useState<ThreatEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerdict, setFilterVerdict] = useState<string>('all');

  useEffect(() => {
    setEntries([]);
  }, []);

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterVerdict === 'all' || entry.verdict === filterVerdict;
    return matchesSearch && matchesFilter;
  });

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getEtherscanUrl = (address: string) => {
    return `https://etherscan.io/address/${address}`;
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold gradient-text mb-2">On-chain Threat Registry</h1>
          <p className="text-gray-400">Browse and search analyzed smart contracts</p>
        </div>

        {/* Filters */}
        <div className="glass-deep rounded-xl border border-gray-800/50 p-6 mb-8 animate-fade-in-up hover-lift" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by contract address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-green-400 focus:ring-1 focus:ring-green-400 outline-none transition-colors focus-ring"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filterVerdict}
                onChange={(e) => setFilterVerdict(e.target.value)}
                className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-green-400 focus:ring-1 focus:ring-green-400 outline-none transition-colors focus-ring"
              >
                <option value="all">All Verdicts</option>
                <option value="safe">Safe</option>
                <option value="suspicious">Suspicious</option>
                <option value="malicious">Malicious</option>
              </select>
            </div>
          </div>
        </div>

        {/* Registry Table */}
        <div className="glass-deep rounded-xl border border-gray-800/50 overflow-hidden animate-fade-in-up hover-lift" style={{ animationDelay: '0.4s' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Contract Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Verdict
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Threat Score (0-1000)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Analysis
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Scanned
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filteredEntries.map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-800/30 transition-all duration-200 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <code className="text-green-400 font-mono text-sm group-hover:text-green-300 transition-colors">
                          {formatAddress(entry.address)}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <VerdictBadge verdict={entry.verdict} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`font-bold mr-2 ${
                          entry.threatScore <= 200 ? 'text-green-400' :
                          entry.threatScore <= 700 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {entry.threatScore} / 1000
                        </span>
                        <div className="w-24 bg-gray-700/50 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              entry.threatScore <= 200 ? 'bg-green-400' :
                              entry.threatScore <= 700 ? 'bg-yellow-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${(entry.threatScore / 1000) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 text-sm">
                        {entry.threatScore <= 200 ? 'Low Risk' : 
                         entry.threatScore <= 700 ? 'Medium Risk' : 'High Risk'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 text-sm">
                        {new Date(entry.flaggedTimestamp).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={getEtherscanUrl(entry.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-green-400 hover:text-green-300 transition-colors hover-lift"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        <span className="text-sm">Etherscan</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredEntries.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No entries found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Registry;
