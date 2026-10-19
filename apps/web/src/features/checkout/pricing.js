/** Keep cashier previews in step with the API's server price quote rules. */
import { minorUnits, parseGhs } from "@counterpoint/shared/money";

function priceToMinorUnits(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) return minorUnits(0);
  try {
    return parseGhs(amount.toString());
  } catch {
    return minorUnits(0);
  }
}

export function retailUnitPriceCents(product) {
  return priceToMinorUnits(product.price);
}

export function saleUnitPriceCents(product, quantity) {
  const retailCents = retailUnitPriceCents(product);
  const wholesaleCents = priceToMinorUnits(product.wholesalePrice);

  if (
    Number(product.wholesaleQuantity) > 0 &&
    quantity >= Number(product.wholesaleQuantity) &&
    wholesaleCents > 0
  ) {
    return minorUnits(Math.min(retailCents, wholesaleCents));
  }
  return retailCents;
}

export function saleUnitPrice(product, quantity) {
  return saleUnitPriceCents(product, quantity) / 100;
}
