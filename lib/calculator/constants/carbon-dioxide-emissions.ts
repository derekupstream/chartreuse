export const ELECTRIC_CO2_EMISSIONS_FACTOR = 1.6; // lbs CO2/therm
export const NATURAL_GAS_CO2_EMISSIONS_FACTOR = 11.7; // lbs CO2/therm

const WATERBORNE_CRAFT_CO2_EMISSIONS_FACTOR = 0.000000021; // MTCO2e/nautical mile
const STANDARD_SHIPMENT_DISTANCE = 19270; // nautical miles

// multiply this by the product mass to get the CO2 emissions for the shipment
export const TRANSPORTATION_CO2_EMISSIONS_FACTOR = WATERBORNE_CRAFT_CO2_EMISSIONS_FACTOR * STANDARD_SHIPMENT_DISTANCE; // MTCO2e/nautical mile
