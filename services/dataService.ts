import { ProcessedPlantData, RawPlantData } from '../types';
import { CONVERSIONS, EMISSION_FACTORS } from '../constants';
import * as XLSX from 'xlsx';

// Helper to safely parse numbers, defaulting to 0 if missing or NaN
const safeFloat = (val: any): number => {
  if (typeof val === 'number') return val;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

// New function to read Excel or CSV files using SheetJS (xlsx)
export const readDataFile = async (file: File): Promise<RawPlantData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return resolve([]);
      
      try {
        // Read the file data
        // cellDates: true converts Excel serial dates (e.g. 45000) to JS Date objects automatically
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        // Assume data is in the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        // Post-process to ensure Date objects are converted to formatted strings
        const processedData = jsonData.map((row: any) => {
            const newRow = { ...row };
            
            // Check if 'Date' exists
            if (newRow['Date']) {
                if (newRow['Date'] instanceof Date) {
                     const d = newRow['Date'];
                     // FIX: Add 12 hours to the date object to prevent timezone shifts.
                     // e.g. Midnight UTC might be previous day in Western timezones. 
                     // Pushing to Noon ensures .getDate() returns the correct day everywhere.
                     const adjustedTime = d.getTime() + (12 * 60 * 60 * 1000); 
                     const adjustedDate = new Date(adjustedTime);

                     const day = adjustedDate.getDate().toString().padStart(2, '0');
                     const month = adjustedDate.toLocaleString('en-US', { month: 'short' });
                     const year = adjustedDate.getFullYear().toString().slice(-2);
                     newRow['Date'] = `${day}-${month}-${year}`;

                } else if (typeof newRow['Date'] === 'number') {
                    // Fallback for Serial Dates
                    // Excel base date is approx 1900. 
                    if (newRow['Date'] > 30000) { 
                        // Add 12 hours (0.5 days) to the serial number or milliseconds to avoid timezone regression
                        const d = new Date(Math.round((newRow['Date'] - 25569) * 86400 * 1000) + (12 * 60 * 60 * 1000));
                        
                        const day = d.getDate().toString().padStart(2, '0');
                        const month = d.toLocaleString('en-US', { month: 'short' });
                        const year = d.getFullYear().toString().slice(-2);
                        newRow['Date'] = `${day}-${month}-${year}`;
                    }
                }
            }
            return newRow;
        });
        
        resolve(processedData as RawPlantData[]);
      } catch (err) {
        console.error("Error parsing file:", err);
        // Fallback or empty on error
        resolve([]);
      }
    };
    
    reader.onerror = (err) => reject(err);
    
    // Read as ArrayBuffer to support binary Excel files
    reader.readAsArrayBuffer(file);
  });
};

export const parseCSV = (csvText: string): RawPlantData[] => {
  // Keeping this for fallback legacy support if needed, 
  // but readDataFile handles CSVs well via XLSX too.
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const data: RawPlantData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < 2) continue;

    const row: any = {};
    headers.forEach((header, index) => {
      const val = values[index] || '';
      if (header === 'Plant Name' || header === 'Date') {
        row[header] = val;
      } else {
        row[header] = safeFloat(val);
      }
    });
    data.push(row as RawPlantData);
  }
  return data;
};

