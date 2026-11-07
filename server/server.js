'use strict';
/* VIOCONS — máy chủ web: phục vụ website công khai (có nội dung động) + khu quản trị tại /quan-tri */
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const store = require('./lib/store');
const auth = require('./lib/auth');
const site = require('./lib/site');

site.init();

/* ---- tài khoản quản trị đầu tiên ---- */
if (!auth.users.all().length) {
  const fromEnv = process.env.VIOCONS_ADMIN_PASSWORD;
  const pw = fromEnv && fromEnv.length >= 8 ? fromEnv : auth.randomPassword();
  auth.createUser('admin', pw, { mustChange: !fromEnv });
  if (!fromEnv) {
    const note = path.join(store.DATA_DIR, 'MAT-KHAU-QUAN-TRI.txt');
    fs.writeFileSync(note, 'Tài khoản quản trị đầu tiên\nTên đăng nhập: admin\nMật khẩu: ' + pw + '\n\nĐăng nhập tại /quan-tri, hệ thống sẽ yêu cầu đổi mật khẩu. Sau đó hãy xóa file này.\n', 'utf8');
    console.log('\n=== TÀI KHOẢN QUẢN TRỊ ĐẦU TIÊN ===\n  Tên đăng nhập: admin\n  Mật khẩu:      ' + pw + '\n  (cũng được lưu trong ' + note + ')\n');
  }
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY || 'loopback, linklocal, uniquelocal');

/* ---- tiêu đề bảo mật ---- */
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

app.use('/api', express.json({ limit: '1mb' }));

/* Chặn yêu cầu ghi từ trang web khác (Origin phải trùng host) */
app.use('/api', (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') return next();
  const origin = req.headers.origin;
  if (origin) {
    let host = '';
    try { host = new URL(origin).host; } catch (e) { /* để trống */ }
    if (host !== req.headers.host) return res.status(403).json({ error: 'Yêu cầu bị từ chối.' });
  }
  next();
});

const wrap = (fn) => (req, res, next) => { try { fn(req, res, next); } catch (e) { next(e); } };

/* =====================================================================
   API công khai: nhận liên hệ / đăng ký dự toán
   ===================================================================== */
const contactLimit = auth.limiter(6, 10 * 60 * 1000);
const PHONE_RE = /^[0-9+\s().-]{8,15}$/;
const cut = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n);

app.post('/api/contact', wrap((req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // ô bẫy bot: giả vờ thành công
  if (contactLimit.blocked(req.ip)) return res.status(429).json({ error: 'Bạn gửi quá nhiều lần, vui lòng thử lại sau ít phút hoặc gọi hotline.' });
  const name = cut(b.name, 100), phone = cut(b.phone, 20);
  const kind = b.kind === 'estimate' ? 'estimate' : 'contact';
  if (kind === 'contact' && !name) return res.status(400).json({ error: 'Vui lòng nhập họ tên.' });
  if (!PHONE_RE.test(phone)) return res.status(400).json({ error: 'Số điện thoại chưa hợp lệ.' });
  contactLimit.hit(req.ip);
  const m = { kind, name, phone };
  if (kind === 'contact') {
    m.need = cut(b.need, 100);
    m.note = String(b.note == null ? '' : b.note).replace(/\r/g, '').trim().slice(0, 2000);
  } else {
    m.est = { province: cut(b.province, 80), pack: cut(b.pack, 80), area: cut(b.area, 20), total: cut(b.total, 40) };
  }
  site.addMessage(m);
  res.json({ ok: true });
}));

/* =====================================================================
   API quản trị
   ===================================================================== */
const loginLimit = auth.limiter(8, 15 * 60 * 1000);

app.post('/api/admin/login', wrap((req, res) => {
  const { username, password } = req.body || {};
  if (loginLimit.blocked(req.ip)) return res.status(429).json({ error: 'Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.' });
  const u = typeof username === 'string' ? auth.users.byName(username.trim()) : null;
  const ok = auth.verifyPassword(typeof password === 'string' ? password : '', u ? u.hash : auth.DUMMY);
  if (!u || !ok) {
    loginLimit.hit(req.ip);
    return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu.' });
  }
  loginLimit.clear(req.ip);
  const csrf = auth.startSession(req, res, u);
  res.json({ csrf, user: { id: u.id, username: u.username, mustChange: !!u.mustChange } });
}));

app.post('/api/admin/logout', (req, res) => { auth.endSession(res); res.json({ ok: true }); });

app.get('/api/admin/me', (req, res) => {
  const s = auth.readSession(req);
  if (!s) return res.status(401).json({ error: 'Chưa đăng nhập.' });
  res.json({ csrf: s.csrf, user: { id: s.user.id, username: s.user.username, mustChange: !!s.user.mustChange } });
});

const admin = express.Router();
admin.use(auth.requireAuth);
admin.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  // bắt buộc đổi mật khẩu lần đầu trước khi làm gì khác
  if (req.user.mustChange && !(req.method === 'POST' && req.path === '/password')) {
    return res.status(403).json({ error: 'Bạn cần đổi mật khẩu trước khi tiếp tục.', mustChange: true });
  }
  next();
});

