const GALLON_TO_LITER = 3.78541;
export const LITER_TO_GALLON = 1 / GALLON_TO_LITER;
const POUND_TO_KILOGRAM = 0.453592;

export function formatNumber(number: number) {
  return number.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function changeValue(number: number, { preUnit = '' }: { preUnit?: string } = {}) {
  const isPositive = number > 0;
  return `${isPositive ? '' : number < 0 ? '-' : ''} ${preUnit}${formatNumber(Math.abs(number))}`;
}

type DisplayOptions = {
  displayAsMetric: boolean;
};

type WeightDisplayOptions = DisplayOptions & {
  displayAsTons?: boolean;
};

// us tons
function poundsToTons(number: number) {
  return number / 2000;
}

// metric tons
function kgToTons(number: number) {
  return number / 1000;
}

function weightToTons(number: number, displayAsTons?: boolean) {
  return displayAsTons ? kgToTons(number) : poundsToTons(number);
}

export function valueInPounds(number: number, { displayAsMetric, displayAsTons }: WeightDisplayOptions) {
  if (displayAsMetric) {
    number = number * POUND_TO_KILOGRAM;
  }
  return weightToTons(number, displayAsTons);
}

// convert to kg if necessary
export function changeValueInPounds(number: number, { displayAsMetric, displayAsTons, ...opts }: WeightDisplayOptions) {
  const value = valueInPounds(number, { displayAsMetric, displayAsTons });
  return changeValue(value, opts) + (displayAsTons ? ' tons' : displayAsMetric ? ' kg' : ' lbs');
}

// // assume number is already converted
export function formattedValueInPounds(number: number, { displayAsMetric, displayAsTons }: WeightDisplayOptions) {
  return formatNumber(number) + (displayAsTons ? ' tons' : displayAsMetric ? ' kg' : ' lbs');
}

export function valueInGallons(number: number, { displayAsMetric }: DisplayOptions) {
  if (displayAsMetric) {
    number = number * GALLON_TO_LITER;
  }
  return number;
}

// assume number is already converted
export function formattedValueInGallons(number: number, { displayAsMetric }: DisplayOptions) {
  return formatNumber(number) + (displayAsMetric ? ' L' : ' gal');
}

export function convertAndFormatGallons(number: number, { displayAsMetric }: DisplayOptions) {
  return formattedValueInGallons(valueInGallons(number, { displayAsMetric }), { displayAsMetric });
}

// convert to gallons if necessary
export function changeValueInGallons(number: number, { displayAsMetric }: DisplayOptions) {
  const value = valueInGallons(number, { displayAsMetric });
  return changeValue(value) + (displayAsMetric ? ' L' : ' gal');
}
