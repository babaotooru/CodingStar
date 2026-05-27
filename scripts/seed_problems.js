const fs = require('fs');
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Please set DATABASE_URL environment variable (Postgres connection string)');
  process.exit(1);
}

const BATCH_SIZE = Number.parseInt(process.env.SEED_BATCH_SIZE || '10', 10);
const PROGRESS_FILE = process.env.SEED_PROGRESS_FILE || '.seed-problems.progress.json';
const REPLACE_EXISTING = process.env.SEED_REPLACE !== 'false';
const INCLUDE_TESTCASES = process.env.SEED_INCLUDE_TESTCASES === 'true';

function readProgress() {
  if (!fs.existsSync(PROGRESS_FILE)) {
    return 0;
  }

  try {
    const raw = fs.readFileSync(PROGRESS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Number.isInteger(parsed.nextIndex) && parsed.nextIndex >= 0 ? parsed.nextIndex : 0;
  } catch (error) {
    console.warn('Ignoring invalid progress file, starting from the beginning:', error.message);
    return 0;
  }
}

function writeProgress(nextIndex) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ nextIndex }, null, 2));
}

function clearProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
  }
}

function buildBulkInsert(table, columns, rows, conflictClause) {
  const values = [];
  const tuples = rows.map((row) => {
    const placeholders = row.map((value) => {
      values.push(value);
      return `$${values.length}`;
    });

    return `(${placeholders.join(',')})`;
  });

  return {
    text: `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${tuples.join(', ')} ${conflictClause}`,
    values,
  };
}

