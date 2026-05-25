const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const csvtojson = require('csvtojson');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Please set DATABASE_URL environment variable (postgres connection string)');
  process.exit(1);
}

// CLI flags
const args = require('minimist')(process.argv.slice(2));
const DRY_RUN = !!args['dry-run'] || !!args['dryrun'];
const ALL_USERS = !!args['all-users'] || !!args['allusers'];
const PARTICIPANT_LIMIT = args['participants'] ? Number(args['participants']) : (args['p'] ? Number(args['p']) : 200);
// mix format E2:M1:H1 (defaults 2:1:1)
const mixArg = args['mix'] || 'E2:M1:H1';
function parseMix(m) {
  const parts = m.split(':');
  const map = { E: 2, M: 1, H: 1 };
  parts.forEach(p => {
    const mch = p.match(/^([EMH])(\d+)$/i);
    if (mch) map[mch[1].toUpperCase()] = Number(mch[2]);
  });
  return map;
}
const MIX = parseMix(mixArg);

async function backup(client) {
  console.log('Backing up contest_problems, contest_participants, problem_notes to data/backup...');
  fs.mkdirSync('data/backup', { recursive: true });
  const cp = await client.query('SELECT * FROM contest_problems');
  const cpart = await client.query('SELECT * FROM contest_participants');
  const pn = await client.query('SELECT * FROM problem_notes');
  fs.writeFileSync('data/backup/contest_problems_backup.json', JSON.stringify(cp.rows, null, 2));
  fs.writeFileSync('data/backup/contest_participants_backup.json', JSON.stringify(cpart.rows, null, 2));
  fs.writeFileSync('data/backup/problem_notes_backup.json', JSON.stringify(pn.rows, null, 2));
}

