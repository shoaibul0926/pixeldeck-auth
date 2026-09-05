const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || __dirname;
const DB_FILE = path.join(DATA_DIR, 'data.json');
const MAX_HISTORY = 50;

fs.mkdirSync(DATA_DIR, { recursive: true });

function load() {
  if (!fs.existsSync(DB_FILE)) return { users: [], nextUserId: 1 };
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function save(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function findUserByUsername(username) {
  const db = load();
  return db.users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
}

function findUserById(id) {
  const db = load();
  return db.users.find(u => u.id === id) || null;
}

function createUser(username, passwordHash) {
  const db = load();
  const now = new Date().toISOString();
  const user = {
    id: db.nextUserId++,
    username,
    passwordHash,
    createdAt: now,
    loginCount: 1,
    loginActivity: [{ at: now }]
  };
  db.users.push(user);
  save(db);
  return user;
}

// Appends a login activity entry and returns { user, previousLogin } where
// previousLogin is the timestamp recorded *before* this call, so callers can
// show "last time you were here" without it being overwritten by the entry
// this call just added.
function recordLogin(userId) {
  const db = load();
  const user = db.users.find(u => u.id === userId);
  if (!user) return null;
  const previousLogin = user.loginActivity.length > 0
    ? user.loginActivity[user.loginActivity.length - 1].at
    : null;
  const now = new Date().toISOString();
  user.loginActivity.push({ at: now });
  if (user.loginActivity.length > MAX_HISTORY) {
    user.loginActivity = user.loginActivity.slice(-MAX_HISTORY);
  }
  user.loginCount = (user.loginCount || 0) + 1;
  save(db);
  return { user, previousLogin };
}

module.exports = { findUserByUsername, findUserById, createUser, recordLogin };
