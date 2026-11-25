import { Request, Response, NextFunction } from "express";
import {
  ValidationError,
  CustomerCountry,
  Currency,
  PaymentMethod,
} from "../types";
import config from "../config/fees";
import { ISO_3166_ALPHA2 } from "../config/countries";
import { usdMidMarketRate } from "../engine/fx";

// Both limits are in USD and converted at the mid-market rate, so they mean
// the same in every currency. The minimum is one US cent: 0.01 USD, 41.50 COP,
// 10.50 ARS. Below it, the flat processing fee is many thousand times the
// price (0.01 COP was charged a 1,245 COP flat fee). The maximum is
// 1,000,000 USD = 4,150,000,000 COP.
const MIN_AMOUNT_USD = 0.01;
const MAX_AMOUNT_USD = 1_000_000;

/** The smallest accepted price in `currency`, rounded up to the cent. */
export function minAmount(currency: Currency): number {
  return Math.ceil(Number((MIN_AMOUNT_USD * usdMidMarketRate(currency) * 100).toPrecision(12))) / 100;
}

function money(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const VALID_COUNTRIES: CustomerCountry[] = ["MX", "CO", "BR", "AR"];
const VALID_CURRENCIES: Currency[] = ["USD", "MXN", "COP", "BRL", "ARS"];
const VALID_PAYMENT_METHODS: PaymentMethod[] = [
  "card",
  "bank_transfer",
  "cash_voucher",
];

export function validateFeeRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // A body that isn't JSON (curl -d sends form encoding unless told otherwise)
  // never reaches express.json(), so every field would be reported missing
  // even though the client sent them. Say what is actually wrong instead.
  // An empty POST (Content-Length: 0, no type) falls through to the field errors.
  const sentSomething =
    Boolean(req.get("content-type")) ||
    Number(req.get("content-length")) > 0 ||
    req.get("transfer-encoding") !== undefined;
  if (sentSomething && req.is("application/json") === false) {
    res.status(415).json({
      error: "Unsupported Media Type",
      message: `Request body must be JSON with Content-Type: application/json (got ${req.get("content-type") || "no Content-Type"})`,
    });
    return;
  }

  const errors: ValidationError[] = [];
  const body = req.body;

  // Codes are matched case-insensitively, the same as merchant_country:
  // "usd" and "mx" mean USD and MX, so pass them on in canonical case.
  if (typeof body.original_currency === "string") {
    body.original_currency = body.original_currency.toUpperCase();
  }
  if (typeof body.customer_country === "string") {
    body.customer_country = body.customer_country.toUpperCase();
  }
  if (typeof body.payment_method === "string") {
    body.payment_method = body.payment_method.toLowerCase();
  }

  if (body.original_amount === undefined || body.original_amount === null) {
    errors.push({
      field: "original_amount",
      message: "original_amount is required",
    });
  } else if (typeof body.original_amount !== "number" || body.original_amount <= 0) {
    errors.push({
      field: "original_amount",
      message: "original_amount must be a positive number",
    });
  } else if (!VALID_CURRENCIES.includes(body.original_currency) && body.original_amount < MIN_AMOUNT_USD) {
    errors.push({
      field: "original_amount",
      message: `original_amount must be at least ${MIN_AMOUNT_USD}`,
    });
  } else if (VALID_CURRENCIES.includes(body.original_currency)) {
    const currency = body.original_currency as Currency;
    const min = minAmount(currency);
    if (body.original_amount < min) {
      errors.push({
        field: "original_amount",
        message:
          currency === "USD"
            ? `original_amount must be at least ${MIN_AMOUNT_USD}`
            : `original_amount must be at least ${money(min)} ${currency} (${MIN_AMOUNT_USD} USD)`,
      });
    }
    const max = MAX_AMOUNT_USD * usdMidMarketRate(body.original_currency as Currency);
    if (body.original_amount > max) {
      errors.push({
        field: "original_amount",
        message:
          body.original_currency === "USD"
            ? `original_amount must not exceed ${max.toLocaleString("en-US")} USD`
            : `original_amount must not exceed ${max.toLocaleString("en-US")} ${body.original_currency} (${MAX_AMOUNT_USD.toLocaleString("en-US")} USD)`,
      });
    }
  }

  if (!body.original_currency) {
    errors.push({
      field: "original_currency",
      message: "original_currency is required",
    });
  } else if (!VALID_CURRENCIES.includes(body.original_currency)) {
    errors.push({
      field: "original_currency",
      message: `original_currency must be one of: ${VALID_CURRENCIES.join(", ")}`,
    });
  }

  if (!body.customer_country) {
    errors.push({
      field: "customer_country",
      message: "customer_country is required",
    });
  } else if (!VALID_COUNTRIES.includes(body.customer_country)) {
    errors.push({
      field: "customer_country",
      message: `customer_country must be one of: ${VALID_COUNTRIES.join(", ")}`,
    });
  }

  if (!body.merchant_country) {
    errors.push({
      field: "merchant_country",
      message: "merchant_country is required",
    });
  } else if (
    typeof body.merchant_country !== "string" ||
    !ISO_3166_ALPHA2.has(body.merchant_country.toUpperCase())
  ) {
    errors.push({
      field: "merchant_country",
      message: "merchant_country must be an ISO 3166-1 alpha-2 country code, such as US",
    });
  } else {
    // Accept "us" but pass "US" on, so the fee descriptions are consistent.
    body.merchant_country = body.merchant_country.toUpperCase();
  }

  if (!body.payment_method) {
    errors.push({
      field: "payment_method",
      message: "payment_method is required",
    });
  } else if (!VALID_PAYMENT_METHODS.includes(body.payment_method)) {
    errors.push({
      field: "payment_method",
      message: `payment_method must be one of: ${VALID_PAYMENT_METHODS.join(", ")}`,
    });
  }

  // A price can be in USD or already in the customer's local currency. Any
  // other pair (for example an MXN price for a customer in CO) has no FX rate
  // configured, so reject it here as a client error instead of letting the
  // engine fail with a 500.
  if (
    VALID_CURRENCIES.includes(body.original_currency) &&
    VALID_COUNTRIES.includes(body.customer_country)
  ) {
    const local = config.countries[body.customer_country as CustomerCountry].currency;
    const from = body.original_currency as Currency;
    const hasRate =
      from === local ||
      config.fx_rates.some((r) => r.from === from && r.to === local);
    if (!hasRate) {
      errors.push({
        field: "original_currency",
        message: `original_currency must be USD or ${local} for customer_country ${body.customer_country}`,
      });
    }
  }

  if (errors.length > 0) {
    res.status(400).json({ error: "Validation failed", details: errors });
    return;
  }

  next();
}
