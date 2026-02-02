/**
 * Robust money parsing utility for Canadian/US/European currency formats
 * Supports:
 * - "1,234.56" (US/CA format)
 * - "1.234,56" (European format)
 * - "$100", "$ 100", "CAD$100", "CAD 100"
 * - Negative: "-123.45" or "(123.45)"
 * - Spaces as thousand separators: "1 234,56"
 */

const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

function devLog(message: string, data?: unknown) {
  if (isDev || (typeof window !== 'undefined' && window.location.hostname === 'localhost')) {
    console.log(`[parseMoney] ${message}`, data ?? '');
  }
}

export interface ParseMoneyResult {
  value: number | null;
  error: string | null;
  original: string;
}

/**
 * Parse a money string into a number
 * @param input - The raw value from spreadsheet
 * @param preferredDecimalSeparator - Optional hint: '.' for CA/US, ',' for EU. Auto-detected if not provided.
 * @returns ParseMoneyResult with value, error, and original input
 */
export function parseMoney(
  input: string | number | null | undefined,
  preferredDecimalSeparator?: '.' | ','
): ParseMoneyResult {
  const original = String(input ?? '').trim();
  
  // Handle empty/null
  if (!original || original === '' || original === '-') {
    return { value: null, error: 'Empty value', original };
  }
  
  // If already a number, return it
  if (typeof input === 'number' && !isNaN(input)) {
    return { value: input, error: null, original };
  }
  
  let cleaned = original;
  
  // Check for negative in parentheses: (123.45) -> -123.45
  const isParenthesesNegative = /^\(.*\)$/.test(cleaned);
  if (isParenthesesNegative) {
    cleaned = cleaned.slice(1, -1);
  }
  
  // Check for leading minus
  const hasLeadingMinus = cleaned.startsWith('-');
  if (hasLeadingMinus) {
    cleaned = cleaned.slice(1);
  }
  
  // Remove currency symbols and text: $, CAD, CAD$, USD, EUR, R$, etc.
  cleaned = cleaned
    .replace(/^(CAD\$?|USD\$?|EUR€?|R\$|£|€|\$)\s*/gi, '')
    .replace(/\s*(CAD|USD|EUR|BRL)$/gi, '')
    .trim();
  
  // Remove spaces used as thousand separators (common in FR/EU: "1 234,56")
  cleaned = cleaned.replace(/\s/g, '');
  
  // Detect decimal separator
  // Strategy: The last occurrence of '.' or ',' followed by 1-2 digits at the end is the decimal separator
  // e.g., "1,234.56" -> '.' is decimal (2 digits after)
  // e.g., "1.234,56" -> ',' is decimal (2 digits after)
  // e.g., "1,234" -> no decimal (could be thousand sep or just integer)
  
  let decimalSeparator: '.' | ',' | null = null;
  
  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');
  
  if (lastDot > -1 && lastComma > -1) {
    // Both exist - the one that comes later is the decimal separator
    if (lastDot > lastComma) {
      decimalSeparator = '.';
    } else {
      decimalSeparator = ',';
    }
  } else if (lastDot > -1) {
    // Only dots - check if it looks like a decimal (1-2 digits after)
    const afterDot = cleaned.slice(lastDot + 1);
    if (afterDot.length <= 2 && /^\d+$/.test(afterDot)) {
      decimalSeparator = '.';
    } else {
      // Multiple digits after dot, likely thousand separator
      decimalSeparator = preferredDecimalSeparator || null;
    }
  } else if (lastComma > -1) {
    // Only commas - check if it looks like a decimal (1-2 digits after)
    const afterComma = cleaned.slice(lastComma + 1);
    if (afterComma.length <= 2 && /^\d+$/.test(afterComma)) {
      decimalSeparator = ',';
    } else {
      // Multiple digits after comma, likely thousand separator
      decimalSeparator = preferredDecimalSeparator || null;
    }
  }
  
  // Use preferred decimal separator if detection unclear
  if (!decimalSeparator && preferredDecimalSeparator) {
    decimalSeparator = preferredDecimalSeparator;
  }
  
  // Normalize: remove thousand separators, convert decimal separator to '.'
  let normalized = cleaned;
  
  if (decimalSeparator === '.') {
    // Remove commas (thousand separators), keep dots
    normalized = cleaned.replace(/,/g, '');
  } else if (decimalSeparator === ',') {
    // Remove dots (thousand separators), convert comma to dot
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // No decimal detected, just remove all non-numeric except dots
    normalized = cleaned.replace(/,/g, '');
  }
  
  // Remove any remaining non-numeric characters except dot and minus
  normalized = normalized.replace(/[^\d.-]/g, '');
  
  // Parse the number
  const parsed = parseFloat(normalized);
  
  if (isNaN(parsed)) {
    devLog('Parse failed', { original, cleaned, normalized });
    return { 
      value: null, 
      error: `Cannot parse "${original}" as number`, 
      original 
    };
  }
  
  // Apply negative sign
  const finalValue = (isParenthesesNegative || hasLeadingMinus) ? -Math.abs(parsed) : parsed;
  
  devLog('Parsed successfully', { original, finalValue });
  
  return { value: finalValue, error: null, original };
}

