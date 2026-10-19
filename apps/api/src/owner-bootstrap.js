export async function createInitialOwner(pool, { name, email, passwordHash }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1, $2)", [1129270863, 1]);
    const { rows } = await client.query("SELECT COUNT(*)::integer AS count FROM users WHERE role = 'owner'");
    if (rows[0].count > 0) {
      const error = new Error("An administrator account already exists. Create staff accounts after signing in.");
      error.code = "OWNER_ALREADY_EXISTS";
      throw error;
    }
    await client.query(
      `INSERT INTO users (name, email, role, password_hash)
       VALUES ($1, $2, 'owner', $3)`,
      [name, email, passwordHash],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
