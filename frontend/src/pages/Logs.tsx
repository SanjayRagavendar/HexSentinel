import React, { useState, useEffect } from 'react';
import { Activity, Clock, User, Code } from 'lucide-react';

interface LogEntry {
  id: string;
  attackerAddress: string;
  methodCalled: string;
  triggerTime: string;
  gasUsed: string;
  txHash: string;
  honeypotTriggered: boolean;
}

const Logs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    setLogs([]);
    // No mock data or simulated logs
  }, [isLive]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const getTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Live Honeypot Trap Log</h1>
            <p className="text-gray-400">Real-time monitoring of contract interactions</p>
          </div>
          
          <div className="flex items-center mt-4 md:mt-0">
            <div className="flex items-center mr-4">
              <div className={`w-3 h-3 rounded-full mr-2 ${isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-400">{isLive ? 'Live' : 'Paused'}</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Interactions</p>
                <p className="text-2xl font-bold text-white">{logs.length}</p>
              </div>
              <Activity className="h-8 w-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Honeypots Triggered</p>
                <p className="text-2xl font-bold text-red-400">
                  {logs.filter(log => log.honeypotTriggered).length}
                </p>
              </div>
              <User className="h-8 w-8 text-red-400" />
            </div>
          </div>
          
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Unique Attackers</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {new Set(logs.map(log => log.attackerAddress)).size}
                </p>
              </div>
              <Code className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Log Table */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Attacker Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Method Called
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Gas Used
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <code className="text-green-400 font-mono text-sm">
                        {formatAddress(log.attackerAddress)}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-blue-400 text-sm bg-gray-800/50 px-2 py-1 rounded">
                        {log.methodCalled}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 text-sm">{log.gasUsed}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        log.honeypotTriggered 
                          ? 'bg-red-400/20 text-red-400' 
                          : 'bg-gray-400/20 text-gray-400'
                      }`}>
                        {log.honeypotTriggered ? '🍯 Trapped' : 'Normal'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-400 text-sm">
                        {getTimeAgo(log.triggerTime)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {logs.length === 0 && (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No interactions detected yet. Monitoring...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Logs;
