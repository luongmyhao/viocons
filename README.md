# VIOCONS — Website

Trang web tĩnh (HTML/CSS/JS) của CÔNG TY TNHH THƯƠNG MẠI XÂY DỰNG VIOCONS. Phong cách tối giản, hiện đại, responsive. Nội dung lấy từ website gốc https://xaydungviocons.com.vn/.

## Cấu trúc

```
index.html        # toàn bộ nội dung trang
css/style.css     # giao diện
js/main.js        # menu, danh sách & bộ lọc dự án, form liên hệ
assets/           # logo, favicon
```

## Chạy thử trên máy

```bash
python -m http.server 5173
# mở http://localhost:5173
```

## Cập nhật nội dung

- Thông tin liên hệ: trong `index.html` (mục `#lien-he` và footer); email nhận form ở `TO` trong `js/main.js`.
- Dự án: mảng `PROJECTS` trong `js/main.js`. Ảnh dự án nằm trong `assets/projects/`; để đổi ảnh, thay file cùng tên.
- Trang Giới thiệu (`gioi-thieu.html`): ảnh kỹ sư đặt trong `assets/team/` với đúng tên `giam-doc.jpg`, `chi-huy-truong.jpg`, `ky-su-dan-dung.jpg`, `ky-su-dien.jpg` (tỉ lệ khung 3:4); ảnh sẽ tự thay khung trống. Đổi "Họ và tên" dưới mỗi ảnh trực tiếp trong `gioi-thieu.html`.
- Form liên hệ mở ứng dụng email với nội dung điền sẵn (GitHub Pages không nhận dữ liệu form).

## Triển khai

GitHub Pages (Settings → Pages → Deploy from branch → `main` / root): https://luongmyhao.github.io/viocons/
