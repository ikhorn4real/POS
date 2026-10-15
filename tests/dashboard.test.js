import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDemoDashboardInsights,
  buildInventoryNotifications,
  fillSalesTrend,
  findExpiringProducts,
  lastDayKeys,
} from "../src/dashboard-model.js";

test("expiry watch includes expired and boundary dates but skips empty or invalid stock", () => {
  const products = [
    { id: 1, name: "Expired", stock: 3, expiryDate: "2025-01-01" },
    { id: 2, name: "Today", stock: 1, expiryDate: "2025-01-10" },
    { id: 3, name: "Boundary", stock: 4, expiryDate: "2025-02-09" },
    { id: 4, name: "Beyond window", stock: 5, expiryDate: "2025-02-10" },
    { id: 5, name: "No stock", stock: 0, expiryDate: "2025-01-05" },
    { id: 6, name: "No expiry", stock: 5, expiryDate: "" },
    { id: 7, name: "Bad date", stock: 5, expiryDate: "2025-02-30" },
  ];

  assert.deepEqual(
    findExpiringProducts(products, "2025-01-10").map((product) => product.id),
    [1, 2, 3],
  );
});

test("sales trend fills absent days with zero values and preserves supplied data", () => {
  const days = ["2025-04-01", "2025-04-02", "2025-04-03"];
  const trend = fillSalesTrend(
    [{ day: "2025-04-02", count: 2, revenue: 42 }],
    days,
  );

  assert.deepEqual(trend, [
    { day: "2025-04-01", count: 0, revenue: 0 },
    { day: "2025-04-02", count: 2, revenue: 42 },
    { day: "2025-04-03", count: 0, revenue: 0 },
  ]);
});

test("notification models distinguish critical stock and expiry alerts", () => {
  const noStock = { id: 1, name: "Tea", stock: 0 };
  const lowStock = { id: 2, name: "Coffee", stock: 2, reorderLevel: 5 };
  const expired = { id: 3, name: "Milk", stock: 4, expiryDate: "2025-03-01" };
  const expiring = { id: 4, name: "Juice", stock: 3, expiryDate: "2025-03-12" };

  const items = buildInventoryNotifications({
    outOfStock: [noStock],
    lowStock: [lowStock],
    expiryAlerts: [expired, expiring],
    today: "2025-03-10",
  });

  assert.deepEqual(items.map(({ severity, type }) => [severity, type]), [
    ["critical", "stock"],
    ["warning", "stock"],
    ["critical", "expiry"],
    ["warning", "expiry"],
  ]);
  assert.match(items[2].detail, /Expired/);
  assert.match(items[3].detail, /2 days/);
});

test("demo dashboard aggregates revenue, payments, and product quantities", () => {
  const today = new Date();
  const day = lastDayKeys(today, 1)[0];
  const sales = [
    {
      date: today.getTime(),
      total: 30,
      method: "Cash",
      itemsDetail: [
        { name: "Rice", quantity: 2, unitPrice: 10, lineTotal: 20 },
        { name: "Oil", quantity: 1, unitPrice: 10, lineTotal: 10 },
      ],
    },
    {
      date: today.getTime(),
      total: 20,
      method: "Cash",
      itemsDetail: [{ productName: "Rice", quantity: 2, unitPrice: 10 }],
    },
  ];

  const result = buildDemoDashboardInsights(sales, [day]);
  assert.deepEqual(result.trend, [{ day, count: 2, revenue: 50 }]);
  assert.deepEqual(result.payments, [
    { method: "Cash", count: 2, revenue: 50 },
  ]);
  assert.deepEqual(result.bestSellers[0], {
    name: "Rice",
    quantity: 4,
    revenue: 40,
  });
});
