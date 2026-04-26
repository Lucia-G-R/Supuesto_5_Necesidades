import initSqlJs from 'sql.js';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH   = join(__dirname, '..', '..', 'caa_tea.db.json');

// ── sql.js wraps SQLite in pure WASM/JS ────────────────────────────────────
const SQL  = await initSqlJs();

// Cargar o crear la base de datos
let db;
if (existsSync(DB_PATH)) {
  const saved = JSON.parse(readFileSync(DB_PATH, 'utf8'));
  db = new SQL.Database(Buffer.from(saved.data));
} else {
  db = new SQL.Database();
}

// Guardar en disco después de cada escritura
function persist() {
  const data = Array.from(db.export());
  writeFileSync(DB_PATH, JSON.stringify({ data }));
}

// ── Wrapper sincrónico compatible con better-sqlite3 API ──────────────────
function run(sql, params = []) {
  db.run(sql, params);
  persist();
  return { changes: db.getRowsModified() };
}

function get(sql, params = []) {
  const stmt   = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return undefined;
}

function all(sql, params = []) {
  const results = db.exec(sql, params);
  if (!results.length) return [];
  const { columns, values } = results[0];
  return values.map(row =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  );
}

function exec(sql) {
  db.run(sql);
  persist();
}

// ── Crear tablas ──────────────────────────────────────────────────────────
exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL,
    pin_hash TEXT, avatar_color TEXT DEFAULT '#1D9E75',
    created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS adult_child_links (
    adult_id TEXT NOT NULL, child_id TEXT NOT NULL,
    PRIMARY KEY(adult_id, child_id)
  );
  CREATE TABLE IF NOT EXISTS generated_phrases (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
    pictogram_ids TEXT NOT NULL, phrase_length INTEGER NOT NULL,
    phrase_text TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY, child_id TEXT NOT NULL,
    date TEXT DEFAULT (date('now')),
    slot_now TEXT, slot_next TEXT, slot_later TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(child_id, date)
  );
  CREATE TABLE IF NOT EXISTS emotional_logs (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
    emotion TEXT NOT NULL, intensity INTEGER,
    strategy_chosen TEXT, created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS usage_events (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL,
    event_type TEXT NOT NULL, details TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// ── Seed inicial ──────────────────────────────────────────────────────────
const userCount = get('SELECT COUNT(*) as n FROM users');
if (!userCount || userCount.n === 0) {
  const pinHash = await bcrypt.hash('1234', 10);
  const adultId = randomUUID();
  const childId = randomUUID();

  run(`INSERT INTO users (id,name,role,pin_hash,avatar_color) VALUES (?,?,?,?,?)`,
    [adultId, 'María (mamá)', 'adult', pinHash, '#534AB7']);
  run(`INSERT INTO users (id,name,role,avatar_color) VALUES (?,?,?,?)`,
    [childId, 'Mateo', 'child', '#1D9E75']);
  run(`INSERT INTO adult_child_links (adult_id,child_id) VALUES (?,?)`,
    [adultId, childId]);
  run(`INSERT INTO schedules (id,child_id,date,slot_now,slot_next,slot_later) VALUES (?,?,date('now'),?,?,?)`, [
    randomUUID(), childId,
    JSON.stringify({pictoId:2510,label:'Desayunar',imageUrl:'https://static.arasaac.org/pictograms/2510/2510_300.png',completed:false}),
    JSON.stringify({pictoId:6386,label:'Colegio',  imageUrl:'https://static.arasaac.org/pictograms/6386/6386_300.png',completed:false}),
    JSON.stringify({pictoId:3196,label:'Jugar',    imageUrl:'https://static.arasaac.org/pictograms/3196/3196_300.png',completed:false}),
  ]);

  console.log('✅ Base de datos creada con datos demo');
  console.log('   Adulto:', adultId);
  console.log('   Niño:  ', childId);
  console.log('   PIN adulto: 1234');
}

export default { run, get, all, exec };
export { randomUUID as uuid };
