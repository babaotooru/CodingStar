const fs = require('fs');
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Please set DATABASE_URL environment variable (Postgres connection string)');
  process.exit(1);
}

const BATCH_SIZE = Number.parseInt(process.env.SEED_BATCH_SIZE || '10', 10);
const PROGRESS_FILE = process.env.SEED_PROGRESS_FILE || '.seed-problems.progress.json';

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

      while (nextIndex < data.problems.length) {
        const batch = data.problems.slice(nextIndex, nextIndex + BATCH_SIZE);
        await client.query('BEGIN');
        try {
          const problemRows = [];
          const testCaseRows = [];

          for (const p of batch) {
            const topic = data.topics.find(t => t.id === p.topic_id);
            const topicsText = topic ? topic.name : null;
            const sampleTestcase = Array.isArray(p.testcases) && p.testcases.length > 0 ? p.testcases[0] : null;

            problemRows.push([
              p.id,
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
                const tcId = Number(String(p.id) + String(j + 1));
                testCaseRows.push([
                  tcId,
                  p.id,
                  tc.input,
                  tc.output,
                  tc.explanation || null,
                  j === 0,
                  j,
                ]);
              }
            }
          }

          if (problemRows.length > 0) {
            const problemQuery = buildBulkInsert(
              'problems',
              ['id', 'title', 'statement', 'difficulty', 'topics', 'description', 'sample_input', 'sample_output'],
              problemRows,
              'ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, statement=EXCLUDED.statement, difficulty=EXCLUDED.difficulty, topics=EXCLUDED.topics, description=EXCLUDED.description, sample_input=EXCLUDED.sample_input, sample_output=EXCLUDED.sample_output'
            );
            await client.query(problemQuery.text, problemQuery.values);
          }

          if (testCaseRows.length > 0) {
            const testCaseQuery = buildBulkInsert(
              'test_cases',
              ['id', 'problem_id', 'input', 'expected_output', 'explanation', 'is_sample', 'order_index'],
              testCaseRows,
              'ON CONFLICT (id) DO UPDATE SET input=EXCLUDED.input, expected_output=EXCLUDED.expected_output, explanation=EXCLUDED.explanation, is_sample=EXCLUDED.is_sample, order_index=EXCLUDED.order_index'
            );
            await client.query(testCaseQuery.text, testCaseQuery.values);
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
