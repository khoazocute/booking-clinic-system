# Hướng dẫn đặt lịch và thanh toán

<!-- Source of truth: AppointmentServiceImpl, PaymentServiceImpl, AppointmentExpiryScheduler. Update together. -->

## Chuẩn bị tài khoản và hồ sơ bệnh nhân
Để đặt lịch, bạn cần đăng nhập bằng tài khoản bệnh nhân và có hồ sơ bệnh nhân. Hồ sơ gồm họ tên, số điện thoại, ngày sinh, giới tính, địa chỉ, nhóm máu, số căn cước, số thẻ bảo hiểm y tế, số điện thoại người liên hệ khẩn cấp và ghi chú tiền sử bệnh. Nếu hệ thống báo chưa có hồ sơ bệnh nhân, hãy vào mục Hồ sơ để cập nhật rồi đặt lịch lại.

## Tìm bác sĩ phù hợp
Bạn có thể tìm bác sĩ theo chuyên khoa hoặc theo tên. Trang thông tin bác sĩ hiển thị chuyên khoa, trình độ, số năm kinh nghiệm, phòng khám, phí khám và điểm đánh giá trung bình của bệnh nhân. Chỉ những bác sĩ đang hoạt động và có giấy phép hành nghề còn hiệu lực mới nhận đặt lịch. Nếu chưa biết nên khám chuyên khoa nào, bạn có thể mô tả triệu chứng cho trợ lý AI để được gợi ý.

## Chọn khung giờ khám
Mỗi bác sĩ có lịch làm việc chia thành các khung giờ. Bạn chỉ đặt được khung giờ còn trống. Hệ thống không cho đặt khung giờ đã qua, và một bệnh nhân không thể đặt trùng cùng một khung giờ hai lần. Khi hai người cùng đặt một khung giờ, chỉ người hoàn tất trước giữ được chỗ, người còn lại được báo khung giờ không còn trống và cần chọn giờ khác.

## Đặt lịch qua trợ lý AI
Trợ lý AI có thể gợi ý chuyên khoa, tìm bác sĩ, xem khung giờ trống và chuẩn bị một đề xuất lịch khám. Đề xuất chưa phải là lịch hẹn: lịch chỉ được tạo khi bạn bấm nút "Xác nhận đặt lịch & thanh toán" trên thẻ đề xuất. Sau khi xác nhận, hệ thống giữ chỗ và chuyển bạn sang bước thanh toán.

## Thời hạn thanh toán 10 phút
Sau khi đặt, lịch hẹn ở trạng thái chờ (PENDING) và có hạn thanh toán 10 phút, hiển thị bằng đồng hồ đếm ngược ở bước thanh toán. Quá 10 phút mà chưa thanh toán, hệ thống tự động huỷ lịch hẹn và trả khung giờ về trạng thái trống.

## Phương thức thanh toán
Phí đặt lịch bằng phí khám của bác sĩ. Có ba phương thức: thanh toán qua cổng VNPay, chuyển khoản ngân hàng, hoặc tiền mặt. Thanh toán qua VNPay được ghi nhận ngay. Với chuyển khoản và tiền mặt, khoản thanh toán ở trạng thái chờ cho đến khi phòng khám xác nhận đã nhận tiền. Mỗi lịch hẹn chỉ có một khoản thanh toán phí đặt lịch.

## Sau khi thanh toán
Thanh toán xong, lịch hẹn vẫn ở trạng thái chờ cho đến khi bác sĩ xác nhận. Khi bác sĩ xác nhận, lịch chuyển sang CONFIRMED và bạn nhận được thông báo. Nếu thanh toán thất bại hoặc bị huỷ, lịch hẹn bị huỷ và khung giờ được trả lại.

## Đổi giờ khám
Hệ thống chưa có chức năng đổi giờ trực tiếp cho một lịch hẹn. Để đổi giờ, bạn huỷ lịch hiện tại rồi đặt lịch mới; khi huỷ, chính sách hoàn tiền theo thời gian được áp dụng.