/**
 * Parse a date string into a Date object
 * Supports: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY
 */
export function parseDate(input: string | number | null | undefined): Date | null {
  if (!input) return null;
  
  const str = String(input).trim();
  if (!str) return null;
  
  // If it's a number (Excel serial date)
  if (typeof input === 'number') {
    // Excel serial date starts from 1900-01-01 (day 1)
    // JavaScript Date expects milliseconds since 1970-01-01
    const excelEpoch = new Date(1899, 11, 30); // Excel epoch (day 0)
    const date = new Date(excelEpoch.getTime() + input * 24 * 60 * 60 * 1000);
    if (!isNaN(date.getTime())) return date;
  }
  
  // ISO format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const date = new Date(str);
    if (!isNaN(date.getTime())) return date;
  }
  
  // DD/MM/YYYY or DD-MM-YYYY (common in BR/EU)
  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }
  
  // MM/DD/YYYY (common in US)
  const mmddyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mmddyyyy) {
    const [, month, day, year] = mmddyyyy;
    // If month > 12, it's probably DD/MM/YYYY
    if (parseInt(month) <= 12) {
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) return date;
    }
  }
  
  // Fallback: try native Date parsing
  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) return fallback;
  
  return null;
}

/**
 * Batch validate rows and return validation statistics
 */
export interface RowValidation {
  rowIndex: number;
  isValid: boolean;
  amountError?: string;
  dateError?: string;
  parsedAmount?: number;
  parsedDate?: Date;
}

export function validateImportRows(
  rows: Record<string, unknown>[],
  dateColumn: string,
  amountColumn: string
): {
  validations: RowValidation[];
  validCount: number;
  invalidCount: number;
  totalErrors: { amount: number; date: number };
} {
  const validations: RowValidation[] = [];
  let validCount = 0;
  let invalidCount = 0;
  const totalErrors = { amount: 0, date: 0 };
  
  rows.forEach((row, index) => {
    const validation: RowValidation = {
      rowIndex: index,
      isValid: true,
    };
    
    // Parse date
    const dateValue = row[dateColumn];
    const parsedDate = parseDate(dateValue as string | number);
    if (!parsedDate) {
      validation.isValid = false;
      validation.dateError = 'Invalid date';
      totalErrors.date++;
    } else {
      validation.parsedDate = parsedDate;
    }
    
    // Parse amount
    const amountValue = row[amountColumn];
    const parsedAmount = parseMoney(amountValue as string | number);
    if (parsedAmount.value === null) {
      validation.isValid = false;
      validation.amountError = parsedAmount.error || 'Invalid amount';
      totalErrors.amount++;
    } else {
      validation.parsedAmount = parsedAmount.value;
    }
    
    if (validation.isValid) {
      validCount++;
    } else {
      invalidCount++;
    }
    
    validations.push(validation);
  });
  
  return { validations, validCount, invalidCount, totalErrors };
}
