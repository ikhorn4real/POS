export function getStockHealth(products) {
  const inStock = [];
  const lowStock = [];
  const outOfStock = [];
  for (const product of products) {
    if (product.stock === 0) outOfStock.push(product);
    else if (product.stock <= product.reorderLevel) lowStock.push(product);
    else inStock.push(product);
  }
  return { inStock, lowStock, outOfStock };
}

export function filterInventory(products, query, lowStockOnly = false) {
  const normalizedQuery = query.trim().toLowerCase();
  return products.filter((product) => {
    const needsAttention = product.stock === 0 || product.stock <= product.reorderLevel;
    const matchesStatus = !lowStockOnly || needsAttention;
    const searchText = [product.name, product.sku, product.category, product.supplier]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return matchesStatus && searchText.includes(normalizedQuery);
  });
}

export function validateStockAdjustment({ stock, quantity, direction, reason }) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1_000_000 || !reason.trim()) {
    return "Enter a whole-number quantity and adjustment reason.";
  }
  const adjustment = (direction === "remove" ? -1 : 1) * quantity;
  if (stock + adjustment < 0) return "This adjustment would take stock below zero.";
  return null;
}
