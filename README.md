# Cross-Border Fee Calculation API

A backend service that calculates the **true all-in customer price** for cross-border B2B marketplace transactions across Latin America.

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Run
npm start
# → http://localhost:3000

# Or run in dev mode (auto-reload)
npm run dev

# Run tests
npm test
```

## Architecture

```
src/
├── config/fees.ts        # All fee rates, FX rates, tax rules (no magic numbers)
├── engine/
│   ├── calculator.ts     # Core fee calculation — pure, deterministic function
│   └── fx.ts             # FX conversion with spread + in-memory cache
├── middleware/
│   ├── validate.ts       # Request validation with detailed error messages
│   └── errorHandler.ts   # Global error handler
├── routes/
│   ├── calculate.ts      # POST /api/v1/calculate
│   └── health.ts         # GET /health
├── types/index.ts        # All TypeScript interfaces
├── app.ts                # Express app setup
└── index.ts              # Server entry point
```

**Design principles:**
- **Config-driven**: Every fee rate, FX spread, and tax rule lives in `src/config/fees.ts`. Zero magic numbers in business logic.
- **Pure engine**: `calculateFees()` is a stateless pure function — deterministic for identical inputs, trivially testable.
- **Layered**: Config → Engine → API are cleanly separated. The engine has no knowledge of HTTP.

## API Documentation

### `POST /api/v1/calculate`

Calculate all-in customer price for a transaction.

**Request body:**

| Field              | Type   | Required | Values                                     |
|--------------------|--------|----------|--------------------------------------------|
| `original_amount`  | number | yes      | > 0, max 1,000,000                         |
| `original_currency`| string | yes      | `USD`, `MXN`, `COP`, `BRL`, `ARS`          |
| `customer_country` | string | yes      | `MX`, `CO`, `BR`, `AR`                     |
| `merchant_country` | string | yes      | Any 2-letter code (e.g., `US`, `MX`)       |
| `payment_method`   | string | yes      | `card`, `bank_transfer`, `cash_voucher`     |

**Response:**

| Field                  | Type       | Description                                      |
|------------------------|------------|--------------------------------------------------|
| `original_amount`      | number     | Input amount                                     |
| `original_currency`    | string     | Input currency                                   |
| `settlement_currency`  | string     | Customer's local currency                        |
| `settlement_amount`    | number     | Amount at mid-market rate (before fees)           |
| `fx_rate`              | number\|null | Effective FX rate applied (null if same currency)|
| `fx_spread_pct`        | number\|null | FX spread percentage                            |
| `fees`                 | array      | Detailed fee line items                          |
| `total_fees`           | number     | Sum of all fees in settlement currency            |
| `total_fees_pct`       | number     | Total fees as fraction of settlement amount       |
| `final_customer_price` | number     | What the customer actually pays                  |
| `final_currency`       | string     | Currency of final price                          |

Each item in `fees` has: `name`, `rate`, `amount`, `currency`, `description`.

### `GET /health`

Returns `{"status": "ok", "timestamp": "..."}`.

---

## Example API Calls

### 1. Cross-border card payment: US merchant → Mexican customer, $100 USD

```bash
curl -X POST http://localhost:3000/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "original_amount": 100,
    "original_currency": "USD",
    "customer_country": "MX",
    "merchant_country": "US",
    "payment_method": "card"
  }'
```

**Response:** Final price **MXN 2,118.02** (23.5% total fees on $100 USD)
- FX spread (2.5%): MXN 42.87
- Card processing (3.5% + $0.30): MXN 65.17
- Cross-border (1.2%): MXN 20.58
- IVA tax (16%): MXN 274.40

### 2. Domestic transaction with FX: MX merchant → MX customer, $100 USD, bank transfer

```bash
curl -X POST http://localhost:3000/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "original_amount": 100,
    "original_currency": "USD",
    "customer_country": "MX",
    "merchant_country": "MX",
    "payment_method": "bank_transfer"
  }'
