const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8507;
const STATE_FILE = process.env.STATE_FILE || '/data/state.json';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Default state (matches DEFAULTS in HTML) ──────────────────────────────────
const DEFAULTS = {
  // o-p1: Trust Architecture
  'o-p1-t1': true,
  'o-p1-t2': true,

  // o-p2: Search Foundation
  'o-p2-t1': true,
  'o-p2-t2': true,
  'o-p2-t3': true,
  'o-p2-t4': true,
  'o-p2-t5': true,

  // o-p3: Content Ecosystem
  'o-p3-t1': true,
  'o-p3-t2': true,
  'o-p3-t3': true,

  // o-p4: Interactive
  'o-p4-t1': true,

  // o-analytics: Analytics
  'o-analytics-t1': true,

  // v-pre: Pre-validation
  'v-pre-t1': true,
  'v-pre-t2': true,
  'v-pre-t3': true,
  'v-pre-t4': true,

  // v-s1: Stage 1
  'v-s1-t1': true,
  'v-s1-t2': true,
  'v-s1-t3': true,
};

// ── State helpers ─────────────────────────────────────────────────────────────
function readState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read state file, using defaults:', err.message);
  }
  return { ...DEFAULTS };
}

function writeState(state) {
  try {
    const dir = path.dirname(STATE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write state file:', err.message);
    throw err;
  }
}

// ── API routes ────────────────────────────────────────────────────────────────

// GET /health — health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/state — return full state
app.get('/api/state', (req, res) => {
  try {
    const state = readState();
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read state' });
  }
});

// POST /api/state — replace full state
app.post('/api/state', (req, res) => {
  try {
    const newState = req.body;
    if (typeof newState !== 'object' || Array.isArray(newState)) {
      return res.status(400).json({ error: 'Body must be a JSON object' });
    }
    newState._ts = new Date().toISOString();
    writeState(newState);
    res.json({ ok: true, state: newState });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save state' });
  }
});

// POST /api/toggle/:taskId — toggle a single checkbox
app.post('/api/toggle/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    // Validate taskId format: letters, digits, hyphens only
    if (!/^[a-z0-9-]+$/.test(taskId)) {
      return res.status(400).json({ error: 'Invalid taskId' });
    }
    const state = readState();
    state[taskId] = !state[taskId];
    state._ts = new Date().toISOString();
    writeState(state);
    res.json({ ok: true, taskId, checked: state[taskId], _ts: state._ts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle task' });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`progress-tracker running on port ${PORT}`);
  console.log(`State file: ${STATE_FILE}`);
});
