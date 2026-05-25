const fs = require('fs');

// Distribution provided by user
const topicDistribution = [
  { name: 'Programming Basics', count: 250 },
  { name: 'Arrays', count: 500 },
  { name: 'Strings', count: 350 },
  { name: 'Sorting & Searching', count: 350 },
  { name: 'Linked List', count: 250 },
  { name: 'Stack & Queue', count: 300 },
  { name: 'Hashing', count: 250 },
  { name: 'Trees', count: 500 },
  { name: 'Heap / Priority Queue', count: 250 },
  { name: 'Recursion & Backtracking', count: 300 },
  { name: 'Greedy Algorithms', count: 250 },
  { name: 'Dynamic Programming', count: 700 },
  { name: 'Graphs', count: 600 },
  { name: 'Tries', count: 100 },
  { name: 'Advanced Topics', count: 350 },
  { name: 'SQL Problems', count: 200 }
];

// Global difficulty split
const globalDifficulty = { EASY: 2000, MEDIUM: 2000, HARD: 1000 };
const totalProblems = topicDistribution.reduce((s, t) => s + t.count, 0);

// Per-topic overrides (user provided recommendations)
const perTopicDifficulty = {
  Arrays: { EASY: 200, MEDIUM: 220, HARD: 80 },
  Strings: { EASY: 120, MEDIUM: 170, HARD: 60 },
  'Dynamic Programming': { EASY: 120, MEDIUM: 350, HARD: 230 },
  Graphs: { EASY: 150, MEDIUM: 300, HARD: 150 },
  Trees: { EASY: 180, MEDIUM: 240, HARD: 80 },
  'Advanced Topics': { EASY: 20, MEDIUM: 150, HARD: 180 }
};

function allocateDifficulties(topicName, count) {
  if (perTopicDifficulty[topicName]) {
    const d = perTopicDifficulty[topicName];
    const sum = (d.EASY || 0) + (d.MEDIUM || 0) + (d.HARD || 0);
    if (sum === count) return { EASY: d.EASY, MEDIUM: d.MEDIUM, HARD: d.HARD };
    // scale proportionally
    const scale = count / sum;
    return {
      EASY: Math.round((d.EASY || 0) * scale),
      MEDIUM: Math.round((d.MEDIUM || 0) * scale),
      HARD: Math.round((d.HARD || 0) * scale)
    };
  }
  // default proportional split: Easy 40%, Medium 40%, Hard 20%
  return {
    EASY: Math.round(count * 0.4),
    MEDIUM: Math.round(count * 0.4),
    HARD: Math.round(count * 0.2)
  };
}

const problems = [];
const topics = topicDistribution.map((t, i) => ({ id: i + 1, name: t.name }));

let nextId = 100000;

for (const t of topicDistribution) {
  const counts = allocateDifficulties(t.name, t.count);
  // adjust rounding errors to match t.count
  let assigned = counts.EASY + counts.MEDIUM + counts.HARD;
  while (assigned !== t.count) {
    if (assigned < t.count) {
      counts.EASY += 1;
    } else {
      if (counts.EASY > 0) counts.EASY -= 1;
      else if (counts.MEDIUM > 0) counts.MEDIUM -= 1;
      else counts.HARD -= 1;
    }
    assigned = counts.EASY + counts.MEDIUM + counts.HARD;
  }

  function pushMany(n, difficulty, startIdx) {
    for (let i = 0; i < n; i++) {
      const id = nextId++;
      const title = `${t.name} Problem ${startIdx + i + 1}`;
      const stmt = `Solve: ${title} — given input produce correct output.`;
      const description = `${title} (auto-generated).`;
      const sampleInput = `sample input ${id}`;
      const sampleOutput = `sample output ${id}`;
      problems.push({
        id,
        problem_code: `P${id}`,
        title,
        statement: stmt,
        description,
        difficulty,
        topics: t.name,
        input_format: 'stdin',
        output_format: 'stdout',
        sample_input: sampleInput,
        sample_output: sampleOutput,
        testcases: [
          { input: sampleInput, output: sampleOutput, explanation: 'sample', is_sample: true },
          { input: `${sampleInput} alt`, output: `${sampleOutput} alt`, explanation: 'alt', is_sample: false }
        ]
      });
    }
  }

  let idx = 0;
  if (counts.EASY > 0) { pushMany(counts.EASY, 'Easy', idx); idx += counts.EASY; }
  if (counts.MEDIUM > 0) { pushMany(counts.MEDIUM, 'Medium', idx); idx += counts.MEDIUM; }
  if (counts.HARD > 0) { pushMany(counts.HARD, 'Hard', idx); idx += counts.HARD; }
}

// Final adjustment if off by a small amount
if (problems.length !== totalProblems) {
  const diff = totalProblems - problems.length;
  if (diff > 0) {
    const t = topicDistribution[0];
    for (let i = 0; i < diff; i++) {
      const id = nextId++;
      problems.push({ id, problem_code: `P${id}`, title: `Extra Problem ${i+1}`, statement: 'Extra', description: 'Extra', difficulty: 'Easy', topics: t.name, testcases: [{input:'1',output:'1',explanation:'',is_sample:true}] });
    }
  } else if (diff < 0) {
    problems.splice(diff); // remove extras
  }
}

// Convert testcases format to match schema (test_cases)
const output = { topics, problems };

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/problems_5000.json', JSON.stringify(output, null, 2), 'utf8');
console.log('Generated', problems.length, 'problems -> data/problems_5000.json');
