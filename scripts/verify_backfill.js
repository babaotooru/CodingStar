const fs = require('fs');
const { Client } = require('pg');

(async function () {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL missing');
  const conn = raw.replace(/:\[([^\]]+)\]@/, (m, p) => ':' + encodeURIComponent(p) + '@');
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  await client.connect();
  try {
    const count = await client.query('SELECT COUNT(*)::int AS count FROM problems');
    const sample = await client.query(
      `SELECT problem_code, sample_input, sample_output, sample_explanation
       FROM problems
       WHERE problem_code IN ('P00001','P03301','P05500')
       ORDER BY problem_code`
    );
    const tc = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM test_cases`
    );
    console.log(JSON.stringify({ problems: count.rows[0].count, testCases: tc.rows[0].count, sampleRows: sample.rows }, null, 2));
  } finally {
    await client.end();
  }
})();