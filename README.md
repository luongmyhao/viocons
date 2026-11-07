# Viocons — Website

Trang web tĩnh (HTML/CSS/JS) giới thiệu dịch vụ thiết kế & thi công xây dựng của Viocons. Phong cách tối giản, hiện đại, responsive.

## Cấu trúc

```
index.html        # toàn bộ nội dung trang
css/style.css     # giao diện
js/main.js        # menu, bộ lọc dự án, máy tính chi phí, form liên hệ
assets/           # logo, favicon
```

## Chạy thử trên máy

```bash
python -m http.server 5173
# mở http://localhost:5173
```

## Cập nhật nội dung

Các thông tin sau đang là **dữ liệu mẫu**, cần thay bằng thông tin thật của Viocons:

- Hotline `0900 000 000`, email `info@viocons.vn`, địa chỉ văn phòng (trong `index.html`; email nhận form ở đầu mục "contact form" trong `js/main.js`).
- Số liệu thống kê (12 năm, 250+ công trình…) trong khối `.stats`.
- Danh sách dự án: mảng `PROJECTS` trong `js/main.js` (hiện dùng hình minh họa; thay bằng ảnh thật trong `assets/projects/`).
- Đơn giá tham khảo của máy tính chi phí: `value` của 3 ô `input[name="pack"]` trong `index.html` (VNĐ/m²).

## Triển khai

Host bằng GitHub Pages (Settings → Pages → Deploy from branch → `main` / root).
