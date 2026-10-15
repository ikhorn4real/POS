const SKU_PATTERN = /^[A-Z0-9][A-Z0-9._/-]{0,63}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validDate(value) {
  if (value === "" || value === null || value === undefined) return true;
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function cents(value, { allowZero = false } = {}) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    (allowZero ? value >= 0 : value > 0) &&
    value <= 1_000_000
  )
    ? Math.round(value * 100)
    : null;
}

export function validateProductInput(input, { includeStock = true, requireSku = true } = {}) {
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const sku = requireSku && typeof input?.sku === "string" ? input.sku.trim().toUpperCase() : null;
  const category = typeof input?.category === "string" ? input.category.trim() : "";
  const supplierId = input?.supplierId === null || input?.supplierId === undefined || input?.supplierId === ""
    ? null
    : input.supplierId;
  const sellingPriceCents = cents(input?.sellingPrice);
  const costPriceCents = cents(input?.costPrice, { allowZero: true });
  const wholesalePriceCents = cents(input?.wholesalePrice, { allowZero: true });
  const wholesaleQuantity = input?.wholesaleQuantity ?? 0;
  const stock = input?.stock;
  const reorderLevel = input?.reorderLevel;
  const expiryDate = input?.expiryDate || null;
  const productionDescription = input?.productionDescription ?? "";
  const mftDate = input?.mftDate || null;

  const valid =
    name.length > 0 &&
    name.length <= 120 &&
    (!requireSku || SKU_PATTERN.test(sku)) &&
    category.length > 0 &&
    category.length <= 60 &&
    (supplierId === null || (Number.isInteger(supplierId) && supplierId > 0)) &&
    sellingPriceCents !== null &&
    costPriceCents !== null &&
    wholesalePriceCents !== null &&
    Number.isInteger(wholesaleQuantity) &&
    wholesaleQuantity >= 0 &&
    wholesaleQuantity <= 1_000_000 &&
    (wholesaleQuantity === 0 || wholesalePriceCents > 0) &&
    (!includeStock || (Number.isInteger(stock) && stock >= 0 && stock <= 1_000_000)) &&
    Number.isInteger(reorderLevel) &&
    reorderLevel >= 0 &&
    reorderLevel <= 1_000_000 &&
    validDate(expiryDate) &&
    typeof productionDescription === "string" &&
    productionDescription.length <= 2000 &&
    validDate(mftDate);

  if (!valid) {
    const error = new Error(
      "Enter valid product details, including a positive wholesale price when a wholesale quantity is set.",
    );
    error.status = 400;
    error.code = "INVALID_PRODUCT";
    throw error;
  }

  return {
    name,
    sku,
    category,
    costPriceCents,
    sellingPriceCents,
    wholesalePriceCents,
    wholesaleQuantity,
    reorderLevel,
    supplierId,
    expiryDate,
    productionDescription: productionDescription.trim(),
    mftDate,
    ...(includeStock ? { stock } : {}),
  };
}

export function generatedSku(productId) {
  if (!Number.isSafeInteger(productId) || productId < 1) {
    throw new TypeError("Product ID must be a positive safe integer.");
  }
  return `CP-${String(productId).padStart(6, "0")}`;
}

export function productResponse(product, { includeCost = true, includeWholesale = includeCost } = {}) {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    price: Number(product.selling_price_cents) / 100,
    ...(includeCost
      ? {
          costPrice: Number(product.cost_price_cents) / 100,
        }
      : {}),
    ...(includeWholesale
      ? {
          wholesalePrice: Number(product.wholesale_price_cents) / 100,
          wholesaleQuantity: product.wholesale_quantity ?? 0,
        }
      : {}),
    discountType: product.discount_type ?? "",
    discountValue: product.discount_value === null || product.discount_value === undefined
      ? 0
      : Number(product.discount_type === "fixed" ? product.discount_value / 100 : product.discount_value),
    discountStartsAt: product.discount_starts_at ?? "",
    discountEndsAt: product.discount_ends_at ?? "",
    stock: product.stock,
    reorderLevel: product.reorder_level,
    supplierId: product.supplier_id ?? null,
    supplier: product.supplier_name ?? product.supplier ?? "",
    expiryDate: product.expiry_date,
    productionDescription: product.production_description ?? "",
    mftDate: product.mft_date ?? "",
    color: product.color,
    initials: product.initials,
  };
}

export function salePriceCents(product, quantity, date = new Date().toISOString().slice(0, 10)) {
  const retailPrice = Number(product.selling_price_cents);
  const eligiblePrices = [retailPrice];
  if (
    product.wholesale_quantity > 0 &&
    quantity >= product.wholesale_quantity &&
    Number(product.wholesale_price_cents) > 0
  ) {
    eligiblePrices.push(Number(product.wholesale_price_cents));
  }
  const startsAt = product.discount_starts_at
    ? String(product.discount_starts_at).slice(0, 10)
    : null;
  const endsAt = product.discount_ends_at
    ? String(product.discount_ends_at).slice(0, 10)
    : null;
  const active = product.discount_type &&
    (!startsAt || date >= startsAt) &&
    (!endsAt || date <= endsAt);
  const discountValue = Number(product.discount_value);
  if (active && discountValue > 0) {
    const promotionPrice = product.discount_type === "percent"
      ? retailPrice - Math.round(retailPrice * discountValue / 100)
      : retailPrice - discountValue;
    if (promotionPrice > 0) eligiblePrices.push(promotionPrice);
  }
  return Math.min(...eligiblePrices);
}

export function skuConflict(error) {
  return error.code === "23505" && error.constraint === "products_sku_key";
}
