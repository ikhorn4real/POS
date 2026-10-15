import assert from "node:assert/strict";
import test from "node:test";
import {
  createRequirePermission,
  createRequireUser,
  destroySession,
  isValidPassword,
  regenerateSession,
  saleDetailQueryFor,
  salesQueryFor,
  salesSummaryQueryFor,
} from "../server/auth.js";
import { createInitialOwner } from "../server/owner-bootstrap.js";
import {
  generatedSku,
  productResponse,
  salePriceCents,
  skuConflict,
  validateProductInput,
} from "../server/product-fields.js";
import { supplierNameConflict, supplierResponse, validateSupplierInput } from "../server/suppliers.js";
import { categoryNameConflict, categoryResponse, validateCategoryInput } from "../server/categories.js";
import { customerIdFromInput, customerResponse, validateCustomerInput } from "../server/customers.js";
import { validatePromotionInput } from "../server/promotions.js";

const roles = {
  owner: { id: 1, role: "owner", active: true, auth_version: 0, must_change_password: false },
  manager: { id: 2, role: "manager", active: true, auth_version: 0, must_change_password: false },
  cashier: { id: 3, role: "cashier", active: true, auth_version: 0, must_change_password: false },
};

function invoke(middleware, request) {
  return new Promise((resolve, reject) => {
    middleware(request, {}, (error) => (error ? reject(error) : resolve()));
  });
}

test("managers have administrator catalog and team rights but cannot change stores", async () => {
  const requireTeamRead = createRequirePermission("team:read");
  const requireTeamWrite = createRequirePermission("team:write");
  await invoke(requireTeamRead, { user: roles.owner });
  await invoke(requireTeamWrite, { user: roles.owner });
  await invoke(requireTeamRead, { user: roles.manager });
  await invoke(requireTeamWrite, { user: roles.manager });
  await invoke(createRequirePermission("stores:write"), { user: roles.owner });
  await assert.rejects(invoke(createRequirePermission("stores:write"), { user: roles.manager }), {
    status: 403,
    code: "FORBIDDEN",
  });
  await invoke(createRequirePermission("catalog:write"), { user: roles.owner });
  await invoke(createRequirePermission("catalog:write"), { user: roles.manager });
  await assert.rejects(invoke(requireTeamRead, { user: roles.cashier }), { status: 403, code: "FORBIDDEN" });
  await assert.rejects(invoke(requireTeamWrite, { user: roles.cashier }), { status: 403, code: "FORBIDDEN" });
  await assert.rejects(invoke(createRequirePermission("stores:write"), { user: roles.cashier }), {
    status: 403,
    code: "FORBIDDEN",
  });
  await assert.rejects(invoke(createRequirePermission("inventory:write"), { user: roles.cashier }), {
    status: 403,
    code: "FORBIDDEN",
  });
  await assert.rejects(invoke(createRequirePermission("inventory:report"), { user: roles.cashier }), {
    status: 403,
    code: "FORBIDDEN",
  });
  await invoke(createRequirePermission("inventory:write"), { user: roles.manager });
  await invoke(createRequirePermission("inventory:report"), { user: roles.manager });
});

test("permission middleware rejects requests without an authenticated user", async () => {
  await assert.rejects(invoke(createRequirePermission("checkout"), {}), {
    status: 401,
    code: "AUTH_REQUIRED",
  });
});

test("password policy requires 8 characters and enforces bcrypt's byte limit", () => {
  assert.equal(isValidPassword("short7!"), false);
  assert.equal(isValidPassword("eight888"), true);
  assert.equal(isValidPassword("x".repeat(72)), true);
  assert.equal(isValidPassword("x".repeat(73)), false);
  assert.equal(isValidPassword("é".repeat(37)), false);
});

