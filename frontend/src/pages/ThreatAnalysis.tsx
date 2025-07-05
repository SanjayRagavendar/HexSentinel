import React, { useState } from 'react';
import { analyzeContract } from '../lib/utils';

const ThreatAnalysis: React.FC = () => {
  const [address, setAddress] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await analyzeContract(address);
      setResult({ ...res, timestamp: new Date().toISOString() });
    } catch (e: any) {
      setError(e.message || 'Failed to analyze contract');
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Threat Analysis</h1>
      <div className="mb-6 flex gap-2">
        <input
          className="flex-1 px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-green-400 outline-none"
          placeholder="Enter contract address (0x...)"
          value={address}
          onChange={e => setAddress(e.target.value)}
        />
        <button
          className="px-6 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
          onClick={handleAnalyze}
          disabled={!address || loading}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
      {error && <div className="text-red-400 mb-4">{error}</div>}
      {result && (
        <div className="bg-gray-800 rounded p-6 mt-4">
          <div className="mb-2">
            <span className="font-semibold text-gray-300">Verdict:</span>
            <span className="ml-2 text-lg font-bold text-green-400">{result.verdict}</span>
          </div>
          <div className="mb-2">
            <span className="font-semibold text-gray-300">Confidence:</span>
            <span className="ml-2">{(result.confidence * 100).toFixed(1)}%</span>
            <div className="w-full bg-gray-700 rounded h-2 mt-1">
              <div
                className="h-2 rounded bg-green-400"
                style={{ width: `${result.confidence * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="mb-2">
            <span className="font-semibold text-gray-300">Reasons:</span>
            <ul className="list-disc ml-6 text-gray-400">
              {result.reasons && result.reasons.map((r: string, i: number) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
          <div className="text-gray-500 text-xs mt-2">Analyzed at: {new Date(result.timestamp).toLocaleString()}</div>
          <button
            className="mt-4 px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
            onClick={handleAnalyze}
            disabled={loading}
          >
            Rescan
          </button>
        </div>
      )}
    </div>
  );
};

export default ThreatAnalysis; 