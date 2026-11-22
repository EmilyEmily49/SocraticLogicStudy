// Cloudflare Worker: serves the static app and a tiny accounts + scores API.
// Data lives in one SQLite-backed Durable Object (free plan; no dashboard setup needed).
//
// API (JSON; send "Authorization: Bearer <token>" when signed in):
//   GET  /api/ping
//   POST /api/signup   { name, username, password, code } -> { token, user }
//   POST /api/login    { username, password }             -> { token, user }
//   POST /api/logout
//   GET  /api/me                                          -> { user, profile, progress }
//   PUT  /api/profile  { ...public profile }
//   PUT  /api/progress { cards, stats, best }
//   GET  /api/profiles                                    -> [{ uid, ...profile }]

import { DurableObject } from "cloudflare:workers";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      const stub = env.STORE.get(env.STORE.idFromName("main"));
      return stub.fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
};

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const fail = (error, status = 400) => json({ error }, status);

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const randomHex = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));
async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(salt), iterations: 100000 }, key, 256);
  return hex(bits);
}
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
const int = (v) => (Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0);

// Keep only the fields the leaderboard needs, with sane limits.
function cleanProfile(p, old) {
  const name = String(p.name || old?.name || "Student").trim().slice(0, 24) || "Student";
  let points = int(p.points);
  if (old) points = Math.max(int(old.points), Math.min(points, int(old.points) + 5000)); // no decreases, no giant jumps
  else points = Math.min(points, 100);
  const out = {
    name, points,
    weekPoints: Math.min(int(p.weekPoints), points),
    weekId: String(p.weekId || "").slice(0, 10),
    streak: Math.min(int(p.streak), 3650),
    bestStreak: Math.min(int(p.bestStreak), 3650),
    lastDay: String(p.lastDay || "").slice(0, 10),
    mastered: Math.min(int(p.mastered), 10000),
    badges: Array.isArray(p.badges) ? p.badges.filter((b) => typeof b === "string").slice(0, 100).map((b) => b.slice(0, 40)) : [],
    counts: {},
  };
  for (const [k, v] of Object.entries(p.counts || {}).slice(0, 100)) out.counts[String(k).slice(0, 40)] = int(v);
  return out;
}

export class Store extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.env = env;
    this.sql = ctx.storage.sql;
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS users (uid TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL, created INTEGER);
      CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, uid TEXT NOT NULL, created INTEGER);
      CREATE TABLE IF NOT EXISTS profiles (uid TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS progress (uid TEXT PRIMARY KEY, data TEXT NOT NULL);
    `);
  }
  one(q, ...args) { return this.sql.exec(q, ...args).toArray()[0] || null; }
  userFor(request) {
    const m = (request.headers.get("authorization") || "").match(/^Bearer ([a-f0-9]{64})$/);
    if (!m) return null;
    const s = this.one("SELECT uid FROM sessions WHERE token = ?", m[1]);
    return s ? this.one("SELECT uid, username FROM users WHERE uid = ?", s.uid) : null;
  }
  newSession(uid) {
    const token = randomHex(32);
    this.sql.exec("INSERT INTO sessions (token, uid, created) VALUES (?, ?, ?)", token, uid, Date.now());
    return token;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const route = `${request.method} ${url.pathname}`;
    let body = {};
    if (request.method === "POST" || request.method === "PUT") {
      try { body = await request.json(); } catch { return fail("bad-request"); }
    }

    if (route === "GET /api/ping") return json({ ok: true });

    if (route === "POST /api/signup") {
      const code = String(body.code || "").trim().toUpperCase();
      if (!this.env.INVITE_CODE || code !== String(this.env.INVITE_CODE).toUpperCase()) return fail("bad-code", 403);
      const username = String(body.username || "").trim().toLowerCase();
      const password = String(body.password || "");
      const name = String(body.name || "").trim().slice(0, 24);
      if (!/^[a-z0-9._-]{2,30}$/.test(username)) return fail("bad-username");
      if (password.length < 6) return fail("weak-password");
      if (!name) return fail("bad-name");
      if (this.one("SELECT uid FROM users WHERE username = ?", username)) return fail("taken", 409);
      const uid = "u_" + randomHex(8), salt = randomHex(16);
      this.sql.exec("INSERT INTO users (uid, username, salt, hash, created) VALUES (?, ?, ?, ?, ?)", uid, username, salt, await hashPassword(password, salt), Date.now());
      this.sql.exec("INSERT INTO profiles (uid, data) VALUES (?, ?)", uid, JSON.stringify(cleanProfile({ name })));
      return json({ token: this.newSession(uid), user: { uid, username } });
    }

    if (route === "POST /api/login") {
      const username = String(body.username || "").trim().toLowerCase();
      const u = this.one("SELECT uid, username, salt, hash FROM users WHERE username = ?", username);
      const ok = u && safeEqual(await hashPassword(String(body.password || ""), u.salt), u.hash);
      if (!ok) return fail("bad-login", 401);
      return json({ token: this.newSession(u.uid), user: { uid: u.uid, username: u.username } });
    }

    const user = this.userFor(request);
    if (!user) return fail("signed-out", 401);

    if (route === "POST /api/logout") {
      const token = request.headers.get("authorization").slice(7);
      this.sql.exec("DELETE FROM sessions WHERE token = ?", token);
      return json({ ok: true });
    }
    if (route === "GET /api/me") {
      const p = this.one("SELECT data FROM profiles WHERE uid = ?", user.uid);
      const g = this.one("SELECT data FROM progress WHERE uid = ?", user.uid);
      return json({ user, profile: p ? JSON.parse(p.data) : null, progress: g ? JSON.parse(g.data) : null });
    }
    if (route === "PUT /api/profile") {
      const old = this.one("SELECT data FROM profiles WHERE uid = ?", user.uid);
      const data = cleanProfile(body, old ? JSON.parse(old.data) : null);
      this.sql.exec("INSERT INTO profiles (uid, data) VALUES (?, ?) ON CONFLICT(uid) DO UPDATE SET data = excluded.data", user.uid, JSON.stringify(data));
      return json({ ok: true });
    }
    if (route === "PUT /api/progress") {
      const data = JSON.stringify({ cards: body.cards || {}, stats: body.stats || {}, best: body.best || {} });
      if (data.length > 500000) return fail("too-big", 413);
      this.sql.exec("INSERT INTO progress (uid, data) VALUES (?, ?) ON CONFLICT(uid) DO UPDATE SET data = excluded.data", user.uid, data);
      return json({ ok: true });
    }
    if (route === "GET /api/profiles") {
      const rows = this.sql.exec("SELECT uid, data FROM profiles").toArray();
      return json(rows.map((r) => ({ uid: r.uid, ...JSON.parse(r.data) })));
    }
    return fail("not-found", 404);
  }
}
