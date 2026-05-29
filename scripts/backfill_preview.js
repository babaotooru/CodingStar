const fs = require('fs');
const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const DATASET_PATH = 'data/problems_5000.json';

(async function(){
  const raw = fs.readFileSync(DATASET_PATH, 'utf8');
  const data = JSON.parse(raw);
  const problems = Array.isArray(data.problems) ? data.problems : [];
  const rawConn = process.env.DATABASE_URL || null;
  const conn = rawConn.replace(/:\[([^\]]+)\]@/, (m, p) => ':' + encodeURIComponent(p) + '@');
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  await client.connect();
  console.log('connected');
  try{
    await client.query('BEGIN');
    for (let i=0;i<Math.min(5, problems.length);i++){
      const problem = problems[i];
      const problemCode = String(problem.id || problem.problem_code || '').trim();
      console.log('handling', problemCode);
      const rows = await client.query('SELECT id FROM problems WHERE problem_code = $1', [problemCode]);
      console.log('existing rows', rows.rowCount);
    }
    await client.query('ROLLBACK');
    console.log('preview done');
  }catch(e){
    console.error('error', e.message);
  }finally{
    await client.end();
  }
})();