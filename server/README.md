# VIOCONS — Máy chủ web động + khu quản trị

Máy chủ Node.js (Express) phục vụ website VIOCONS và khu quản trị tại `/quan-tri`, để **người của công ty tự cập nhật** dự án, hình ảnh, thông tin liên hệ và xem tin nhắn khách gửi — không cần sửa code.

- Trang công khai: các file HTML/CSS/JS ở thư mục cha (`../index.html`, `../css`, `../js`, `../assets`).
- Dữ liệu: lưu thành file JSON trong `server/data/` (không cần cài cơ sở dữ liệu).
- Ảnh tải lên: `server/data/uploads/`.
- Cùng bộ file vẫn chạy được như web tĩnh (GitHub Pages): khi đó dự án lấy từ `js/projects.js` và form liên hệ mở email.

## Chạy thử trên máy

Cần Node.js 18 trở lên (https://nodejs.org).

```bash
cd server
npm install
npm start
# mở http://localhost:3000   (khu quản trị: http://localhost:3000/quan-tri)
```

Lần chạy đầu tiên hệ thống tạo tài khoản `admin` với mật khẩu ngẫu nhiên, in ra màn hình và lưu trong `server/data/MAT-KHAU-QUAN-TRI.txt`. Đăng nhập, hệ thống yêu cầu đổi mật khẩu (file này tự xóa sau khi đổi).

Quên mật khẩu / thêm người quản trị từ dòng lệnh:

```bash
node scripts/create-admin.js <ten-dang-nhap> [mat-khau]
```

## Triển khai lên hosting (cPanel có "Setup Node.js App")

Tên miền `xaydungviocons.com.vn` hiện chạy một ứng dụng Next.js cũ (có `/admin` riêng). Việc chuyển sang bản này sẽ **thay thế hoàn toàn** web cũ, nên làm theo thứ tự:

1. **Sao lưu web cũ** (nén toàn bộ thư mục + xuất cơ sở dữ liệu nếu có). Lưu lại các bài viết/dữ liệu muốn giữ.
2. Tải toàn bộ dự án này lên hosting, ví dụ vào thư mục `~/viocons/` (gồm `index.html`, `css`, `js`, `assets` và thư mục `server`). Có thể tải bằng Git: `git clone https://github.com/luongmyhao/viocons.git viocons`.
3. Trong cPanel → **Setup Node.js App** → *Create Application* (hoặc sửa ứng dụng Next.js cũ):
   - Node.js version: 18 trở lên
   - Application mode: Production
   - Application root: `viocons/server`
   - Application URL: `xaydungviocons.com.vn`
   - Application startup file: `server.js`
4. Thêm biến môi trường (Environment variables):
   - `VIOCONS_DATA` = đường dẫn thư mục dữ liệu **nằm ngoài** thư mục mã nguồn, ví dụ `/home/TENTAIKHOAN/viocons-data` (để cập nhật mã nguồn không bao giờ ghi đè dữ liệu).
   - (tùy chọn) `VIOCONS_ADMIN_PASSWORD` = mật khẩu ban đầu cho `admin` (nếu không đặt, mật khẩu ngẫu nhiên sẽ nằm trong `MAT-KHAU-QUAN-TRI.txt` ở thư mục dữ liệu).
5. Bấm **Run NPM Install**, rồi **Restart**.
6. Vào `https://xaydungviocons.com.vn/quan-tri` đăng nhập, đổi mật khẩu.
7. **Bắt buộc dùng HTTPS** (bật AutoSSL trong cPanel) để cookie đăng nhập được bảo vệ.

Nếu hosting không có Node.js: cần chuyển sang VPS hoặc nhà cung cấp có Node.js (ví dụ Render, Railway, Fly.io, VPS chạy `pm2`/`systemd`). Khi chạy sau Nginx/Apache, giữ nguyên cấu hình `trust proxy` mặc định hoặc đặt biến `TRUST_PROXY`.

### Cập nhật mã nguồn sau này

`git pull` trong thư mục dự án → `npm install` (nếu có thay đổi thư viện) → Restart ứng dụng. Dữ liệu quản trị không bị ảnh hưởng vì nằm ở `VIOCONS_DATA`.

### Sao lưu

Định kỳ sao chép thư mục `VIOCONS_DATA` (gồm `*.json` và `uploads/`), hoặc dùng nút **Tải bản sao lưu** trong khu quản trị (không gồm ảnh).

## Bảo mật (tóm tắt)

- Mật khẩu băm `scrypt`; phiên đăng nhập là cookie `HttpOnly`, `SameSite=Strict`, hết hạn sau 8 giờ; có token chống CSRF và kiểm tra `Origin`.
- Giới hạn số lần đăng nhập sai (8 lần / 15 phút / IP) và số lần gửi form liên hệ (6 lần / 10 phút / IP); ô bẫy chống thư rác.
- Ảnh tải lên được kiểm tra bằng chữ ký file (chỉ JPG/PNG/WebP), đổi tên ngẫu nhiên, không thể chạy như mã.
- Khu quản trị có `Content-Security-Policy` chặt, nội dung nhập luôn được hiển thị dạng văn bản (chống XSS).
- Chỉ các thư mục `css`, `js`, `assets`, `uploads` và các trang `.html` được phục vụ; `server/`, `.git`, dữ liệu không thể tải từ ngoài.

## Cấu trúc

```
server/
  server.js            # máy chủ, API, định tuyến
  lib/store.js         # lưu/đọc JSON nguyên tử
  lib/auth.js          # mật khẩu, phiên, CSRF, giới hạn tần suất
  lib/site.js          # cài đặt công ty, dự án, tin nhắn, thay thông tin liên hệ vào trang
  admin/               # giao diện quản trị (index.html, admin.js, admin.css)
  scripts/create-admin.js
  data/                # (tự tạo, không đưa lên Git) dữ liệu + ảnh tải lên
```
