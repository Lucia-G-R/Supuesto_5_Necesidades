import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRouter     from './routes/auth.js';
import usersRouter    from './routes/users.js';
import phrasesRouter  from './routes/phrases.js';
import scheduleRouter from './routes/schedule.js';
import emotionRouter  from './routes/emotion.js';
import dashboardRouter from './routes/dashboard.js';
import arasaacRouter  from './routes/arasaac.js';

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// ── Rutas ───────────────────────────────────────────────────
app.use('/api/auth',      authRouter);
app.use('/api/users',     usersRouter);
app.use('/api/phrases',   phrasesRouter);
app.use('/api/schedule',  scheduleRouter);
app.use('/api/emotion',   emotionRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/arasaac',   arasaacRouter);

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ── Error handler ───────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`CAA-TEA API running on :${PORT}`));
