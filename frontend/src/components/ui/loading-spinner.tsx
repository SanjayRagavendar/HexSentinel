import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'green' | 'white' | 'gray';
  className?: string;
}

const LoadingSpinner = ({ size = 'md', color = 'green', className = '' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const colorClasses = {
    green: 'border-green-400/20 border-t-green-400',
    white: 'border-white/20 border-t-white',
    gray: 'border-gray-400/20 border-t-gray-400'
  };

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
      <div className="w-full h-full border-2 rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingSpinner; 