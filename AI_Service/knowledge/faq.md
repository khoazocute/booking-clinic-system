<!--
Clinic FAQ used as RAG knowledge. Every statement here is taken from the actual backend
logic (AppointmentServiceImpl, AppointmentExpiryScheduler, PaymentServiceImpl,
ReviewServiceImpl, AuthServiceImpl). Update this file whenever those rules change.
Each "## " section becomes one retrievable chunk.
-->

## Quy trình đặt lịch khám
Bệnh nhân đặt lịch theo các bước: chọn chuyên khoa hoặc bác sĩ, chọn một khung giờ còn trống (AVAILABLE) trong lịch làm việc của bác sĩ, nhập lý do khám (không bắt buộc), xác nhận đặt lịch rồi thanh toán phí khám. Cần đăng nhập bằng tài khoản bệnh nhân và hoàn thiện hồ sơ bệnh nhân trước khi đặt lịch. Không thể đặt khung giờ đã qua, và mỗi bệnh nhân không thể đặt trùng cùng một khung giờ hai lần.

## Thời hạn thanh toán sau khi đặt lịch
Sau khi đặt lịch, lịch hẹn ở trạng thái chờ (PENDING) và bệnh nhân có 10 phút để thanh toán phí đặt lịch. Nếu quá 10 phút chưa thanh toán, hệ thống tự động huỷ lịch hẹn và trả khung giờ về trạng thái trống cho người khác đặt.

## Phí khám và phương thức thanh toán
Phí đặt lịch bằng đúng phí khám (consultation fee) của bác sĩ được chọn, hiển thị trên trang thông tin bác sĩ. Có thể thanh toán trực tuyến qua cổng VNPay. Sau khi thanh toán, lịch hẹn vẫn ở trạng thái chờ cho đến khi bác sĩ xác nhận.

## Trạng thái lịch hẹn
Lịch hẹn mới tạo ở trạng thái PENDING (chờ thanh toán và chờ bác sĩ xác nhận). Bác sĩ xác nhận thì chuyển sang CONFIRMED. Sau buổi khám, lịch hẹn được đánh dấu COMPLETED. Lịch hẹn có thể bị CANCELLED khi bệnh nhân huỷ, khi quá hạn thanh toán, hoặc khi ngày khám đã qua mà lịch vẫn chưa được thực hiện.

## Chính sách huỷ lịch và hoàn tiền
Bệnh nhân có thể huỷ lịch hẹn đang ở trạng thái PENDING hoặc CONFIRMED. Số tiền hoàn lại phụ thuộc vào thời gian còn lại trước giờ khám: huỷ trước hơn 24 giờ được hoàn 100% phí đã thanh toán; huỷ trong khoảng từ 6 đến 24 giờ trước giờ khám được hoàn 40%; huỷ trong vòng 6 giờ trước giờ khám thì không được hoàn tiền. Tiền hoàn được cộng vào ví (wallet) của bệnh nhân trong hệ thống.

## Đánh giá bác sĩ sau khi khám
Bệnh nhân chỉ có thể viết đánh giá cho bác sĩ sau khi lịch hẹn đã hoàn thành (COMPLETED), và mỗi lịch hẹn chỉ được đánh giá một lần. Điểm đánh giá trung bình của bác sĩ được hiển thị công khai.

## Hồ sơ bệnh án và đơn thuốc
Sau buổi khám, bác sĩ lập hồ sơ bệnh án (triệu chứng, chẩn đoán, hướng điều trị, ngày tái khám nếu có) và có thể kê đơn thuốc. Bệnh nhân xem hồ sơ bệnh án và đơn thuốc của mình trong mục tài khoản. Trợ lý AI không kê đơn và không thay thế chẩn đoán của bác sĩ.

## Thông báo
Hệ thống gửi thông báo khi đặt lịch thành công, khi bác sĩ xác nhận hoặc thay đổi trạng thái lịch hẹn. Bệnh nhân xem thông báo trong mục Thông báo trên website.

## Đăng nhập và quên mật khẩu
Có thể đăng ký tài khoản bằng email hoặc đăng nhập bằng Google hoặc Facebook. Khi quên mật khẩu, hệ thống gửi mã OTP 6 số qua email; mã có hiệu lực 15 phút, mỗi lần yêu cầu mã mới phải cách nhau ít nhất 1 phút, và nhập sai quá số lần cho phép thì phải yêu cầu mã mới.

## Trợ lý AI có thể giúp gì
Trợ lý AI giúp gợi ý chuyên khoa phù hợp với triệu chứng, tìm bác sĩ, xem khung giờ còn trống, giải đáp quy định của phòng khám và chuẩn bị đề xuất đặt lịch. Việc đặt lịch chỉ được thực hiện khi bệnh nhân tự bấm xác nhận. Trợ lý không chẩn đoán bệnh, không kê đơn hay tư vấn liều thuốc. Với các dấu hiệu cấp cứu, hãy gọi 115 hoặc đến cơ sở cấp cứu gần nhất.
