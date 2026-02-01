// Conversion Factors (Approximate Industry Standards for Demo)
// In a real app, these would be configurable via an admin panel.

export const CONVERSIONS = {
  SCM_TO_MMBTU: 0.0396, // Approx Net CV of Natural Gas
  KWH_TO_MMBTU: 0.003412,
  KL_TO_MMBTU_HSD: 35.8, // Approx for High Speed Diesel
  BARREL_TO_MMBTU_OIL: 5.8, // Crude Oil approx
  MMBTU_TO_GJ: 1.05506,
};

export const EMISSION_FACTORS = {
  GAS_KGCO2_PER_SCM: 1.88, // Natural Gas combustion
  HSD_KGCO2_PER_KL: 2650, // Diesel combustion
  GRID_ELEC_KGCO2_PER_KWH: 0.82, // Indian Grid Average (approx high side)
};

export const DEFAULT_PLANT_DATA = {
  plantName: 'N/A',
  date: 'N/A',
  gasBoiler: 0, gasFurnace: 0, gasGDU: 0, gasEngine: 0, gasCompressor: 0,
  gasTotalInternal: 0, gasFlared: 0,
  elecGCS: 0, elecETP: 0, elecRefinery: 0, elecTotalConsumed: 0,
  elecGenerated: 0, elecImported: 0,
  waterGCS: 0, waterRefinery: 0, waterTotal: 0,
  hsdPumps: 0, hsdGensets: 0, hsdTotalConsumed: 0,
  hsdIssuedFire: 0, hsdIssuedPSA: 0, hsdIssuedOthers: 0, hsdTotalIssued: 0,
  gasProduced: 0, oilProduced: 0,
  expectedEnergyMMBTU: 0,
  totalEnergyExpendedMMBTU: 0, totalEnergyProducedMMBTU: 0,
  ghgScope1: 0, ghgScope2: 0,
  sec: 0, eii: 0, emissionIntensity: 0
};
