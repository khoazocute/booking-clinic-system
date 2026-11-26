# Tài khoản, đăng nhập và thông báo

<!-- Source of truth: AuthServiceImpl, RegisterRequest, application.properties (JWT), NotificationServiceImpl. -->

## Đăng ký tài khoản
Bạn đăng ký bằng họ tên, email, số điện thoại và mật khẩu có ít nhất 6 ký tự. Mỗi email chỉ dùng cho một tài khoản. Bạn cũng có thể đăng nhập nhanh bằng tài khoản Google hoặc Facebook.

## Quên mật khẩu
Chọn Quên mật khẩu và nhập email đã đăng ký, hệ thống gửi mã OTP gồm 6 chữ số qua email. Mã có hiệu lực trong 15 phút. Mỗi lần yêu cầu mã mới phải cách lần trước ít nhất 1 phút. Nhập sai mã quá số lần cho phép thì mã bị vô hiệu và bạn cần yêu cầu mã mới.

## Phiên đăng nhập
Phiên đăng nhập được duy trì bằng mã truy cập có hiệu lực ngắn (15 phút) và được tự động gia hạn bằng mã làm mới trong tối đa 7 ngày. Sau thời gian đó, hoặc khi bạn đăng xuất, bạn cần đăng nhập lại.

## Thông báo
Hệ thống gửi thông báo trong mục Thông báo khi bạn đặt lịch thành công, khi thanh toán được ghi nhận hoặc xác nhận, khi bác sĩ xác nhận lịch hẹn và khi lịch hẹn bị huỷ. Bác sĩ cũng nhận thông báo khi có bệnh nhân đặt lịch mới. Thông báo hiển thị theo thời gian thực khi bạn đang mở website.

## Vai trò người dùng
Hệ thống có ba vai trò: bệnh nhân đặt và quản lý lịch hẹn của mình; bác sĩ quản lý lịch làm việc, xác nhận lịch hẹn, lập bệnh án và kê đơn; quản trị viên quản lý chuyên khoa, bác sĩ, thuốc, lịch hẹn và xác nhận thanh toán.
