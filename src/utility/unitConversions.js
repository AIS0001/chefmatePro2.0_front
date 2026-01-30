/**
 * Unit Conversion Utilities for Inventory System
 * Handles conversions between different units (bottles, ML, pegs, pcs, etc.)
 */

/**
 * Convert quantity from one unit to base unit (ML or pcs)
 * @param {number} quantity - Quantity in the source unit
 * @param {string} fromUnit - Source unit (e.g., "Bottle", "30ML Peg")
 * @param {object} item - Item object with unit configuration
 * @returns {number} - Quantity in base unit
 */
export const convertToBaseUnit = (quantity, fromUnit, item) => {
  if (!item || !quantity) return 0;

  // For simple items (pcs, cans, etc.), no conversion needed
  if (item.unit_type === 'simple') {
    return parseFloat(quantity);
  }

  // For convertible items (liquor with bottles and ML)
  if (item.unit_type === 'convertible') {
    // If purchasing in bottles, convert to ML
    if (fromUnit === 'Bottle' || fromUnit === item.purchase_unit) {
      return parseFloat(quantity) * parseFloat(item.bottle_capacity_ml || 0);
    }

    // If unit is ML-based (like "30ML Peg", "60ML Peg")
    const mlMatch = fromUnit.match(/(\d+)\s*ML/i);
    if (mlMatch) {
      const mlPerUnit = parseFloat(mlMatch[1]);
      return parseFloat(quantity) * mlPerUnit;
    }

    // Check sale_units JSON for conversion factor
    if (item.sale_units) {
      try {
        const saleUnits = typeof item.sale_units === 'string' 
          ? JSON.parse(item.sale_units) 
          : item.sale_units;
        
        const unitConfig = saleUnits.find(u => u.unit === fromUnit);
        if (unitConfig) {
          return parseFloat(quantity) * parseFloat(unitConfig.factor);
        }
      } catch (e) {
        console.error('Error parsing sale_units:', e);
      }
    }
  }

  // Default: assume 1:1 conversion
  return parseFloat(quantity);
};

/**
 * Convert quantity from base unit to display unit
 * @param {number} baseQuantity - Quantity in base unit (ML or pcs)
 * @param {string} toUnit - Target unit for display
 * @param {object} item - Item object with unit configuration
 * @returns {number} - Quantity in target unit
 */
export const convertFromBaseUnit = (baseQuantity, toUnit, item) => {
  if (!item || !baseQuantity) return 0;

  // For simple items, no conversion needed
  if (item.unit_type === 'simple') {
    return parseFloat(baseQuantity);
  }

  // For convertible items
  if (item.unit_type === 'convertible') {
    // Convert ML to bottles
    if (toUnit === 'Bottle' || toUnit === item.purchase_unit) {
      const bottleCapacity = parseFloat(item.bottle_capacity_ml || 1);
      return parseFloat(baseQuantity) / bottleCapacity;
    }

    // Convert ML to peg sizes
    const mlMatch = toUnit.match(/(\d+)\s*ML/i);
    if (mlMatch) {
      const mlPerUnit = parseFloat(mlMatch[1]);
      return parseFloat(baseQuantity) / mlPerUnit;
    }

    // Check sale_units JSON
    if (item.sale_units) {
      try {
        const saleUnits = typeof item.sale_units === 'string' 
          ? JSON.parse(item.sale_units) 
          : item.sale_units;
        
        const unitConfig = saleUnits.find(u => u.unit === toUnit);
        if (unitConfig) {
          return parseFloat(baseQuantity) / parseFloat(unitConfig.factor);
        }
      } catch (e) {
        console.error('Error parsing sale_units:', e);
      }
    }
  }

  // Default: assume 1:1 conversion
  return parseFloat(baseQuantity);
};

/**
 * Get available sale units for an item
 * @param {object} item - Item object
 * @returns {array} - Array of sale unit options
 */
