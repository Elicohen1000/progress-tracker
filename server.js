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
  // t1 (/how-it-works page) NOT done
  'o-p1-t2': true,  // Organization schema done
  'o-p1-t3': true,  // Founder bio done

  // o-p2: Search Foundation
  'o-p2-t1': true,  // Technical SEO sprints complete
  'o-p2-t2': true,  // Keyword strategy documented
  'o-p2-t3': true,  // AEO + FAQPage schema done
  // t4 (GEO 3+ brand mentions) in progress (TechBullion + ToolPilot = 2)
  'o-p2-t5': true,  // GSC pipeline operational (51 URLs submitted, daily automation)

  // o-p3: Content Ecosystem
  'o-p3-t1': true,  // 60+ pages live (51+ indexed URLs)
  // t2 (CMM pipeline) NOT running yet
  'o-p3-t3': true,  // Pillar pages live (/learn/ai-meditation, personalized-meditation, science)

  // o-p4: Interactive
  'o-p4-t1': true,  // Quiz live
  // t2 (quiz as primary CTA) not yet repositioned
  'o-p4-t3': true,  // Email capture (Brevo) integrated

  // o-p7: Owned Audience
  'o-p7-t1': true,  // Email platform (Brevo) set up

  // o-analytics: Analytics
  'o-analytics-t1': true,  // GA4 event tracking implemented

  // v-pre: Pre-validation (all 4 complete)
  'v-pre-t1': true,  // 5 core assumptions mapped
  'v-pre-t2': true,  // VC evaluation completed (6.6/10, 2026-03-25)
  'v-pre-t3': true,  // Kill criteria defined
  'v-pre-t4': true,  // Assumptions prioritized

  // v-s1: Problem Validation
  'v-s1-t1': true,  // F5Bot keyword alerts active
  'v-s1-t2': true,  // App Store + Reddit complaint analysis done
  'v-s1-t3': true,  // Google Trends + keyword research completed
  // t4 (30 discovery interviews) NOT done
  // t5 (top 3 pain points) NOT done

  // v-s2: Solution & Demand Signal
  'v-s2-t1': true,  // Landing page live (meditailor.app fully deployed)
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
