export const getCurrencySymbol = (abbreviation: string): string => {
  const symbol = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: abbreviation,
    currencyDisplay: 'symbol'
  })
    .formatToParts(1)
    .find(x => x.type === 'currency')?.value;
  if (!symbol) {
    console.log(`Unknown currency: ${abbreviation}`);
    return '$'; // Default to USD
  }

  return symbol;
};
