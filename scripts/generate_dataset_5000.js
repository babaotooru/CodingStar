const fs = require('fs');

// Configuration: topics mapping and target counts
const TOPICS = [
  { id: 1, name: 'Programming Basics', count: 250 },
  { id: 2, name: 'Arrays', count: 500 },
  { id: 3, name: 'Strings', count: 350 },
  { id: 4, name: 'Sorting & Searching', count: 350 },
  { id: 5, name: 'Linked List', count: 250 },
  { id: 6, name: 'Stack & Queue', count: 300 },
  { id: 7, name: 'Hashing', count: 250 },
  { id: 8, name: 'Trees', count: 500 },
  { id: 9, name: 'Heap / Priority Queue', count: 250 },
  { id: 10, name: 'Recursion & Backtracking', count: 300 },
  { id: 11, name: 'Greedy Algorithms', count: 250 },
  { id: 12, name: 'Dynamic Programming', count: 700 },
  { id: 13, name: 'Graphs', count: 600 },
  { id: 14, name: 'Tries', count: 100 },
  { id: 15, name: 'Advanced Topics', count: 350 },
  { id: 16, name: 'SQL Problems', count: 200 }
];

// Difficulty split overall: Easy 2000, Medium 2000, Hard 1000
// We'll distribute difficulties roughly per-topic; for simplicity use proportions
const TOTAL = 5000;

function pickDifficulty(topicName, indexInTopic, topicCount) {
  // Heuristic distribution per-topic: some topics are harder (DP, Graphs, Advanced)
  const heavyHard = ['Dynamic Programming', 'Graphs', 'Advanced Topics'];
  const mediumBias = ['Trees', 'Arrays', 'Sorting & Searching'];

  let hardProb = heavyHard.includes(topicName) ? 0.2 : mediumBias.includes(topicName) ? 0.12 : 0.08;
  let mediumProb = heavyHard.includes(topicName) ? 0.5 : mediumBias.includes(topicName) ? 0.5 : 0.4;
  let easyProb = 1 - hardProb - mediumProb;

  // Slight deterministic variation to achieve counts
  const r = Math.random();
  if (r < easyProb) return 'Easy';
  if (r < easyProb + mediumProb) return 'Medium';
  return 'Hard';
}

function generateProblem(id, topic) {
  const title = `${topic.name} Problem ${id}`;
  const difficulty = pickDifficulty(topic.name, id, topic.count);
  const statement = `Solve problem ${id} from topic ${topic.name}. Placeholder statement.`;
  const sampleIn = 'input sample';
  const sampleOut = 'output sample';

  const testcases = [
    { input: sampleIn, output: sampleOut },
    { input: sampleIn + '2', output: sampleOut + '2' }
  ];

  return {
    id,
    title,
    topic_id: topic.id,
    difficulty,
    statement,
    testcases,
    canonical_answer: '// placeholder solution'
  };
}

async function main() {
  const problems = [];
  let nextId = 200000; // avoid clashing with existing sample ids

  for (const topic of TOPICS) {
    for (let i = 0; i < topic.count; i++) {
      problems.push(generateProblem(nextId++, topic));
    }
  }

  const out = {
    topics: TOPICS.map(t => ({ id: t.id, name: t.name })),
    problems
  };

  fs.writeFileSync('data/problems_5000.json', JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote data/problems_5000.json', problems.length, 'problems');
}

main().catch(e => { console.error(e); process.exit(1); });
