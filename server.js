const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const PORT = process.env.PORT || 3002;

const ALLOWED_ORIGINS = [
  'https://shoaibul0926.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

const app = express();
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json());

function makeToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.post('/api/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password || username.trim().length < 3 || password.length < 6) {
    return res.status(400).json({ error: 'Username must be 3+ chars, password 6+ chars.' });
  }
  const clean = username.trim().slice(0, 20);
  if (db.findUserByUsername(clean)) {
    return res.status(409).json({ error: 'That username is already taken.' });
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  const user = db.createUser(clean, passwordHash);
  res.json({
    token: makeToken(user),
    username: user.username,
    loginCount: user.loginCount,
    lastLogin: null
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = db.findUserByUsername(username || '');
  if (!user || !bcrypt.compareSync(password || '', user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }
  const { previousLogin, user: updated } = db.recordLogin(user.id);
  res.json({
    token: makeToken(updated),
    username: updated.username,
    loginCount: updated.loginCount,
    lastLogin: previousLogin
  });
});

// Called when a stored token is reused to re-enter the hub, so each visit
// (not just fresh credential logins) is captured as a login activity entry.
app.post('/api/activity/ping', requireAuth, (req, res) => {
  const result = db.recordLogin(req.user.id);
  if (!result) return res.status(404).json({ error: 'User not found' });
  res.json({
    username: result.user.username,
    loginCount: result.user.loginCount,
    lastLogin: result.previousLogin
  });
});

app.get('/api/activity', requireAuth, (req, res) => {
  const user = db.findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    username: user.username,
    createdAt: user.createdAt,
    loginCount: user.loginCount,
    history: user.loginActivity.slice(-20).reverse()
  });
});

app.listen(PORT, () => console.log('pixeldeck-auth listening on ' + PORT));
