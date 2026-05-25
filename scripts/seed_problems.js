const fs = require('fs');
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Please set DATABASE_URL environment variable (Postgres connection string)');
  process.exit(1);
}

async function run() {
  const seedFile = process.env.SEED_FILE || (fs.existsSync('data/problems_5000.json') ? 'data/problems_5000.json' : 'data/problems_14_topics.json');
  console.log('Using seed file:', seedFile);
  const raw = fs.readFileSync(seedFile, 'utf8');
  const data = JSON.parse(raw);
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    // Increase statement timeout for the session
    await client.query('SET statement_timeout = 0');
    
    const BATCH_SIZE = 10;
    for (let i = 0; i < data.problems.length; i += BATCH_SIZE) {
        const batch = data.problems.slice(i, i + BATCH_SIZE);
        await client.query('BEGIN');
        try {
            for (const p of batch) {
                const topic = data.topics.find(t => t.id === p.topic_id);
                const topicsText = topic ? topic.name : null;

                await client.query(
                    `INSERT INTO problems(id, title, statement, difficulty, topics, description, sample_input, sample_output) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, statement=EXCLUDED.statement, difficulty=EXCLUDED.difficulty, topics=EXCLUDED.topics, description=EXCLUDED.description, sample_input=EXCLUDED.sample_input, sample_output=EXCLUDED.sample_output`,
                    [p.id, p.title, p.statement || null, p.difficulty || null, topicsText, p.statement || p.description || null, (p.testcases && p.testcases[0]) ? p.testcases[0].input : null, (p.testcases && p.testcases[0]) ? p.testcases[0].output : null]
                );

                if (Array.isArray(p.testcases)) {
                    for (let j = 0; j < p.testcases.length; j++) {
                        const tc = p.testcases[j];
                        const tcId = Number(String(p.id) + String(j + 1));
                        await client.query(
                            `INSERT INTO test_cases(id, problem_id, input, expected_output, explanation, is_sample, order_index) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO UPDATE SET input=EXCLUDED.input, expected_output=EXCLUDED.expected_output, explanation=EXCLUDED.explanation, is_sample=EXCLUDED.is_sample, order_index=EXCLUDED.order_index`,
                            [tcId, p.id, tc.input, tc.output, tc.explanation || null, j === 0, j]
                        );
                    }
                }
            }
            await client.query('COMMIT');
            if ((i / BATCH_SIZE) % 10 === 0) {
                console.log(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(data.problems.length / BATCH_SIZE)}`);
            }
        } catch (batchErr) {
            await client.query('ROLLBACK');
            console.error(`Failed batch starting at index ${i}:`, batchErr);
            throw batchErr;
        }
    }
    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await client.end();
  }
}

run();