test("session lifecycle restores active accounts and rejects disabled accounts", async () => {
  let lookedUpId;
  const requireUser = createRequireUser(async (id) => {
    lookedUpId = id;
    return id === "inactive" ? { ...roles.manager, active: false } : { ...roles.cashier, id };
  });
  const request = { session: { userId: "cashier-session", authVersion: 0 } };
  await invoke(requireUser, request);
  assert.equal(lookedUpId, "cashier-session");
  assert.equal(request.user.role, "cashier");
  await assert.rejects(invoke(requireUser, { session: { userId: "inactive" } }), {
    status: 401,
    code: "AUTH_REQUIRED",
  });
  await assert.rejects(invoke(requireUser, { session: {} }), {
    status: 401,
    code: "AUTH_REQUIRED",
  });
});

test("password version changes revoke stale sessions and temporary passwords block normal use", async () => {
  const staleUser = { ...roles.cashier, auth_version: 2 };
  const requireUser = createRequireUser(async () => staleUser);
  let destroyed = false;
  await assert.rejects(
    invoke(requireUser, {
      session: {
        userId: staleUser.id,
        authVersion: 1,
        destroy(callback) {
          destroyed = true;
          callback(null);
        },
      },
      method: "GET",
      path: "/api/products",
    }),
    { status: 401, code: "AUTH_REQUIRED" },
  );
  assert.equal(destroyed, true);

  const temporaryUser = { ...staleUser, must_change_password: true };
  const requireTemporaryUser = createRequireUser(async () => temporaryUser);
  const session = { userId: temporaryUser.id, authVersion: 2 };
  await assert.rejects(
    invoke(requireTemporaryUser, {
      session,
      method: "GET",
      path: "/api/products",
    }),
    { status: 403, code: "PASSWORD_CHANGE_REQUIRED" },
  );
  await invoke(requireTemporaryUser, {
    session,
    method: "GET",
    path: "/api/auth/session",
  });
  await invoke(requireTemporaryUser, {
    session,
    method: "POST",
    path: "/api/auth/password",
  });
});

test("login rotation and logout destroy the server session", async () => {
  const lifecycle = [];
  const request = {
    session: {
      regenerate(callback) {
        lifecycle.push("regenerate");
        this.userId = undefined;
        callback(null);
      },
      destroy(callback) {
        lifecycle.push("destroy");
        callback(null);
      },
    },
  };
  await regenerateSession(request);
  request.session.userId = roles.owner.id;
  assert.equal(request.session.userId, 1);
  await destroySession(request);
  assert.deepEqual(lifecycle, ["regenerate", "destroy"]);
});

test("sales SQL is scoped to the active store and cashiers' own user id", () => {
  const cashierQuery = salesQueryFor(roles.cashier, 7);
  assert.match(cashierQuery.sql, /WHERE s\.store_id = \$1 AND s\.cashier_id = \$2/);
  assert.deepEqual(cashierQuery.params, [7, roles.cashier.id, 50, 0]);
  assert.match(cashierQuery.countSql, /s\.cashier_id = \$2/);

  for (const role of [roles.owner, roles.manager]) {
    const query = salesQueryFor(role, 7);
    assert.match(query.sql, /WHERE s\.store_id = \$1/);
    assert.deepEqual(query.params, [7, 50, 0]);
  }
  assert.throws(() => salesQueryFor({ id: 9, role: "unknown" }, 7), { status: 403 });
});

