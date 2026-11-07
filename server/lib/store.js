'use strict';
/* Kho dữ liệu dạng file JSON (ghi nguyên tử: ghi file tạm rồi đổi tên) — đủ cho website doanh nghiệp, không cần cài cơ sở dữ liệu. */
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.VIOCONS_DATA ? path.resolve(process.env.VIOCONS_DATA) : path.join(__dirname, '..', 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const cache = Object.create(null);
const fileOf = (name) => path.join(DATA_DIR, name + '.json');

function exists(name) {
  return fs.existsSync(fileOf(name));
}

function read(name, fallback) {
  if (!(name in cache)) {
    try {
      cache[name] = JSON.parse(fs.readFileSync(fileOf(name), 'utf8'));
    } catch (e) {
      cache[name] = typeof fallback === 'function' ? fallback() : fallback;
    }
  }
  return structuredClone(cache[name]);
}

function write(name, value) {
  cache[name] = structuredClone(value);
  const f = fileOf(name);
  const tmp = f + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2), 'utf8');
  fs.renameSync(tmp, f);
}

module.exports = { DATA_DIR, UPLOAD_DIR, exists, read, write };
