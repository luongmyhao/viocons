'use strict';
/* Tạo tài khoản quản trị hoặc đặt lại mật khẩu:
     node scripts/create-admin.js <tên-đăng-nhập> [mật-khẩu]
   Không nhập mật khẩu thì hệ thống tự sinh một mật khẩu ngẫu nhiên. */
const auth = require('../lib/auth');

const name = process.argv[2];
if (!name || !/^[A-Za-z0-9._-]{3,40}$/.test(name)) {
  console.log('Cách dùng: node scripts/create-admin.js <tên-đăng-nhập> [mật-khẩu]');
  process.exit(1);
}
const pw = process.argv[3] || auth.randomPassword();
if (pw.length < 8) { console.log('Mật khẩu cần ít nhất 8 ký tự.'); process.exit(1); }

const existing = auth.users.byName(name);
if (existing) {
  auth.setPassword(existing.id, pw, true);
  console.log('Đã đặt lại mật khẩu cho "' + existing.username + '".');
} else {
  auth.createUser(name, pw, { mustChange: true });
  console.log('Đã tạo tài khoản "' + name + '".');
}
console.log('Mật khẩu tạm: ' + pw + '  (sẽ được yêu cầu đổi khi đăng nhập lần đầu)');
