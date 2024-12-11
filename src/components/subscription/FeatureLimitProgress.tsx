import React from 'react';
import { FeatureLimit } from '../../utils/subscriptionLimits';

interface FeatureLimitProgressProps {
  featureLimit: FeatureLimit;
}

const FeatureLimitProgress: React.FC<FeatureLimitProgressProps> = ({ featureLimit }) => {
  const percentage = Math.min(100, (featureLimit.current / featureLimit.limit) * 100);
  
  const getColorClass = () => {
    if (percentage >= 100) return 'bg-red-600';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>{featureLimit.name}</span>
        <span>{`${featureLimit.current} / ${featureLimit.limit}`}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${getColorClass()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default FeatureLimitProgress;