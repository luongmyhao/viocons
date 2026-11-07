/* Dữ liệu dự án dùng chung (trang chủ, trang Dự án, trang chi tiết dự án). Nguồn: xaydungviocons.com.vn
   Muốn bổ sung chi tiết cho một dự án: điền các trường tùy chọn  loc / investor / scale / year / desc / gallery  */
(function () {
  var P = [
    { slug: 'eco-retreat', name: 'ECO RETREAT', meta: 'Khu nhà ở liền kề', group: 'dan-dung', kind: 'house', label: 'Dân dụng', img: 'assets/projects/pj-eco-retreat.webp?v=2' },
    { slug: 'the-grand-manhattan', name: 'The Grand Manhattan', meta: 'Công trình dân dụng', group: 'dan-dung', kind: 'house', label: 'Dân dụng', img: 'assets/projects/pj-grand-manhattan.webp?v=2' },
    { slug: 'thcs-tang-bat-ho', name: 'Sửa chữa trường THCS Tăng Bạt Hổ', meta: 'Phường Xóm Chiếu, TP. Hồ Chí Minh', loc: 'Phường Xóm Chiếu, TP. Hồ Chí Minh', group: 'cong-cong', kind: 'school', label: 'Trường học', img: 'assets/projects/pj-tang-bat-ho.webp?v=2' },
    { slug: 'mam-non-19-5', name: 'Sửa chữa trường Mầm non 19/5', meta: 'Quận 8, TP. Hồ Chí Minh', loc: 'Quận 8, TP. Hồ Chí Minh', group: 'cong-cong', kind: 'school', label: 'Trường học', img: 'assets/projects/pj-mam-non.webp?v=2' },
    { slug: 'thcs-ly-thanh-tong', name: 'Sửa chữa trường THCS Lý Thánh Tông', meta: 'Quận 8, TP. Hồ Chí Minh', loc: 'Quận 8, TP. Hồ Chí Minh', group: 'cong-cong', kind: 'school', label: 'Trường học', img: 'assets/projects/pj-ly-thanh-tong.webp?v=2' },
    { slug: 'tieu-hoc-my-loc', name: 'Sửa chữa trường Tiểu học Mỹ Lộc', meta: 'Cần Giuộc, Long An', loc: 'Cần Giuộc, Long An', group: 'cong-cong', kind: 'school', label: 'Trường học', img: 'assets/projects/pj-my-loc.webp?v=2' },
    { slug: 'duong-tinh-826c', name: 'Đường Tỉnh 826C', meta: 'Đông Thạnh, Cần Giuộc', loc: 'Đông Thạnh, Cần Giuộc', group: 'cong-cong', kind: 'road', label: 'Hạ tầng', img: 'assets/projects/duong-826c.png' },
    { slug: 'duong-tan-quy-tan-dai', name: 'Đường Tân Quý – Tân Đại', meta: 'Tân Tập, Cần Giuộc', loc: 'Tân Tập, Cần Giuộc', group: 'cong-cong', kind: 'road', label: 'Hạ tầng', img: 'assets/projects/tan-quy-tan-dai.png' },
    { slug: 'rach-bao-dinh', name: 'Rạch Bảo Định', meta: 'Mỹ Tho, Tiền Giang', loc: 'Mỹ Tho, Tiền Giang', group: 'cong-cong', kind: 'water', label: 'Hạ tầng', img: 'assets/projects/rach-bao-dinh.png' },
    { slug: 'ke-tan-thanh', name: 'Kè Tân Thành', meta: 'Gò Công Đông, Tiền Giang', loc: 'Gò Công Đông, Tiền Giang', group: 'cong-cong', kind: 'water', label: 'Hạ tầng', img: 'assets/projects/ke-tan-thanh.png' }
  ];
  window.VIOCONS_PROJECTS = P;
})();
