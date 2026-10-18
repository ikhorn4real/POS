import { saleUnitPrice } from "./pricing.js";

export function addCartItem(cart, product) {
  if (!product) return { cart, added: false, reason: "missing" };
  const quantity = cart.find((item) => item.id === product.id)?.quantity ?? 0;
  if (quantity >= product.stock) {
    return { cart, added: false, reason: "stock" };
  }
  const existing = cart.some((item) => item.id === product.id);
  return {
    cart: existing
      ? cart.map((item) => item.id === product.id
        ? { ...item, quantity: item.quantity + 1 }
        : item)
      : [...cart, { ...product, quantity: 1 }],
    added: true,
    reason: null,
  };
}

export function changeCartQuantity(cart, productId, amount, products) {
  return cart
    .map((item) => {
      if (item.id !== productId) return item;
      const stock = products.find((product) => product.id === productId)?.stock ?? 0;
      return { ...item, quantity: Math.min(stock, item.quantity + amount) };
    })
    .filter((item) => item.quantity > 0);
}

export function removeCartItem(cart, productId) {
  return cart.filter((item) => item.id !== productId);
}

export function summarizeCart(cart) {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCents = cart.reduce(
    (sum, item) => sum + Math.round(saleUnitPrice(item, item.quantity) * 100) * item.quantity,
    0,
  );
  return { count, subtotalCents: totalCents, totalCents, total: totalCents / 100 };
}
