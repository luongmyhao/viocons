# Hướng dẫn dùng khu quản trị website VIOCONS

Dành cho người của công ty cập nhật website — không cần biết lập trình.

## Đăng nhập

1. Mở `https://xaydungviocons.com.vn/quan-tri` (thêm `/quan-tri` sau tên miền).
2. Nhập tên đăng nhập và mật khẩu do người cài đặt website cấp.
3. Lần đầu đăng nhập, hệ thống yêu cầu **đổi mật khẩu** sang mật khẩu của riêng bạn (ít nhất 8 ký tự).

Hết 8 giờ hoặc khi bấm **Đăng xuất**, bạn cần đăng nhập lại.

## Thêm dự án mới

1. Vào **Dự án** → **+ Thêm dự án**.
2. Điền **Tên dự án**, chọn **Nhóm công trình** (dân dụng / công cộng) và **Loại hạng mục**. Các mục còn lại (địa điểm, chủ đầu tư, tình trạng, nguồn vốn, quy mô, thời gian, mô tả) điền được càng nhiều càng tốt; mục nào để trống thì website tự ẩn.
3. **Ảnh đại diện**: chọn một ảnh ngang đẹp nhất của công trình.
4. **Thư viện ảnh**: bấm **+ Thêm ảnh**, chọn nhiều ảnh cùng lúc. Ảnh lớn được tự thu nhỏ. Dùng nút ← → để đổi thứ tự, ★ để chọn làm ảnh đại diện, ✕ để bỏ ảnh.
5. Bấm **Thêm dự án**. Dự án xuất hiện trên website ngay lập tức.

## Sửa, sắp xếp, ẩn, xóa dự án

- **Sửa**: bấm *Sửa* cạnh dự án, thay đổi rồi *Lưu thay đổi*.
- **Sắp xếp**: dùng nút ↑ ↓. Thứ tự này chính là thứ tự hiển thị trên trang chủ và trang Dự án.
- **Ẩn tạm thời**: trong trang sửa, tích *Ẩn dự án này khỏi website* — dự án vẫn được giữ lại.
- **Xóa**: bấm *Xóa* (có hỏi lại, không hoàn tác được).
- **Xem**: mở trang chi tiết dự án trên website để kiểm tra.

## Thông tin công ty

Vào **Thông tin công ty** để đổi số điện thoại, email, địa chỉ, liên kết Facebook / Messenger / Zalo. Bấm **Lưu thông tin** — mọi trang (menu, nút gọi nhanh, chân trang, form liên hệ) đổi theo ngay.

## Tin nhắn từ khách

Khi khách điền **form liên hệ** hoặc **đăng ký dự toán** trên website, thông tin hiện ở mục **Tin nhắn từ khách** (kèm số điện thoại bấm để gọi, số tin mới hiện ở biểu tượng cam).

- *Đánh dấu đã đọc* khi đã xử lý; *Xóa* khi không cần nữa.
- **Tải về (Excel/CSV)** để lưu toàn bộ danh sách.

## Tài khoản

- **Đổi mật khẩu** của bạn.
- **Thêm người quản trị** khác: nhập tên đăng nhập (không dấu) và mật khẩu tạm; người đó sẽ phải đổi mật khẩu khi đăng nhập lần đầu.
- **Sao lưu dữ liệu**: tải về file JSON chứa dự án, thông tin công ty, tin nhắn. Nên làm mỗi tháng một lần.

## Lưu ý

- Ảnh: định dạng JPG, PNG hoặc WebP. Nên dùng ảnh ngang, rõ nét.
- Nếu thấy thông báo "phiên đã hết hạn", chỉ cần đăng nhập lại.
- Nội dung cố định của các trang (bài giới thiệu, mô tả dịch vụ, ảnh slide đầu trang) chưa sửa được trong khu quản trị — cần nhờ người lập website cập nhật.
- Quên mật khẩu: nhờ người quản lý hosting chạy lệnh `node scripts/create-admin.js <tên-đăng-nhập>` để cấp mật khẩu tạm mới.
