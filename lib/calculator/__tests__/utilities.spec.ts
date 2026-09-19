import { LITER_TO_GALLON } from '../../number';
import { CANADIAN_REGIONS, getProjectUtilities, isCanadianRegion, STATES } from '../constants/utilities';

const imperialOrg = { useMetricSystem: false };

describe('getProjectUtilities', () => {
  it('returns the US national average water rate for US states', () => {
    const rates = getProjectUtilities({ USState: 'California', org: imperialOrg });
    expect(rates.electric).toBe(0.13);
    expect(rates.gas).toBe(0.92);
    expect(rates.water).toBe(6.98);
  });

  it('returns Canadian gas and water rates for provinces', () => {
    const ontario = getProjectUtilities({ USState: 'Ontario', org: imperialOrg });
    expect(ontario.electric).toBe(0.148); // Hydro-Québec 2025 comparison
    expect(ontario.gas).toBe(0.723); // StatCan 25-10-0086-01, 12 mo ending Jun 2026
    expect(ontario.water).toBe(17.6); // 7-city commercial water+wastewater average

    const quebec = getProjectUtilities({ USState: 'Quebec', org: imperialOrg });
    expect(quebec.gas).toBe(1.216);
  });

  it('gives every Canadian region its own gas rate and the Canadian water rate', () => {
    for (const region of CANADIAN_REGIONS) {
      const rates = getProjectUtilities({ USState: region, org: imperialOrg });
      expect(rates.gas).not.toBe(0.92); // never the US placeholder
      expect(rates.water).toBe(17.6);
    }
  });

  it('converts the water rate for metric organizations', () => {
    const rates = getProjectUtilities({ USState: 'Ontario', org: { useMetricSystem: true } });
    expect(rates.water).toBeCloseTo(17.6 * LITER_TO_GALLON, 10);
  });
});

describe('isCanadianRegion', () => {
  it('recognizes provinces and not US states', () => {
    expect(isCanadianRegion('Ontario')).toBe(true);
    expect(isCanadianRegion('California')).toBe(false);
  });

  it('every Canadian region is present in STATES', () => {
    for (const region of CANADIAN_REGIONS) {
      expect(STATES.some(s => s.name === region)).toBe(true);
    }
  });
});
