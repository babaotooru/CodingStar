const { Client } = require('pg');

(async function () {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL missing');
  const conn = raw.replace(/:\[([^\]]+)\]@/, (m, p) => ':' + encodeURIComponent(p) + '@');
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  await client.connect();
  try {
    const r = await client.query(
      `SELECT id, problem_code, sample_input, sample_output, sample_explanation
       FROM problems
       WHERE problem_code = 'P00004'`
    );
    console.log(JSON.stringify(r.rows, null, 2));
  } finally {
    await client.end();
  }
})();
