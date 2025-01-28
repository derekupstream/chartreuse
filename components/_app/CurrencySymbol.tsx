import React from 'react';

import { useCurrency } from './CurrencyProvider';

const CurrencySymbol: React.FC<{ value?: number }> = ({ value }) => {
  const { symbol } = useCurrency();
  // If no value is provided, just return the symbol

  if (typeof value === 'undefined') {
    return <span dangerouslySetInnerHTML={{ __html: symbol }} />;
  }

  // If the integer part of the value is 2 digits or less, show 2 decimal places (eg. $45.67). Otherwise, show the whole number (eg. $102 instead of $101.99; $1,288 instead of $1,287.99)
  const integerLength = Math.floor(value).toString().length;
  const fractionDigits = integerLength <= 2 ? 2 : 0;

  const formattedValue = value.toLocaleString('en-US', {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits
  });
  return <span dangerouslySetInnerHTML={{ __html: symbol + formattedValue }} />;
};

export default CurrencySymbol;
