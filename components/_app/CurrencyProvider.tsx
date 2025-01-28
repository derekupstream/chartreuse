import type { ReactNode } from 'react';
import React, { useContext, createContext } from 'react';
import { getCurrencySymbol } from '../../utils/currency';

const CurrencyContext = createContext<string | null>(null);

export const useCurrency = () => {
  // Default to USD if currency context isn't provided
  const abbreviation = useContext(CurrencyContext) || 'USD';
  return { abbreviation, symbol: getCurrencySymbol(abbreviation) };
};

export const CurrencyProvider: React.FC<{ children: ReactNode; abbreviation: string | null }> = ({
  children,
  abbreviation
}) => {
  return <CurrencyContext.Provider value={abbreviation}>{children}</CurrencyContext.Provider>;
};
