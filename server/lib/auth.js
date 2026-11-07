'use strict';
/* Đăng nhập quản trị: mật khẩu băm scrypt, phiên là cookie HttpOnly ký HMAC, chống CSRF bằng token riêng mỗi phiên. */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const store = require('./store');

const COOKIE = 'vio_sid';
const SESSION_MS = 8 * 60 * 60 * 1000; // 8 giờ

/* ---- khóa bí mật (tạo một lần, lưu trong thư mục data) ---- */
function loadSecret() {
  if (process.env.VIOCONS_SECRET && process.env.VIOCONS_SECRET.length >= 16) return process.env.VIOCONS_SECRET;
  const f = path.join(store.DATA_DIR, 'secret.key');
  try {
    const s = fs.readFileSync(f, 'utf8').trim();
    if (s.length >= 32) return s;
  } catch (e) { /* tạo mới */ }
  const s = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(f, s, { mode: 0o600 });
  return s;
}
const SECRET = loadSecret();

/* ---- mật khẩu ---- */
function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pw, salt, 64);
  return 'scrypt$' + salt.toString('hex') + '$' + hash.toString('hex');
}
const DUMMY = hashPassword('khong-ai-biet-mat-khau-nay');
function verifyPassword(pw, stored) {
  try {
    const [alg, saltHex, hashHex] = String(stored).split('$');
    if (alg !== 'scrypt') return false;
    const want = Buffer.from(hashHex, 'hex');
    const got = crypto.scryptSync(pw, Buffer.from(saltHex, 'hex'), want.length);
    return crypto.timingSafeEqual(got, want);
  } catch (e) { return false; }
}

/* ---- tài khoản ---- */
const users = {
  all: () => store.read('users', []),
  save: (list) => store.write('users', list),
  byName: (name) => users.all().find((u) => u.username.toLowerCase() === String(name).toLowerCase()),
  byId: (id) => users.all().find((u) => u.id === id),
};

function randomPassword() {
  const abc = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  const b = crypto.randomBytes(12);
  for (let i = 0; i < 12; i++) s += abc[b[i] % abc.length];
  return s;
}

function createUser(username, password, opts) {
  opts = opts || {};
  const list = users.all();
  const u = {
    id: crypto.randomBytes(6).toString('hex'),
    username: username,
    hash: hashPassword(password),
    pv: 1,
    mustChange: !!opts.mustChange,
    createdAt: new Date().toISOString(),
  };
  list.push(u);
  users.save(list);
  return u;
}

function setPassword(id, password, mustChange) {
  const list = users.all();
  const u = list.find((x) => x.id === id);
  if (!u) return false;
  u.hash = hashPassword(password);
  u.pv = (u.pv || 1) + 1; // đăng xuất mọi phiên cũ
  u.mustChange = !!mustChange;
  users.save(list);
  return true;
}

/* ---- phiên đăng nhập ---- */
const b64 = (buf) => Buffer.from(buf).toString('base64url');
function sign(payload) {
  const body = b64(JSON.stringify(payload));
  const mac = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return body + '.' + mac;
}
function unsign(token) {
  if (typeof token !== 'string') return null;
  const i = token.lastIndexOf('.');
  if (i < 1) return null;
  const body = token.slice(0, i), mac = token.slice(i + 1);
  const want = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const a = Buffer.from(mac), b = Buffer.from(want);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return p.exp > Date.now() ? p : null;
  } catch (e) { return null; }
}

function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function startSession(req, res, user) {
  const csrf = crypto.randomBytes(18).toString('base64url');
  const token = sign({ u: user.id, pv: user.pv, c: csrf, exp: Date.now() + SESSION_MS });
  const secure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.setHeader('Set-Cookie', COOKIE + '=' + token + '; Path=/; HttpOnly; SameSite=Strict; Max-Age=' + Math.floor(SESSION_MS / 1000) + (secure ? '; Secure' : ''));
  return csrf;
}
function endSession(res) {
  res.setHeader('Set-Cookie', COOKIE + '=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
}

/* Đọc phiên từ cookie (không bắt buộc). Gắn req.user, req.csrf */
function readSession(req) {
  const p = unsign(parseCookies(req)[COOKIE]);
  if (!p) return null;
  const u = users.byId(p.u);
  if (!u || u.pv !== p.pv) return null;
  return { user: u, csrf: p.c };
}

function requireAuth(req, res, next) {
  const s = readSession(req);
  if (!s) return res.status(401).json({ error: 'Chưa đăng nhập hoặc phiên đã hết hạn.' });
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const sent = req.headers['x-csrf-token'];
    const ok = typeof sent === 'string' && sent.length === s.csrf.length && crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(s.csrf));
    if (!ok) return res.status(403).json({ error: 'Phiên không hợp lệ, hãy tải lại trang.' });
  }
  req.user = s.user;
  req.csrf = s.csrf;
  next();
}

/* ---- giới hạn số lần thử (theo IP) ---- */
function limiter(max, windowMs) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  }, 60 * 1000).unref();
  return {
    blocked(key) {
      const v = hits.get(key);
      return !!v && v.reset > Date.now() && v.n >= max;
    },
    hit(key) {
      const now = Date.now();
      const v = hits.get(key);
      if (!v || v.reset <= now) hits.set(key, { n: 1, reset: now + windowMs });
      else v.n++;
    },
    clear(key) { hits.delete(key); },
  };
}

module.exports = { users, createUser, setPassword, verifyPassword, hashPassword, DUMMY, randomPassword, startSession, endSession, readSession, requireAuth, limiter };
