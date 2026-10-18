/** Keep cashier previews in step with the API's server price quote rules. */
export function saleUnitPrice(product, quantity) {
  const retailCents = Math.round(Number(product.price) * 100);
  if (!Number.isSafeInteger(retailCents) || retailCents < 0) return 0;

  if (
    Number(product.wholesaleQuantity) > 0 &&
    quantity >= Number(product.wholesaleQuantity) &&
    Number(product.wholesalePrice) > 0
  ) {
    return Math.min(
      retailCents,
      Math.round(Number(product.wholesalePrice) * 100),
    ) / 100;
  }
  return retailCents / 100;
}
