import React from 'react';

interface ThreatScoreProps {
  score: number;
  className?: string;
}

const ThreatScore = ({ score, className = '' }: ThreatScoreProps) => {
  const getColor = (score: number) => {
    if (score <= 30) return 'text-green-400';
    if (score <= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBackgroundColor = (score: number) => {
    if (score <= 30) return 'bg-green-400';
    if (score <= 70) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const getLevel = (score: number) => {
    if (score <= 30) return 'Low';
    if (score <= 70) return 'Medium';
    return 'High';
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400 font-medium">Threat Score</span>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getColor(score)}`}>{score}/100</div>
          <div className="text-xs text-gray-500">{getLevel(score)} Risk</div>
        </div>
      </div>
      <div className="relative">
        <div className="w-full bg-gray-700/50 rounded-full h-4 overflow-hidden">
          <div
            className={`h-4 rounded-full transition-all duration-1000 ease-out ${getBackgroundColor(score)} relative`}
            style={{ width: `${score}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
};

export default ThreatScore;
