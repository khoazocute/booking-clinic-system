# Chính sách huỷ lịch và hoàn tiền

<!-- Source of truth: AppointmentServiceImpl.cancelAppointment / updateStatus, AppointmentExpiryScheduler. -->

## Ai có thể huỷ lịch hẹn
Bệnh nhân tự huỷ được lịch hẹn của mình khi lịch đang ở trạng thái chờ (PENDING) hoặc đã xác nhận (CONFIRMED). Không thể huỷ lịch đã hoàn thành (COMPLETED) hoặc đã bị huỷ trước đó. Bác sĩ và quản trị viên cũng có thể huỷ lịch hẹn, kèm lý do huỷ.

## Mức hoàn tiền khi bệnh nhân tự huỷ
Số tiền hoàn tính theo thời gian còn lại đến giờ bắt đầu khám. Huỷ trước hơn 24 giờ: hoàn 100% phí đã thanh toán. Huỷ trong khoảng từ 6 đến 24 giờ trước giờ khám: hoàn 40%. Huỷ khi còn dưới 6 giờ: không được hoàn tiền. Chỉ khoản phí đặt lịch đã thanh toán thành công mới được tính hoàn.

## Ví dụ cách tính tiền hoàn
Với phí khám 300.000 đồng đã thanh toán: huỷ trước 2 ngày được hoàn 300.000 đồng; huỷ trước 12 giờ được hoàn 120.000 đồng (40%); huỷ trước 3 giờ không được hoàn. Nếu chưa thanh toán thì không có khoản nào để hoàn.

## Tiền hoàn được trả về đâu
Tiền hoàn được cộng vào ví (wallet) của bệnh nhân trong hệ thống, kèm một giao dịch hoàn tiền trong lịch sử thanh toán. Số dư ví hiển thị trong hồ sơ bệnh nhân.

## Khi bác sĩ hoặc phòng khám huỷ lịch
Nếu lịch hẹn bị bác sĩ hoặc quản trị viên huỷ, bệnh nhân được hoàn 100% phí đặt lịch đã thanh toán vào ví, bất kể thời điểm huỷ. Khung giờ được trả lại trạng thái trống và bệnh nhân nhận thông báo kèm lý do huỷ.

## Lịch hẹn bị huỷ tự động
Hệ thống tự động huỷ lịch hẹn trong hai trường hợp: lịch quá 10 phút kể từ khi đặt mà chưa thanh toán, và lịch hẹn mà ngày khám đã qua nhưng chưa được thực hiện. Lý do huỷ tự động được ghi trong chi tiết lịch hẹn.
