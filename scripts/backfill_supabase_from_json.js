const fs = require('fs');
const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const DATASET_PATH = 'data/problems_5000.json';

function toDifficulty(value) {
  const normalized = String(value || 'Easy').trim().toUpperCase();
  if (normalized === 'MEDIUM') return 'MEDIUM';
  if (normalized === 'HARD') return 'HARD';
  return 'EASY';
}

function normalizeCategory(topics, platform) {
  const firstTopic = Array.isArray(topics) && topics.length > 0 ? String(topics[0]) : 'General';
  const label = firstTopic.trim() || 'General';
  const isSql = /sql/i.test(label) || /sql/i.test(platform || '');
  return isSql ? `SQL - ${label}` : label;
}

function normalizeTopics(topics) {
  if (Array.isArray(topics)) {
    return topics.join(',');
  }
  if (typeof topics === 'string') {
    return topics;
  }
  return null;
}

async function main() {
  const raw = fs.readFileSync(DATASET_PATH, 'utf8');
  const data = JSON.parse(raw);
  const problems = Array.isArray(data.problems) ? data.problems : [];

  if (problems.length === 0) {
    throw new Error(`No problems found in ${DATASET_PATH}`);
  }

  // Allow overriding via DATABASE_URL env var. Accept bracketed passwords like :[pwd]@
  const rawConn = process.env.DATABASE_URL || null;
  let client;
  if (rawConn) {
    // sanitize bracketed password: :[password]@ -> :encodeURIComponent(password)@
    const conn = rawConn.replace(/:\[([^\]]+)\]@/, (m, p) => ':' + encodeURIComponent(p) + '@');
    const masked = conn.replace(/:([^:@]+)@/, ':*****@');
    console.log('Using DATABASE_URL (masked):', masked);
    client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 });
  } else {
    console.log('Using default Supabase connection parameters (from script).');
    client = new Client({
      host: 'db.kefwjrfqnzhbvopljwau.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: 'CodingJudge!@',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });
  }
  await client.connect();
  console.log('Postgres client connected. disabling statement timeout...');
  // Try to disable statement timeout for this session (may be ignored by hosted DB)
  try {
    await client.query("SET statement_timeout = 0");
  } catch (e) {
    console.warn('Could not set statement_timeout, continuing with defaults:', e.message);
  }

  try {
    const existingRows = await client.query('SELECT id, problem_code FROM problems');
    const existingByCode = new Map(existingRows.rows.map((row) => [String(row.problem_code), row.id]));

    let updated = 0;
    let inserted = 0;
    let testcaseDeleted = 0;
    let testcaseInserted = 0;
    let failed = 0;

    const batchSize = 100;
    for (let idx = 0; idx < problems.length; idx += 1) {
      const problem = problems[idx];
      if (idx > 0 && idx % 100 === 0) {
        console.log(`Processed ${idx}/${problems.length} problems...`);
      }
      const problemCode = String(problem.id || problem.problem_code || '').trim();
      if (!problemCode) {
        continue;
      }

      // Start a new batch transaction when needed
      if (idx % batchSize === 0) {
        await client.query('BEGIN');
      }

      const title = problem.title || 'Untitled Problem';
      const statement = problem.statement || problem.description || '';
      const description = problem.description || statement;
      const difficulty = toDifficulty(problem.difficulty);
      const level = problem.level || null;
      const platform = problem.platform || null;
      const topics = normalizeTopics(problem.topic || problem.topics || null);
      const category = normalizeCategory(problem.topic || (topics ? topics.split(',') : null), platform);
      const inputFormat = problem.input_format || null;
      const outputFormat = problem.output_format || null;
      const constraints = problem.constraints || null;
      const sampleInput = problem.sample_input || null;
      const sampleOutput = problem.sample_output || null;
      const sampleExplanation = problem.sample_explanation || null;
      const timeLimitMs = Number(problem.time_limit_ms || 2000);
      const memoryLimitMb = Number(problem.memory_limit_mb || 256);
      const totalSubmissions = Number(problem.submissions || 0);
      const acceptanceRate = problem.acceptance_rate === null || problem.acceptance_rate === undefined
        ? null
        : Number(problem.acceptance_rate);
      const acceptedSubmissions = acceptanceRate === null
        ? 0
        : Math.round((acceptanceRate / 100) * totalSubmissions);
      const kind = problem.kind || null;
      const family = problem.family || null;
      const companies = problem.companies || null;
      const intuition = problem.intuition || null;
      const approach = problem.approach || null;
      const algorithm = problem.algorithm || null;
      const syntaxNotes = problem.syntax_notes || null;
      const hints = problem.hints || null;
      const editorial = problem.editorial || null;

      const currentId = existingByCode.get(problemCode);
      let problemId = currentId;

      try {
        if (currentId) {
          await client.query(
            `UPDATE problems
             SET title = $1,
                 statement = $2,
                 description = $3,
                 difficulty = $4,
                 level = $5,
                 topics = $6,
                 platform = $7,
                 input_format = $8,
                 output_format = $9,
                 constraints = $10,
                 sample_input = $11,
                 sample_output = $12,
                 sample_explanation = $13,
                 time_limit_ms = $14,
                 memory_limit_mb = $15,
                 total_submissions = $16,
                 accepted_submissions = $17,
                 acceptance_rate = $18,
                 category = $19,
                 kind = $20,
                 family = $21,
                 companies = $22,
                 intuition = $23,
                 approach = $24,
                 algorithm = $25,
                 syntax_notes = $26,
                 hints = $27,
                 editorial = $28
             WHERE id = $29`,
            [
              title, statement, description, difficulty, level, topics, platform,
              inputFormat, outputFormat, constraints, sampleInput, sampleOutput,
              sampleExplanation, timeLimitMs, memoryLimitMb, totalSubmissions,
              acceptedSubmissions, acceptanceRate, category, kind, family, companies,
              intuition, approach, algorithm, syntaxNotes, hints, editorial, currentId,
            ]
          );
          updated += 1;
        } else {
          const insertResult = await client.query(
            `INSERT INTO problems (
               problem_code, title, statement, description, difficulty, level, topics, platform,
               input_format, output_format, constraints, sample_input, sample_output,
               sample_explanation, time_limit_ms, memory_limit_mb, total_submissions,
               accepted_submissions, acceptance_rate, category, kind, family, companies,
               intuition, approach, algorithm, syntax_notes, hints, editorial
             ) VALUES (
               $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29
             ) RETURNING id`,
            [
              problemCode, title, statement, description, difficulty, level, topics, platform,
              inputFormat, outputFormat, constraints, sampleInput, sampleOutput,
              sampleExplanation, timeLimitMs, memoryLimitMb, totalSubmissions,
              acceptedSubmissions, acceptanceRate, category, kind, family, companies,
              intuition, approach, algorithm, syntaxNotes, hints, editorial,
            ]
          );
          problemId = insertResult.rows[0].id;
          existingByCode.set(problemCode, problemId);
          inserted += 1;
        }

        await client.query('DELETE FROM test_cases WHERE problem_id = $1', [problemId]);
        testcaseDeleted += 1;

        if (Array.isArray(problem.testcases) && problem.testcases.length > 0) {
          for (let i = 0; i < problem.testcases.length; i += 1) {
            const testcase = problem.testcases[i];
            await client.query(
              `INSERT INTO test_cases (problem_id, input, expected_output, explanation, is_sample, order_index)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                problemId,
                testcase.input ?? null,
                testcase.output ?? null,
                testcase.explanation ?? null,
                Boolean(testcase.is_sample),
                i,
              ]
            );
            testcaseInserted += 1;
          }
        }
      } catch (err) {
        console.error(`Failed updating problem ${problemCode}:`, err.message);
        failed += 1;
      }

      // Commit batch when reached batch boundary
      if ((idx % batchSize) === batchSize - 1) {
        await client.query('COMMIT');
      }
    }

    // Commit any remaining open batch
    const remainder = problems.length % batchSize;
    if (remainder !== 0) {
      await client.query('COMMIT');
    }
    console.log(JSON.stringify({ updated, inserted, testcaseDeleted, testcaseInserted, failed }, null, 2));
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