/* ---- mật khẩu & tài khoản ---- */
admin.post('/password', wrap((req, res) => {
  const { current, next } = req.body || {};
  if (!auth.verifyPassword(String(current || ''), req.user.hash)) return res.status(400).json({ error: 'Mật khẩu hiện tại chưa đúng.' });
  if (typeof next !== 'string' || next.length < 8) return res.status(400).json({ error: 'Mật khẩu mới cần ít nhất 8 ký tự.' });
  if (next === current) return res.status(400).json({ error: 'Mật khẩu mới phải khác mật khẩu cũ.' });
  auth.setPassword(req.user.id, next, false);
  const fresh = auth.users.byId(req.user.id);
  const csrf = auth.startSession(req, res, fresh); // giữ phiên hiện tại sau khi đổi
  try { fs.unlinkSync(path.join(store.DATA_DIR, 'MAT-KHAU-QUAN-TRI.txt')); } catch (e) { /* không có thì thôi */ }
  res.json({ ok: true, csrf });
}));

admin.get('/users', wrap((req, res) => {
  res.json(auth.users.all().map((u) => ({ id: u.id, username: u.username, createdAt: u.createdAt, self: u.id === req.user.id })));
}));

admin.post('/users', wrap((req, res) => {
  const { username, password } = req.body || {};
  const name = cut(username, 40);
  if (!/^[A-Za-z0-9._-]{3,40}$/.test(name)) return res.status(400).json({ error: 'Tên đăng nhập gồm 3–40 ký tự: chữ không dấu, số, dấu . _ -' });
  if (typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'Mật khẩu cần ít nhất 8 ký tự.' });
  if (auth.users.byName(name)) return res.status(400).json({ error: 'Tên đăng nhập này đã tồn tại.' });
  auth.createUser(name, password, { mustChange: true });
  res.json({ ok: true });
}));

admin.delete('/users/:id', wrap((req, res) => {
  const list = auth.users.all();
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Không thể tự xóa tài khoản đang đăng nhập.' });
  if (!list.some((u) => u.id === req.params.id)) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
  auth.users.save(list.filter((u) => u.id !== req.params.id));
  res.json({ ok: true });
}));

/* ---- dự án ---- */
admin.get('/meta', (req, res) => {
  res.json({ kinds: site.KINDS, groups: site.GROUPS });
});

admin.get('/projects', (req, res) => res.json(site.getProjects()));

admin.post('/projects', wrap((req, res) => {
  const list = site.getProjects();
  const { value, errors } = site.cleanProject(req.body || {});
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });
  value.slug = site.uniqueSlug(value.name, list);
  list.push(value);
  store.write('projects', list);
  res.json(value);
}));

admin.post('/projects/reorder', wrap((req, res) => {
  const slugs = Array.isArray((req.body || {}).slugs) ? req.body.slugs : [];
  const list = site.getProjects();
  const by = new Map(list.map((p) => [p.slug, p]));
  if (slugs.length !== list.length || !slugs.every((s) => by.has(s)) || new Set(slugs).size !== slugs.length) {
    return res.status(400).json({ error: 'Danh sách sắp xếp không khớp, hãy tải lại trang.' });
  }
  store.write('projects', slugs.map((s) => by.get(s)));
  res.json({ ok: true });
}));

admin.put('/projects/:slug', wrap((req, res) => {
  const list = site.getProjects();
  const i = list.findIndex((p) => p.slug === req.params.slug);
  if (i < 0) return res.status(404).json({ error: 'Không tìm thấy dự án.' });
  const { value, errors } = site.cleanProject(req.body || {});
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });
  value.slug = list[i].slug;
  list[i] = value;
  store.write('projects', list);
  site.sweepUploads();
  res.json(value);
}));

admin.delete('/projects/:slug', wrap((req, res) => {
  const list = site.getProjects();
  if (!list.some((p) => p.slug === req.params.slug)) return res.status(404).json({ error: 'Không tìm thấy dự án.' });
  store.write('projects', list.filter((p) => p.slug !== req.params.slug));
  site.sweepUploads();
  res.json({ ok: true });
}));

/* ---- tải ảnh lên ---- */
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024, files: 1 } });
function sniff(buf) {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 12 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 12 && buf.slice(0, 4).toString('latin1') === 'RIFF' && buf.slice(8, 12).toString('latin1') === 'WEBP') return 'webp';
  return null;
}
admin.post('/upload', upload.single('file'), wrap((req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Chưa chọn ảnh.' });
  const ext = sniff(req.file.buffer);
  if (!ext) return res.status(400).json({ error: 'Chỉ nhận ảnh JPG, PNG hoặc WebP.' });
  const name = crypto.randomBytes(12).toString('hex') + '.' + ext;
  fs.writeFileSync(path.join(store.UPLOAD_DIR, name), req.file.buffer);
  res.json({ path: 'uploads/' + name });
}));

/* ---- thông tin công ty ---- */
admin.get('/settings', (req, res) => res.json(site.getSettings()));
admin.put('/settings', wrap((req, res) => {
  const { value, errors } = site.cleanSettings(req.body || {});
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });
  site.saveSettings(value);
  res.json(value);
}));