async function readCsvIfExists(filepath) {
  if (!fs.existsSync(filepath)) return null;
  return csvtojson({ trim: true, ignoreEmpty: true }).fromFile(filepath);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

async function run() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  try {
    await backup(client);

    console.log('Repopulating contest_problems for contests that have no problems');
    const contestsRes = await client.query('SELECT id, start_time, end_time, duration_minutes FROM contests');
    const contests = contestsRes.rows;

    // Preload problems by difficulty
    const easyRes = await client.query("SELECT id FROM problems WHERE difficulty = 'EASY' LIMIT 1000");
    const medRes = await client.query("SELECT id FROM problems WHERE difficulty = 'MEDIUM' LIMIT 1000");
    const hardRes = await client.query("SELECT id FROM problems WHERE difficulty = 'HARD' LIMIT 1000");
    const easyIds = easyRes.rows.map(r => r.id);
    const medIds = medRes.rows.map(r => r.id);
    const hardIds = hardRes.rows.map(r => r.id);

    for (const contest of contests) {
      const cpCheck = await client.query('SELECT COUNT(*)::int as c FROM contest_problems WHERE contest_id = $1', [contest.id]);
      if (cpCheck.rows[0].c > 0) continue;

      // pick problems according to MIX
      shuffle(easyIds);
      shuffle(medIds);
      shuffle(hardIds);

      const chosen = [];
      for (let i = 0; i < (MIX.E || 0); i++) if (easyIds[i]) chosen.push(easyIds[i]);
      for (let i = 0; i < (MIX.M || 0); i++) if (medIds[i]) chosen.push(medIds[i]);
      for (let i = 0; i < (MIX.H || 0); i++) if (hardIds[i]) chosen.push(hardIds[i]);

      if (chosen.length === 0) continue;

      const vals = [];
      const placeholders = [];
      chosen.forEach((pid, idx) => {
        vals.push(contest.id, pid);
        placeholders.push(`($${vals.length-1}, $${vals.length})`);
      });

      // build proper placeholders sequence
      const ph = [];
      for (let i = 0; i < chosen.length; i++) {
        ph.push(`($${i*2+1}, $${i*2+2})`);
      }

      const sql = `INSERT INTO contest_problems(contest_id, problem_id) VALUES ${ph.join(', ')} ON CONFLICT DO NOTHING`;
      if (DRY_RUN) {
        console.log('[DRY RUN] SQL:', sql, 'VALUES:', vals.slice(0, 20), chosen.length > 20 ? '... (truncated)' : '');
      } else {
        await client.query(sql, vals);
        console.log(`Added ${chosen.length} problems to contest ${contest.id}`);
      }
    }

    console.log('Populating contest_participants: selecting users with role USER');
    const usersRes = ALL_USERS ? await client.query("SELECT id FROM users WHERE role IN ('USER','ADMIN')") : await client.query("SELECT id FROM users WHERE role = 'USER' LIMIT 1000");
    const userIds = usersRes.rows.map(r => r.id);
    if (userIds.length === 0) {
      console.log('No matching users found, skipping contest_participants');
    } else {
      const contestsRes2 = await client.query('SELECT id FROM contests');
      for (const c of contestsRes2.rows) {
        shuffle(userIds);
        const sample = ALL_USERS ? userIds : userIds.slice(0, Math.min(PARTICIPANT_LIMIT, userIds.length));
        const vals = [];
        for (const uid of sample) {
          vals.push(c.id, uid);
        }
        const ph = [];
        for (let i = 0; i < sample.length; i++) ph.push(`($${i*2+1}, $${i*2+2})`);
        if (ph.length > 0) {
          const sql = `INSERT INTO contest_participants(contest_id, user_id) VALUES ${ph.join(', ')} ON CONFLICT DO NOTHING`;
          if (DRY_RUN) {
            console.log('[DRY RUN] SQL:', sql, 'VALUES sample:', vals.slice(0, 10));
          } else {
            await client.query(sql, vals);
          }
        }
        console.log(`Added ${sample.length} participants to contest ${c.id}`);
      }
    }

    // Optionally import problem_notes.csv if present
    const notesCsv = path.resolve('problem_notes.csv');
    const notes = await readCsvIfExists(notesCsv);
    if (notes && notes.length > 0) {
      console.log(`Importing ${notes.length} problem_notes from problem_notes.csv`);
      // build maps for problem_code->id and username->id
      const problemsMapRes = await client.query('SELECT id, problem_code FROM problems');
      const problemsMap = new Map(problemsMapRes.rows.map(r => [String(r.problem_code), r.id]));
      const usersMapRes = await client.query('SELECT id, username FROM users');
      const usersMap = new Map(usersMapRes.rows.map(r => [r.username, r.id]));

      const batch = [];
      for (const n of notes) {
        const pid = problemsMap.get(String(n.problem_code || n.problem_id || n.problem));
        const uid = usersMap.get(n.username || n.user);
        if (!pid || !uid) continue;
        batch.push({ pid, uid, approach: n.approach || null, logic: n.logic || null, learnings: n.learnings || null, time_complexity: n.time_complexity || n.timeComplexity || null, space_complexity: n.space_complexity || n.spaceComplexity || null });
      }

      const chunk = 200;
      for (let i = 0; i < batch.length; i += chunk) {
        const slice = batch.slice(i, i + chunk);
        const vals = [];
        const ph = [];
        slice.forEach((r, idx) => {
          vals.push(r.uid, r.pid, r.approach, r.logic, r.learnings, r.time_complexity, r.space_complexity);
          ph.push(`($${idx*7+1},$${idx*7+2},$${idx*7+3},$${idx*7+4},$${idx*7+5},$${idx*7+6},$${idx*7+7})`);
        });
        await client.query(`INSERT INTO problem_notes(user_id, problem_id, approach, logic, learnings, time_complexity, space_complexity) VALUES ${ph.join(', ')} ON CONFLICT DO NOTHING`, vals);
      }
      console.log('Imported problem_notes');
    } else {
      console.log('No problem_notes.csv found; skipping notes import');
    }

    // Summary counts
    const counts = await client.query(`SELECT (SELECT COUNT(*) FROM contest_problems) as cp, (SELECT COUNT(*) FROM contest_participants) as cpart, (SELECT COUNT(*) FROM problem_notes) as pn`);
    console.log('Post-sync counts:', counts.rows[0]);

  } finally {
    await client.end();
  }
}

run().catch(e => { console.error(e); process.exit(1); });