export const getAvailableSaleUnits = (item) => {
  if (!item) return [];

  if (item.unit_type === 'simple') {
    return [{ unit: item.unit || item.base_unit, factor: 1 }];
  }

  if (item.unit_type === 'convertible' && item.sale_units) {
    try {
      const saleUnits = typeof item.sale_units === 'string' 
        ? JSON.parse(item.sale_units) 
        : item.sale_units;
      return saleUnits;
    } catch (e) {
      console.error('Error parsing sale_units:', e);
      return [];
    }
  }

  return [];
};

/**
 * Format stock display with appropriate units
 * @param {number} baseQuantity - Quantity in base unit
 * @param {object} item - Item object
 * @returns {string} - Formatted stock display
 */
export const formatStockDisplay = (baseQuantity, item) => {
  if (!item) return '0';

  if (item.unit_type === 'simple') {
    return `${parseFloat(baseQuantity).toFixed(2)} ${item.base_unit || item.unit}`;
  }

  if (item.unit_type === 'convertible') {
    const bottles = convertFromBaseUnit(baseQuantity, 'Bottle', item);
    const ml = baseQuantity;
    return `${bottles.toFixed(2)} Bottles (${ml.toFixed(0)} ML)`;
  }

  return `${parseFloat(baseQuantity).toFixed(2)}`;
};

/**
 * Calculate stock after sale
 * @param {number} currentStock - Current stock in base unit
 * @param {number} saleQuantity - Quantity being sold
 * @param {string} saleUnit - Unit of sale
 * @param {object} item - Item object
 * @returns {number} - Remaining stock in base unit
 */
export const calculateStockAfterSale = (currentStock, saleQuantity, saleUnit, item) => {
  const deduction = convertToBaseUnit(saleQuantity, saleUnit, item);
  return parseFloat(currentStock) - deduction;
};

/**
 * Validate if sufficient stock is available
 * @param {number} currentStock - Current stock in base unit
 * @param {number} saleQuantity - Quantity being sold
 * @param {string} saleUnit - Unit of sale
 * @param {object} item - Item object
 * @returns {boolean} - True if sufficient stock
 */
export const hasAvailableStock = (currentStock, saleQuantity, saleUnit, item) => {
  const required = convertToBaseUnit(saleQuantity, saleUnit, item);
  return parseFloat(currentStock) >= required;
};

/**
 * Get unit conversion suggestions for display
 * @param {object} item - Item object
 * @returns {array} - Array of conversion examples
 */
export const getUnitConversionExamples = (item) => {
  if (!item || item.unit_type !== 'convertible') return [];

  const examples = [];
  const saleUnits = getAvailableSaleUnits(item);

  saleUnits.forEach(unit => {
    examples.push({
      unit: unit.unit,
      example: `1 ${unit.unit} = ${unit.factor} ML`
    });
  });

  return examples;
};

/**
 * Parse sale units JSON string to array
 * @param {string|array} saleUnitsData - Sale units data
 * @returns {array} - Parsed sale units array
 */
export const parseSaleUnits = (saleUnitsData) => {
  if (!saleUnitsData) return [];
  
  if (Array.isArray(saleUnitsData)) return saleUnitsData;
  
  if (typeof saleUnitsData === 'string') {
    try {
      return JSON.parse(saleUnitsData);
    } catch (e) {
      console.error('Error parsing sale units:', e);
      return [];
    }
  }
  
  return [];
};

/**
 * Commonly used unit configurations
 */
export const COMMON_LIQUOR_UNITS = [
  { unit: '30ML Peg', factor: 30 },
  { unit: '60ML Peg', factor: 60 },
  { unit: '90ML Large Peg', factor: 90 },
  { unit: 'Bottle', factor: 750 }
];

export const COMMON_BOTTLE_SIZES = [
  { label: '180ML (Nip)', value: 180 },
  { label: '375ML (Half Bottle)', value: 375 },
  { label: '750ML (Standard)', value: 750 },
  { label: '1000ML (1 Liter)', value: 1000 },
  { label: '1750ML (1.75 Liter)', value: 1750 }
];

export const SIMPLE_UNIT_TYPES = [
  'pcs',
  'cann',
  'can',
  'bottle',
  'pack',
  'box',
  'kg',
  'gram',
  'liter'
];
