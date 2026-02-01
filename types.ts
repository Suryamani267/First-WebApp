export interface RawPlantData {
  'Plant Name': string;
  'Date': string;
  'Gas Consumption - Boiler (SCM)': number;
  'Gas Consumption - Furnace (SCM)': number;
  'Gas Consumption - GDU (SCM)': number;
  'Gas Consumption - Engine (SCM)': number;
  'Gas Consumption - Package Gas Compressor (SCM)': number;
  'Gas Flared (SCM)': number;
  'Electrical Consumption - GCS (kWh)': number;
  'Electrical Consumption - ETP (kWh)': number;
  'Electrical Consumption - Refinery (kWh)': number;
  'Electrical Generated (kWh)': number;
  'APSEB Electricity Imported (kWh)': number;
  'Water Consumption - GCS (m³)': number;
  'Water Consumption - Refinery (m³)': number;
  'HSD Consumption - Pumps (KL)': number;
  'HSD Consumption - Emergency Diesel Gensets (KL)': number;
  'HSD Issued - Fire Section (KL)': number;
  'HSD Issued - PSA (KL)': number;
  'HSD Issued - Others (KL)': number;
  'Gas Production (SCM)': number;
  'Oil Production (Barrels)': number;
  'Expected Energy Consumption (MMBTU)': number;
}

export interface ProcessedPlantData {
  plantName: string;
  date: string;
  
  // 1. Gas Flared
  gasFlared: number;

  // 2. Gas Internal Consumption Breakdown
  gasBoiler: number;
  gasFurnace: number;
  gasGDU: number;
  gasEngine: number;
  gasCompressor: number;
  gasTotalInternal: number;
  
  // 3. Electrical Consumption Breakdown
  elecGCS: number;
  elecETP: number;
  elecRefinery: number;
  elecTotalConsumed: number;
  
  // 4. Water Consumption Breakdown
  waterGCS: number;
  waterRefinery: number;
  waterTotal: number;

  // 5. Electrical Generated
  elecGenerated: number;

  // 6. HSD Consumption Breakdown
  hsdPumps: number;
  hsdGensets: number;
  hsdTotalConsumed: number;

  // 7. HSD Issued Breakdown
  hsdIssuedFire: number;
  hsdIssuedPSA: number;
  hsdIssuedOthers: number;
  hsdTotalIssued: number;

  // 8. Total Energy Expended (Calculated)
  energyFromGasMMBTU: number;
  energyFromHSDMMBTU: number;
  totalEnergyExpendedMMBTU: number;

  // 9. Total Energy Produced (Calculated)
  gasProduced: number;
  oilProduced: number;
  energyFromGasProdMMBTU: number;
  energyFromOilProdMMBTU: number;
  totalEnergyProducedMMBTU: number;

  // 10. GHG Emissions (Calculated)
  elecImported: number;
  ghgScope1: number; // Gas + HSD
  ghgScope2: number; // APSEB
  ghgTotal: number;

  // KPIs
  expectedEnergyMMBTU: number;
  sec: number; // Specific Energy Consumption
  eii: number; // Energy Intensity Index
  emissionIntensity: number;
}

export type UnitType = 'MMBTU' | 'GJ';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
