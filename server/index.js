import "dotenv/config";
import bcrypt from "bcryptjs";
import connectPgSimple from "connect-pg-simple";
import { createHash, randomBytes } from "node:crypto";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pg from "pg";
import session from "express-session";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createRequirePermission,
  createRequireUser,
  destroySession,
  isValidPassword,
  regenerateSession,
  saleDetailQueryFor,
  salesQueryFor,
  salesSummaryQueryFor,
} from "./auth.js";
import {
  generatedSku,
  productResponse,
  salePriceCents,
  skuConflict,
  validateProductInput,
} from "./product-fields.js";
import { supplierNameConflict, supplierResponse, validateSupplierInput } from "./suppliers.js";
import { categoryNameConflict, categoryResponse, validateCategoryInput } from "./categories.js";
import { customerIdFromInput, customerResponse, validateCustomerInput } from "./customers.js";
import { validatePromotionInput } from "./promotions.js";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 3001);
const sessionSecret = process.env.SESSION_SECRET;

function isValidDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}
if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error("Set SESSION_SECRET to a random value of at least 32 characters.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: true } : undefined,
});
const app = express();
const PgSession = connectPgSimple(session);
const allowedOrigins = new Set(
  (process.env.WEB_ORIGIN ?? "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.disable("x-powered-by");
app.set("trust proxy", process.env.NODE_ENV === "production" ? 1 : false);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        ...(process.env.NODE_ENV === "production"
          ? {}
          : { upgradeInsecureRequests: null }),
      },
    },
  }),
);
app.use(express.json({ limit: "32kb" }));
app.use(
  session({
    name: "counterpoint.sid",
    store: new PgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
      ttl: 60 * 60 * 8,
      pruneSessionInterval: 60 * 15,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 8,
    },
  }),
);

function apiError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function calculateSaleQuote(products, quantities, userRole) {
  const items = products.map((product) => {
    const quantity = quantities.get(product.id);
    return {
      productId: product.id,
      quantity,
      unitPriceCents: salePriceCents(product, quantity),
    };
  });
  const subtotalCents = items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0,
  );
  const totalCents = subtotalCents;
  if (
    !Number.isSafeInteger(subtotalCents) ||
    !Number.isSafeInteger(totalCents)
  ) {
    throw apiError(400, "This order exceeds the maximum supported total.", "SALE_TOTAL_TOO_LARGE");
  }
  return {
    items,
    subtotalCents,
    totalCents,
    available: products.every(
      (product) => product.stock >= quantities.get(product.id),
    ),
    products: products.map((product) =>
      productResponse(product, {
        includeCost: userRole !== "cashier",
        includeWholesale: true,
      }),
    ),
  };
}

function saleProductQuery(forUpdate = false) {
  return `SELECT p.id, p.name, p.sku, p.category, p.cost_price_cents,
                 p.selling_price_cents, p.wholesale_price_cents,
                 p.wholesale_quantity, i.stock, i.reorder_level,
                 p.supplier_id, s.name AS supplier_name, p.expiry_date,
                 p.color, p.initials, pr.discount_type, pr.discount_value,
                 pr.starts_at::text AS discount_starts_at,
                 pr.ends_at::text AS discount_ends_at
          FROM products p
          JOIN store_inventory i ON i.product_id = p.id AND i.store_id = $2
          LEFT JOIN store_promotions pr ON pr.product_id = p.id AND pr.store_id = $2
          LEFT JOIN suppliers s ON s.id = p.supplier_id
          WHERE p.active = TRUE AND p.id = ANY($1::integer[])
          ORDER BY p.id${forUpdate ? " FOR UPDATE OF p, i" : ""}`;
}

function saleQuantities(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    throw apiError(400, "Add one or more valid items.", "INVALID_SALE");
  }
  const quantities = new Map();
  for (const item of items) {
    if (
      !Number.isInteger(item?.productId) ||
      !Number.isInteger(item?.quantity) ||
      item.quantity < 1
    ) {
      throw apiError(400, "The sale contains an invalid product or quantity.", "INVALID_SALE");
    }
    quantities.set(
      item.productId,
      (quantities.get(item.productId) ?? 0) + item.quantity,
    );
  }
  return quantities;
}

function asyncRoute(handler) {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

function requireSameOrigin(request, response, next) {
  const origin = request.get("origin");
  if (!origin || !allowedOrigins.has(origin)) {
    return next(apiError(403, "Request origin is not allowed.", "ORIGIN_NOT_ALLOWED"));
  }
  return next();
}

const requireUser = createRequireUser(async (userId) => {
  const { rows } = await pool.query(
      `SELECT id, name, email, role, active, auth_version,
              must_change_password
       FROM users
       WHERE id = $1`,
      [userId],
    );
  return rows[0];
});
const requirePermission = createRequirePermission;

function storeDetailsFromInput(input) {
  const fields = [
    ["branch", 120],
    ["manager", 120],
    ["location", 240],
    ["phone", 40],
    ["email", 254],
  ];
  const details = {};
  for (const [field, maxLength] of fields) {
    const value = input?.[field];
    if (value === undefined) {
      details[field] = null;
      continue;
    }
    if (typeof value !== "string" || value.trim().length > maxLength) {
      throw apiError(400, `Enter a valid ${field} (up to ${maxLength} characters).`, "INVALID_STORE");
    }
    details[field] = value.trim();
  }
  if (
    details.email !== null &&
    details.email !== "" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)
  ) {
    throw apiError(400, "Enter a valid store contact email.", "INVALID_STORE");
  }
  return details;
}

function requireStore(request, response, next) {
  const storeId = Number(request.get("x-store-id"));
  if (!Number.isSafeInteger(storeId) || storeId < 1) {
    return next(apiError(400, "Select a store before continuing.", "STORE_REQUIRED"));
  }
  pool.query(
    `SELECT s.id, s.name
     FROM stores s
     WHERE s.id = $1 AND s.active = TRUE
       AND ($2 = 'owner' OR EXISTS (
         SELECT 1 FROM user_stores us WHERE us.store_id = s.id AND us.user_id = $3
       ))`,
    [storeId, request.user.role, request.user.id],
  ).then(({ rows }) => {
    if (!rows[0]) {
      next(apiError(403, "You do not have access to this store.", "STORE_FORBIDDEN"));
      return;
    }
    request.store = rows[0];
    request.storeId = rows[0].id;
    next();
  }).catch(next);
}
const dummyPasswordHash = "$2b$12$LF4GtgsCsF84gAtkukZ31.AtIi.kesN.doeRd3NAOpUjshAtwtCPG";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Try again later.", code: "RATE_LIMITED" },
});

app.use("/api", (request, response, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    return requireSameOrigin(request, response, next);
  }
  return next();
});

app.get("/api/health", asyncRoute(async (request, response) => {
  await pool.query("SELECT 1");
  response.json({ status: "ok" });
}));

app.post("/api/auth/login", loginLimiter, asyncRoute(async (request, response) => {
  const email = typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase() : "";
  const password = typeof request.body?.password === "string" ? request.body.password : "";
  if (!email || email.length > 254 || !password || password.length > 256 || Buffer.byteLength(password, "utf8") > 72) {
    throw apiError(400, "Enter your email and password.", "INVALID_CREDENTIALS");
  }
  const { rows } = await pool.query(
    `SELECT id, name, email, role, password_hash, auth_version,
            must_change_password
     FROM users
     WHERE email = $1 AND active = TRUE`,
    [email],
  );
  const user = rows[0];
  const passwordMatches = user
    ? await bcrypt.compare(password, user.password_hash)
    : await bcrypt.compare(password, dummyPasswordHash);
  if (!user || !passwordMatches) {
    throw apiError(401, "Email or password is incorrect.", "INVALID_CREDENTIALS");
  }
  await regenerateSession(request);
  request.session.userId = user.id;
  request.session.authVersion = Number(user.auth_version);
  response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.must_change_password,
    },
  });
}));

app.get("/api/auth/session", requireUser, (request, response) => {
  response.json({
    user: {
      id: request.user.id,
      name: request.user.name,
      email: request.user.email,
      role: request.user.role,
      mustChangePassword: request.user.must_change_password,
    },
  });
});

