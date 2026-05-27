const fs = require('fs');
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Please set DATABASE_URL');
  process.exit(1);
}

(async () => {
  const raw = fs.readFileSync('data/problems_5000.json','utf8');
  const data = JSON.parse(raw);
  const p = data.problems[0];
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    console.log('Connected');
    await client.query("ALTER TABLE problems ADD CONSTRAINT IF NOT EXISTS uq_problems_problem_code UNIQUE (problem_code)").catch(() => {});
    await client.query('TRUNCATE TABLE test_cases, problem_notes, submissions, contest_problems, contest_participants, problems RESTART IDENTITY CASCADE');
    const problemCode = String(p.id);
    const q = `INSERT INTO problems (problem_code, title, statement, difficulty, topics, description, sample_input, sample_output) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`;
    const vals = [problemCode, p.title, p.statement || null, p.difficulty || null, (Array.isArray(p.topic)?p.topic[0]:null), p.statement||p.description||null, p.sample_input||null, p.sample_output||null];
    console.log('Inserting problem with vals sample:', vals);
    const res = await client.query(q, vals);
    console.log('Inserted id:', res.rows[0].id);
    const pid = res.rows[0].id;
    if (Array.isArray(p.testcases)) {
      for (let j=0;j<p.testcases.length;j++){
        const tc = p.testcases[j];
        const tcq = `INSERT INTO test_cases (problem_id, input, expected_output, explanation, is_sample, order_index) VALUES ($1,$2,$3,$4,$5,$6)`;
        const tvals = [pid, tc.input, tc.output, tc.explanation||null, j===0, j];
        await client.query(tcq, tvals);
        console.log('Inserted test case', j+1);
      }
    }
    console.log('Done');
  } catch (e) {
    console.error('Error:', e && e.stack ? e.stack : e);
  } finally {
    await client.end();
  }
})();
