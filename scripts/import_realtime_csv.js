const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
// Use csvtojson for more tolerant CSV parsing
const csvtojson = require('csvtojson');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Please set DATABASE_URL environment variable (postgres connection string)');
  process.exit(1);
}

async function backupTables(client) {
  console.log('Backing up existing problems and test_cases to data/backup...');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.mkdirSync('data/backup', { recursive: true });
  const resP = await client.query('SELECT * FROM problems');
  const resT = await client.query('SELECT * FROM test_cases');
  fs.writeFileSync(`data/backup/problems_backup_${timestamp}.json`, JSON.stringify(resP.rows, null, 2));
  fs.writeFileSync(`data/backup/test_cases_backup_${timestamp}.json`, JSON.stringify(resT.rows, null, 2));
}

function readCsvSync(filePath) {
  return csvtojson({ trim: true, ignoreEmpty: true }).fromFile(filePath);
}

async function run() {
  // CLI flags
  const argv = require('minimist')(process.argv.slice(2));
  const DRY_RUN = argv['dry-run'] || argv['d'] || false;
  const PROBLEMS_FILE = argv['problems-file'] || argv['problems'] || 'realtime_problems.csv';
  const TESTCASES_FILE = argv['testcases-file'] || argv['testcases'] || 'realtime_testcases.csv';
  const BACKUP_DIR = argv['backup-dir'] || argv['backup'] || 'data/backup';

  if (!DRY_RUN && !DATABASE_URL) {
    console.error('Please set DATABASE_URL environment variable (postgres connection string) when not using --dry-run');
    process.exit(1);
  }

  const problemsCsv = path.resolve(PROBLEMS_FILE);
  const testcasesCsv = path.resolve(TESTCASES_FILE);

  if (!fs.existsSync(problemsCsv) || !fs.existsSync(testcasesCsv)) {
    console.error(`CSV files not found: ${problemsCsv} or ${testcasesCsv}`);
    process.exit(1);
  }

  console.log('Parsing problems CSV...');
  const problems = await readCsvSync(problemsCsv);
  console.log(`Found ${problems.length} problem rows`);

  if (DRY_RUN) {
    console.log('Dry-run mode: no database changes will be performed.');
    console.log(`Problems file: ${problemsCsv}`);
    console.log(`Testcases file: ${testcasesCsv}`);
    console.log('Sample problem row:', problems[0] || {});
  }

  let client;
  if (!DRY_RUN) {
    client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
  }

  try {
    if (!DRY_RUN) {
      // create backup dir if provided
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      await backupTables(client);
      await client.query('BEGIN');
      await client.query('TRUNCATE TABLE test_cases, submissions, problem_notes, contest_problems, contest_participants, problems RESTART IDENTITY CASCADE');
      await client.query('COMMIT');
    }

    const problemIdByCode = new Map();
    const problemBatchSize = 200;

    let insertedProblems = 0;
    for (let i = 0; i < problems.length; i += problemBatchSize) {
      const batch = problems.slice(i, i + problemBatchSize);
      const values = [];
      const placeholders = [];

      batch.forEach((p, index) => {
        // Build richer mapping from CSV columns to DB columns
        const offset = index * 22;
        const problem_code = p.id || null;
        const title = p.title || null;
        const statement = p.statement || p.description || null;
        const description = p.description || statement || null;
        const difficulty = (p.difficulty || '').toUpperCase() || null;
        const level = p.level || null;

        // topics in CSV might be JSON array string like: ["Programming Basics"]
        let topicsVal = null;
        try {
          if (p.topic) {
            const parsed = JSON.parse(p.topic);
            if (Array.isArray(parsed)) topicsVal = parsed.join(',');
            else topicsVal = String(parsed);
          }
        } catch (e) {
          topicsVal = p.topic || null;
        }

        const platform = p.platform || null;
        const input_format = p.input_format || null;
        const output_format = p.output_format || null;
        const constraints = p.constraints || null;
        const sample_input = p.sample_input || null;
        const sample_output = p.sample_output || null;
        const sample_explanation = p.sample_explanation || null;
        const time_limit_ms = p.time_limit_ms ? Number(p.time_limit_ms) : null;
        const memory_limit_mb = p.memory_limit_mb ? Number(p.memory_limit_mb) : null;

        const total_submissions = p.submissions ? Number(p.submissions) : 0;
        const acceptance_rate = p.acceptance_rate ? Number(p.acceptance_rate) : 0;
        const accepted_submissions = Math.round((acceptance_rate / 100) * total_submissions);

        // category mapping: if topic mentions SQL or kind/family/platform contains sql, mark as SQL topic
        let category = 'General';
        const lowerTopic = (topicsVal || '').toLowerCase();
        const lowerKind = (p.kind || '').toLowerCase();
        const lowerPlatform = (platform || '').toLowerCase();
        if (lowerTopic.includes('sql') || lowerKind.includes('sql') || lowerPlatform.includes('sql')) {
          const label = topicsVal ? topicsVal.split(',')[0] : 'Generic';
          category = `SQL - ${label}`;
        } else if (topicsVal) {
          category = `${topicsVal.split(',')[0]}`;
        }

        const kind = p.kind || null;
        const family = p.family || null;

        values.push(problem_code, title, statement, description, difficulty, level, topicsVal, platform, input_format, output_format, constraints, sample_input, sample_output, sample_explanation, time_limit_ms, memory_limit_mb, total_submissions, accepted_submissions, acceptance_rate, category, kind, family);
        placeholders.push(`($${offset + 1},$${offset + 2},$${offset + 3},$${offset + 4},$${offset + 5},$${offset + 6},$${offset + 7},$${offset + 8},$${offset + 9},$${offset + 10},$${offset + 11},$${offset + 12},$${offset + 13},$${offset + 14},$${offset + 15},$${offset + 16},$${offset + 17},$${offset + 18},$${offset + 19},$${offset + 20},$${offset + 21},$${offset + 22})`);
      });

      if (DRY_RUN) {
        // report what would be inserted
        console.log(`Dry-run: would insert ${batch.length} problems (batch starting ${i})`);
        insertedProblems += batch.length;
      } else {
        const insertRes = await client.query(
          `INSERT INTO problems(
            problem_code, title, statement, description, difficulty, level, topics, platform, input_format, output_format, constraints, sample_input, sample_output, sample_explanation, time_limit_ms, memory_limit_mb, total_submissions, accepted_submissions, acceptance_rate, category, kind, family
          )
           VALUES ${placeholders.join(', ')}
           RETURNING id, problem_code`,
          values
        );

        for (const row of insertRes.rows) {
          problemIdByCode.set(row.problem_code, row.id);
          insertedProblems++;
        }
      }
    }

    // Now insert testcases
    console.log('Parsing testcases CSV...');
    const testcases = await readCsvSync(testcasesCsv);
    console.log(`Found ${testcases.length} testcase rows`);

    const testcaseBatchSize = 500;
    let insertedTestcases = 0;
    let skippedTestcases = 0;
    for (let i = 0; i < testcases.length; i += testcaseBatchSize) {
      const batch = testcases.slice(i, i + testcaseBatchSize);
      const values = [];
      const placeholders = [];

      batch.forEach((tc, index) => {
        const problem_code = tc.problem_id;
        const problemId = problemIdByCode.get(problem_code);
        if (!problemId) {
          skippedTestcases++;
          return;
        }

        const input = tc.input_data || tc.input || null;
        const expected_output = tc.expected_output || null;
        const explanation = tc.explanation || null;
        const is_sample = (String(tc.is_sample).toLowerCase() === 'true' || tc.is_sample === 'True' || tc.is_sample === '1');
        const order_index = 0;

        const offset = values.length;
        values.push(problemId, input, expected_output, explanation, is_sample, order_index);
        placeholders.push(`($${offset + 1},$${offset + 2},$${offset + 3},$${offset + 4},$${offset + 5},$${offset + 6})`);
      });

      if (placeholders.length > 0) {
        if (DRY_RUN) {
          console.log(`Dry-run: would insert ${placeholders.length} testcases (batch starting ${i})`);
          insertedTestcases += placeholders.length;
        } else {
          const res = await client.query(
            `INSERT INTO test_cases(problem_id, input, expected_output, explanation, is_sample, order_index)
             VALUES ${placeholders.join(', ')}`,
            values
          );
          insertedTestcases += placeholders.length;
        }
      }
    }
    const summary = {
      timestamp: new Date().toISOString(),
      dryRun: !!DRY_RUN,
      problemsParsed: problems.length,
      testcasesParsed: testcases.length,
      problemsInserted: insertedProblems,
      testcasesInserted: insertedTestcases,
      testcasesSkipped: skippedTestcases
    };

    // write summary to backup dir
    try {
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const summaryPath = path.join(BACKUP_DIR, `import_summary_${ts}.json`);
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      console.log('Import complete. Summary written to', summaryPath);
    } catch (e) {
      console.warn('Failed to write summary file:', e.message);
    }
  } finally {
    if (client) await client.end();
  }
}

run().catch(e => { console.error(e); process.exit(1); });
