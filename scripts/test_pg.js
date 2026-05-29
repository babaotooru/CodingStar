const { Client } = require('pg');

(async function(){
  const raw = process.env.DATABASE_URL || null;
  if (!raw) { console.error('No DATABASE_URL'); process.exit(2); }
  const conn = raw.replace(/:\[([^\]]+)\]@/, (m,p) => ':'+encodeURIComponent(p)+'@');
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
  try{
    await client.connect();
    console.log('connected');
    const r = await client.query('SELECT 1 as ok');
    console.log('query result:', r.rows[0]);
    await client.end();
    process.exit(0);
  }catch(e){
    console.error('error', e.message);
    try{ await client.end(); }catch(_){}
    process.exit(1);
  }
})();