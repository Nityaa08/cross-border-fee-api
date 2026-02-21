import { Request, Response, NextFunction } from "express";
import {
  ValidationError,
  CustomerCountry,
  Currency,
  PaymentMethod,
} from "../types";

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
  } else if (typeof body.merchant_country !== "string" || body.merchant_country.length !== 2) {
    errors.push({
      field: "merchant_country",
      message: "merchant_country must be a 2-letter country code",
    });
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

  if (errors.length > 0) {
    res.status(400).json({ error: "Validation failed", details: errors });
    return;
  }

  next();
}
