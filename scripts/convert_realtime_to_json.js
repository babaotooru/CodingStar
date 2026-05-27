const fs = require('fs');
const csv = require('csvtojson');

async function main() {
  const problemsCsv = 'realtime_problems.csv';
  const testcasesCsv = 'realtime_testcases.csv';

  const problems = await csv({ trim: true }).fromFile(problemsCsv);
  const testcases = await csv({ trim: true }).fromFile(testcasesCsv);

  const topicMap = {};
  const problemsOut = [];

  for (const p of problems) {
    let id = p.id;
    let topics = [];
    try {
      topics = JSON.parse(p.topic);
    } catch (e) {
      if (p.topic && p.topic.trim()) topics = [p.topic];
    }

    topics.forEach((t, idx) => {
      if (!topicMap[t]) topicMap[t] = Object.keys(topicMap).length + 1;
    });

    problemsOut.push({
      id: id,
      title: p.title,
      difficulty: p.difficulty,
      level: p.level,
      topic: topics,
      platform: p.platform || null,
      statement: p.statement || null,
      description: p.description || null,
      input_format: p.input_format || null,
      output_format: p.output_format || null,
      constraints: p.constraints || null,
      sample_input: p.sample_input || null,
      sample_output: p.sample_output || null,
      sample_explanation: p.sample_explanation || null,
      time_limit_ms: Number(p.time_limit_ms) || 2000,
      memory_limit_mb: Number(p.memory_limit_mb) || 256,
      submissions: Number(p.submissions) || 0,
      acceptance_rate: p.acceptance_rate ? Number(p.acceptance_rate) : null,
      updated_at: p.updated_at || null,
      kind: p.kind || null,
      family: p.family || null
    });
  }

  const topicsOut = Object.keys(topicMap).map(name => ({ id: topicMap[name], name }));

  // attach testcases
  const tcByProblem = {};
  for (const tc of testcases) {
    const pid = tc.problem_id;
    if (!tcByProblem[pid]) tcByProblem[pid] = [];
    tcByProblem[pid].push({
      id: tc.id,
      input: tc.input_data,
      output: tc.expected_output,
      is_sample: tc.is_sample === 'True' || tc.is_sample === 'true' || tc.is_sample === '1',
      explanation: tc.explanation || null
    });
  }

  for (const p of problemsOut) {
    if (tcByProblem[p.id]) p.testcases = tcByProblem[p.id];
  }

  const out = {
    version: '2.1',
    generated_at: new Date().toISOString(),
    total_problems: problemsOut.length,
    topics: topicsOut,
    problems: problemsOut
  };

  fs.writeFileSync('data/problems_5000.json', JSON.stringify(out, null, 2));
  console.log('Wrote data/problems_5000.json with', problemsOut.length, 'problems');
}

main().catch(e => { console.error(e); process.exit(1); });
