import { Request, Response, NextFunction } from "express";
import {
  ValidationError,
  CustomerCountry,
  Currency,
  PaymentMethod,
} from "../types";
import config from "../config/fees";
import { ISO_3166_ALPHA2 } from "../config/countries";

// Amounts are rounded to 2 decimals, so anything smaller is a zero price
// that would still be charged the flat processing fee.
const MIN_AMOUNT = 0.01;

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
  const errors: ValidationError[] = [];
  const body = req.body;

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
  } else if (body.original_amount < MIN_AMOUNT) {
    errors.push({
      field: "original_amount",
      message: `original_amount must be at least ${MIN_AMOUNT}`,
    });
  } else if (body.original_amount > 1_000_000) {
    errors.push({
      field: "original_amount",
      message: "original_amount must not exceed 1,000,000",
    });
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
