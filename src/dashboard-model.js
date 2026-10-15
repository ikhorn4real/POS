const DAY_MS = 86_400_000;

export function localDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function lastDayKeys(today = new Date(), dayCount = 7) {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - dayCount + 1);
  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return localDateKey(date);
  });
}

export function fillSalesTrend(trend, days = lastDayKeys()) {
  const byDay = new Map(trend.map((entry) => [entry.day, entry]));
  return days.map(
    (day) => byDay.get(day) ?? { day, count: 0, revenue: 0 },
  );
}

export function findExpiringProducts(
  products,
  today = new Date().toISOString().slice(0, 10),
  windowDays = 30,
) {
  const todayTime = Date.parse(`${today}T00:00:00Z`);
  if (!Number.isFinite(todayTime) || !Number.isInteger(windowDays) || windowDays < 1) {
    return [];
  }
  const expiryLimit = new Date(todayTime + windowDays * DAY_MS)
    .toISOString()
    .slice(0, 10);
  return products
    .filter(
      (product) => {
        if (
          product.stock <= 0 ||
          typeof product.expiryDate !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(product.expiryDate)
        ) {
          return false;
        }
        const expiryTime = Date.parse(`${product.expiryDate}T00:00:00Z`);
        return (
          Number.isFinite(expiryTime) &&
          new Date(expiryTime).toISOString().slice(0, 10) === product.expiryDate &&
          product.expiryDate <= expiryLimit
        );
      },
    )
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
}

export function buildInventoryNotifications({
  lowStock,
  outOfStock,
  expiryAlerts,
  today = new Date().toISOString().slice(0, 10),
}) {
  const stockAlerts = [
    ...outOfStock.map((product) => ({
      id: `out-${product.id}`,
      product,
      severity: "critical",
      title: product.name,
      detail: "Out of stock · Reorder needed",
      type: "stock",
    })),
    ...lowStock.map((product) => ({
      id: `low-${product.id}`,
      product,
      severity: "warning",
      title: product.name,
      detail: `Low stock · ${product.stock} left, reorder at ${product.reorderLevel}`,
      type: "stock",
    })),
  ];
  const expiryItems = expiryAlerts.map((product) => {
    const daysLeft = Math.ceil(
      (Date.parse(`${product.expiryDate}T00:00:00Z`) -
        Date.parse(`${today}T00:00:00Z`)) /
        DAY_MS,
    );
    return {
      id: `expiry-${product.id}`,
      product,
      severity: daysLeft < 0 ? "critical" : "warning",
      title: product.name,
      detail:
        daysLeft < 0
          ? `Expired · ${product.stock} in stock`
          : daysLeft === 0
            ? `Expires today · ${product.stock} in stock`
            : `Expires in ${daysLeft} days · ${product.stock} in stock`,
      type: "expiry",
    };
  });
  return [...stockAlerts, ...expiryItems];
}

export function buildDemoDashboardInsights(sales, days = lastDayKeys()) {
  const dayBuckets = new Map(
    days.map((day) => [day, { day, count: 0, revenue: 0 }]),
  );
  const paymentBuckets = new Map();
  const productBuckets = new Map();
  for (const sale of sales) {
    const dayBucket = dayBuckets.get(localDateKey(sale.date));
    if (dayBucket) {
      dayBucket.count += 1;
      dayBucket.revenue += Number(sale.total ?? 0);
    }
    const payment = paymentBuckets.get(sale.method) ?? {
      method: sale.method,
      count: 0,
      revenue: 0,
    };
    payment.count += 1;
    payment.revenue += Number(sale.total ?? 0);
    paymentBuckets.set(sale.method, payment);
    for (const item of sale.itemsDetail ?? []) {
      const name = item.productName ?? item.name;
      const product = productBuckets.get(name) ?? {
        name,
        quantity: 0,
        revenue: 0,
      };
      product.quantity += Number(item.quantity ?? 0);
      product.revenue += Number(
        item.lineTotal ??
          Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0),
      );
      productBuckets.set(name, product);
    }
  }
  return {
    trend: [...dayBuckets.values()],
    bestSellers: [...productBuckets.values()]
      .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
      .slice(0, 5),
    payments: [...paymentBuckets.values()].sort(
      (a, b) => b.revenue - a.revenue,
    ),
  };
}
