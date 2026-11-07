'use strict';
/* Dữ liệu website: cài đặt công ty, dự án (hạt giống lấy từ js/projects.js), tin nhắn; kiểm tra dữ liệu; thay thông tin liên hệ vào trang. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const store = require('./store');

const ROOT = path.resolve(__dirname, '..', '..');

/* ================= Cài đặt công ty ================= */
const DEFAULT_SETTINGS = {
  phone1: '0979.001.455',
  phone2: '0981.874.990',
  email: 'xaydungviocons@gmail.com',
  address1: 'F3/31F, Ấp 69, Xã Vĩnh Lộc, TP. Hồ Chí Minh',
  address2: '160 Nguyễn Tất Thành, Thôn Đăk Mâm, Xã Krông Nô, Tỉnh Lâm Đồng',
  facebook: 'https://www.facebook.com/xaydungviocons/',
  messenger: 'https://m.me/xaydungviocons',
  zalo: 'https://zalo.me/2561762295819266198',
};

let settingsVersion = 0;
const getSettings = () => Object.assign({}, DEFAULT_SETTINGS, store.read('settings', {}));

const isUrl = (s) => /^https:\/\/[^\s"'<>]{4,300}$/.test(s);
function cleanSettings(input) {
  const out = {};
  const errors = [];
  const str = (k, label, max, required) => {
    const v = String(input[k] == null ? '' : input[k]).replace(/\s+/g, ' ').trim();
    if (!v) { if (required) errors.push(label + ' không được để trống.'); out[k] = DEFAULT_SETTINGS[k]; return v; }
    if (v.length > max) errors.push(label + ' quá dài.');
    out[k] = v;
    return v;
  };
  const phone = (k, label) => {
    const v = str(k, label, 20, true);
    if (v && !/^[0-9+ .()-]{8,20}$/.test(v)) errors.push(label + ' không hợp lệ (chỉ gồm số, dấu chấm, khoảng trắng).');
  };
  phone('phone1', 'Số điện thoại 1');
  phone('phone2', 'Số điện thoại 2');
  const em = str('email', 'Email', 120, true);
  if (em && !/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(em)) errors.push('Email không hợp lệ.');
  str('address1', 'Địa chỉ trụ sở', 200, true);
  str('address2', 'Địa chỉ văn phòng đại diện', 200, true);
  [['facebook', 'Liên kết Facebook'], ['messenger', 'Liên kết Messenger'], ['zalo', 'Liên kết Zalo']].forEach(([k, label]) => {
    const v = str(k, label, 300, true);
    if (v && !isUrl(v)) errors.push(label + ' phải bắt đầu bằng https://');
  });
  return { value: out, errors };
}
function saveSettings(v) {
  store.write('settings', v);
  settingsVersion++;
}

/* ================= Dự án ================= */
const KINDS = {
  house: { label: 'Dân dụng', name: 'Nhà ở / Dân dụng' },
  school: { label: 'Trường học', name: 'Trường học' },
  road: { label: 'Hạ tầng', name: 'Đường giao thông' },
  water: { label: 'Hạ tầng', name: 'Kè / Thủy lợi' },
};
const GROUPS = { 'dan-dung': 'Công trình dân dụng', 'cong-cong': 'Công trình công cộng' };
const IMG_RE = /^(assets|uploads)\/[A-Za-z0-9_\-/.]+(\?v=\d+)?$/;
const okImg = (s) => typeof s === 'string' && IMG_RE.test(s) && !s.includes('..');

function seedProjects() {
  const src = fs.readFileSync(path.join(ROOT, 'js', 'projects.js'), 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(src, sandbox, { timeout: 1000 });
  return Array.isArray(sandbox.window.VIOCONS_PROJECTS) ? sandbox.window.VIOCONS_PROJECTS : [];
}
const getProjects = () => store.read('projects', []);

function slugify(s) {
  return String(s).toLowerCase().replace(/đ/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'du-an';
}

function cleanProject(input, existing) {
  const errors = [];
  const t = (k, max) => {
    const v = String(input[k] == null ? '' : input[k]).replace(/[ \t]+/g, ' ').trim();
    if (v.length > max) errors.push('Mục "' + k + '" quá dài (tối đa ' + max + ' ký tự).');
    return v;
  };
  const p = {
    name: t('name', 150),
    loc: t('loc', 200),
    client: t('client', 250),
    status: t('status', 60),
    funding: t('funding', 60),
    scale: t('scale', 120),
    year: t('year', 40),
    desc: String(input.desc == null ? '' : input.desc).replace(/\r/g, '').trim(),
  };
  if (p.desc.length > 4000) errors.push('Phần mô tả quá dài (tối đa 4000 ký tự).');
  if (!p.name) errors.push('Cần nhập tên dự án.');
  p.group = GROUPS[input.group] ? input.group : null;
  if (!p.group) errors.push('Cần chọn nhóm công trình.');
  const kind = KINDS[input.kind] ? input.kind : null;
  if (!kind) errors.push('Cần chọn loại hạng mục.');
  p.kind = kind || 'house';
  p.label = KINDS[p.kind].label;
  p.meta = p.loc || p.label;
  if (input.img && !okImg(input.img)) errors.push('Ảnh đại diện không hợp lệ.');
  p.img = okImg(input.img) ? input.img : '';
  const g = Array.isArray(input.gallery) ? input.gallery : [];
  if (g.length > 40) errors.push('Tối đa 40 ảnh trong thư viện.');
  if (g.some((x) => !okImg(x))) errors.push('Có ảnh trong thư viện không hợp lệ.');
  p.gallery = g.filter(okImg).slice(0, 40);
  p.hidden = !!input.hidden;
  if (!p.img && p.gallery.length) p.img = p.gallery[0];
  return { value: p, errors };
}

function uniqueSlug(name, list) {
  const base = slugify(name);
  let s = base, i = 2;
  while (list.some((x) => x.slug === s)) s = base + '-' + i++;
  return s;
}

/* Xóa file ảnh đã tải lên mà không còn dự án nào dùng */
function sweepUploads(extraKeep) {
  const used = new Set(extraKeep || []);
  getProjects().forEach((p) => { [p.img].concat(p.gallery || []).forEach((x) => used.add(String(x).split('?')[0])); });
  let names = [];
  try { names = fs.readdirSync(store.UPLOAD_DIR); } catch (e) { return; }
  const cutoff = Date.now() - 24 * 60 * 60 * 1000; // chỉ dọn file cũ hơn 1 ngày (tránh xóa ảnh vừa tải lên, chưa lưu)
  names.forEach((n) => {
    if (!/^[a-f0-9]{16,}\.(jpg|png|webp)$/.test(n) || used.has('uploads/' + n)) return;
    const f = path.join(store.UPLOAD_DIR, n);
    try { if (fs.statSync(f).mtimeMs < cutoff) fs.unlinkSync(f); } catch (e) { /* bỏ qua */ }
  });
}

/* ================= Tin nhắn từ khách ================= */
const getMessages = () => store.read('messages', []);
function addMessage(m) {
  const list = getMessages();
  m.id = crypto.randomBytes(6).toString('hex');
  m.at = new Date().toISOString();
  m.read = false;
  list.unshift(m);
  store.write('messages', list.slice(0, 5000));
  return m;
}

/* ================= Khởi tạo lần đầu ================= */
function init() {
  if (!store.exists('projects')) store.write('projects', seedProjects());
  if (!store.exists('settings')) store.write('settings', DEFAULT_SETTINGS);
  if (!store.exists('messages')) store.write('messages', []);
}

/* ================= Đưa dữ liệu vào trang công khai ================= */
function publicProjects() {
  return getProjects().filter((p) => !p.hidden).map((p) => {
    const o = Object.assign({}, p);
    delete o.hidden;
    if (!o.gallery || !o.gallery.length) delete o.gallery;
    Object.keys(o).forEach((k) => { if (o[k] === '' || o[k] == null) delete o[k]; });
    return o;
  });
}
function projectsJs() {
  const json = JSON.stringify(publicProjects()).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return '/* Tạo tự động từ khu quản trị — đừng sửa tay */\n(function () { window.VIOCONS_PROJECTS = ' + json + '; })();\n';
}

const escHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const escJs = (s) => String(s).replace(/[\\'"<>\n\r\u2028\u2029]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const telOf = (s) => String(s).replace(/[^0-9+]/g, '');
const D = DEFAULT_SETTINGS;

/* Thay thông tin liên hệ mặc định (viết sẵn trong trang) bằng thông tin trong phần cài đặt. mode: 'html' | 'js' */
function applySettings(text, mode) {
  const s = getSettings();
  const esc = mode === 'js' ? escJs : escHtml;
  const rep = (from, to) => { if (from !== to) text = text.split(from).join(to); };
  // địa chỉ (chuỗi dài trước)
  rep('160 Nguyễn Tất Thành, Thôn Đăk Mâm, Xã Krông Nô, Lâm Đồng', esc(s.address2));
  rep(D.address2, esc(s.address2));
  rep(D.address1, esc(s.address1));
  if (s.address1 !== D.address1) {
    const q = encodeURIComponent(s.address1.replace(/[,.]/g, ''));
    text = text.replace(/maps\/search\/\?api=1&amp;query=[^"'\s<]*/g, 'maps/search/?api=1&amp;query=' + q);
  }
  // điện thoại (dạng có dấu chấm và dạng liền)
  rep(telOf(D.phone1), esc(telOf(s.phone1)));
  rep(telOf(D.phone2), esc(telOf(s.phone2)));
  rep(D.phone1, esc(s.phone1));
  rep(D.phone2, esc(s.phone2));
  rep(D.email, esc(s.email));
  rep(D.facebook, esc(s.facebook));
  rep(D.messenger, esc(s.messenger));
  rep(D.zalo, esc(s.zalo));
  return text;
}

const pageCache = new Map();
function renderFile(abs, mode) {
  const st = fs.statSync(abs);
  const key = abs;
  const hit = pageCache.get(key);
  if (hit && hit.m === st.mtimeMs && hit.v === settingsVersion) return hit.out;
  const out = applySettings(fs.readFileSync(abs, 'utf8'), mode);
  pageCache.set(key, { m: st.mtimeMs, v: settingsVersion, out });
  return out;
}

module.exports = {
  ROOT, DEFAULT_SETTINGS, KINDS, GROUPS, init,
  getSettings, cleanSettings, saveSettings,
  getProjects, cleanProject, uniqueSlug, sweepUploads,
  getMessages, addMessage,
  projectsJs, renderFile,
};