test("transaction searches retain role scope and match staff, customer, payment, products or order IDs", () => {
  const cashierQuery = salesQueryFor(roles.cashier, 7, "CP-000044");
  assert.match(cashierQuery.sql, /WHERE s\.store_id = \$1 AND s\.cashier_id = \$2 AND \(/);
  assert.match(cashierQuery.sql, /JOIN users u ON u\.id = s\.cashier_id/);
  assert.match(cashierQuery.sql, /u\.name ILIKE \$3/);
  assert.match(cashierQuery.sql, /u\.name AS cashier_name/);
  assert.match(cashierQuery.sql, /si\.product_name ILIKE \$3/);
  assert.deepEqual(cashierQuery.params, [7, roles.cashier.id, "%000044%", 50, 0]);
  const ownerQuery = salesQueryFor(roles.owner, 7, "Mug");
  assert.match(ownerQuery.sql, /WHERE s\.store_id = \$1 AND \(/);
  assert.match(ownerQuery.sql, /u\.name ILIKE \$2/);
  assert.deepEqual(ownerQuery.params, [7, "%Mug%", 50, 0]);
});

test("sales history pagination is bounded and sales summaries retain role scope", () => {
  const query = salesQueryFor(roles.manager, 7, "Mug", 25, 50);
  assert.match(query.sql, /LIMIT \$3 OFFSET \$4/);
  assert.deepEqual(query.params, [7, "%Mug%", 25, 50]);
  assert.deepEqual(query.countParams, [7, "%Mug%"]);
  assert.throws(() => salesQueryFor(roles.owner, 7, "", 101, 0), TypeError);

  const cashierSummary = salesSummaryQueryFor(
    roles.cashier,
    7,
    "2026-10-04T00:00:00.000Z",
    "2026-10-05T00:00:00.000Z",
  );
  assert.match(cashierSummary.sql, /s\.store_id = \$1 AND s\.cashier_id = \$2/);
  assert.match(cashierSummary.sql, /COUNT\(\*\) FILTER/);
  assert.deepEqual(cashierSummary.params, [
    7,
    roles.cashier.id,
    "2026-10-04T00:00:00.000Z",
    "2026-10-05T00:00:00.000Z",
  ]);
});

test("cashiers can only query their own transaction receipt details", () => {
  const cashierQuery = saleDetailQueryFor(roles.cashier, 44, 7);
  assert.match(cashierQuery.whereSql, /s\.id = \$1 AND s\.store_id = \$2 AND s\.cashier_id = \$3/);
  assert.deepEqual(cashierQuery.params, [44, 7, roles.cashier.id]);
  for (const role of [roles.owner, roles.manager]) {
    const query = saleDetailQueryFor(role, 44, 7);
    assert.equal(query.whereSql, "s.id = $1 AND s.store_id = $2");
    assert.deepEqual(query.params, [44, 7]);
  }
  assert.throws(() => saleDetailQueryFor({ id: 9, role: "unknown" }, 44, 7), {
    status: 403,
    code: "FORBIDDEN",
  });
});

test("product validation covers SKU, pricing, reorder stock, supplier selection and expiry", () => {
  const product = validateProductInput({
    name: "  Specialty Coffee  ",
    sku: " bean-001 ",
    category: "Grocery",
    costPrice: 5.25,
    sellingPrice: 12.5,
    wholesalePrice: 9,
    wholesaleQuantity: 6,
    stock: 12,
    reorderLevel: 4,
    supplierId: 7,
    expiryDate: "2027-02-28",
    productionDescription: "Small-batch roasted coffee.",
    mftDate: "2027-01-15",
  });
  assert.deepEqual(product, {
    name: "Specialty Coffee",
    sku: "BEAN-001",
    category: "Grocery",
    costPriceCents: 525,
    sellingPriceCents: 1250,
    wholesalePriceCents: 900,
    wholesaleQuantity: 6,
    reorderLevel: 4,
    supplierId: 7,
    expiryDate: "2027-02-28",
    productionDescription: "Small-batch roasted coffee.",
    mftDate: "2027-01-15",
    stock: 12,
  });
  const updated = validateProductInput({
    name: "Specialty Coffee",
    sku: "BEAN-001",
    category: "Grocery",
    costPrice: 5.25,
    sellingPrice: 12.5,
    wholesalePrice: 9,
    wholesaleQuantity: 6,
    reorderLevel: 4,
    supplierId: null,
    expiryDate: "",
    productionDescription: "",
    mftDate: null,
  }, { includeStock: false });
  assert.equal(Object.hasOwn(updated, "stock"), false);
  assert.equal(updated.productionDescription, "");
  assert.equal(updated.mftDate, null);
});

test("new products do not require caller-supplied SKUs and generated SKU is tied to product ID", () => {
  const { sku, ...withoutSku } = {
    name: "Coffee",
    sku: "CALLER-SKU",
    category: "Grocery",
    costPrice: 2,
    sellingPrice: 5,
    wholesalePrice: 4,
    wholesaleQuantity: 5,
    stock: 10,
    reorderLevel: 3,
  };
  assert.equal(
    validateProductInput(withoutSku, { requireSku: false }).sku,
    null,
  );
  assert.equal(
    validateProductInput({ ...withoutSku, sku }, { requireSku: false }).sku,
    null,
  );
  assert.equal(generatedSku(1), "CP-000001");
  assert.equal(generatedSku(1234567), "CP-1234567");
  assert.throws(() => generatedSku(0), TypeError);
});

test("product validation rejects malformed SKU, dates and negative values", () => {
  const valid = {
    name: "Coffee",
    sku: "CF-1001",
    category: "Grocery",
    costPrice: 2,
    sellingPrice: 5,
    wholesalePrice: 4,
    wholesaleQuantity: 5,
    stock: 10,
    reorderLevel: 3,
    supplierId: null,
    expiryDate: "",
    productionDescription: "",
    mftDate: null,
  };
  for (const invalid of [
    { sku: " leading space" },
    { sku: "bad sku" },
    { sellingPrice: 0 },
    { costPrice: -1 },
    { wholesalePrice: -1 },
    { wholesaleQuantity: -1 },
    { wholesaleQuantity: 1.5 },
    { wholesaleQuantity: 1_000_001 },
    { wholesalePrice: 0, wholesaleQuantity: 1 },
    { stock: -1 },
    { reorderLevel: -1 },
    { supplierId: 0 },
    { supplierId: "7" },
    { expiryDate: "2027-02-30" },
    { mftDate: "2027-02-30" },
    { productionDescription: "x".repeat(2001) },
    { productionDescription: 42 },
  ]) {
    assert.throws(
      () => validateProductInput({ ...valid, ...invalid }),
      { status: 400, code: "INVALID_PRODUCT" },
    );
  }
});

test("product response converts database cents and preserves inventory fields", () => {
  assert.deepEqual(
    productResponse({
      id: 42,
      name: "Coffee",
      sku: "CF-1001",
      category: "Grocery",
      cost_price_cents: "525",
      selling_price_cents: "1250",
      wholesale_price_cents: "900",
      wholesale_quantity: 6,
      stock: 12,
      reorder_level: 4,
      supplier_id: 7,
      supplier_name: "Roaster Supply",
      expiry_date: "2027-02-28",
      production_description: "Small-batch roasted coffee.",
      mft_date: "2027-01-15",
      color: "#e8e8ef",
      initials: "CO",
    }),
    {
      id: 42,
      name: "Coffee",
      sku: "CF-1001",
      category: "Grocery",
      price: 12.5,
      costPrice: 5.25,
      wholesalePrice: 9,
      wholesaleQuantity: 6,
      discountType: "",
      discountValue: 0,
      discountStartsAt: "",
      discountEndsAt: "",
      stock: 12,
      reorderLevel: 4,
      supplierId: 7,
      supplier: "Roaster Supply",
      expiryDate: "2027-02-28",
      productionDescription: "Small-batch roasted coffee.",
      mftDate: "2027-01-15",
      color: "#e8e8ef",
      initials: "CO",
    },
  );
  const cashierProduct = productResponse({
    id: 42,
    name: "Coffee",
    sku: "CF-1001",
    category: "Grocery",
    cost_price_cents: "525",
    selling_price_cents: "1250",
    wholesale_price_cents: "900",
    wholesale_quantity: 6,
    stock: 12,
    reorder_level: 4,
    supplier_id: 7,
    supplier_name: "Roaster",
    expiry_date: null,
    production_description: "",
    mft_date: null,
    color: "#e8e8ef",
    initials: "CO",
  }, { includeCost: false });
  assert.equal(Object.hasOwn(cashierProduct, "costPrice"), false);
  assert.equal(Object.hasOwn(cashierProduct, "wholesalePrice"), false);
  const checkoutProduct = productResponse({
    id: 42,
    name: "Coffee",
    sku: "CF-1001",
    category: "Grocery",
    cost_price_cents: "525",
    selling_price_cents: "1250",
    wholesale_price_cents: "900",
    wholesale_quantity: 6,
    stock: 12,
    reorder_level: 4,
    supplier_id: 7,
    supplier_name: "Roaster",
    expiry_date: null,
    color: "#e8e8ef",
    initials: "CO",
  }, { includeCost: false, includeWholesale: true });
  assert.equal(Object.hasOwn(checkoutProduct, "costPrice"), false);
  assert.equal(checkoutProduct.wholesalePrice, 9);
  assert.equal(checkoutProduct.wholesaleQuantity, 6);
});

test("wholesale price applies to every unit at and above its configured sale quantity", () => {
  const product = {
    selling_price_cents: "1250",
    wholesale_price_cents: "900",
    wholesale_quantity: 6,
  };
  assert.equal(salePriceCents(product, 5), 1250);
  assert.equal(salePriceCents(product, 6), 900);
  assert.equal(salePriceCents(product, 8), 900);
  assert.equal(salePriceCents({ ...product, wholesale_quantity: 0 }, 8), 1250);
  assert.equal(salePriceCents({ ...product, wholesale_price_cents: "0" }, 8), 1250);
});

test("promotions validate dates and checkout chooses the lowest non-stacked price", () => {
  assert.deepEqual(validatePromotionInput({
    discountType: "percent",
    discountValue: 20,
    discountStartsAt: "2026-10-01",
    discountEndsAt: "2026-10-31",
  }, 1250), {
    discountType: "percent",
    discountValueCents: 20,
    startsAt: "2026-10-01",
    endsAt: "2026-10-31",
  });
  assert.deepEqual(validatePromotionInput({}, 1250), {
    discountType: null,
    discountValueCents: null,
    startsAt: null,
    endsAt: null,
  });
  const product = {
    selling_price_cents: 1250,
    wholesale_price_cents: 900,
    wholesale_quantity: 6,
    discount_type: "percent",
    discount_value: "30",
    discount_starts_at: "2026-10-01",
    discount_ends_at: "2026-10-31",
  };
  assert.equal(salePriceCents(product, 1, "2026-10-01"), 875);
  assert.equal(salePriceCents(product, 6, "2026-10-31"), 875);
  assert.equal(salePriceCents(product, 6, "2026-11-01"), 900);
  assert.throws(() => validatePromotionInput({ discountType: "percent", discountValue: 100 }, 1250), {
    status: 400,
    code: "INVALID_PROMOTION",
  });
  assert.throws(() => validatePromotionInput({ discountType: "fixed", discountValue: 12.5 }, 1250), {
    status: 400,
    code: "INVALID_PROMOTION",
  });
  assert.throws(() => validatePromotionInput({ discountType: "percent", discountValue: 10, discountStartsAt: "bad" }, 1250), {
    status: 400,
    code: "INVALID_PROMOTION",
  });
});

test("supplier input is normalized and rejects invalid names or contact details", () => {
  assert.deepEqual(validateSupplierInput({
    name: "  Accra Wholesale  ",
    contactName: " Ama Mensah ",
    email: " ORDERS@EXAMPLE.COM ",
    phone: " +233 20 123 4567 ",
  }), {
    name: "Accra Wholesale",
    contactName: "Ama Mensah",
    email: "orders@example.com",
    phone: "+233 20 123 4567",
  });
  assert.throws(() => validateSupplierInput({ name: "", email: "not-an-email" }), {
    status: 400,
    code: "INVALID_SUPPLIER",
  });
  assert.equal(supplierNameConflict({ code: "23505", constraint: "suppliers_name_ci_key" }), true);
  assert.equal(supplierNameConflict({ code: "23505", constraint: "products_sku_key" }), false);
  assert.deepEqual(supplierResponse({
    id: 4,
    name: "Accra Wholesale",
    contact_name: null,
    email: null,
    phone: null,
    created_at: "2026-10-03T12:00:00.000Z",
  }), {
    id: 4,
    name: "Accra Wholesale",
    contactName: "",
    email: "",
    phone: "",
    createdAt: Date.parse("2026-10-03T12:00:00.000Z"),
  });
});

test("category input is normalized and duplicate names are recognized case-insensitively", () => {
  assert.deepEqual(validateCategoryInput({ name: "  Beverages  " }), { name: "Beverages" });
  assert.throws(() => validateCategoryInput({ name: "  " }), {
    status: 400,
    code: "INVALID_CATEGORY",
  });
  assert.throws(() => validateCategoryInput({ name: "x".repeat(61) }), {
    status: 400,
    code: "INVALID_CATEGORY",
  });
  assert.equal(categoryNameConflict({ code: "23505", constraint: "categories_name_ci_key" }), true);
  assert.equal(categoryNameConflict({ code: "23505", constraint: "products_sku_key" }), false);
  assert.deepEqual(categoryResponse({ id: 3, name: "Beverages", product_count: "5" }), {
    id: 3,
    name: "Beverages",
    productCount: 5,
  });
});

test("all store roles can manage customer records while customer ids are validated", async () => {
  const requireCustomerRead = createRequirePermission("customers:read");
  const requireCustomerWrite = createRequirePermission("customers:write");
  for (const role of Object.values(roles)) {
    await invoke(requireCustomerRead, { user: role });
    await invoke(requireCustomerWrite, { user: role });
  }
  assert.deepEqual(validateCustomerInput({
    name: " Ama Mensah ",
    phone: " +233 20 123 4567 ",
    email: " AMA@EXAMPLE.COM ",
    notes: " Prefers phone contact ",
  }), {
    name: "Ama Mensah",
    phone: "+233 20 123 4567",
    email: "ama@example.com",
    notes: "Prefers phone contact",
  });
  assert.equal(customerIdFromInput(null), null);
  assert.equal(customerIdFromInput(42), 42);
  assert.throws(() => customerIdFromInput("42"), { status: 400, code: "INVALID_CUSTOMER" });
  assert.throws(() => validateCustomerInput({ name: "Customer", email: "invalid" }), {
    status: 400,
    code: "INVALID_CUSTOMER",
  });
  assert.deepEqual(customerResponse({
    id: 6,
    name: "Ama Mensah",
    phone: null,
    email: null,
    notes: null,
    created_at: "2026-10-03T12:00:00.000Z",
  }), {
    id: 6,
    name: "Ama Mensah",
    phone: "",
    email: "",
    notes: "",
    createdAt: Date.parse("2026-10-03T12:00:00.000Z"),
  });
});

test("SKU uniqueness errors are recognized without masking unrelated conflicts", () => {
  assert.equal(skuConflict({ code: "23505", constraint: "products_sku_key" }), true);
  assert.equal(skuConflict({ code: "23505", constraint: "users_email_key" }), false);
});

test("owner bootstrap lock serializes concurrent initial-owner creation", async () => {
  let ownerCount = 0;
  let insertCount = 0;
  let lockTail = Promise.resolve();
  let countQueries = 0;

  const pool = {
    async connect() {
      let releaseLock;
      return {
        async query(sql) {
          if (sql === "BEGIN") return { rows: [] };
          if (sql.startsWith("SELECT pg_advisory_xact_lock")) {
            const previous = lockTail;
            lockTail = new Promise((resolve) => { releaseLock = resolve; });
            await previous;
            return { rows: [] };
          }
          if (sql.startsWith("SELECT COUNT(*)")) {
            countQueries += 1;
            return { rows: [{ count: ownerCount }] };
          }
          if (sql.startsWith("INSERT INTO users")) {
            insertCount += 1;
            ownerCount += 1;
            return { rows: [] };
          }
          if (sql === "COMMIT" || sql === "ROLLBACK") {
            releaseLock?.();
            releaseLock = undefined;
            return { rows: [] };
          }
          throw new Error(`Unexpected SQL in owner bootstrap test: ${sql}`);
        },
        release() {},
      };
    },
  };

  const results = await Promise.allSettled([
    createInitialOwner(pool, { name: "Owner One", email: "one@example.test", passwordHash: "hash-one" }),
    createInitialOwner(pool, { name: "Owner Two", email: "two@example.test", passwordHash: "hash-two" }),
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.filter((result) => result.status === "rejected" && result.reason.code === "OWNER_ALREADY_EXISTS").length, 1);
  assert.equal(ownerCount, 1);
  assert.equal(insertCount, 1);
  assert.equal(countQueries, 2);
});
