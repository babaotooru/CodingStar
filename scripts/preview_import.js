const fs = require('fs');
const path = require('path');
const csvtojson = require('csvtojson');
const argv = require('minimist')(process.argv.slice(2));

const PROBLEMS_FILE = argv['problems-file'] || argv['problems'] || 'realtime_problems.csv';
const TESTCASES_FILE = argv['testcases-file'] || argv['testcases'] || 'realtime_testcases.csv';
const OUT_FILE = argv['out-file'] || argv['out'] || `data/preview_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
const LIMIT = Number(argv['limit'] || 20);

async function readCsv(file) {
  if (!fs.existsSync(file)) throw new Error('File not found: ' + file);
  return csvtojson({ trim: true, ignoreEmpty: true }).fromFile(file);
}

function mapProblem(p) {
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
  const total_submissions = p.submissions ? Number(p.submissions) : 0;
  const acceptance_rate = p.acceptance_rate ? Number(p.acceptance_rate) : 0;
  const accepted_submissions = Math.round((acceptance_rate / 100) * total_submissions);
  let category = 'General';
  const lowerTopic = (topicsVal || '').toLowerCase();
  const lowerKind = (p.kind || '').toLowerCase();
  const lowerPlatform = (p.platform || '').toLowerCase();
  if (lowerTopic.includes('sql') || lowerKind.includes('sql') || lowerPlatform.includes('sql')) {
    const label = topicsVal ? topicsVal.split(',')[0] : 'Generic';
    category = `SQL - ${label}`;
  } else if (topicsVal) {
    category = `${topicsVal.split(',')[0]}`;
  }

  return {
    problem_code: p.id || null,
    title: p.title || null,
    description: p.description || p.statement || null,
    difficulty: (p.difficulty || '').toUpperCase() || null,
    category,
    topics: topicsVal,
    platform: p.platform || null,
    timeLimitMs: p.time_limit_ms ? Number(p.time_limit_ms) : 2000,
    memoryLimitMb: p.memory_limit_mb ? Number(p.memory_limit_mb) : 256,
    totalSubmissions: total_submissions,
    acceptedSubmissions: accepted_submissions,
    acceptanceRate: acceptance_rate,
    sampleInput: p.sample_input || null,
    sampleOutput: p.sample_output || null
  };
}

async function run() {
  const problemsCsv = path.resolve(PROBLEMS_FILE);
  const testcasesCsv = path.resolve(TESTCASES_FILE);
  const problems = await readCsv(problemsCsv);
  const testcases = await readCsv(testcasesCsv);

  const byCode = new Map();
  problems.forEach(p => byCode.set(p.id, p));

  const preview = [];
  for (let i = 0; i < Math.min(LIMIT, problems.length); i++) {
    const p = problems[i];
    const mapped = mapProblem(p);
    const pcode = p.id;
    mapped.testCases = testcases.filter(tc => tc.problem_id === pcode).map(tc => ({
      input: tc.input_data || tc.input || null,
      expectedOutput: tc.expected_output || null,
      isSample: String(tc.is_sample).toLowerCase() === 'true' || tc.is_sample === '1'
    }));
    preview.push(mapped);
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(preview, null, 2));
  console.log('Preview written to', OUT_FILE);
}

run().catch(e => { console.error(e); process.exit(1); });
