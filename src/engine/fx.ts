import { Currency, FxRateEntry } from "../types";
import config from "../config/fees";

interface FxResult {
  converted_amount: number;
  effective_rate: number;
  mid_market_rate: number;
  spread_pct: number;
  spread_cost: number;
}

/**
 * Simple in-memory FX rate cache.
 * In production: use Redis or poll a live FX API.
 */
const rateCache = new Map<string, { entry: FxRateEntry; cachedAt: number }>();

function getCacheKey(from: Currency, to: Currency): string {
  return `${from}_${to}`;
}

function findRate(from: Currency, to: Currency): FxRateEntry | undefined {
  const key = getCacheKey(from, to);
  const cached = rateCache.get(key);
  const now = Date.now();

  if (cached && now - cached.cachedAt < config.fx_cache_ttl_seconds * 1000) {
    return cached.entry;
  }

  const entry = config.fx_rates.find((r) => r.from === from && r.to === to);
  if (entry) {
    rateCache.set(key, { entry, cachedAt: now });
  }
  return entry;
}

/**
 * Convert an amount between currencies, applying the spread markup.
 * Returns null if no conversion is needed (same currency).
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency
): FxResult | null {
  if (from === to) return null;

  const rate = findRate(from, to);
  if (!rate) {
    throw new Error(`No FX rate available for ${from} → ${to}`);
  }

  // Effective rate = mid-market rate * (1 + spread)
  // Customer gets a worse rate by the spread percentage
  const effectiveRate = rate.mid_market_rate * (1 + rate.spread_pct);
  const convertedAmount = amount * effectiveRate;
  const midMarketConverted = amount * rate.mid_market_rate;
  const spreadCost = convertedAmount - midMarketConverted;

  return {
    converted_amount: convertedAmount,
    effective_rate: effectiveRate,
    mid_market_rate: rate.mid_market_rate,
    spread_pct: rate.spread_pct,
    spread_cost: spreadCost,
  };
}
