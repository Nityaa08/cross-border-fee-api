# Fee Calculation Logic & Assumptions

## How the Calculation Works

When a customer initiates a payment, the engine applies four fee layers **in sequence**:

### 1. Currency Conversion (FX Spread)

If the original currency differs from the customer's local currency, we convert using:

```
effective_rate = mid_market_rate × (1 + spread_pct)
```

The spread represents the markup a payment processor charges over the interbank rate. We separate mid-market from effective rate so the customer sees exactly how much the conversion costs them.

| Corridor | Mid-Market Rate | Spread | Rationale |
|----------|----------------|--------|-----------|
| USD → MXN | 17.15 | 2.5% | Stable, high-volume corridor |
| USD → COP | 4,150 | 3.0% | Moderate liquidity |
| USD → BRL | 5.85 | 2.5% | Stable, high-volume corridor |
| USD → ARS | 1,050 | 5.0% | High volatility, capital controls |

### 2. Payment Method Processing Fee

Each payment method has a **percentage fee + flat fee** (in USD, converted to local currency):

| Country | Card | Bank Transfer | Cash Voucher |
|---------|------|---------------|--------------|
| MX | 3.5% + $0.30 | 1.8% | 4.0% + $0.50 |
| CO | 3.9% + $0.30 | 2.0% | 4.5% + $0.60 |
| BR | 4.2% + $0.25 | 1.5% (PIX) | 5.0% + $0.70 (Boleto) |
| AR | 4.5% + $0.35 | 2.5% | 5.5% + $0.80 |

These reflect typical acquiring costs in LATAM. Bank transfers are cheapest; cash vouchers (OXXO, Boleto, Rapipago) carry the highest fees due to manual reconciliation.

### 3. Cross-Border Fee

Applied **only** when `customer_country ≠ merchant_country`:

| Country | Rate | Rationale |
|---------|------|-----------|
| MX | 1.2% | Low — USMCA trade corridor |
| CO | 1.5% | Moderate |
| BR | 2.0% | Higher regulatory overhead |
| AR | 2.5% | Capital controls, compliance costs |

A domestic transaction (e.g., CO merchant → CO customer) pays **zero** cross-border fees.

### 4. Tax Withholding

Applied when the transaction is cross-border **or** involves foreign currency:

| Country | Rate | Tax Type |
|---------|------|----------|
| MX | 16% | IVA (value-added tax on digital services) |
| CO | 19% | IVA on cross-border services |
| BR | 6.5% | IOF (tax on foreign exchange operations) |
| AR | 30% | PAIS tax on foreign currency purchases |

Argentina's 30% PAIS tax is the single largest cost driver and explains why Argentine customers see 40%+ markups on USD-denominated goods.

## Key Design Decisions

**Fees calculated on mid-market base, not compounded.** All percentage fees use the mid-market converted amount as their base, not the spread-inflated amount. This prevents fee-on-fee compounding and makes the breakdown transparent.

**Tax applies to base amount, not fees.** We apply tax withholding on the transaction base, not on the accumulated fee total. Real-world tax rules vary by jurisdiction — this is a simplification that slightly underestimates the tax in some cases.

**FX rates are mocked but structurally real.** The codebase uses the same data structures a live FX integration would. Swapping in a real provider (e.g., Open Exchange Rates API) requires changing only the `findRate()` function in `src/engine/fx.ts`.

**In-memory cache with TTL.** FX rates are cached for 5 minutes (configurable). In production this would use Redis to share across instances.

## Realistic Output Range

For a $100 USD cross-border card transaction:
- **Mexico**: ~23% total markup (IVA dominates)
- **Colombia**: ~25% total markup (highest IVA)
- **Brazil**: ~15% total markup (IOF is lower)
- **Argentina**: ~43% total markup (PAIS tax is extreme)

For a domestic same-currency transaction, fees drop to **2–4%** (processing only).
