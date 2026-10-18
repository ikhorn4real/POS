import { roleCan } from "./permissions.js";
export { rolePermissions, roleCan } from "./permissions.js";

export function isValidPassword(password) {
  return typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 72 &&
    Buffer.byteLength(password, "utf8") <= 72;
}

export function createRequirePermission(permission) {
  return (request, response, next) => {
    if (!request.user) {
      const error = new Error("Sign in to continue.");
      error.status = 401;
      error.code = "AUTH_REQUIRED";
      return next(error);
    }
    if (!roleCan(request.user.role, permission)) {
      const error = new Error("Your role does not allow this action.");
      error.status = 403;
      error.code = "FORBIDDEN";
      return next(error);
    }
    return next();
  };
}

export function createRequireUser(findUserById) {
  return async (request, response, next) => {
    if (!request.session?.userId) {
      const error = new Error("Sign in to continue.");
      error.status = 401;
      error.code = "AUTH_REQUIRED";
      return next(error);
    }
    try {
      const user = await findUserById(request.session.userId);
      if (!user?.active) {
        if (request.session) request.session.userId = null;
        const error = new Error("Your account is no longer active.");
        error.status = 401;
        error.code = "AUTH_REQUIRED";
        return next(error);
      }
      if (Number(request.session.authVersion) !== Number(user.auth_version)) {
        await new Promise((resolve, reject) => {
          request.session.destroy((error) =>
            error ? reject(error) : resolve(),
          );
        });
        const error = new Error("Your session has expired. Sign in again.");
        error.status = 401;
        error.code = "AUTH_REQUIRED";
        return next(error);
      }
      request.user = user;
      if (
        user.must_change_password &&
        !(
          (request.method === "GET" && request.path === "/api/auth/session") ||
          (request.method === "POST" && request.path === "/api/auth/password") ||
          (request.method === "POST" && request.path === "/api/auth/logout")
        )
      ) {
        const error = new Error("Change your temporary password before continuing.");
        error.status = 403;
        error.code = "PASSWORD_CHANGE_REQUIRED";
        return next(error);
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export function salesQueryFor(
  user,
  storeId,
  search = "",
  limit = 50,
  offset = 0,
  dateFrom = "",
  dateTo = "",
) {
  const normalizedSearch = search.trim().replace(/^CP-/i, "");
  const searchParameter = user.role === "cashier" ? 3 : 2;
  const searchClause = normalizedSearch
    ? ` AND (
         s.id::text ILIKE $${searchParameter}
         OR ('CP-' || LPAD(s.id::text, GREATEST(6, LENGTH(s.id::text)), '0')) ILIKE $${searchParameter}
         OR COALESCE(c.name, 'Walk-in customer') ILIKE $${searchParameter}
         OR u.name ILIKE $${searchParameter}
         OR s.method ILIKE $${searchParameter}
         OR EXISTS (
           SELECT 1 FROM sale_items si
           WHERE si.sale_id = s.id AND si.product_name ILIKE $${searchParameter}
         )
       )`
    : "";
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 ||
      !Number.isInteger(offset) || offset < 0) {
    throw new TypeError("Sales pagination values are invalid.");
  }
  const isValidDate = (value) => {
    if (!value) return true;
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  if (!isValidDate(dateFrom) || !isValidDate(dateTo) ||
      (dateFrom && dateTo && dateFrom > dateTo)) {
    throw new TypeError("Sales date filters are invalid.");
  }
  let params;
  let whereClause;
  if (user.role === "cashier") {
    params = [storeId, user.id];
    whereClause = "s.store_id = $1 AND s.cashier_id = $2";
  } else if (user.role === "owner" || user.role === "manager") {
    params = [storeId];
    whereClause = "s.store_id = $1";
  } else {
    const error = new Error("Your role does not allow this action.");
    error.status = 403;
    error.code = "FORBIDDEN";
    throw error;
  }
  if (normalizedSearch) {
    params.push(`%${normalizedSearch}%`);
    whereClause += searchClause;
  }
  if (dateFrom) {
    params.push(`${dateFrom}T00:00:00.000Z`);
    whereClause += ` AND s.created_at >= $${params.length}::timestamptz`;
  }
  if (dateTo) {
    const dayAfterDateTo = new Date(`${dateTo}T00:00:00.000Z`);
    dayAfterDateTo.setUTCDate(dayAfterDateTo.getUTCDate() + 1);
    params.push(dayAfterDateTo.toISOString());
    whereClause += ` AND s.created_at < $${params.length}::timestamptz`;
  }
  const countParams = [...params];
  params.push(limit, offset);
  return {
    sql: `SELECT s.id, s.cashier_id, u.name AS cashier_name, s.customer_id, c.name AS customer_name,
                 (SELECT si.product_name FROM sale_items si WHERE si.sale_id = s.id ORDER BY si.id LIMIT 1) AS first_product_name,
                 s.method, s.cash_received_cents, s.mobile_money_amount_cents,
                 s.item_count, s.subtotal_cents,
                 s.total_cents, s.created_at
          FROM sales s
          JOIN users u ON u.id = s.cashier_id
          LEFT JOIN customers c ON c.id = s.customer_id
          WHERE ${whereClause}
          ORDER BY s.created_at DESC, s.id DESC
          LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
    countSql: `SELECT COUNT(*)::text AS total
               FROM sales s
               JOIN users u ON u.id = s.cashier_id
               LEFT JOIN customers c ON c.id = s.customer_id
               WHERE ${whereClause}`,
    countParams,
  };
}

export function salesSummaryQueryFor(user, storeId, start, end) {
  if (user.role === "cashier") {
    return {
      sql: `SELECT COUNT(*)::text AS total_count,
                   COUNT(*) FILTER (
                     WHERE s.created_at >= $3::timestamptz
                       AND s.created_at < $4::timestamptz
                   )::text AS today_count,
                   COALESCE(SUM(s.total_cents) FILTER (
                     WHERE s.created_at >= $3::timestamptz
                       AND s.created_at < $4::timestamptz
                   ), 0)::text AS today_total_cents
            FROM sales s
            WHERE s.store_id = $1 AND s.cashier_id = $2`,
      params: [storeId, user.id, start, end],
    };
  }
  if (user.role === "owner" || user.role === "manager") {
    return {
      sql: `SELECT COUNT(*)::text AS total_count,
                   COUNT(*) FILTER (
                     WHERE s.created_at >= $2::timestamptz
                       AND s.created_at < $3::timestamptz
                   )::text AS today_count,
                   COALESCE(SUM(s.total_cents) FILTER (
                     WHERE s.created_at >= $2::timestamptz
                       AND s.created_at < $3::timestamptz
                   ), 0)::text AS today_total_cents
            FROM sales s
            WHERE s.store_id = $1`,
      params: [storeId, start, end],
    };
  }
  const error = new Error("Your role does not allow this action.");
  error.status = 403;
  error.code = "FORBIDDEN";
  throw error;
}

export function saleDetailQueryFor(user, saleId, storeId) {
  if (user.role === "cashier") {
    return {
      whereSql: "s.id = $1 AND s.store_id = $2 AND s.cashier_id = $3",
      params: [saleId, storeId, user.id],
    };
  }
  if (user.role === "owner" || user.role === "manager") {
    return {
      whereSql: "s.id = $1 AND s.store_id = $2",
      params: [saleId, storeId],
    };
  }
  const error = new Error("Your role does not allow this action.");
  error.status = 403;
  error.code = "FORBIDDEN";
  throw error;
}

export function regenerateSession(request) {
  return new Promise((resolve, reject) => {
    request.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

export function destroySession(request) {
  return new Promise((resolve, reject) => {
    request.session.destroy((error) => (error ? reject(error) : resolve()));
  });
}