async function run() {
  const seedFile = process.env.SEED_FILE || (fs.existsSync('data/problems_5000.json') ? 'data/problems_5000.json' : 'data/problems_14_topics.json');
  console.log('Using seed file:', seedFile);
  const raw = fs.readFileSync(seedFile, 'utf8');
  const data = JSON.parse(raw);

  let nextIndex = readProgress();
  const totalBatches = Math.ceil(data.problems.length / BATCH_SIZE);

  while (nextIndex < data.problems.length) {
    const client = new Client({ connectionString: DATABASE_URL });

    client.on('error', (error) => {
      console.error('Database client error:', error.message);
    });

    try {
      await client.connect();
      await client.query('SET statement_timeout = 0');

      if (REPLACE_EXISTING && nextIndex === 0) {
        console.log('Clearing existing problem data before seeding...');
        try {
          await client.query('TRUNCATE TABLE test_cases, problem_notes, submissions, contest_problems, contest_participants, problems RESTART IDENTITY CASCADE');
        } catch (tErr) {
          console.error('Error truncating tables:', tErr && tErr.stack ? tErr.stack : tErr);
          throw tErr;
        }
      }

      while (nextIndex < data.problems.length) {
        const batch = data.problems.slice(nextIndex, nextIndex + BATCH_SIZE);
        await client.query('BEGIN');
        try {
          const problemRows = [];
          const testCaseRows = [];

          for (const p of batch) {
            const topic = data.topics.find(t => t.id === p.topic_id) || (Array.isArray(p.topic) && p.topic.length > 0 ? { name: p.topic[0] } : null);
            const topicsText = topic ? topic.name : null;
            const sampleTestcase = Array.isArray(p.testcases) && p.testcases.length > 0 ? p.testcases[0] : null;

            // Use problem_code to store original external id (e.g., P00001). Let DB generate numeric id.
            const problemCode = p.id != null ? String(p.id) : null;

            problemRows.push([
              problemCode,
              p.title,
              p.statement || null,
              p.difficulty || null,
              topicsText,
              p.statement || p.description || null,
              sampleTestcase ? sampleTestcase.input : null,
              sampleTestcase ? sampleTestcase.output : null,
            ]);

            if (Array.isArray(p.testcases)) {
              for (let j = 0; j < p.testcases.length; j++) {
                const tc = p.testcases[j];
                // store testcases temporarily referencing the problem_code; we'll resolve to numeric id after inserting problems
                testCaseRows.push([
                  null, // placeholder for id (DB will generate)
                  problemCode,
                  tc.input,
                  tc.output,
                  tc.explanation || null,
                  j === 0,
                  j,
                ]);
              }
            }
          }

              if (batch.length > 0) {
                if (!INCLUDE_TESTCASES) {
                  const bulk = buildBulkInsert(
                    'problems',
                    ['problem_code', 'title', 'statement', 'difficulty', 'topics', 'description', 'sample_input', 'sample_output'],
                    problemRows,
                    'RETURNING id'
                  );
                  await client.query(bulk.text, bulk.values);
                } else {
                // Fallback: insert problems one-by-one with RETURNING id to avoid bulk insert issues
                // Use SAVEPOINTs around each problem insert so a single failure doesn't abort the whole transaction.
                for (const p of batch) {
                  const problemCode = p.id != null ? String(p.id) : null;
                  const topicsText = (data.topics && data.topics.find(t => t.id === p.topic_id)) ? data.topics.find(t => t.id === p.topic_id).name : (Array.isArray(p.topic) && p.topic.length>0? p.topic[0]: null);
                  const sampleTestcase = Array.isArray(p.testcases) && p.testcases.length > 0 ? p.testcases[0] : null;
                  const insertProblemSql = `INSERT INTO problems (problem_code, title, statement, difficulty, topics, description, sample_input, sample_output) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`;
                  const insertProblemVals = [
                    problemCode,
                    p.title,
                    p.statement || null,
                    p.difficulty || null,
                    topicsText,
                    p.statement || p.description || null,
                    sampleTestcase ? sampleTestcase.input : null,
                    sampleTestcase ? sampleTestcase.output : null,
                  ];

                  let pid = null;
                  try {
                    await client.query('SAVEPOINT sp');
                    const res = await client.query(insertProblemSql, insertProblemVals);
                    await client.query('RELEASE SAVEPOINT sp');
                    pid = res.rows[0] && res.rows[0].id ? res.rows[0].id : null;
                  } catch (e) {
                    // Roll back to savepoint so the main transaction remains usable
                    await client.query('ROLLBACK TO SAVEPOINT sp').catch(() => {});
                    // If it's a unique-violation, try to look up the existing id and continue
                    if (e && e.code === '23505') {
                      try {
                        const sel = await client.query('SELECT id FROM problems WHERE problem_code = $1', [problemCode]);
                        pid = sel.rows[0] ? sel.rows[0].id : null;
                        if (!pid) {
                          console.error('Unique violation but could not find existing id for code', problemCode);
                          throw e;
                        }
                      } catch (se) {
                        console.error('Failed to resolve existing problem id after unique violation for code', problemCode, 'error:', se && se.stack ? se.stack : se);
                        throw se;
                      }
                    } else {
                      console.error('Insert problem failed for code', problemCode, 'error:', e && e.stack ? e.stack : e);
                      throw e;
                    }
                  }

                  if (INCLUDE_TESTCASES && pid && Array.isArray(p.testcases)) {
                    for (let j = 0; j < p.testcases.length; j++) {
                      const tc = p.testcases[j];
                      const tcSql = `INSERT INTO test_cases (problem_id, input, expected_output, explanation, is_sample, order_index) VALUES ($1,$2,$3,$4,$5,$6)`;
                      const tcVals = [pid, tc.input, tc.output, tc.explanation || null, j === 0, j];
                      try {
                        await client.query(tcSql, tcVals);
                      } catch (e) {
                        console.error('Insert testcase failed for problem id', pid, 'error:', e && e.stack ? e.stack : e);
                        throw e;
                      }
                    }
                  }
                }
                }
              }

          await client.query('COMMIT');
          nextIndex += batch.length;
          writeProgress(nextIndex);

          const batchNumber = Math.floor(nextIndex / BATCH_SIZE);
          if (batchNumber % 10 === 1 || nextIndex >= data.problems.length) {
            console.log(`Processed batch ${batchNumber} / ${totalBatches}`);
          }
        } catch (batchErr) {
          await client.query('ROLLBACK').catch(() => {});
          console.error('Batch error:', batchErr && batchErr.stack ? batchErr.stack : batchErr);
          throw batchErr;
        }
      }

      clearProgress();
      console.log('Seeding complete.');
      return;
    } catch (err) {
      console.error(`Seeding paused at index ${nextIndex}:`, err.message);
      try {
        await client.end();
      } catch (endErr) {
        console.error('Error while closing database client:', endErr.message);
      }

      if (nextIndex >= data.problems.length) {
        break;
      }

      console.log('Reconnecting and resuming from the last checkpoint...');
    }
  }
}

run();
