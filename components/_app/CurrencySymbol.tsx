import React from 'react';

import { useCurrency } from './CurrencyProvider';

const CurrencySymbol: React.FC<{ value?: number }> = ({ value }) => {
  const { symbol, abbreviation } = useCurrency();
  // If no value is provided, just return the symbol (used as an input prefix, where
  // there is no room for a code suffix — CAD shows CA$ there).

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
  // Site convention: "$1,234 USD" / "$1,234 CAD" — the currency code rides after the
  // amount at the same size, like the lbs / units / MTCO2e unit labels.
  return <span style={{ whiteSpace: 'nowrap' }}>{`$${formattedValue} ${abbreviation}`}</span>;
};

export default CurrencySymbol;
