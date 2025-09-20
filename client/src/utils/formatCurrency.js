/**
 * Format currency to short notation (K, M, B)
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency symbol (default: ₹)
 * @returns {string} - Formatted currency string
 */
export const formatCurrencyShort = (amount, currency = '₹') => {
  if (amount === 0) return `0 ${currency}`;
  
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 1000000000) {
    // Billions
    return `${(amount / 1000000000).toFixed(1)}B ${currency}`;
  } else if (absAmount >= 1000000) {
    // Millions
    return `${(amount / 1000000).toFixed(1)}M ${currency}`;
  } else if (absAmount >= 1000) {
    // Thousands
    return `${(amount / 1000).toFixed(1)}K ${currency}`;
  } else {
    // Less than 1000
    return `${amount} ${currency}`;
  }
};

/**
 * Format currency with full notation and commas
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency symbol (default: ₹)
 * @returns {string} - Formatted currency string
 */
export const formatCurrencyFull = (amount, currency = '₹') => {
  return `${currency} ${amount.toLocaleString('en-IN')}`;
};

/**
 * Format number to short notation (K, M, B) without currency
 * @param {number} num - The number to format
 * @returns {string} - Formatted number string
 */
export const formatNumberShort = (num) => {
  if (num === 0) return '0';
  
  const absNum = Math.abs(num);
  
  if (absNum >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  } else if (absNum >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (absNum >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  } else {
    return num.toString();
  }
};