```

**Response:** Final price **MXN 2,063.14** (20.3% total fees)
- No cross-border fee (domestic)
- Still has FX spread and tax (foreign currency transaction)

### 3. Cross-border card payment: US merchant → Brazilian customer, $250 USD

```bash
curl -X POST http://localhost:3000/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "original_amount": 250,
    "original_currency": "USD",
    "customer_country": "BR",
    "merchant_country": "US",
    "payment_method": "card"
  }'
```

**Response:** Final price **BRL 1,686.26** (15.3% total fees)
- IOF tax at 6.5% (lower than MX IVA)
- Cross-border 2.0%

### 4. Cross-border cash voucher: US merchant → Argentine customer, $50 USD

```bash
curl -X POST http://localhost:3000/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "original_amount": 50,
    "original_currency": "USD",
    "customer_country": "AR",
    "merchant_country": "US",
    "payment_method": "cash_voucher"
  }'
```

**Response:** Final price **ARS 75,915** (44.6% total fees!)
- PAIS tax 30% is the dominant cost
- FX spread 5% (volatile currency)
- This illustrates why AR customers see massive markups

### 5. Fully domestic: CO merchant → CO customer, 500,000 COP, bank transfer

```bash
curl -X POST http://localhost:3000/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "original_amount": 500000,
    "original_currency": "COP",
    "customer_country": "CO",
    "merchant_country": "CO",
    "payment_method": "bank_transfer"
  }'
```

**Response:** Final price **COP 510,000** (2.0% total fees)
- Only payment processing fee (2%)
- No FX, no cross-border, no tax — cheapest scenario

### 6. Validation error

```bash
curl -X POST http://localhost:3000/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{"original_amount": -50}'
```

**Response (400):**
```json
{
  "error": "Validation failed",
  "details": [
    {"field": "original_amount", "message": "original_amount must be a positive number"},
    {"field": "original_currency", "message": "original_currency is required"},
    ...
  ]
}
```

---

## Fee Logic & Assumptions

### Calculation Order

1. **FX Conversion** — Convert original amount to customer's local currency using mid-market rate + spread markup
2. **Payment Processing Fee** — Percentage + flat fee (flat fee converted to local currency)
3. **Cross-Border Fee** — Applied only when `customer_country ≠ merchant_country`
4. **Tax Withholding** — Applied when the transaction is cross-border OR involves foreign currency

All percentage fees are calculated on the **mid-market equivalent** (not the spread-inflated amount), preventing fee-on-fee compounding.

### Country Assumptions

| Country | Currency | Tax | Cross-Border | Notes |
|---------|----------|-----|--------------|-------|
| MX | MXN | 16% IVA | 1.2% | Standard Mexican digital services tax |
| CO | COP | 19% IVA | 1.5% | Colombian VAT on cross-border services |
| BR | BRL | 6.5% IOF | 2.0% | IOF tax on foreign currency card transactions |
| AR | ARS | 30% PAIS | 2.5% | PAIS tax on foreign currency purchases; highly volatile FX |

### FX Rates

Mocked mid-market rates (approximate 2026 values). Spreads:
- MXN: 2.5% (stable corridor)
- COP: 3.0%
- BRL: 2.5%
- ARS: 5.0% (reflects blue-dollar volatility)

In production, these would come from a live FX API with a Redis-backed cache.

### Trade-offs

| Decision | Why |
|----------|-----|
| In-memory config vs DB | Speed and simplicity for POC; production would use a config service |
| Mocked FX rates | Avoids external API dependency; structure supports real integration |
| Fees on mid-market base | Prevents compounding — more transparent to customers |
| Tax on full base amount | Simplified; real tax rules vary by transaction type |
| No authentication | Out of scope for POC; production would use API keys |
| No persistence | Stateless by design; every call is self-contained |

## Testing

```bash
npm test
```

Runs 13 tests across two suites:
- **Engine tests** (7): All 5 scenarios, determinism check, error handling
- **API tests** (6): HTTP integration, validation errors, health check