/* ---- tin nhắn từ khách ---- */
admin.get('/messages', (req, res) => res.json(site.getMessages()));

admin.get('/messages.csv', wrap((req, res) => {
  const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const guard = (v) => (/^[=+\-@]/.test(String(v)) ? "'" + v : v); // chặn công thức Excel
  const rows = [['Thời gian', 'Loại', 'Họ tên', 'Điện thoại', 'Nhu cầu / Hạng mục', 'Nội dung / Dự toán']];
  site.getMessages().forEach((m) => {
    const detail = m.kind === 'estimate' && m.est
      ? m.est.province + ' | ' + m.est.pack + ' | ' + m.est.area + ' m² | ' + m.est.total
      : (m.note || '');
    rows.push([m.at, m.kind === 'estimate' ? 'Đăng ký dự toán' : 'Liên hệ', m.name || '', m.phone, m.need || '', detail]);
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="tin-nhan-viocons.csv"');
  res.send('﻿' + rows.map((r) => r.map((c) => q(guard(c))).join(',')).join('\r\n'));
}));

admin.post('/messages/:id/read', wrap((req, res) => {
  const list = site.getMessages();
  const m = list.find((x) => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Không tìm thấy tin nhắn.' });
  m.read = !!(req.body || {}).read;
  store.write('messages', list);
  res.json({ ok: true });
}));

admin.delete('/messages/:id', wrap((req, res) => {
  const list = site.getMessages();
  if (!list.some((x) => x.id === req.params.id)) return res.status(404).json({ error: 'Không tìm thấy tin nhắn.' });
  store.write('messages', list.filter((x) => x.id !== req.params.id));
  res.json({ ok: true });
}));

/* ---- sao lưu dữ liệu (không gồm mật khẩu) ---- */
admin.get('/backup', wrap((req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="viocons-du-lieu-' + new Date().toISOString().slice(0, 10) + '.json"');
  res.json({ exportedAt: new Date().toISOString(), settings: site.getSettings(), projects: site.getProjects(), messages: site.getMessages() });
}));

app.use('/api/admin', admin);
app.use('/api', (req, res) => res.status(404).json({ error: 'Không tìm thấy.' }));

/* =====================================================================
   Trang quản trị (giao diện)
   ===================================================================== */
const ADMIN_DIR = path.join(__dirname, 'admin');
app.use('/quan-tri', (req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
});
// (express.static tự chuyển /quan-tri sang /quan-tri/)
app.use('/quan-tri', express.static(ADMIN_DIR, { index: 'index.html', extensions: false, redirect: true }));

/* =====================================================================
   Website công khai
   ===================================================================== */
const ROOT = site.ROOT;
const noCache = (res) => res.setHeader('Cache-Control', 'no-cache');

app.get('/js/projects.js', (req, res) => {
  noCache(res);
  res.type('application/javascript; charset=utf-8').send(site.projectsJs());
});
app.get('/js/main.js', wrap((req, res) => {
  noCache(res);
  res.type('application/javascript; charset=utf-8').send(site.renderFile(path.join(ROOT, 'js', 'main.js'), 'js'));
}));

const staticOpts = (age) => ({ maxAge: age, etag: true, index: false, dotfiles: 'ignore', setHeaders: (res, p) => { if (/\.(js|css)$/.test(p)) noCache(res); } });
app.use('/css', express.static(path.join(ROOT, 'css'), staticOpts(0)));
app.use('/js', express.static(path.join(ROOT, 'js'), staticOpts(0)));
app.use('/assets', express.static(path.join(ROOT, 'assets'), staticOpts('7d')));
app.use('/uploads', express.static(store.UPLOAD_DIR, { maxAge: '30d', immutable: true, index: false, dotfiles: 'ignore' }));

function sendPage(name, req, res, next) {
  const abs = path.join(ROOT, name);
  if (!fs.existsSync(abs)) return next();
  noCache(res);
  res.type('html').send(site.renderFile(abs, 'html'));
}
app.get('/', (req, res, next) => sendPage('index.html', req, res, next));
app.get('/:page.html', (req, res, next) => {
  if (!/^[a-z0-9-]+$/.test(req.params.page)) return next();
  sendPage(req.params.page + '.html', req, res, next);
});

app.use((req, res) => {
  res.status(404).type('html').send('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Không tìm thấy — VIOCONS</title><body style="font-family:Arial,sans-serif;text-align:center;padding:15vh 20px"><h1>404</h1><p>Không tìm thấy trang này.</p><p><a href="/">Về trang chủ VIOCONS</a></p></body>');
});

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err && err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Ảnh quá lớn (tối đa 12 MB).' });
  if (err && err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Dữ liệu gửi lên không đọc được.' });
  console.error(err);
  if (req.path.startsWith('/api')) return res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại.' });
  res.status(500).send('Lỗi máy chủ.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('VIOCONS đang chạy tại http://localhost:' + PORT + '  —  khu quản trị: /quan-tri'));
module.exports = app;
