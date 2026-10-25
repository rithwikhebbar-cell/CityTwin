/**
 * CityTwin Financial Formatting Utilities
 * Standardizes currency representation in Indian Rupee Crores (₹ Cr / ₹ crore).
 *
 * Mathematical Conversion:
 * 1 Crore = 100 Lakhs = 10,000,000 INR
 * Crores = Lakhs / 100
 *
 * Examples:
 * - 2,500 Lakhs -> ₹25.00 crore (or ₹25.00 Cr)
 * - 1,750 Lakhs -> ₹17.50 crore (or ₹17.50 Cr)
 * - 750 Lakhs   -> ₹7.50 crore (or ₹7.50 Cr)
 * - 100 Lakhs   -> ₹1.00 crore (or ₹1.00 Cr)
 * - 50 Lakhs    -> ₹0.50 crore (or ₹0.50 Cr)
 * - 10 Lakhs    -> ₹0.10 crore (or ₹0.10 Cr)
 * - 1.5 Lakhs   -> ₹0.015 Cr / ₹0.02 Cr
 * - -4.6 Lakhs  -> -₹0.05 Cr (Deficit)
 */

export function lakhsToCrores(lakhs: number): number {
  if (isNaN(lakhs) || lakhs === null || lakhs === undefined) return 0;
  return Number((lakhs / 100).toFixed(4));
}

export function croresToLakhs(crores: number): number {
  if (isNaN(crores) || crores === null || crores === undefined) return 0;
  return Number((crores * 100).toFixed(2));
}

export interface FormatCroresOptions {
  showUnit?: boolean;
  fullWord?: boolean; // 'crore' instead of 'Cr'
  decimals?: number;
  showSign?: boolean; // '+' prefix for positive values
}

export function formatCrores(
  lakhs: number,
  options?: FormatCroresOptions
): string {
  if (isNaN(lakhs) || lakhs === null || lakhs === undefined) {
    if (options?.fullWord) return '₹0.00 crore';
    return options?.showUnit === false ? '₹0.00' : '₹0.00 Cr';
  }

  const crores = lakhs / 100;
  const decimals = options?.decimals ?? 2;
  const absCrores = Math.abs(crores);
  const formattedNumber = absCrores.toFixed(decimals);

  let prefix = '';
  if (crores < 0) {
    prefix = '-';
  } else if (options?.showSign && crores > 0) {
    prefix = '+';
  }

  if (options?.showUnit === false) {
    return `${prefix}₹${formattedNumber}`;
  }

  if (options?.fullWord) {
    const word = Number(formattedNumber) === 1 ? 'crore' : 'crore';
    return `${prefix}₹${formattedNumber} ${word}`;
  }

  return `${prefix}₹${formattedNumber} Cr`;
}

/**
 * Formats a delta in Crores (e.g., +₹0.05 Cr or -₹0.12 Cr)
 */
export function formatCroresDelta(
  lakhsDelta: number,
  options?: FormatCroresOptions
): string {
  return formatCrores(lakhsDelta, { showSign: true, decimals: options?.decimals ?? 2, ...options });
}

/**
 * Formats efficiency metric (cost per minute saved in Crores)
 */
export function formatCostPerMinuteSaved(lakhsPerMinute: number): string {
  if (isNaN(lakhsPerMinute) || lakhsPerMinute <= 0) return 'N/A';
  const cr = lakhsToCrores(lakhsPerMinute);
  // Show 3 decimals if under 0.1 Cr for high precision
  const decimals = cr < 0.1 ? 3 : 2;
  return `${formatCrores(lakhsPerMinute, { decimals })} / min saved`;
}

/**
 * Formats ISO timestamp into readable municipal date and time
 * e.g., "Oct 16, 2026, 04:30 PM"
 */
export function formatScenarioTimestamp(isoString?: string | null): string {
  if (!isoString) return 'Unrecorded time';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

/**
 * Returns human-friendly relative time string (e.g. "Just now", "5m ago", "2h ago", "Yesterday")
 */
export function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const now = Date.now();
    const diffSec = Math.floor((now - d.getTime()) / 1000);
    if (diffSec < 45) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    const days = Math.floor(diffSec / 86400);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

