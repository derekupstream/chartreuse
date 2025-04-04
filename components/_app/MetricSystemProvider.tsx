import type { ReactNode } from 'react';
import React, { useContext, createContext } from 'react';

const MetricSystemContext = createContext<boolean | null>(null);

export const useMetricSystem = () => {
  // Default to false (imperial) if metric system context isn't provided
  const isMetric = useContext(MetricSystemContext) ?? false;
  return isMetric;
};

export const MetricSystemProvider: React.FC<{ children: ReactNode; isMetric: boolean | null }> = ({
  children,
  isMetric
}) => {
  return <MetricSystemContext.Provider value={isMetric}>{children}</MetricSystemContext.Provider>;
};
