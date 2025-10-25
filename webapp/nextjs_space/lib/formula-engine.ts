
import { evaluate } from 'mathjs';

/**
 * Formula Engine for safe rebate calculations
 * Supports complex formulas with variables
 */

export interface FormulaVariables {
  systemSizeKw?: number;
  batterySizeKwh?: number;
  batteryCost?: number;
  solarCost?: number;
  totalCost?: number;
  panelCount?: number;
  [key: string]: number | undefined;
}

export interface FormulaResult {
  success: boolean;
  value?: number;
  error?: string;
}

/**
 * Safely evaluates a mathematical formula with provided variables
 * Uses mathjs for secure evaluation
 * 
 * @param formula - Mathematical expression (e.g., "min(systemSizeKw * 500, 5000)")
 * @param variables - Object containing variable values
 * @returns Result object with success status and calculated value or error
 */
export function evaluateFormula(
  formula: string,
  variables: FormulaVariables
): FormulaResult {
  try {
    // Validate formula is not empty
    if (!formula || typeof formula !== 'string') {
      return {
        success: false,
        error: 'Formula is required and must be a string',
      };
    }

    // Clean the formula (remove extra whitespace)
    const cleanFormula = formula.trim();

    // Prepare scope with variables, defaulting undefined values to 0
    const scope: Record<string, number> = {};
    Object.keys(variables).forEach((key) => {
      scope[key] = variables[key] ?? 0;
    });

    // Evaluate the formula
    const result = evaluate(cleanFormula, scope);

    // Ensure result is a number
    if (typeof result !== 'number' || isNaN(result)) {
      return {
        success: false,
        error: 'Formula did not evaluate to a valid number',
      };
    }

    // Round to 2 decimal places
    const roundedResult = Math.round(result * 100) / 100;

    return {
      success: true,
      value: roundedResult,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Formula evaluation error: ${error.message}`,
    };
  }
}

/**
 * Validates a formula by attempting to evaluate it with sample variables
 * 
 * @param formula - Mathematical expression to validate
 * @returns Result object indicating if formula is valid
 */
export function validateFormula(formula: string): FormulaResult {
  // Sample variables for testing
  const sampleVariables: FormulaVariables = {
    systemSizeKw: 10,
    batterySizeKwh: 13.5,
    batteryCost: 15000,
    solarCost: 12000,
    totalCost: 27000,
    panelCount: 25,
  };

  return evaluateFormula(formula, sampleVariables);
}

/**
 * Gets a list of available variables that can be used in formulas
 */
export function getAvailableVariables(): Array<{
  name: string;
  description: string;
  type: string;
}> {
  return [
    {
      name: 'systemSizeKw',
      description: 'Solar system size in kilowatts',
      type: 'number',
    },
    {
      name: 'batterySizeKwh',
      description: 'Battery capacity in kilowatt-hours',
      type: 'number',
    },
    {
      name: 'batteryCost',
      description: 'Total cost of battery system',
      type: 'number',
    },
    {
      name: 'solarCost',
      description: 'Total cost of solar panels and installation',
      type: 'number',
    },
    {
      name: 'totalCost',
      description: 'Total system cost (solar + battery + addons)',
      type: 'number',
    },
    {
      name: 'panelCount',
      description: 'Number of solar panels',
      type: 'number',
    },
  ];
}

/**
 * Example formulas for reference
 */
export const EXAMPLE_FORMULAS = [
  {
    name: 'Fixed amount per kW with cap',
    formula: 'min(systemSizeKw * 500, 5000)',
    description: '$500 per kW, maximum $5,000',
  },
  {
    name: 'Percentage with minimum',
    formula: 'max(batteryCost * 0.3, 1000)',
    description: '30% of battery cost, minimum $1,000',
  },
  {
    name: 'Tiered based on size',
    formula: 'batterySizeKwh > 10 ? 3000 : 1500',
    description: '$3,000 for batteries over 10kWh, otherwise $1,500',
  },
  {
    name: 'Complex tiered calculation',
    formula: 'systemSizeKw <= 5 ? systemSizeKw * 400 : (5 * 400 + (systemSizeKw - 5) * 300)',
    description: '$400/kW for first 5kW, then $300/kW for additional capacity',
  },
  {
    name: 'Combined with multiple conditions',
    formula: 'min((batterySizeKwh * 400) + (systemSizeKw > 10 ? 2000 : 0), 8000)',
    description: '$400 per kWh + $2,000 bonus if system > 10kW, capped at $8,000',
  },
];
