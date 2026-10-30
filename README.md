# PixelDeck Auth

**Retired (2026-09-18):** PixelDeck dropped its login gate entirely and is now login-free (Capacitor-wrapped, ships as an APK — see [PixelDeck](https://shoaibul0926.github.io/PixelDeck/)'s README). This backend is no longer used by it. The Railway deployment below was deleted; nothing currently runs this code. Kept only for reference.

Small Node/Express backend that gave [PixelDeck](https://shoaibul0926.github.io/PixelDeck/) real
username/password accounts and a persistent, server-side log of every login.

Mirrors the auth pattern used in [chat-buddy](https://github.com/shoaibul0926/chat-buddy):
bcrypt-hashed passwords, JWT bearer tokens, and a JSON file "database".

## Endpoints

- `POST /api/register` `{ username, password }` → creates an account, returns `{ token, username, loginCount, lastLogin }`
- `POST /api/login` `{ username, password }` → returns the same shape; `lastLogin` is the timestamp of the *previous* visit
- `POST /api/activity/ping` (Bearer token) → records a login activity entry when a stored token is reused to re-enter the hub
- `GET /api/activity` (Bearer token) → `{ username, createdAt, loginCount, history }` — the last 20 login timestamps

## Deployment (historical — no longer live)

Was deployed on Railway at `https://pixeldeck-auth-production.up.railway.app` (now deleted), with `DATA_DIR` pointed at
a mounted persistent volume so accounts survive container restarts (the same fix chat-buddy needed
after an early deploy lost accounts on restart — see its README).

Environment variables: `JWT_SECRET`, `DATA_DIR` (see `.env.example`).
