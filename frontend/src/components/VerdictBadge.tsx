
import React from 'react';
import { Shield, AlertTriangle, X } from 'lucide-react';

interface VerdictBadgeProps {
  verdict: 'safe' | 'suspicious' | 'malicious';
  className?: string;
}

const VerdictBadge = ({ verdict, className = '' }: VerdictBadgeProps) => {
  const getVerdictConfig = (verdict: string) => {
    switch (verdict) {
      case 'safe':
        return {
          icon: Shield,
          text: 'Safe',
          bgColor: 'bg-green-400/20',
          textColor: 'text-green-400',
          borderColor: 'border-green-400/30',
        };
      case 'suspicious':
        return {
          icon: AlertTriangle,
          text: 'Suspicious',
          bgColor: 'bg-yellow-400/20',
          textColor: 'text-yellow-400',
          borderColor: 'border-yellow-400/30',
        };
      case 'malicious':
        return {
          icon: X,
          text: 'Malicious',
          bgColor: 'bg-red-400/20',
          textColor: 'text-red-400',
          borderColor: 'border-red-400/30',
        };
      default:
        return {
          icon: Shield,
          text: 'Unknown',
          bgColor: 'bg-gray-400/20',
          textColor: 'text-gray-400',
          borderColor: 'border-gray-400/30',
        };
    }
  };

  const config = getVerdictConfig(verdict);
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}>
      <Icon className="h-4 w-4 mr-2" />
      <span className="font-medium">{config.text}</span>
    </div>
  );
};

export default VerdictBadge;
