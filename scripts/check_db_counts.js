const { Client } = require('pg');

(async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Please set DATABASE_URL');
    process.exit(1);
  }
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const totalRes = await client.query('select count(*)::int as total from problems');
    const placeholdersRes = await client.query("select count(*)::int as total from problems where title ilike 'Programming Basics Problem %' or title ilike 'Placeholder%'");
    const realtimeRes = await client.query("select count(*)::int as total from problems where title ilike 'Find Minimum in Array %' or title ilike 'Sum of Array Elements %' or title ilike '%Easy #%'");
    const samplePlaceholders = await client.query("select id,title,created_at from problems where title ilike 'Programming Basics Problem %' order by id asc limit 5");
    const sampleRealtime = await client.query("select id,title,created_at from problems where title ilike 'Find Minimum in Array %' order by id asc limit 5");
    console.log(JSON.stringify({
      total: totalRes.rows[0].total,
      placeholders: placeholdersRes.rows[0].total,
      realtime: realtimeRes.rows[0].total,
      samplePlaceholders: samplePlaceholders.rows,
      sampleRealtime: sampleRealtime.rows
    }, null, 2));
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