app.post("/api/auth/password", requireUser, asyncRoute(async (request, response) => {
  const currentPassword = typeof request.body?.currentPassword === "string"
    ? request.body.currentPassword
    : "";
  const newPassword = typeof request.body?.newPassword === "string"
    ? request.body.newPassword
    : "";
  if (
    (!request.user.must_change_password && !currentPassword) ||
    !isValidPassword(newPassword)
  ) {
    throw apiError(
      400,
      request.user.must_change_password
        ? "Enter a new password of 8 to 72 characters."
        : "Enter your current password and a new password of 8 to 72 characters.",
      "INVALID_PASSWORD",
    );
  }

  const { rows } = await pool.query(
    "SELECT password_hash, auth_version, must_change_password FROM users WHERE id = $1 AND active = TRUE",
    [request.user.id],
  );
  if (
    !rows[0] ||
    (!request.user.must_change_password &&
      !(await bcrypt.compare(currentPassword, rows[0].password_hash))) ||
    (request.user.must_change_password && !isValidPassword(newPassword))
  ) {
    throw apiError(400, "Your current password is incorrect.", "CURRENT_PASSWORD_INCORRECT");
  }
  if (
    !request.user.must_change_password &&
    currentPassword === newPassword
  ) {
    throw apiError(400, "Choose a new password that differs from your current password.", "PASSWORD_UNCHANGED");
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  const client = await pool.connect();
  let authVersion;
  try {
    await client.query("BEGIN");
    const { rows: updatedUsers } = await client.query(
      `UPDATE users
       SET password_hash = $1, must_change_password = FALSE,
           auth_version = auth_version + 1
       WHERE id = $2 AND active = TRUE
       RETURNING auth_version`,
      [passwordHash, request.user.id],
    );
    if (!updatedUsers[0]) {
      throw apiError(401, "Your account is no longer active.", "AUTH_REQUIRED");
    }
    authVersion = Number(updatedUsers[0].auth_version);
    await client.query(
      "DELETE FROM user_sessions WHERE sess->>'userId' = $1",
      [String(request.user.id)],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  await regenerateSession(request);
  request.session.userId = request.user.id;
  request.session.authVersion = authVersion;
  response.json({ message: "Password changed successfully." });
}));

app.post("/api/auth/logout", asyncRoute(async (request, response) => {
  if (request.session) await destroySession(request);
  response.clearCookie("counterpoint.sid", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  response.status(204).end();
}));

app.get("/api/stores", requireUser, asyncRoute(async (request, response) => {
  const { rows } = await pool.query(
    `SELECT s.id, s.name, s.branch, s.manager_name, s.location,
            s.contact_phone, s.contact_email, s.active
     FROM stores s
     WHERE ($3::boolean OR s.active = TRUE)
       AND ($1 = 'owner' OR EXISTS (
         SELECT 1 FROM user_stores us WHERE us.store_id = s.id AND us.user_id = $2
       ))
     ORDER BY s.name, s.branch`,
    [request.user.role, request.user.id, request.query.includeInactive === "true"],
  );
  response.json({
    stores: rows.map((store) => ({
      id: store.id,
      name: store.name,
      branch: store.branch,
      manager: store.manager_name,
      location: store.location,
      phone: store.contact_phone,
      email: store.contact_email,
      active: store.active,
    })),
  });
}));

app.post("/api/stores", requireUser, requirePermission("stores:write"), asyncRoute(async (request, response) => {
  if (request.user.role !== "owner") {
    throw apiError(403, "Only an administrator can create stores.", "FORBIDDEN");
  }
  const name = typeof request.body?.name === "string" ? request.body.name.trim() : "";
  const details = storeDetailsFromInput(request.body);
  if (!name || name.length > 120) {
    throw apiError(400, "Enter a store name of 1 to 120 characters.", "INVALID_STORE");
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO stores (
         name, branch, manager_name, location, contact_phone, contact_email
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, branch, manager_name AS manager, location,
                 contact_phone AS phone, contact_email AS email, active`,
      [
        name,
        details.branch ?? "",
        details.manager ?? "",
        details.location ?? "",
        details.phone ?? "",
        details.email ?? "",
      ],
    );
    await client.query(
      `INSERT INTO store_inventory (store_id, product_id, stock, reorder_level)
       SELECT $1, id, 0, reorder_level FROM products WHERE active = TRUE
       ON CONFLICT DO NOTHING`,
      [rows[0].id],
    );
    await client.query("COMMIT");
    response.status(201).json({ store: rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505" && error.constraint === "stores_name_branch_ci_key") {
      throw apiError(409, "A branch with that name already exists for this store.", "BRANCH_ALREADY_EXISTS");
    }
    throw error;
  } finally {
    client.release();
  }
}));

app.put("/api/stores/:id", requireUser, requirePermission("stores:write"), asyncRoute(async (request, response) => {
  if (request.user.role !== "owner") {
    throw apiError(403, "Only an administrator can change store details.", "FORBIDDEN");
  }
  const id = Number(request.params.id);
  const name = typeof request.body?.name === "string" ? request.body.name.trim() : "";
  const details = storeDetailsFromInput(request.body);
  const active = request.body?.active;
  if (!Number.isSafeInteger(id) || id < 1) {
    throw apiError(400, "Invalid store ID.", "INVALID_STORE_ID");
  }
  if (!name || name.length > 120 || typeof active !== "boolean") {
    throw apiError(400, "Enter a store name of 1 to 120 characters and a valid status.", "INVALID_STORE");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(741092)");
    const { rows: stores } = await client.query(
      `SELECT s.id, s.active
       FROM stores s
       WHERE s.id = $1
       FOR UPDATE`,
      [id],
    );
    if (!stores[0]) {
      throw apiError(404, "Store not found.", "STORE_NOT_FOUND");
    }
    if (stores[0].active && !active) {
      const { rows: activeStores } = await client.query(
        "SELECT id FROM stores WHERE active = TRUE ORDER BY id FOR UPDATE",
      );
      if (activeStores.length <= 1) {
        throw apiError(409, "At least one store must remain active.", "LAST_ACTIVE_STORE");
      }
    }
    const { rows } = await client.query(
      `UPDATE stores
       SET name = $1, active = $2,
           branch = COALESCE($3, branch),
           manager_name = COALESCE($4, manager_name),
           location = COALESCE($5, location),
           contact_phone = COALESCE($6, contact_phone),
           contact_email = COALESCE($7, contact_email)
       WHERE id = $8
       RETURNING id, name, branch, manager_name AS manager, location,
                 contact_phone AS phone, contact_email AS email, active`,
      [
        name, active, details.branch, details.manager, details.location,
        details.phone, details.email, id,
      ],
    );
    await client.query("COMMIT");
    response.json({ store: rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505" && error.constraint === "stores_name_branch_ci_key") {
      throw apiError(409, "A branch with that name already exists for this store.", "BRANCH_ALREADY_EXISTS");
    }
    throw error;
  } finally {
    client.release();
  }
}));

app.get("/api/products", requireUser, requirePermission("inventory:read"), requireStore, asyncRoute(async (request, response) => {
  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.sku, p.category, p.cost_price_cents, p.selling_price_cents,
            p.wholesale_price_cents, p.wholesale_quantity, i.stock, i.reorder_level,
            pr.discount_type, pr.discount_value, pr.starts_at::text AS discount_starts_at,
            pr.ends_at::text AS discount_ends_at,
            p.supplier_id, s.name AS supplier_name, p.expiry_date,
            p.production_description, p.mft_date::text AS mft_date, p.color, p.initials
     FROM products p
     JOIN store_inventory i ON i.product_id = p.id AND i.store_id = $1
     LEFT JOIN store_promotions pr ON pr.product_id = p.id AND pr.store_id = $1
     LEFT JOIN suppliers s ON s.id = p.supplier_id
     WHERE p.active = TRUE
     ORDER BY p.name`,
    [request.storeId],
  );
  response.json({
    products: rows.map((product) =>
      productResponse(product, {
        includeCost: request.user.role !== "cashier",
        includeWholesale: true,
      }),
    ),
  });
}));

app.get("/api/suppliers", requireUser, requirePermission("inventory:write"), asyncRoute(async (request, response) => {
  const { rows } = await pool.query(
    `SELECT id, name, contact_name, email, phone, created_at
     FROM suppliers
     ORDER BY name`,
  );
  response.json({ suppliers: rows.map(supplierResponse) });
}));

app.post("/api/suppliers", requireUser, requirePermission("catalog:write"), asyncRoute(async (request, response) => {
  const supplier = validateSupplierInput(request.body);
  try {
    const { rows } = await pool.query(
      `INSERT INTO suppliers (name, contact_name, email, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, contact_name, email, phone, created_at`,
      [supplier.name, supplier.contactName, supplier.email, supplier.phone],
    );
    response.status(201).json({ supplier: supplierResponse(rows[0]) });
  } catch (error) {
    if (supplierNameConflict(error)) {
      throw apiError(409, "A supplier with that name already exists.", "SUPPLIER_ALREADY_EXISTS");
    }
    throw error;
  }
}));

app.put("/api/suppliers/:id", requireUser, requirePermission("catalog:write"), asyncRoute(async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw apiError(400, "Invalid supplier ID.", "INVALID_SUPPLIER_ID");
  }
  const supplier = validateSupplierInput(request.body);
  try {
    const { rows } = await pool.query(
      `UPDATE suppliers
       SET name = $1, contact_name = $2, email = $3, phone = $4
       WHERE id = $5
       RETURNING id, name, contact_name, email, phone, created_at`,
      [supplier.name, supplier.contactName, supplier.email, supplier.phone, id],
    );
    if (!rows[0]) throw apiError(404, "Supplier not found.", "SUPPLIER_NOT_FOUND");
    response.json({ supplier: supplierResponse(rows[0]) });
  } catch (error) {
    if (supplierNameConflict(error)) {
      throw apiError(409, "A supplier with that name already exists.", "SUPPLIER_ALREADY_EXISTS");
    }
    throw error;
  }
}));

app.get("/api/categories", requireUser, requirePermission("inventory:read"), asyncRoute(async (request, response) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.name, COUNT(p.id)::integer AS product_count
     FROM categories c
     LEFT JOIN products p ON p.category = c.name AND p.active = TRUE
     GROUP BY c.id
     ORDER BY c.name`,
  );
  response.json({ categories: rows.map(categoryResponse) });
}));

app.post("/api/categories", requireUser, requirePermission("catalog:write"), asyncRoute(async (request, response) => {
  const category = validateCategoryInput(request.body);
  try {
    const { rows } = await pool.query(
      `INSERT INTO categories (name)
       VALUES ($1)
       RETURNING id, name`,
      [category.name],
    );
    response.status(201).json({ category: categoryResponse(rows[0]) });
  } catch (error) {
    if (categoryNameConflict(error)) {
      throw apiError(409, "A category with that name already exists.", "CATEGORY_ALREADY_EXISTS");
    }
    throw error;
  }
}));

app.put("/api/categories/:id", requireUser, requirePermission("catalog:write"), asyncRoute(async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw apiError(400, "Invalid category ID.", "INVALID_CATEGORY_ID");
  }
  const category = validateCategoryInput(request.body);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: existingRows } = await client.query(
      "SELECT id, name FROM categories WHERE id = $1 FOR UPDATE",
      [id],
    );
    if (!existingRows[0]) throw apiError(404, "Category not found.", "CATEGORY_NOT_FOUND");
    const { rows } = await client.query(
      `UPDATE categories
       SET name = $1
       WHERE id = $2
       RETURNING id, name`,
      [category.name, id],
    );
    await client.query(
      "UPDATE products SET category = $1 WHERE LOWER(category) = LOWER($2)",
      [rows[0].name, existingRows[0].name],
    );
    const { rows: countRows } = await client.query(
      "SELECT COUNT(*)::integer AS product_count FROM products WHERE category = $1 AND active = TRUE",
      [rows[0].name],
    );
    await client.query("COMMIT");
    response.json({ category: categoryResponse({ ...rows[0], product_count: countRows[0].product_count }) });
  } catch (error) {
    await client.query("ROLLBACK");
    if (categoryNameConflict(error)) {
      throw apiError(409, "A category with that name already exists.", "CATEGORY_ALREADY_EXISTS");
    }
    throw error;
  } finally {
    client.release();
  }
}));

async function resolveCategoryName(name, queryable = pool) {
  const { rows } = await queryable.query(
    "SELECT name FROM categories WHERE LOWER(name) = LOWER($1)",
    [name],
  );
  if (!rows[0]) throw apiError(400, "Select a category from the category list.", "INVALID_CATEGORY");
  return rows[0].name;
}

app.post("/api/products", requireUser, requirePermission("catalog:write"), requireStore, asyncRoute(async (request, response) => {
  const product = validateProductInput(request.body, { requireSku: false });
  const promotion = validatePromotionInput(request.body, product.sellingPriceCents);
  product.category = await resolveCategoryName(product.category);
  const targetStoreId = request.body.storeId === undefined
    ? request.storeId
    : Number(request.body.storeId);
  if (!Number.isSafeInteger(targetStoreId) || targetStoreId < 1) {
    throw apiError(400, "Select a valid destination store.", "INVALID_STORE");
  }
  const initials = product.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: targetStoreRows } = await client.query(
      `SELECT s.id
       FROM stores s
       WHERE s.id = $1 AND s.active = TRUE
         AND ($2 = 'owner' OR EXISTS (
           SELECT 1 FROM user_stores us WHERE us.store_id = s.id AND us.user_id = $3
         ))`,
      [targetStoreId, request.user.role, request.user.id],
    );
    if (!targetStoreRows[0]) {
      throw apiError(403, "You do not have access to the selected store.", "STORE_FORBIDDEN");
    }
    const { rows: idRows } = await client.query(
      "SELECT nextval(pg_get_serial_sequence('products', 'id')) AS id",
    );
    const id = Number(idRows[0].id);
    const sku = generatedSku(id);
    const { rows } = await client.query(
      `INSERT INTO products (
         id, name, sku, category, cost_price_cents, selling_price_cents,
         wholesale_price_cents, wholesale_quantity, stock, reorder_level, supplier_id,
         expiry_date, production_description, mft_date, color, initials
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING id, name, sku, category, cost_price_cents, selling_price_cents,
                 wholesale_price_cents, wholesale_quantity, stock, reorder_level, supplier_id,
                 expiry_date, production_description, mft_date::text AS mft_date, color, initials`,
      [
        id, product.name, sku, product.category, product.costPriceCents,
        product.sellingPriceCents, product.wholesalePriceCents, product.wholesaleQuantity,
        product.stock, product.reorderLevel, product.supplierId, product.expiryDate,
        product.productionDescription, product.mftDate, "#e8e8ef", initials,
      ],
    );
    await client.query(
      `INSERT INTO store_inventory (store_id, product_id, stock, reorder_level)
       SELECT s.id, $2, CASE WHEN s.id = $1 THEN $3 ELSE 0 END, $4
       FROM stores s WHERE s.active = TRUE
       ON CONFLICT DO NOTHING`,
      [targetStoreId, rows[0].id, product.stock, product.reorderLevel],
    );
    if (promotion.discountType) {
      await client.query(
        `INSERT INTO store_promotions (store_id, product_id, discount_type, discount_value, starts_at, ends_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          targetStoreId, rows[0].id, promotion.discountType, promotion.discountValueCents,
          promotion.startsAt, promotion.endsAt,
        ],
      );
    }
    if (product.stock > 0) {
      await client.query(
        `INSERT INTO stock_movements (store_id, product_id, user_id, quantity, reason)
         VALUES ($1, $2, $3, $4, 'Opening stock')`,
        [targetStoreId, rows[0].id, request.user.id, product.stock],
      );
    }
    const supplierResult = product.supplierId
      ? await client.query("SELECT name FROM suppliers WHERE id = $1", [product.supplierId])
      : { rows: [] };
    await client.query("COMMIT");
    response.status(201).json({
      product: productResponse({
        ...rows[0],
        stock: product.stock,
        reorder_level: product.reorderLevel,
        discount_type: promotion.discountType,
        discount_value: promotion.discountValueCents,
        discount_starts_at: promotion.startsAt,
        discount_ends_at: promotion.endsAt,
        supplier_name: supplierResult.rows[0]?.name ?? "",
      }),
    });
  } catch (error) {
    await client.query("ROLLBACK");
    if (skuConflict(error)) {
      throw apiError(409, "That SKU is already assigned to another product.", "SKU_ALREADY_EXISTS");
    }
    if (error.code === "23503" && error.constraint === "products_supplier_id_fkey") {
      throw apiError(400, "Select a supplier from the supplier list.", "INVALID_SUPPLIER");
    }
    throw error;
  } finally {
    client.release();
  }
}));

