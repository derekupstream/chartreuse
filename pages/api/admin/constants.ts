import type { NextApiResponse } from 'next';
import { handlerWithUser } from 'lib/middleware/handler';
import { checkIsUpstream } from 'lib/middleware/requireUpstream';
import type { NextApiRequestWithUser } from 'lib/middleware/getUser';
import { MATERIALS, REUSABLE_MATERIALS } from 'lib/calculator/constants/materials';
import { STATES } from 'lib/calculator/constants/utilities';
import {
  ELECTRIC_CO2_EMISSIONS_FACTOR,
  NATURAL_GAS_CO2_EMISSIONS_FACTOR,
  TRANSPORTATION_CO2_EMISSIONS_FACTOR
} from 'lib/calculator/constants/carbon-dioxide-emissions';

export default handlerWithUser().get(async (req: NextApiRequestWithUser, res: NextApiResponse) => {
  const isUpstream = await checkIsUpstream(req.user.orgId);
  if (!isUpstream) return res.status(403).json({ error: 'Forbidden' });

  res.json({
    emissionFactors: {
      electricCO2FactorLbsPerKwh: ELECTRIC_CO2_EMISSIONS_FACTOR,
      naturalGasCO2FactorLbsPerTherm: NATURAL_GAS_CO2_EMISSIONS_FACTOR,
      transportationMTCO2ePerLb: TRANSPORTATION_CO2_EMISSIONS_FACTOR,
      source: 'EPA WARM Model + EIA'
    },
    singleUseMaterials: MATERIALS.map(m => ({
      id: m.id,
      name: m.name,
      mtco2ePerLb: m.mtco2ePerLb,
      waterUsageGalPerLb: m.waterUsageGalPerLb,
      source: 'EPA WARM Model'
    })),
    reusableMaterials: REUSABLE_MATERIALS.map(m => ({
      id: m.id,
      name: m.name,
      mtco2ePerLb: m.mtco2ePerLb,
      waterUsageGalPerLb: m.waterUsageGalPerLb,
      source: 'EPA WARM Model'
    })),
    utilityRates: STATES.map(s => ({
      state: s.name,
      electricRateDollarPerKwh: s.electric,
      gasRateDollarPerTherm: s.gas,
      source: 'EIA Commercial Rates'
    }))
  });
});
