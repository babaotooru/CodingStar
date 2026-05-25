const fs = require('fs');
const path = require('path');

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

function writeCsv(filePath, headers, rows) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
}

function loadJsonProblems() {
  const jsonPath = path.join(__dirname, '..', 'realtime_dataset.json');
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(raw);
  return data.problems || [];
}

function normalizeProblems() {
  const problems = loadJsonProblems();
  const headers = [
    'id', 'title', 'difficulty', 'level', 'topic', 'platform', 'statement', 'description',
    'input_format', 'output_format', 'constraints', 'sample_input', 'sample_output',
    'sample_explanation', 'time_limit_ms', 'memory_limit_mb', 'submissions', 'acceptance_rate',
    'updated_at', 'kind', 'family'
  ];

  const rows = problems.map((p) => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    level: p.level,
    topic: JSON.stringify(p.topic || []),
    platform: p.platform,
    statement: p.statement,
    description: p.description,
    input_format: p.input_format,
    output_format: p.output_format,
    constraints: p.constraints,
    sample_input: p.sample_input,
    sample_output: p.sample_output,
    sample_explanation: p.sample_explanation,
    time_limit_ms: p.time_limit_ms,
    memory_limit_mb: p.memory_limit_mb,
    submissions: p.submissions,
    acceptance_rate: p.acceptance_rate === null ? '' : p.acceptance_rate,
    updated_at: p.updated_at,
    kind: p.kind,
    family: p.family,
  }));

  writeCsv(path.join(__dirname, '..', 'realtime_problems.csv'), headers, rows);
}

function parseTestcaseChunks(raw) {
  const cleaned = raw.replace(/\r\n/g, '\n').trim();
  const startRegex = /^P\d+_TC\d+,/m;
  const starts = [];
  let match;
  const regex = /^P\d+_TC\d+,/gm;
  while ((match = regex.exec(cleaned)) !== null) {
    starts.push(match.index);
  }
  const chunks = [];
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const end = i + 1 < starts.length ? starts[i + 1] : cleaned.length;
    chunks.push(cleaned.slice(start, end).trim());
  }
  return chunks;
}

function parseTestcaseRow(chunk) {
  const firstComma = chunk.indexOf(',');
  const secondComma = chunk.indexOf(',', firstComma + 1);
  const id = chunk.slice(0, firstComma).trim();
  const problem_id = chunk.slice(firstComma + 1, secondComma).trim();
  const tail = chunk.slice(secondComma + 1).trim();

  const sampleMatch = tail.match(/^(.*),(True|False|TRUE|FALSE),(.*)$/s);
  if (!sampleMatch) {
    throw new Error(`Unable to parse testcase row: ${id}`);
  }

  const beforeFlag = sampleMatch[1];
  const is_sample = sampleMatch[2];
  const explanation = sampleMatch[3];

  const expectedSplit = beforeFlag.lastIndexOf(',');
  if (expectedSplit === -1) {
    throw new Error(`Missing expected_output separator for testcase row: ${id}`);
  }

  const input_data = beforeFlag.slice(0, expectedSplit).trim();
  const expected_output = beforeFlag.slice(expectedSplit + 1).trim();

  return { id, problem_id, input_data, expected_output, is_sample, explanation };
}

function normalizeTestcases() {
  const testcasePath = path.join(__dirname, '..', 'realtime_testcases.csv');
  const raw = fs.readFileSync(testcasePath, 'utf8');
  const chunks = parseTestcaseChunks(raw);
  const rows = [];

  for (const chunk of chunks) {
    try {
      rows.push(parseTestcaseRow(chunk));
    } catch (err) {
      console.warn('Skipping malformed testcase row:', err.message);
    }
  }

  const headers = ['id', 'problem_id', 'input_data', 'expected_output', 'is_sample', 'explanation'];
  writeCsv(testcasePath, headers, rows);
  return rows.length;
}

function main() {
  normalizeProblems();
  const count = normalizeTestcases();
  console.log(`Normalized realtime_problems.csv and realtime_testcases.csv (${count} testcases kept).`);
}

main();