app.put("/api/products/:id", requireUser, requirePermission("catalog:write"), requireStore, asyncRoute(async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw apiError(400, "Invalid product ID.", "INVALID_PRODUCT_ID");
  }
  const product = validateProductInput(request.body, { includeStock: false });
  const hasPromotionFields = [
    "discountType",
    "discountValue",
    "discountStartsAt",
    "discountEndsAt",
  ].some((field) => Object.hasOwn(request.body, field));
  const promotion = hasPromotionFields
    ? validatePromotionInput(request.body, product.sellingPriceCents)
    : null;
  product.category = await resolveCategoryName(product.category);
  const initials = product.name.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `UPDATE products
       SET name = $1, sku = $2, category = $3, cost_price_cents = $4,
           selling_price_cents = $5, wholesale_price_cents = $6, wholesale_quantity = $7,
           supplier_id = $8, expiry_date = $9, production_description = $10,
           mft_date = $11, initials = $12
       WHERE id = $13 AND active = TRUE
       RETURNING id, name, sku, category, cost_price_cents, selling_price_cents,
                 wholesale_price_cents, wholesale_quantity, stock, reorder_level, supplier_id,
                 expiry_date, production_description, mft_date::text AS mft_date, color, initials`,
      [
        product.name, product.sku, product.category, product.costPriceCents,
        product.sellingPriceCents, product.wholesalePriceCents, product.wholesaleQuantity,
        product.supplierId, product.expiryDate, product.productionDescription,
        product.mftDate, initials, id,
      ],
    );
    if (!rows[0]) throw apiError(404, "Product not found.", "PRODUCT_NOT_FOUND");
    await client.query(
      `INSERT INTO store_inventory (store_id, product_id, reorder_level)
       VALUES ($1, $2, $3)
       ON CONFLICT (store_id, product_id) DO UPDATE SET reorder_level = EXCLUDED.reorder_level`,
      [request.storeId, id, product.reorderLevel],
    );
    if (promotion?.discountType) {
      await client.query(
        `INSERT INTO store_promotions (store_id, product_id, discount_type, discount_value, starts_at, ends_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (store_id, product_id) DO UPDATE
         SET discount_type = EXCLUDED.discount_type, discount_value = EXCLUDED.discount_value,
             starts_at = EXCLUDED.starts_at, ends_at = EXCLUDED.ends_at`,
        [
          request.storeId, id, promotion.discountType, promotion.discountValueCents,
          promotion.startsAt, promotion.endsAt,
        ],
      );
    } else if (promotion) {
      await client.query(
        "DELETE FROM store_promotions WHERE store_id = $1 AND product_id = $2",
        [request.storeId, id],
      );
    }
    const { rows: storeRows } = await client.query(
      `SELECT i.stock, i.reorder_level, pr.discount_type, pr.discount_value,
              pr.starts_at::text AS discount_starts_at, pr.ends_at::text AS discount_ends_at
       FROM store_inventory i
       LEFT JOIN store_promotions pr ON pr.store_id = i.store_id AND pr.product_id = i.product_id
       WHERE i.store_id = $1 AND i.product_id = $2`,
      [request.storeId, id],
    );
    const supplierResult = product.supplierId
      ? await client.query("SELECT name FROM suppliers WHERE id = $1", [product.supplierId])
      : { rows: [] };
    await client.query("COMMIT");
    response.json({
      product: productResponse({
        ...rows[0], ...storeRows[0], supplier_name: supplierResult.rows[0]?.name ?? "",
      }),
    });
  } catch (error) {
    await client.query("ROLLBACK");
    if (skuConflict(error)) {
      throw apiError(409, "That SKU is already assigned to another product.", "SKU_ALREADY_EXISTS");
    }
    if (error.code === "23503" && error.constraint === "products_supplier_id_fkey") {
      throw apiError(400, "Select a supplier from the supplier list.", "INVALID_SUPPLIER");
    }
    throw error;
  } finally {
    client.release();
  }
}));

