import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import pg from "pg";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInitialOwner } from "./owner-bootstrap.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const { Pool } = pg;
const name = process.env.OWNER_NAME?.trim();
const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
const password = process.env.OWNER_PASSWORD;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}
if (!name || name.length > 120 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("Set a valid OWNER_NAME and OWNER_EMAIL before running this command.");
}
if (!password || password.length < 12 || password.length > 72 || Buffer.byteLength(password, "utf8") > 72) {
  throw new Error("Set OWNER_PASSWORD to a value between 12 and 72 characters.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: true } : undefined,
});
try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(254) NOT NULL UNIQUE,
      role VARCHAR(16) NOT NULL CHECK (role IN ('owner', 'manager', 'cashier')),
      password_hash TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const passwordHash = await bcrypt.hash(password, 12);
  await createInitialOwner(pool, { name, email, passwordHash });
  console.info(`Administrator account created for ${email}.`);
} catch (error) {
  if (error.code === "OWNER_ALREADY_EXISTS") {
    console.error(error.message);
    process.exitCode = 1;
  } else {
    throw error;
  }
} finally {
  await pool.end();
}
