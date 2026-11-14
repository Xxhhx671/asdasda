const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'keys.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me';
const PORT = process.env.PORT || 3000;

function loadDB() {
  try {
    if (!fs.existsSync(DATA_FILE)) return { keys: [] };
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const db = JSON.parse(raw || '{"keys":[]}');
    if (!db.keys) db.keys = [];
    return db;
  } catch (e) {
    console.error('loadDB error', e);
    return { keys: [] };
  }
}

function saveDB(db) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function now() { return Date.now(); }

function genKey() {
  // FOREV-XXXX-XXXX-XXXX
  const part = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `FOREV-${part()}${part().slice(0,0)}${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`.replace(/[^A-Z0-9-]/g,'');
}

function normGenKey() {
  const seg = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `FOREV-${seg()}${seg()}-${seg()}${seg()}-${seg()}${seg()}`;
}

function auth(req, res, next) {
  const pass = req.headers['x-admin-password'] || req.body.password || req.query.password;
  if (pass !== ADMIN_PASSWORD) return res.status(401).json({ ok: false, error: 'unauthorized' });
  next();
}

// --- Public validation endpoint (used by loader) ---
// GET or POST: key, hwid
app.all('/api/validate', (req, res) => {
  const key = String((req.method === 'GET' ? req.query.key : req.body.key) || '').trim().toUpperCase();
  const hwid = String((req.method === 'GET' ? req.query.hwid : req.body.hwid) || '').trim();
  if (!key || !hwid) return res.json({ valid: false, reason: 'missing_params' });

  const db = loadDB();
  const entry = db.keys.find(k => k.key === key);
  if (!entry) return res.json({ valid: false, reason: 'not_found' });
  if (entry.revoked) return res.json({ valid: false, reason: 'revoked' });
  if (entry.expiresAt && now() > entry.expiresAt) return res.json({ valid: false, reason: 'expired' });

  if (!entry.hwid) {
    entry.hwid = hwid;
    entry.boundAt = now();
    saveDB(db);
  } else if (entry.hwid !== hwid) {
    return res.json({ valid: false, reason: 'hwid_mismatch' });
  }

  entry.lastSeen = now();
  saveDB(db);
  return res.json({ valid: true, reason: 'ok', expiresAt: entry.expiresAt || null });
});

// --- Admin endpoints ---
app.post('/api/admin/generate', auth, (req, res) => {
  const count = Math.max(1, Math.min(100, parseInt(req.body.count || 1, 10)));
  const days = parseInt(req.body.days || 0, 10); // 0 = lifetime
  const note = String(req.body.note || '');
  const db = loadDB();
  const created = [];
  for (let i = 0; i < count; i++) {
    const key = normGenKey();
    const entry = {
      key,
      createdAt: now(),
      expiresAt: days > 0 ? now() + days * 24 * 60 * 60 * 1000 : null,
      hwid: null,
      revoked: false,
      note
    };
    db.keys.push(entry);
    created.push(entry);
  }
  saveDB(db);
  res.json({ ok: true, keys: created });
});

app.get('/api/admin/list', auth, (req, res) => {
  const db = loadDB();
  res.json({ ok: true, keys: db.keys });
});

app.post('/api/admin/revoke', auth, (req, res) => {
  const key = String(req.body.key || '').trim().toUpperCase();
  const db = loadDB();
  const entry = db.keys.find(k => k.key === key);
  if (!entry) return res.json({ ok: false, error: 'not_found' });
  entry.revoked = true;
  saveDB(db);
  res.json({ ok: true });
});

app.get('/health', (_req, res) => res.send('ok'));

app.listen(PORT, () => {
  console.log(`Key server listening on ${PORT}`);
  console.log(`Admin password env ADMIN_PASSWORD is ${ADMIN_PASSWORD === 'change-me' ? 'DEFAULT (change it!)' : 'set'}`);
});