app.post("/api/products/:id/stock-adjustments", requireUser, requirePermission("inventory:write"), requireStore, asyncRoute(async (request, response) => {
  const id = Number(request.params.id);
  const { quantity, reason } = request.body ?? {};
  const cleanReason = typeof reason === "string" ? reason.trim() : "";
  if (
    !Number.isSafeInteger(id) ||
    id < 1 ||
    !Number.isInteger(quantity) ||
    quantity === 0 ||
    Math.abs(quantity) > 1_000_000 ||
    !cleanReason ||
    cleanReason.length > 160
  ) {
    throw apiError(400, "Enter a non-zero stock adjustment and a reason.", "INVALID_STOCK_ADJUSTMENT");
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: inventoryRows } = await client.query(
      `UPDATE store_inventory
       SET stock = stock + $1
       WHERE store_id = $2 AND product_id = $3 AND stock + $1 >= 0
       RETURNING stock, reorder_level`,
      [quantity, request.storeId, id],
    );
    if (!inventoryRows[0]) {
      const { rows: productRows } = await client.query(
        `SELECT p.id, i.stock FROM products p
         LEFT JOIN store_inventory i ON i.product_id = p.id AND i.store_id = $2
         WHERE p.id = $1 AND p.active = TRUE`,
        [id, request.storeId],
      );
      if (!productRows[0] || productRows[0].stock === null) {
        throw apiError(404, "Product not found in this store.", "PRODUCT_NOT_FOUND");
      }
      throw apiError(409, "This adjustment would take stock below zero.", "INSUFFICIENT_STOCK");
    }
    await client.query(
      `INSERT INTO stock_movements (store_id, product_id, user_id, quantity, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [request.storeId, id, request.user.id, quantity, cleanReason],
    );
    const { rows } = await client.query(
      `SELECT p.id, p.name, p.sku, p.category, p.cost_price_cents, p.selling_price_cents,
              p.wholesale_price_cents, p.wholesale_quantity,
              i.stock, i.reorder_level, p.supplier_id, s.name AS supplier_name,
              p.expiry_date, p.color, p.initials, pr.discount_type, pr.discount_value,
              pr.starts_at::text AS discount_starts_at, pr.ends_at::text AS discount_ends_at
       FROM products p
       JOIN store_inventory i ON i.product_id = p.id AND i.store_id = $2
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       LEFT JOIN store_promotions pr ON pr.product_id = p.id AND pr.store_id = $2
       WHERE p.id = $1`,
      [id, request.storeId],
    );
    await client.query("COMMIT");
    response.json({
      product: productResponse(rows[0]),
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}));

app.get("/api/inventory/report", requireUser, requirePermission("inventory:report"), requireStore, asyncRoute(async (request, response) => {
  const days = request.query.expiringWithinDays === undefined
    ? 30
    : Number(request.query.expiringWithinDays);
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw apiError(400, "Expiry report window must be between 1 and 365 days.", "INVALID_REPORT_WINDOW");
  }
  const { rows: products } = await pool.query(
    `SELECT p.id, p.name, p.sku, p.category, p.cost_price_cents, p.selling_price_cents,
            p.wholesale_price_cents, p.wholesale_quantity,
            i.stock, i.reorder_level, pr.discount_type, pr.discount_value,
            pr.starts_at::text AS discount_starts_at, pr.ends_at::text AS discount_ends_at,
            p.supplier_id, s.name AS supplier_name, p.expiry_date, p.color, p.initials
     FROM products p
     JOIN store_inventory i ON i.product_id = p.id AND i.store_id = $1
     LEFT JOIN store_promotions pr ON pr.product_id = p.id AND pr.store_id = $1
     LEFT JOIN suppliers s ON s.id = p.supplier_id
     WHERE p.active = TRUE
     ORDER BY p.name`,
    [request.storeId],
  );
  const { rows: movements } = await pool.query(
    `SELECT sm.id, sm.product_id, p.name AS product_name, p.sku, sm.user_id,
            u.name AS user_name, sm.quantity, sm.reason, sm.created_at
     FROM stock_movements sm
     JOIN products p ON p.id = sm.product_id
     JOIN users u ON u.id = sm.user_id
     WHERE sm.store_id = $1
     ORDER BY sm.created_at DESC
     LIMIT 100`,
    [request.storeId],
  );
  const mappedProducts = products.map(productResponse);
  const today = new Date().toISOString().slice(0, 10);
  const expiresBy = new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
  response.json({
    report: {
      generatedAt: Date.now(),
      expiringWithinDays: days,
      summary: {
        productCount: mappedProducts.length,
        totalUnits: mappedProducts.reduce((sum, product) => sum + product.stock, 0),
        lowStockCount: mappedProducts.filter((product) => product.stock > 0 && product.stock <= product.reorderLevel).length,
        outOfStockCount: mappedProducts.filter((product) => product.stock === 0).length,
        expiredCount: mappedProducts.filter((product) => product.expiryDate && product.expiryDate < today).length,
        expiringSoonCount: mappedProducts.filter((product) => product.expiryDate && product.expiryDate >= today && product.expiryDate <= expiresBy).length,
        costValue: mappedProducts.reduce((sum, product) => sum + product.costPrice * product.stock, 0),
        retailValue: mappedProducts.reduce((sum, product) => sum + product.price * product.stock, 0),
      },
      lowStock: mappedProducts.filter((product) => product.stock <= product.reorderLevel),
      expiring: mappedProducts.filter((product) => product.expiryDate && product.expiryDate <= expiresBy),
      movements: movements.map((movement) => ({
        id: movement.id,
        productId: movement.product_id,
        productName: movement.product_name,
        sku: movement.sku,
        userName: movement.user_name,
        quantity: movement.quantity,
        reason: movement.reason,
        date: new Date(movement.created_at).getTime(),
      })),
    },
  });
}));

app.get("/api/customers", requireUser, requirePermission("customers:read"), asyncRoute(async (request, response) => {
  const { rows } = await pool.query(
    `SELECT id, name, phone, email, notes, created_at
     FROM customers
     ORDER BY name`,
  );
  response.json({ customers: rows.map(customerResponse) });
}));

app.post("/api/customers", requireUser, requirePermission("customers:write"), asyncRoute(async (request, response) => {
  const customer = validateCustomerInput(request.body);
  const { rows } = await pool.query(
    `INSERT INTO customers (name, phone, email, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, phone, email, notes, created_at`,
    [customer.name, customer.phone, customer.email, customer.notes],
  );
  response.status(201).json({ customer: customerResponse(rows[0]) });
}));

app.put("/api/customers/:id", requireUser, requirePermission("customers:write"), asyncRoute(async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw apiError(400, "Invalid customer ID.", "INVALID_CUSTOMER_ID");
  }
  const customer = validateCustomerInput(request.body);
  const { rows } = await pool.query(
    `UPDATE customers
     SET name = $1, phone = $2, email = $3, notes = $4
     WHERE id = $5
     RETURNING id, name, phone, email, notes, created_at`,
    [customer.name, customer.phone, customer.email, customer.notes, id],
  );
  if (!rows[0]) throw apiError(404, "Customer not found.", "CUSTOMER_NOT_FOUND");
  response.json({ customer: customerResponse(rows[0]) });
}));

app.get("/api/customers/:id/history", requireUser, requirePermission("customers:read"), requireStore, asyncRoute(async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw apiError(400, "Invalid customer ID.", "INVALID_CUSTOMER_ID");
  }
  const page = request.query.page === undefined ? 1 : Number(request.query.page);
  const pageSize = request.query.pageSize === undefined
    ? 50
    : Number(request.query.pageSize);
  if (
    !Number.isSafeInteger(page) || page < 1 ||
    !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100 ||
    !Number.isSafeInteger((page - 1) * pageSize)
  ) {
    throw apiError(400, "Invalid customer history page.", "INVALID_CUSTOMER_HISTORY_PAGE");
  }
  const { rows: customerRows } = await pool.query(
    "SELECT id, name, phone, email, notes, created_at FROM customers WHERE id = $1",
    [id],
  );
  if (!customerRows[0]) throw apiError(404, "Customer not found.", "CUSTOMER_NOT_FOUND");
  const cashierScoped = request.user.role === "cashier";
  const historyParams = cashierScoped
    ? [request.storeId, id, request.user.id]
    : [request.storeId, id];
  const historyWhere = `s.store_id = $1 AND s.customer_id = $2${cashierScoped ? " AND s.cashier_id = $3" : ""}`;
  const [{ rows: saleRows }, { rows: countRows }] = await Promise.all([
    pool.query(
    `SELECT s.id, s.method, s.cash_received_cents, s.mobile_money_amount_cents,
            s.item_count, s.subtotal_cents,
            s.total_cents, s.created_at,
            COALESCE(
              json_agg(json_build_object(
                'name', si.product_name,
                'quantity', si.quantity,
                'unitPriceCents', si.unit_price_cents
              ) ORDER BY si.id) FILTER (WHERE si.id IS NOT NULL),
              '[]'::json
            ) AS items
     FROM sales s
     LEFT JOIN sale_items si ON si.sale_id = s.id
     WHERE ${historyWhere}
     GROUP BY s.id
     ORDER BY s.created_at DESC
     LIMIT $${historyParams.length + 1} OFFSET $${historyParams.length + 2}`,
    [...historyParams, pageSize, (page - 1) * pageSize],
    ),
    pool.query(
      `SELECT COUNT(*)::text AS total
       FROM sales s
       WHERE ${historyWhere}`,
      historyParams,
    ),
  ]);
  response.json({
    customer: customerResponse(customerRows[0]),
    page,
    pageSize,
    total: Number(countRows[0].total),
    sales: saleRows.map((sale) => ({
      id: `CP-${String(sale.id).padStart(6, "0")}`,
      method: sale.method,
      itemCount: sale.item_count,
      subtotal: Number(sale.subtotal_cents) / 100,
      total: Number(sale.total_cents) / 100,
      date: new Date(sale.created_at).getTime(),
      items: sale.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPriceCents) / 100,
        lineTotal: Number(item.unitPriceCents) / 100 * item.quantity,
      })),
    })),
  });
}));

app.get("/api/sales", requireUser, requireStore, asyncRoute(async (request, response) => {
  const search = typeof request.query.search === "string" ? request.query.search.trim() : "";
  if (search.length > 120) {
    throw apiError(400, "Transaction search must be 120 characters or fewer.", "INVALID_SALE_SEARCH");
  }
  const page = request.query.page === undefined ? 1 : Number(request.query.page);
  const pageSize = request.query.pageSize === undefined
    ? 50
    : Number(request.query.pageSize);
  const dateFrom = request.query.dateFrom === undefined ? "" : request.query.dateFrom;
  const dateTo = request.query.dateTo === undefined ? "" : request.query.dateTo;
  if (
    (dateFrom && !isValidDateOnly(dateFrom)) ||
    (dateTo && !isValidDateOnly(dateTo)) ||
    (dateFrom && dateTo && dateFrom > dateTo)
  ) {
    throw apiError(400, "Invalid sales date range.", "INVALID_SALES_DATE_RANGE");
  }
  if (
    !Number.isSafeInteger(page) || page < 1 ||
    !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100
  ) {
    throw apiError(400, "Invalid sales page or page size.", "INVALID_SALES_PAGE");
  }
  const offset = (page - 1) * pageSize;
  if (!Number.isSafeInteger(offset)) {
    throw apiError(400, "Invalid sales page or page size.", "INVALID_SALES_PAGE");
  }
  const query = salesQueryFor(
    request.user,
    request.storeId,
    search,
    pageSize,
    offset,
    dateFrom,
    dateTo,
  );
  const [{ rows }, { rows: countRows }] = await Promise.all([
    pool.query(query.sql, query.params),
    pool.query(query.countSql, query.countParams),
  ]);
  response.json({
    page,
    pageSize,
    total: Number(countRows[0].total),
    sales: rows.map((sale) => ({
      id: `CP-${String(sale.id).padStart(6, "0")}`,
      items: sale.item_count,
      total: Number(sale.total_cents) / 100,
      date: new Date(sale.created_at).getTime(),
      method: sale.method,
      cashReceived: sale.cash_received_cents === null
        ? null
        : Number(sale.cash_received_cents) / 100,
      change: sale.cash_received_cents === null
        ? 0
        : Math.max(
            0,
            Number(sale.cash_received_cents) - Number(sale.total_cents),
          ) / 100,
      mobileMoneyAmount: sale.mobile_money_amount_cents === null
        ? null
        : Number(sale.mobile_money_amount_cents) / 100,
      cashierId: sale.cashier_id,
      cashierName: sale.cashier_name,
      customerId: sale.customer_id,
      customerName: sale.customer_name ?? "Walk-in customer",
    })),
  });
}));

app.get("/api/sales/summary", requireUser, requireStore, asyncRoute(async (request, response) => {
  const start = request.query.start;
  const end = request.query.end;
  const startDate = typeof start === "string" ? new Date(start) : null;
  const endDate = typeof end === "string" ? new Date(end) : null;
  if (
    !startDate || !endDate ||
    !Number.isFinite(startDate.getTime()) ||
    !Number.isFinite(endDate.getTime()) ||
    endDate <= startDate ||
    endDate.getTime() - startDate.getTime() > 48 * 60 * 60 * 1000
  ) {
    throw apiError(400, "A valid local-day start and end are required.", "INVALID_SALES_SUMMARY_RANGE");
  }
  const query = salesSummaryQueryFor(
    request.user,
    request.storeId,
    startDate.toISOString(),
    endDate.toISOString(),
  );
  const { rows } = await pool.query(query.sql, query.params);
  response.json({
    totalCount: Number(rows[0].total_count),
    todayCount: Number(rows[0].today_count),
    todayRevenue: Number(rows[0].today_total_cents) / 100,
  });
}));

app.get("/api/dashboard/insights", requireUser, requireStore, asyncRoute(async (request, response) => {
  const start = typeof request.query.start === "string" ? new Date(request.query.start) : null;
  const end = typeof request.query.end === "string" ? new Date(request.query.end) : null;
  if (
    !start || !end ||
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    end <= start ||
    end.getTime() - start.getTime() > 31 * 24 * 60 * 60 * 1000
  ) {
    throw apiError(400, "A valid dashboard date range is required.", "INVALID_DASHBOARD_RANGE");
  }
  if (!["owner", "manager", "cashier"].includes(request.user.role)) {
    throw apiError(403, "Your role does not allow this action.", "FORBIDDEN");
  }

  const params = [request.storeId];
  let where = "s.store_id = $1";
  if (request.user.role === "cashier") {
    params.push(request.user.id);
    where += " AND s.cashier_id = $2";
  }
  params.push(start.toISOString(), end.toISOString());
  const startParam = `$${params.length - 1}`;
  const endParam = `$${params.length}`;
  const rangeWhere = `${where} AND s.created_at >= ${startParam}::timestamptz AND s.created_at < ${endParam}::timestamptz`;
  const [trendResult, bestSellerResult, paymentResult] = await Promise.all([
    pool.query(
      `SELECT TO_CHAR(DATE_TRUNC('day', s.created_at), 'YYYY-MM-DD') AS day,
              COUNT(*)::text AS count,
              COALESCE(SUM(s.total_cents), 0)::text AS revenue_cents
       FROM sales s
       WHERE ${rangeWhere}
       GROUP BY DATE_TRUNC('day', s.created_at)
       ORDER BY DATE_TRUNC('day', s.created_at)`,
      params,
    ),
    pool.query(
      `SELECT si.product_name AS name,
              SUM(si.quantity)::text AS quantity,
              COALESCE(SUM(si.quantity * si.unit_price_cents), 0)::text AS revenue_cents
       FROM sales s
       JOIN sale_items si ON si.sale_id = s.id
       WHERE ${rangeWhere}
       GROUP BY si.product_name
       ORDER BY SUM(si.quantity) DESC, SUM(si.quantity * si.unit_price_cents) DESC, si.product_name
       LIMIT 5`,
      params,
    ),
    pool.query(
      `SELECT s.method,
              COUNT(*)::text AS count,
              COALESCE(SUM(s.total_cents), 0)::text AS revenue_cents
       FROM sales s
       WHERE ${rangeWhere}
       GROUP BY s.method
       ORDER BY SUM(s.total_cents) DESC, s.method`,
      params,
    ),
  ]);
  response.json({
    trend: trendResult.rows.map((row) => ({
      day: row.day,
      count: Number(row.count),
      revenue: Number(row.revenue_cents) / 100,
    })),
    bestSellers: bestSellerResult.rows.map((row) => ({
      name: row.name,
      quantity: Number(row.quantity),
      revenue: Number(row.revenue_cents) / 100,
    })),
    payments: paymentResult.rows.map((row) => ({
      method: row.method,
      count: Number(row.count),
      revenue: Number(row.revenue_cents) / 100,
    })),
  });
}));

app.post("/api/sales/quote", requireUser, requirePermission("checkout"), requireStore, asyncRoute(async (request, response) => {
  const quantities = saleQuantities(request.body?.items);
  const ids = [...quantities.keys()];
  const { rows: products } = await pool.query(
    saleProductQuery(),
    [ids, request.storeId],
  );
  const foundIds = new Set(products.map((product) => product.id));
  const missingProductIds = ids.filter((id) => !foundIds.has(id));
  const quote = calculateSaleQuote(products, quantities, request.user.role);
  quote.available = quote.available && missingProductIds.length === 0;
  quote.unavailableProductIds = missingProductIds;
  response.json({
    quote,
  });
}));

app.post("/api/payments/paystack/initialize", requireUser, requirePermission("checkout"), asyncRoute(async () => {
  throw apiError(410, "Only cash payments are accepted.", "CASH_ONLY");
}));

app.get("/api/sales/:id", requireUser, requireStore, asyncRoute(async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw apiError(400, "Invalid sale ID.", "INVALID_SALE_ID");
  }
  const { whereSql, params } = saleDetailQueryFor(request.user, id, request.storeId);
  const { rows } = await pool.query(
    `SELECT s.id, s.cashier_id, u.name AS cashier_name, s.customer_id, c.name AS customer_name,
            s.method, s.cash_received_cents, s.mobile_money_amount_cents,
            s.item_count, s.subtotal_cents,
            s.total_cents, s.created_at,
            COALESCE(
              json_agg(json_build_object(
                'productName', si.product_name,
                'quantity', si.quantity,
                'unitPriceCents', si.unit_price_cents
              ) ORDER BY si.id) FILTER (WHERE si.id IS NOT NULL),
              '[]'::json
            ) AS receipt_items
     FROM sales s
     JOIN users u ON u.id = s.cashier_id
     LEFT JOIN customers c ON c.id = s.customer_id
     LEFT JOIN sale_items si ON si.sale_id = s.id
     WHERE ${whereSql}
     GROUP BY s.id, c.name, u.name`,
    params,
  );
  const sale = rows[0];
  if (!sale) throw apiError(404, "Transaction not found.", "SALE_NOT_FOUND");
  response.json({
    sale: {
      id: `CP-${String(sale.id).padStart(6, "0")}`,
      cashierId: sale.cashier_id,
      cashierName: sale.cashier_name,
      customerId: sale.customer_id,
      customerName: sale.customer_name ?? "Walk-in customer",
      method: sale.method,
      cashReceived: sale.cash_received_cents === null
        ? null
        : Number(sale.cash_received_cents) / 100,
      change: sale.cash_received_cents === null
        ? 0
        : Math.max(
            0,
            Number(sale.cash_received_cents) - Number(sale.total_cents),
          ) / 100,
      mobileMoneyAmount: sale.mobile_money_amount_cents === null
        ? null
        : Number(sale.mobile_money_amount_cents) / 100,
      itemCount: sale.item_count,
      items: sale.item_count,
      subtotal: Number(sale.subtotal_cents) / 100,
      total: Number(sale.total_cents) / 100,
      date: new Date(sale.created_at).getTime(),
      itemsDetail: sale.receipt_items.map((item) => {
        const unitPriceCents = Number(item.unitPriceCents);
        return {
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: unitPriceCents / 100,
          lineTotal: unitPriceCents * item.quantity / 100,
        };
      }),
    },
  });
}));

app.post("/api/sales", requireUser, requirePermission("checkout"), requireStore, asyncRoute(async (request, response) => {
  const { items } = request.body ?? {};
  const method = request.body?.method ?? "Cash";
  const cashReceivedCents = request.body?.cashReceivedCents;
  const expectedTotalCents = request.body?.expectedTotalCents;
  const idempotencyKey = request.get("Idempotency-Key");
  const customerId = customerIdFromInput(request.body?.customerId);
  const quantities = saleQuantities(items);
  if (
    method !== "Cash" ||
    !Number.isSafeInteger(expectedTotalCents) ||
    expectedTotalCents < 0 ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey ?? "") ||
    !Number.isSafeInteger(cashReceivedCents) ||
    cashReceivedCents < 0 ||
    cashReceivedCents > 2147483647
  ) {
    throw apiError(400, "Only cash payments are accepted. Enter the cash received and review the order.", "INVALID_SALE");
  }
  const normalizedItems = [...quantities.entries()]
    .sort(([left], [right]) => left - right)
    .map(([productId, quantity]) => ({ productId, quantity }));
  const requestHash = createHash("sha256")
    .update(JSON.stringify({
      items: normalizedItems,
      method,
      cashReceivedCents,
      customerId,
      expectedTotalCents,
    }))
    .digest("hex");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      [`${request.user.id}:${request.storeId}:${idempotencyKey}`],
    );
    const { rows: previousRequests } = await client.query(
      `SELECT request_hash, response
       FROM checkout_idempotency
       WHERE user_id = $1 AND store_id = $2 AND idempotency_key = $3`,
      [request.user.id, request.storeId, idempotencyKey],
    );
    if (previousRequests[0]) {
      if (previousRequests[0].request_hash !== requestHash) {
        throw apiError(
          409,
          "This checkout key was already used for a different sale.",
          "IDEMPOTENCY_KEY_REUSED",
        );
      }
      if (!previousRequests[0].response) {
        throw apiError(409, "This sale is still being processed. Retry shortly.", "SALE_IN_PROGRESS");
      }
      await client.query("COMMIT");
      response.status(200).json(previousRequests[0].response);
      return;
    }
    await client.query(
      `INSERT INTO checkout_idempotency (
         user_id, store_id, idempotency_key, request_hash
       ) VALUES ($1, $2, $3, $4)`,
      [request.user.id, request.storeId, idempotencyKey, requestHash],
    );
    let customer = null;
    if (customerId !== null) {
      const { rows } = await client.query(
        "SELECT id, name FROM customers WHERE id = $1",
        [customerId],
      );
      if (!rows[0]) throw apiError(404, "Customer not found.", "CUSTOMER_NOT_FOUND");
      customer = rows[0];
    }
    const ids = [...quantities.keys()];
    const { rows: products } = await client.query(
      saleProductQuery(true),
      [ids, request.storeId],
    );
    const foundIds = new Set(products.map((product) => product.id));
    const missingProductIds = ids.filter((id) => !foundIds.has(id));
    const quote = calculateSaleQuote(products, quantities, request.user.role);
    quote.available = quote.available && missingProductIds.length === 0;
    quote.unavailableProductIds = missingProductIds;
    if (expectedTotalCents !== quote.totalCents) {
      const error = apiError(
        409,
        "Prices changed while this order was being checked. Review the updated quote before continuing.",
        "QUOTE_CHANGED",
      );
      error.quote = quote;
      throw error;
    }
    if (!quote.available) {
      const product = products.find(
        (item) => item.stock < quantities.get(item.id),
      );
      const error = apiError(
        409,
        product
          ? `${product.name} does not have enough stock to complete this sale.`
          : "A product in this order is no longer available.",
        "STOCK_CONFLICT",
      );
      error.quote = quote;
      throw error;
    }
    const { subtotalCents, totalCents } = quote;
    if (cashReceivedCents < totalCents) {
      throw apiError(
        400,
        "Cash received must cover the total due.",
        "INVALID_PAYMENT_AMOUNT",
      );
    }
    const itemCount = [...quantities.values()].reduce((sum, quantity) => sum + quantity, 0);
    const { rows: saleRows } = await client.query(
      `INSERT INTO sales (
         store_id, cashier_id, customer_id, method, cash_received_cents,
         mobile_money_amount_cents, paystack_reference, item_count,
         subtotal_cents, total_cents
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, cashier_id, method, cash_received_cents,
                 mobile_money_amount_cents, item_count, total_cents, created_at`,
      [
        request.storeId,
        request.user.id,
        customerId,
        method,
        cashReceivedCents,
        null,
        null,
        itemCount,
        subtotalCents,
        totalCents,
      ],
    );
    const sale = saleRows[0];
    const updatedProducts = [];
    const receiptItems = [];
    for (const product of products) {
      const quantity = quantities.get(product.id);
      const unitPriceCents = salePriceCents(product, quantity);
      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price_cents)
         VALUES ($1, $2, $3, $4, $5)`,
        [sale.id, product.id, product.name, quantity, unitPriceCents],
      );
      receiptItems.push({
        productName: product.name,
        quantity,
        unitPrice: unitPriceCents / 100,
        lineTotal: unitPriceCents * quantity / 100,
      });
      await client.query(
        `UPDATE store_inventory SET stock = stock - $1
         WHERE product_id = $2 AND store_id = $3
         RETURNING product_id, stock, reorder_level`,
        [quantity, product.id, request.storeId],
      );
      const { rows: updatedProductRows } = await client.query(
        `SELECT p.id, p.name, p.sku, p.category, p.cost_price_cents, p.selling_price_cents,
                p.wholesale_price_cents, p.wholesale_quantity,
                i.stock, i.reorder_level, p.supplier_id, s.name AS supplier_name,
                p.expiry_date, p.color, p.initials, pr.discount_type, pr.discount_value,
                pr.starts_at::text AS discount_starts_at, pr.ends_at::text AS discount_ends_at
         FROM products p
         JOIN store_inventory i ON i.product_id = p.id AND i.store_id = $2
         LEFT JOIN suppliers s ON s.id = p.supplier_id
         LEFT JOIN store_promotions pr ON pr.product_id = p.id AND pr.store_id = $2
         WHERE p.id = $1`,
        [product.id, request.storeId],
      );
      updatedProducts.push(
        productResponse(
          updatedProductRows[0],
          { includeCost: request.user.role !== "cashier", includeWholesale: true },
        ),
      );
      await client.query(
        `INSERT INTO stock_movements (store_id, product_id, user_id, quantity, reason)
         VALUES ($1, $2, $3, $4, $5)`,
        [request.storeId, product.id, request.user.id, -quantity, `Sale CP-${String(sale.id).padStart(6, "0")}`],
      );
    }
    const saleResponse = {
      sale: {
        id: `CP-${String(sale.id).padStart(6, "0")}`,
        items: sale.item_count,
        total: Number(sale.total_cents) / 100,
        date: new Date(sale.created_at).getTime(),
        method: sale.method,
        cashReceived: sale.cash_received_cents === null
          ? null
          : Number(sale.cash_received_cents) / 100,
        change: cashReceivedCents === null
          ? 0
          : Math.max(0, cashReceivedCents - totalCents) / 100,
        mobileMoneyAmount: sale.mobile_money_amount_cents === null
          ? null
          : Number(sale.mobile_money_amount_cents) / 100,
        cashierId: sale.cashier_id,
        cashierName: request.user.name,
        customerId,
        customerName: customer?.name ?? "Walk-in customer",
        subtotal: subtotalCents / 100,
        receiptItems,
        products: updatedProducts,
      },
    };
    await client.query(
      `UPDATE checkout_idempotency
       SET response = $1
       WHERE user_id = $2 AND store_id = $3 AND idempotency_key = $4`,
      [
        JSON.stringify(saleResponse),
        request.user.id,
        request.storeId,
        idempotencyKey,
      ],
    );
    await client.query("COMMIT");
    response.status(201).json(saleResponse);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}));

app.get("/api/users", requireUser, requirePermission("team:read"), requireStore, asyncRoute(async (request, response) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, u.active, u.created_at,
            COALESCE(json_agg(json_build_object('id', s.id, 'name', s.name)
              ORDER BY s.name) FILTER (WHERE s.id IS NOT NULL), '[]'::json) AS stores
     FROM users u
     LEFT JOIN user_stores us ON us.user_id = u.id
     LEFT JOIN stores s ON s.id = us.store_id AND s.active = TRUE
       AND ($1 = 'owner' OR EXISTS (
         SELECT 1 FROM user_stores visible
         WHERE visible.user_id = $2 AND visible.store_id = us.store_id
       ))
     WHERE ($1 = 'owner' OR EXISTS (
       SELECT 1 FROM user_stores scope
       WHERE scope.user_id = $2 AND scope.store_id = $3
     )) AND EXISTS (
       SELECT 1 FROM user_stores assigned
       WHERE assigned.user_id = u.id AND assigned.store_id = $3
     )
     GROUP BY u.id
     ORDER BY u.created_at`,
    [request.user.role, request.user.id, request.storeId],
  );
  response.json({
    users: rows.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      createdAt: new Date(user.created_at).getTime(),
      stores: user.stores,
    })),
  });
}));

app.post("/api/users", requireUser, requirePermission("team:write"), requireStore, asyncRoute(async (request, response) => {
  const { name, email, password, role } = request.body ?? {};
  const storeIds = Array.isArray(request.body?.storeIds)
    ? [...new Set(request.body.storeIds)]
    : [request.storeId];
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (request.user.role === "manager" && role !== "cashier") {
    throw apiError(403, "Managers can only add cashier accounts.", "MANAGER_CASHIER_ONLY");
  }
  if (
    !cleanName ||
    cleanName.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
    cleanEmail.length > 254 ||
    !isValidPassword(password) ||
    !["manager", "cashier"].includes(role) ||
    storeIds.length !== 1 ||
    storeIds.some((storeId) => !Number.isSafeInteger(storeId) || storeId < 1)
  ) {
    throw apiError(400, "Enter valid account details and assign the account to exactly one store.", "INVALID_USER");
  }
  const { rows: accessibleStores } = await pool.query(
    `SELECT s.id, s.name FROM stores s
     WHERE s.id = ANY($1::integer[]) AND s.active = TRUE
       AND ($2 = 'owner' OR EXISTS (
         SELECT 1 FROM user_stores us WHERE us.user_id = $3 AND us.store_id = s.id
       ))`,
    [storeIds, request.user.role, request.user.id],
  );
  if (accessibleStores.length !== storeIds.length) {
    throw apiError(403, "You can only assign team members to stores you manage.", "STORE_ASSIGNMENT_FORBIDDEN");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO users (
         name, email, role, password_hash, must_change_password
       )
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, name, email, role, active, created_at`,
      [cleanName, cleanEmail, role, passwordHash],
    );
    const user = rows[0];
    for (const storeId of storeIds) {
      await client.query(
        "INSERT INTO user_stores (user_id, store_id) VALUES ($1, $2)",
        [user.id, storeId],
      );
    }
    await client.query("COMMIT");
    response.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        createdAt: new Date(user.created_at).getTime(),
        stores: accessibleStores,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      throw apiError(409, "An account with that email already exists.", "EMAIL_ALREADY_EXISTS");
    }
    throw error;
  } finally {
    client.release();
  }
}));

