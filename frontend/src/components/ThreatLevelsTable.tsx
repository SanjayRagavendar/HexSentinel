import React from 'react';
import { Brain, AlertTriangle, Shield, Zap } from 'lucide-react';

const ThreatLevelsTable = () => {
  const threatLevels = [
    {
      score: "0–200",
      level: "Low",
      color: "text-green-400",
      bgColor: "bg-green-400/20",
      dotColor: "bg-green-400",
      icon: Shield,
      interpretation: "Secure – No major flaws in code or runtime behavior."
    },
    {
      score: "201–400",
      level: "Moderate",
      color: "text-yellow-400",
      bgColor: "bg-yellow-400/20",
      dotColor: "bg-yellow-400",
      icon: AlertTriangle,
      interpretation: "Mild code or runtime issues; needs minor fixes."
    },
    {
      score: "401–600",
      level: "Elevated",
      color: "text-orange-400",
      bgColor: "bg-orange-400/20",
      dotColor: "bg-orange-400",
      icon: AlertTriangle,
      interpretation: "Some vulnerabilities with possible exploit paths."
    },
    {
      score: "601–800",
      level: "High",
      color: "text-red-400",
      bgColor: "bg-red-400/20",
      dotColor: "bg-red-400",
      icon: Zap,
      interpretation: "Serious code or execution flaws; exploitable."
    },
    {
      score: "801–1000",
      level: "Critical",
      color: "text-purple-400",
      bgColor: "bg-purple-400/20",
      dotColor: "bg-purple-400",
      icon: Zap,
      interpretation: "Catastrophic issues both statically and dynamically; urgent remediation needed."
    }
  ];

  return (
    <div className="glass-deep rounded-xl p-8 border border-gray-800/50 neon-glow">
      <div className="flex items-center space-x-3 mb-8">
        <div className="relative">
          <Brain className="h-8 w-8 text-pink-400" />
          <div className="absolute inset-0 bg-pink-400/20 rounded-full blur-md"></div>
        </div>
        <h2 className="text-2xl font-bold gradient-text">Combined Threat Levels (Out of 1000)</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800/50">
              <th className="text-left py-4 px-6 text-gray-300 font-semibold">Score Range</th>
              <th className="text-left py-4 px-6 text-gray-300 font-semibold">Threat Level</th>
              <th className="text-left py-4 px-6 text-gray-300 font-semibold">Risk Interpretation</th>
            </tr>
          </thead>
          <tbody>
            {threatLevels.map((level, index) => {
              const Icon = level.icon;
              return (
                <tr key={index} className="border-b border-gray-800/30 hover:bg-gray-800/20 transition-all duration-200 group hover-lift">
                  <td className="py-5 px-6">
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-5 w-5 ${level.color} opacity-60 group-hover:opacity-100 transition-all duration-200 group-hover:scale-110`} />
                      <span className="text-gray-300 font-mono font-medium group-hover:text-white transition-colors">{level.score}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${level.dotColor} shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-125`}></div>
                      <span className={`font-semibold ${level.color} group-hover:scale-105 transition-transform`}>{level.level}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <span className="text-gray-300 text-sm leading-relaxed group-hover:text-gray-200 transition-colors">{level.interpretation}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-8 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 hover-lift">
        <p className="text-sm text-gray-400 text-center">
          <strong className="text-white">Note:</strong> Threat scores are calculated using advanced AI algorithms that analyze both static code patterns and dynamic runtime behavior.
        </p>
      </div>
    </div>
  );
};

export default ThreatLevelsTable;
