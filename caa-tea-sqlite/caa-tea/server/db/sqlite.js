import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH   = join(__dirname, '..', '..', 'caa_tea.db');
const SCHEMA    = join(__dirname, '..', '..', 'sql', '001_schema_sqlite.sql');

// IDs deterministas para que el cliente (PinGate, demos) pueda referenciarlos sin endpoint extra.
const SEED_ADULT_ID = '00000000-0000-0000-0000-000000000001';
const SEED_CHILD_ID = '00000000-0000-0000-0000-000000000010';

let rawDb = null;

function persist() {
  const data = rawDb.export();
  writeFileSync(DB_PATH, Buffer.from(data));
}

const db = {
  prepare(sql) {
    return {
      get(...params) {
        const stmt = rawDb.prepare(sql);
        if (params.length) stmt.bind(params);
        if (!stmt.step()) { stmt.free(); return undefined; }
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      },
      all(...params) {
        const stmt = rawDb.prepare(sql);
        if (params.length) stmt.bind(params);
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        return rows;
      },
      run(...params) {
        rawDb.run(sql, params);
        persist();
        return this;
      },
    };
  },
  exec(sql) {
    rawDb.exec(sql);
    persist();
  },
  pragma(str) {
    rawDb.run(`PRAGMA ${str}`);
  },
};

export async function initDb() {
  const SQL = await initSqlJs();

  if (existsSync(DB_PATH)) {
    const fileBuffer = readFileSync(DB_PATH);
    rawDb = new SQL.Database(fileBuffer);
  } else {
    rawDb = new SQL.Database();
  }

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schema = readFileSync(SCHEMA, 'utf8');
  rawDb.exec(schema);
  persist();

  // Seed si está vacía
  const userCount = db.prepare('SELECT COUNT(*) as n FROM users').get();
  if (userCount.n === 0) {
    const pinHash = bcrypt.hashSync('1234', 10);

    db.prepare('INSERT INTO users (id,name,role,pin_hash,avatar_color) VALUES (?,?,?,?,?)')
      .run(SEED_ADULT_ID, 'María (mamá)', 'adult', pinHash, '#534AB7');

    db.prepare('INSERT INTO users (id,name,role,avatar_color) VALUES (?,?,?,?)')
      .run(SEED_CHILD_ID, 'Mateo', 'child', '#1D9E75');

    db.prepare('INSERT INTO adult_child_links (adult_id,child_id) VALUES (?,?)')
      .run(SEED_ADULT_ID, SEED_CHILD_ID);

    const scheduleId = randomUUID();
    db.prepare("INSERT INTO schedules (id,child_id,date,slot_now,slot_next,slot_later) VALUES (?,?,date('now'),?,?,?)")
      .run(
        scheduleId, SEED_CHILD_ID,
        JSON.stringify({pictoId:2510, label:'Desayunar', imageUrl:'https://static.arasaac.org/pictograms/2510/2510_300.png', completed:false}),
        JSON.stringify({pictoId:6386, label:'Colegio',   imageUrl:'https://static.arasaac.org/pictograms/6386/6386_300.png', completed:false}),
        JSON.stringify({pictoId:3196, label:'Jugar',     imageUrl:'https://static.arasaac.org/pictograms/3196/3196_300.png', completed:false})
      );

    // Fila inicial de progreso para el niño demo
    db.prepare(
      'INSERT INTO child_progress (child_id,total_stars,level,streak_days) VALUES (?,?,?,?)'
    ).run(SEED_CHILD_ID, 0, 1, 0);

    console.log('  Base de datos creada con datos demo');
    console.log('   Adulto:', SEED_ADULT_ID, '(PIN: 1234)');
    console.log('   Nino:  ', SEED_CHILD_ID);
  }
}

export default db;
export { randomUUID as uuid, SEED_ADULT_ID, SEED_CHILD_ID };