app.put("/api/users/:id", requireUser, requirePermission("team:write"), requireStore, asyncRoute(async (request, response) => {
  const id = Number(request.params.id);
  const { name, email, storeIds, active } = request.body ?? {};
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const assignedStoreIds = Array.isArray(storeIds) ? [...new Set(storeIds)] : [];
  if (
    !Number.isSafeInteger(id) ||
    id < 1 ||
    !cleanName ||
    cleanName.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
    cleanEmail.length > 254 ||
    typeof active !== "boolean" ||
    assignedStoreIds.length !== 1 ||
    assignedStoreIds.some((storeId) => !Number.isSafeInteger(storeId) || storeId < 1)
  ) {
    throw apiError(400, "Enter valid account details and assign the account to exactly one store.", "INVALID_USER");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: targetRows } = await client.query(
      `SELECT u.id
       FROM users u
       WHERE u.id = $1 AND u.role IN ('manager', 'cashier')
         AND EXISTS (
           SELECT 1 FROM user_stores us
           WHERE us.user_id = u.id AND us.store_id = $2
         )
       FOR UPDATE`,
      [id, request.storeId],
    );
    if (!targetRows[0]) {
      throw apiError(404, "Team member not found for this store.", "TEAM_MEMBER_NOT_FOUND");
    }

    const { rows: accessibleStores } = await client.query(
      `SELECT s.id, s.name FROM stores s
       WHERE s.id = ANY($1::integer[]) AND s.active = TRUE
         AND ($2 = 'owner' OR EXISTS (
           SELECT 1 FROM user_stores us
           WHERE us.user_id = $3 AND us.store_id = s.id
         ))`,
      [assignedStoreIds, request.user.role, request.user.id],
    );
    if (accessibleStores.length !== assignedStoreIds.length) {
      throw apiError(403, "You can only assign cashiers to stores you manage.", "STORE_ASSIGNMENT_FORBIDDEN");
    }

    const { rows } = await client.query(
      `UPDATE users
       SET name = $1, email = $2, active = $3,
           auth_version = auth_version + CASE WHEN active IS DISTINCT FROM $3 THEN 1 ELSE 0 END
       WHERE id = $4
       RETURNING id, name, email, role, active, created_at`,
      [cleanName, cleanEmail, active, id],
    );
    if (request.user.role === "owner" || request.user.role === "manager") {
      await client.query(
        "DELETE FROM user_stores WHERE user_id = $1 AND NOT (store_id = ANY($2::integer[]))",
        [id, assignedStoreIds],
      );
    } else {
      await client.query(
        `DELETE FROM user_stores us
         USING stores s
         WHERE us.store_id = s.id AND us.user_id = $1
           AND EXISTS (
             SELECT 1 FROM user_stores manager_store
             WHERE manager_store.user_id = $2 AND manager_store.store_id = s.id
           )
           AND NOT (us.store_id = ANY($3::integer[]))`,
        [id, request.user.id, assignedStoreIds],
      );
    }
    for (const storeId of assignedStoreIds) {
      await client.query(
        "INSERT INTO user_stores (user_id, store_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [id, storeId],
      );
    }
    await client.query("COMMIT");
    response.json({
      user: {
        id: rows[0].id,
        name: rows[0].name,
        email: rows[0].email,
        role: rows[0].role,
        active: rows[0].active,
        createdAt: new Date(rows[0].created_at).getTime(),
        stores: accessibleStores,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      throw apiError(409, "An account with that email already exists.", "EMAIL_ALREADY_EXISTS");
    }
    throw error;
  } finally {
    client.release();
  }
}));

app.post("/api/users/:id/password-reset", requireUser, requirePermission("team:write"), requireStore, asyncRoute(async (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw apiError(400, "Invalid user ID.", "INVALID_USER_ID");
  }

  const { rows } = await pool.query(
    `SELECT u.id
     FROM users u
     WHERE u.id = $1 AND u.role IN ('manager', 'cashier')
       AND ($2 = 'owner'
         OR EXISTS (
           SELECT 1 FROM user_stores target_store
           JOIN user_stores manager_store
             ON manager_store.store_id = target_store.store_id
           WHERE target_store.user_id = u.id
             AND manager_store.user_id = $3
             AND target_store.store_id = $4
         ))`,
    [id, request.user.role, request.user.id, request.storeId],
  );
  if (!rows[0]) {
    throw apiError(404, "Team member not found for this store.", "TEAM_MEMBER_NOT_FOUND");
  }

  const temporaryPassword = randomBytes(18).toString("base64url");
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: updatedUsers } = await client.query(
      `UPDATE users
       SET password_hash = $1, must_change_password = TRUE,
           auth_version = auth_version + 1
       WHERE id = $2 AND role IN ('manager', 'cashier')
       RETURNING id`,
      [passwordHash, id],
    );
    if (!updatedUsers[0]) {
      throw apiError(404, "Team member not found for this store.", "TEAM_MEMBER_NOT_FOUND");
    }
    await client.query(
      "DELETE FROM user_sessions WHERE sess->>'userId' = $1",
      [String(id)],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  response.json({ temporaryPassword });
}));

