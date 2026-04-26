import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Importar db primero para que cree/semille la base de datos
import './db/sqlite.js';

import authRouter      from './routes/auth.js';
import usersRouter     from './routes/users.js';
import phrasesRouter   from './routes/phrases.js';
import scheduleRouter  from './routes/schedule.js';
import emotionRouter   from './routes/emotion.js';
import dashboardRouter from './routes/dashboard.js';
import arasaacRouter   from './routes/arasaac.js';

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth',      authRouter);
app.use('/api/users',     usersRouter);
app.use('/api/phrases',   phrasesRouter);
app.use('/api/schedule',  scheduleRouter);
app.use('/api/emotion',   emotionRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/arasaac',   arasaacRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true, db: 'SQLite' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🗣️  CAA-TEA API corriendo en http://localhost:${PORT}`);
  console.log(`📁  Base de datos: caa_tea.db (SQLite - se crea automáticamente)\n`);
});
