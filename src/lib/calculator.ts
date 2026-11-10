import {
  InboundCalculationParams,
  InboundCalculationResult,
  OutboundCalculationParams,
  OutboundCalculationResult,
} from '../types';

export const round2 = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates Landed Cost and auction fee breakdown
 */
export function calculateInbound(params: InboundCalculationParams): InboundCalculationResult {
  const hammerPrice = Math.max(0, params.hammerPrice || 0);
  const buyerFeePercent = Math.max(0, params.buyerFeePercent || 0);
  const vatPercent = Math.max(0, params.vatPercent || 0);
  const inboundOtherCost = Math.max(0, params.inboundOtherCost || 0);

  const buyerFee = round2(hammerPrice * (buyerFeePercent / 100));

  let vat = 0;
  if (params.vatMode === 'STANDARD') {
    // 15% on Hammer Price + Buyer's Fee
    vat = round2((hammerPrice + buyerFee) * (vatPercent / 100));
  } else if (params.vatMode === 'COMMISSION_ONLY') {
    // 15% on Buyer's Commission only
    vat = round2(buyerFee * (vatPercent / 100));
  } else {
    vat = 0;
  }

  const landedCost = round2(hammerPrice + buyerFee + vat + inboundOtherCost);

  return {
    buyerFee,
    vat,
    landedCost,
  };
}

/**
 * Calculates Bob Shop / Marketplace payout and Net Profit/Loss
 */
export function calculateOutbound(params: OutboundCalculationParams): OutboundCalculationResult {
  const salePrice = Math.max(0, params.salePrice || 0);
  const platformFeePercent = Math.max(0, params.platformFeePercent || 0);
  const deliveryCost = Math.max(0, params.deliveryCost || 0);
  const packagingCost = Math.max(0, params.packagingCost || 0);
  const landedCost = Math.max(0, params.landedCost || 0);

  if (salePrice <= 0) {
    return {
      platformFee: 0,
      netPayout: 0,
      netProfit: round2(-landedCost),
      marginPercent: 0,
      roiPercent: 0,
    };
  }

  const platformFee = round2(salePrice * (platformFeePercent / 100));
  const netPayout = round2(salePrice - platformFee - deliveryCost - packagingCost);
  const netProfit = round2(netPayout - landedCost);

  const marginPercent = salePrice > 0 ? round2((netProfit / salePrice) * 100) : 0;
  const roiPercent = landedCost > 0 ? round2((netProfit / landedCost) * 100) : 0;

  return {
    platformFee,
    netPayout,
    netProfit,
    marginPercent,
    roiPercent,
  };
}

/**
 * Calculates the break-even selling price on Bob Shop
 * (Covers Landed Cost + Platform Fee + Delivery + Packaging, Net Profit = 0)
 */
export function calculateBreakEvenPrice(
  landedCost: number,
  platformFeePercent: number = 6.6,
  deliveryCost: number = 30,
  packagingCost: number = 0
): number {
  const totalDeductions = landedCost + deliveryCost + packagingCost;
  const netMultiplier = 1 - platformFeePercent / 100;
  if (netMultiplier <= 0) return totalDeductions;
  return round2(totalDeductions / netMultiplier);
}

/**
 * Calculates the required selling price to hit a specific net profit margin % (e.g. 25%)
 */
export function calculatePriceForTargetMargin(
  landedCost: number,
  targetMarginPercent: number,
  platformFeePercent: number = 6.6,
  deliveryCost: number = 30,
  packagingCost: number = 0
): number {
  const totalDeductions = landedCost + deliveryCost + packagingCost;
  const denominator = 1 - (platformFeePercent + targetMarginPercent) / 100;
  if (denominator <= 0) return 0;
  return round2(totalDeductions / denominator);
}

/**
 * Calculates the required selling price to hit a fixed Rand profit (e.g. R150)
 */
export function calculatePriceForFixedProfit(
  landedCost: number,
  targetProfitRand: number,
  platformFeePercent: number = 6.6,
  deliveryCost: number = 30,
  packagingCost: number = 0
): number {
  const totalDeductions = landedCost + deliveryCost + packagingCost + targetProfitRand;
  const netMultiplier = 1 - platformFeePercent / 100;
  if (netMultiplier <= 0) return 0;
  return round2(totalDeductions / netMultiplier);
}

/**
 * Currency formatter helper for South African Rand
 */
export function formatZAR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'R0.00';
  }
  const isNegative = amount < 0;
  const absFormatted = Math.abs(amount).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}R ${absFormatted}`;
}

/**
 * Format percentage helper
 */
export function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0.0%';
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
}