app.use("/api", (request, response, next) => {
  next(apiError(404, "API endpoint not found.", "NOT_FOUND"));
});

const distDir = path.resolve(__dirname, "../dist");
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/.*/, (request, response, next) => {
    if (request.path.startsWith("/api/")) return next();
    return response.sendFile(path.join(distDir, "index.html"));
  });
}

app.use((error, request, response, next) => {
  if (response.headersSent) return next(error);
  if (error.status >= 500 || !error.status) {
    console.error(error);
  }
  response.status(error.status ?? 500).json({
    error: error.status ? error.message : "An unexpected server error occurred.",
    code: error.code ?? "INTERNAL_ERROR",
    ...(error.quote ? { quote: error.quote } : {}),
  });
});

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(254) NOT NULL UNIQUE,
      role VARCHAR(16) NOT NULL CHECK (role IN ('owner', 'manager', 'cashier')),
      password_hash TEXT NOT NULL,
      auth_version BIGINT NOT NULL DEFAULT 0,
      must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      contact_name VARCHAR(120),
      email VARCHAR(254),
      phone VARCHAR(40),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS suppliers_name_ci_key ON suppliers (LOWER(name));
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(60) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS categories_name_ci_key ON categories (LOWER(name));
    CREATE TABLE IF NOT EXISTS stores (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      branch VARCHAR(120) NOT NULL DEFAULT '',
      manager_name VARCHAR(120) NOT NULL DEFAULT '',
      location VARCHAR(240) NOT NULL DEFAULT '',
      contact_phone VARCHAR(40) NOT NULL DEFAULT '',
      contact_email VARCHAR(254) NOT NULL DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE stores ADD COLUMN IF NOT EXISTS branch VARCHAR(120) NOT NULL DEFAULT '';
    ALTER TABLE stores ADD COLUMN IF NOT EXISTS manager_name VARCHAR(120) NOT NULL DEFAULT '';
    ALTER TABLE stores ADD COLUMN IF NOT EXISTS location VARCHAR(240) NOT NULL DEFAULT '';
    ALTER TABLE stores ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(40) NOT NULL DEFAULT '';
    ALTER TABLE stores ADD COLUMN IF NOT EXISTS contact_email VARCHAR(254) NOT NULL DEFAULT '';
    DROP INDEX IF EXISTS stores_name_ci_key;
    CREATE UNIQUE INDEX IF NOT EXISTS stores_name_branch_ci_key
      ON stores (LOWER(name), LOWER(branch));
    CREATE TABLE IF NOT EXISTS user_stores (
      user_id BIGINT NOT NULL REFERENCES users(id),
      store_id INTEGER NOT NULL REFERENCES stores(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, store_id)
    );
    CREATE TABLE IF NOT EXISTS user_store_assignment_migrations (
      user_id BIGINT PRIMARY KEY REFERENCES users(id),
      previous_store_ids INTEGER[] NOT NULL,
      retained_store_id INTEGER NOT NULL REFERENCES stores(id),
      migrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    INSERT INTO user_store_assignment_migrations (user_id, previous_store_ids, retained_store_id)
    SELECT user_id, ARRAY_AGG(store_id ORDER BY store_id), MIN(store_id)
    FROM user_stores
    GROUP BY user_id
    HAVING COUNT(*) > 1
    ON CONFLICT (user_id) DO NOTHING;
    DELETE FROM user_stores us
    WHERE us.store_id <> (
      SELECT MIN(keep.store_id) FROM user_stores keep WHERE keep.user_id = us.user_id
    );
    CREATE UNIQUE INDEX IF NOT EXISTS user_stores_one_store_per_user_key ON user_stores (user_id);
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      phone VARCHAR(40),
      email VARCHAR(254),
      notes VARCHAR(500),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      sku VARCHAR(64),
      category VARCHAR(60) NOT NULL,
      price_cents INTEGER,
      cost_price_cents BIGINT NOT NULL DEFAULT 0 CHECK (cost_price_cents >= 0),
      selling_price_cents BIGINT NOT NULL DEFAULT 1 CHECK (selling_price_cents > 0),
      wholesale_price_cents BIGINT NOT NULL DEFAULT 0 CHECK (wholesale_price_cents >= 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      reorder_level INTEGER NOT NULL DEFAULT 5 CHECK (reorder_level >= 0),
      supplier VARCHAR(120),
      supplier_id INTEGER REFERENCES suppliers(id),
      expiry_date DATE,
      production_description TEXT NOT NULL DEFAULT '',
      mft_date DATE,
      color VARCHAR(16) NOT NULL DEFAULT '#e8e8ef',
      initials VARCHAR(4) NOT NULL DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS store_inventory (
      store_id INTEGER NOT NULL REFERENCES stores(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      reorder_level INTEGER NOT NULL DEFAULT 5 CHECK (reorder_level >= 0),
      PRIMARY KEY (store_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS store_promotions (
      store_id INTEGER NOT NULL REFERENCES stores(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      discount_type VARCHAR(8) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
      discount_value NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
      starts_at DATE,
      ends_at DATE,
      PRIMARY KEY (store_id, product_id),
      CHECK (starts_at IS NULL OR ends_at IS NULL OR starts_at <= ends_at),
      CHECK (discount_type <> 'percent' OR discount_value < 100)
    );
    CREATE TABLE IF NOT EXISTS sales (
      id BIGSERIAL PRIMARY KEY,
      store_id INTEGER NOT NULL REFERENCES stores(id),
      cashier_id BIGINT NOT NULL REFERENCES users(id),
      customer_id INTEGER REFERENCES customers(id),
      method VARCHAR(20) NOT NULL CHECK (method = 'Cash'),
      cash_received_cents INTEGER,
      mobile_money_amount_cents INTEGER,
      paystack_reference TEXT,
      item_count INTEGER NOT NULL CHECK (item_count > 0),
      subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
      total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE sales ALTER COLUMN method TYPE VARCHAR(20);
    ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_method_check;
    ALTER TABLE sales ADD CONSTRAINT sales_method_check
      CHECK (method = 'Cash') NOT VALID;
    ALTER TABLE sales ADD COLUMN IF NOT EXISTS cash_received_cents INTEGER;
    ALTER TABLE sales ADD COLUMN IF NOT EXISTS mobile_money_amount_cents INTEGER;
    ALTER TABLE sales ADD COLUMN IF NOT EXISTS paystack_reference TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS sales_paystack_reference_key
      ON sales (paystack_reference) WHERE paystack_reference IS NOT NULL;
    CREATE TABLE IF NOT EXISTS checkout_idempotency (
      user_id BIGINT NOT NULL REFERENCES users(id),
      store_id INTEGER NOT NULL REFERENCES stores(id),
      idempotency_key UUID NOT NULL,
      request_hash CHAR(64) NOT NULL,
      response JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, store_id, idempotency_key)
    );
    CREATE INDEX IF NOT EXISTS checkout_idempotency_created_idx
      ON checkout_idempotency (created_at);
    CREATE TABLE IF NOT EXISTS paystack_payment_intents (
      reference TEXT PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id),
      store_id INTEGER NOT NULL REFERENCES stores(id),
      amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
      request_hash CHAR(64) NOT NULL,
      email VARCHAR(254) NOT NULL,
      sale_id BIGINT UNIQUE REFERENCES sales(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS sale_items (
      id BIGSERIAL PRIMARY KEY,
      sale_id BIGINT NOT NULL REFERENCES sales(id),
      product_id INTEGER REFERENCES products(id),
      product_name VARCHAR(120) NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents > 0)
    );
    CREATE TABLE IF NOT EXISTS stock_movements (
      id BIGSERIAL PRIMARY KEY,
      store_id INTEGER NOT NULL REFERENCES stores(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      user_id BIGINT NOT NULL REFERENCES users(id),
      quantity INTEGER NOT NULL CHECK (quantity <> 0),
      reason VARCHAR(160) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(64);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price_cents BIGINT NOT NULL DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS selling_price_cents BIGINT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_price_cents BIGINT NOT NULL DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_quantity INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_level INTEGER NOT NULL DEFAULT 5;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier VARCHAR(120);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers(id);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date DATE;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS production_description TEXT NOT NULL DEFAULT '';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS mft_date DATE;
    ALTER TABLE sales ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES stores(id);
    ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS store_id INTEGER REFERENCES stores(id);
    ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id);
    ALTER TABLE products DROP COLUMN IF EXISTS tax_rate;
    ALTER TABLE sale_items DROP COLUMN IF EXISTS tax_rate;
    ALTER TABLE sales DROP COLUMN IF EXISTS tax_cents;
    INSERT INTO stores (name)
      SELECT 'Main Store'
      WHERE NOT EXISTS (SELECT 1 FROM stores);
    INSERT INTO user_stores (user_id, store_id)
      SELECT u.id, s.id FROM users u CROSS JOIN (SELECT id FROM stores ORDER BY id LIMIT 1) s
      WHERE u.role IN ('manager', 'cashier')
        AND NOT EXISTS (SELECT 1 FROM user_stores us WHERE us.user_id = u.id)
      ON CONFLICT DO NOTHING;
    INSERT INTO store_inventory (store_id, product_id, stock, reorder_level)
      SELECT s.id, p.id, p.stock, p.reorder_level
      FROM products p CROSS JOIN (SELECT id FROM stores ORDER BY id LIMIT 1) s
      ON CONFLICT DO NOTHING;
    UPDATE sales SET store_id = (SELECT id FROM stores ORDER BY id LIMIT 1) WHERE store_id IS NULL;
    UPDATE stock_movements SET store_id = (SELECT id FROM stores ORDER BY id LIMIT 1) WHERE store_id IS NULL;
    ALTER TABLE sales ALTER COLUMN store_id SET NOT NULL;
    ALTER TABLE stock_movements ALTER COLUMN store_id SET NOT NULL;
    INSERT INTO categories (name)
      SELECT DISTINCT BTRIM(category)
      FROM products
      WHERE category IS NOT NULL AND BTRIM(category) <> ''
      ON CONFLICT DO NOTHING;
    UPDATE products p
      SET category = c.name
      FROM categories c
      WHERE LOWER(BTRIM(p.category)) = LOWER(c.name);
    INSERT INTO suppliers (name)
      SELECT DISTINCT BTRIM(supplier)
      FROM products
      WHERE supplier IS NOT NULL AND BTRIM(supplier) <> ''
      ON CONFLICT DO NOTHING;
    UPDATE products p
      SET supplier_id = s.id
      FROM suppliers s
      WHERE p.supplier_id IS NULL AND LOWER(BTRIM(p.supplier)) = LOWER(s.name);
    ALTER TABLE products ALTER COLUMN price_cents DROP NOT NULL;
    UPDATE products
      SET selling_price_cents = COALESCE(selling_price_cents, price_cents)
      WHERE selling_price_cents IS NULL;
    UPDATE products
      SET sku = 'CP-' || id::text
      WHERE sku IS NULL;
    ALTER TABLE products ALTER COLUMN sku SET NOT NULL;
    ALTER TABLE products ALTER COLUMN selling_price_cents SET NOT NULL;
    ALTER TABLE products ALTER COLUMN selling_price_cents DROP DEFAULT;
    CREATE UNIQUE INDEX IF NOT EXISTS products_sku_key ON products (sku);
    CREATE INDEX IF NOT EXISTS products_stock_reorder_idx ON products (stock, reorder_level);
    CREATE INDEX IF NOT EXISTS products_expiry_idx ON products (expiry_date);
    CREATE INDEX IF NOT EXISTS store_inventory_stock_idx ON store_inventory (store_id, stock, reorder_level);
    CREATE INDEX IF NOT EXISTS sales_store_created_idx ON sales (store_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS stock_movements_store_created_idx ON stock_movements (store_id, created_at DESC);
    ALTER TABLE sales ALTER COLUMN subtotal_cents TYPE BIGINT;
    ALTER TABLE sales ALTER COLUMN total_cents TYPE BIGINT;
    ALTER TABLE sale_items ALTER COLUMN unit_price_cents TYPE BIGINT;
    CREATE INDEX IF NOT EXISTS sales_cashier_created_idx ON sales (cashier_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS sales_customer_created_idx ON sales (customer_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS sale_items_sale_idx ON sale_items (sale_id);
    CREATE INDEX IF NOT EXISTS stock_movements_created_idx ON stock_movements (created_at DESC);
  `);
  await pool.query(
    "DELETE FROM checkout_idempotency WHERE created_at < NOW() - INTERVAL '30 days'",
  );
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS auth_version BIGINT NOT NULL DEFAULT 0;
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'products_sku_format_check'
          AND conrelid = 'products'::regclass
      ) THEN
        ALTER TABLE products
          ADD CONSTRAINT products_sku_format_check
          CHECK (sku ~ '^[A-Z0-9][A-Z0-9._/-]{0,63}$');
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'products_cost_price_check' AND conrelid = 'products'::regclass
      ) THEN
        ALTER TABLE products ADD CONSTRAINT products_cost_price_check CHECK (cost_price_cents >= 0);
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'products_selling_price_check' AND conrelid = 'products'::regclass
      ) THEN
        ALTER TABLE products ADD CONSTRAINT products_selling_price_check CHECK (selling_price_cents > 0);
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'products_wholesale_price_check' AND conrelid = 'products'::regclass
      ) THEN
        ALTER TABLE products ADD CONSTRAINT products_wholesale_price_check CHECK (wholesale_price_cents >= 0);
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'products_wholesale_quantity_check' AND conrelid = 'products'::regclass
      ) THEN
        ALTER TABLE products ADD CONSTRAINT products_wholesale_quantity_check
          CHECK (wholesale_quantity >= 0 AND wholesale_quantity <= 1000000);
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'products_reorder_level_check' AND conrelid = 'products'::regclass
      ) THEN
        ALTER TABLE products ADD CONSTRAINT products_reorder_level_check CHECK (reorder_level >= 0);
      END IF;
    END;
    $$
  `);
}

await initializeDatabase();
const idempotencyRetentionTimer = setInterval(() => {
  pool
    .query(
      "DELETE FROM checkout_idempotency WHERE created_at < NOW() - INTERVAL '30 days'",
    )
    .catch((error) => {
      console.error("Could not clean up expired checkout idempotency records.", error);
    });
}, 24 * 60 * 60 * 1000);
idempotencyRetentionTimer.unref();
app.listen(port, () => {
  console.info(`Counterpoint API listening on port ${port}.`);
});