export const processPlantData = (raw: RawPlantData): ProcessedPlantData => {
  // --- 1. Daily Gas Flared ---
  const gasFlared = safeFloat(raw['Gas Flared (SCM)']);

  // --- 2. Daily Gas Internal Fuel Consumption ---
  const gasBoiler = safeFloat(raw['Gas Consumption - Boiler (SCM)']);
  const gasFurnace = safeFloat(raw['Gas Consumption - Furnace (SCM)']);
  const gasGDU = safeFloat(raw['Gas Consumption - GDU (SCM)']);
  const gasEngine = safeFloat(raw['Gas Consumption - Engine (SCM)']);
  const gasCompressor = safeFloat(raw['Gas Consumption - Package Gas Compressor (SCM)']);
  const gasTotalInternal = gasBoiler + gasFurnace + gasGDU + gasEngine + gasCompressor;

  // --- 3. Electrical Energy Consumption ---
  const elecGCS = safeFloat(raw['Electrical Consumption - GCS (kWh)']);
  const elecETP = safeFloat(raw['Electrical Consumption - ETP (kWh)']);
  const elecRefinery = safeFloat(raw['Electrical Consumption - Refinery (kWh)']);
  const elecTotalConsumed = elecGCS + elecETP + elecRefinery;

  // --- 4. Water Consumption ---
  const waterGCS = safeFloat(raw['Water Consumption - GCS (m³)']);
  const waterRefinery = safeFloat(raw['Water Consumption - Refinery (m³)']);
  const waterTotal = waterGCS + waterRefinery;

  // --- 5. Electrical Energy Generated ---
  const elecGenerated = safeFloat(raw['Electrical Generated (kWh)']);

  // --- 6. HSD Fuel Consumption ---
  const hsdPumps = safeFloat(raw['HSD Consumption - Pumps (KL)']);
  const hsdGensets = safeFloat(raw['HSD Consumption - Emergency Diesel Gensets (KL)']);
  const hsdTotalConsumed = hsdPumps + hsdGensets;

  // --- 7. HSD Issued ---
  const hsdIssuedFire = safeFloat(raw['HSD Issued - Fire Section (KL)']);
  const hsdIssuedPSA = safeFloat(raw['HSD Issued - PSA (KL)']);
  const hsdIssuedOthers = safeFloat(raw['HSD Issued - Others (KL)']);
  const hsdTotalIssued = hsdIssuedFire + hsdIssuedPSA + hsdIssuedOthers;

  // --- 8. Total Energy Expended ---
  const energyFromGasMMBTU = gasTotalInternal * CONVERSIONS.SCM_TO_MMBTU;
  const energyFromHSDMMBTU = hsdTotalConsumed * CONVERSIONS.KL_TO_MMBTU_HSD;
  const totalEnergyExpendedMMBTU = energyFromGasMMBTU + energyFromHSDMMBTU;

  // --- 9. Total Energy Produced ---
  const gasProduced = safeFloat(raw['Gas Production (SCM)']);
  const oilProduced = safeFloat(raw['Oil Production (Barrels)']);
  
  const energyFromGasProdMMBTU = gasProduced * CONVERSIONS.SCM_TO_MMBTU;
  const energyFromOilProdMMBTU = oilProduced * CONVERSIONS.BARREL_TO_MMBTU_OIL;
  const totalEnergyProducedMMBTU = energyFromGasProdMMBTU + energyFromOilProdMMBTU;

  // --- 10. GHG Emissions ---
  const elecImported = safeFloat(raw['APSEB Electricity Imported (kWh)']);
  
  // Scope 1: Gas Combustion + HSD Combustion
  const scope1Tonnes = (
    (gasTotalInternal * EMISSION_FACTORS.GAS_KGCO2_PER_SCM) + 
    (hsdTotalConsumed * EMISSION_FACTORS.HSD_KGCO2_PER_KL)
  ) / 1000;

  // Scope 2: Purchased Electricity
  const scope2Tonnes = (elecImported * EMISSION_FACTORS.GRID_ELEC_KGCO2_PER_KWH) / 1000;
  
  const ghgTotal = scope1Tonnes + scope2Tonnes;

  // --- KPIs ---
  const expectedEnergyMMBTU = safeFloat(raw['Expected Energy Consumption (MMBTU)']);
  
  // SEC = Gas Energy Consumed / Total Energy Produced
  // Changed from Total Energy (Gas+HSD) to just Gas Energy as per request.
  const sec = totalEnergyProducedMMBTU > 0 ? (energyFromGasMMBTU / totalEnergyProducedMMBTU) : 0;

  // EII = Actual / Expected
  const eii = expectedEnergyMMBTU > 0 ? (totalEnergyExpendedMMBTU / expectedEnergyMMBTU) * 100 : 0;

  // Emission Intensity = Emissions / Gas Produced (As per prompt: mmCO2e / Gas Produced)
  const emissionIntensity = gasProduced > 0 ? (ghgTotal / gasProduced) : 0;

  return {
    plantName: raw['Plant Name'] || 'Unknown Plant',
    date: raw['Date'] || 'Unknown Date',
    gasFlared,
    gasBoiler, gasFurnace, gasGDU, gasEngine, gasCompressor, gasTotalInternal,
    elecGCS, elecETP, elecRefinery, elecTotalConsumed,
    waterGCS, waterRefinery, waterTotal,
    elecGenerated,
    hsdPumps, hsdGensets, hsdTotalConsumed,
    hsdIssuedFire, hsdIssuedPSA, hsdIssuedOthers, hsdTotalIssued,
    energyFromGasMMBTU, energyFromHSDMMBTU, totalEnergyExpendedMMBTU,
    gasProduced, oilProduced, energyFromGasProdMMBTU, energyFromOilProdMMBTU, totalEnergyProducedMMBTU,
    elecImported, ghgScope1: scope1Tonnes, ghgScope2: scope2Tonnes, ghgTotal,
    expectedEnergyMMBTU,
    sec,
    eii,
    emissionIntensity
  };
};

export const getBlankPlantData = (): ProcessedPlantData => ({
  plantName: 'Select Plant', date: 'Select Date',
  gasFlared: 0,
  gasBoiler: 0, gasFurnace: 0, gasGDU: 0, gasEngine: 0, gasCompressor: 0, gasTotalInternal: 0,
  elecGCS: 0, elecETP: 0, elecRefinery: 0, elecTotalConsumed: 0,
  waterGCS: 0, waterRefinery: 0, waterTotal: 0,
  elecGenerated: 0,
  hsdPumps: 0, hsdGensets: 0, hsdTotalConsumed: 0,
  hsdIssuedFire: 0, hsdIssuedPSA: 0, hsdIssuedOthers: 0, hsdTotalIssued: 0,
  energyFromGasMMBTU: 0, energyFromHSDMMBTU: 0, totalEnergyExpendedMMBTU: 0,
  gasProduced: 0, oilProduced: 0, energyFromGasProdMMBTU: 0, energyFromOilProdMMBTU: 0, totalEnergyProducedMMBTU: 0,
  elecImported: 0, ghgScope1: 0, ghgScope2: 0, ghgTotal: 0,
  expectedEnergyMMBTU: 0,
  sec: 0, eii: 0, emissionIntensity: 0
});