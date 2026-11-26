# Sau buổi khám: bệnh án, đơn thuốc, đánh giá

<!-- Source of truth: MedicalRecordServiceImpl, PrescriptionServiceImpl, PaymentServiceImpl, ReviewServiceImpl. -->

## Hồ sơ bệnh án
Trong buổi khám, bác sĩ lập hồ sơ bệnh án cho lịch hẹn đã được xác nhận, gồm triệu chứng, chẩn đoán, hướng điều trị, ghi chú và ngày tái khám nếu cần. Khi hồ sơ bệnh án được lập, lịch hẹn chuyển sang trạng thái hoàn thành (COMPLETED). Mỗi lịch hẹn có một hồ sơ bệnh án. Bệnh nhân xem hồ sơ bệnh án của mình trong mục tài khoản; chỉ bệnh nhân đó, bác sĩ phụ trách và quản trị viên được xem.

## Đơn thuốc
Bác sĩ chỉ kê đơn thuốc sau khi buổi khám đã hoàn thành và đã có hồ sơ bệnh án. Thuốc được chọn từ danh mục thuốc của phòng khám, không trùng lặp trong cùng một đơn, và phải còn đủ số lượng trong kho. Bệnh nhân xem đơn thuốc, liều dùng và tổng tiền thuốc trong mục Đơn thuốc. Trợ lý AI không kê đơn và không tư vấn liều dùng.

## Thanh toán tiền thuốc
Tiền thuốc là một khoản thanh toán riêng (khác phí đặt lịch), chỉ tạo được khi lịch hẹn đã hoàn thành. Số tiền bằng tổng tiền của đơn thuốc. Thuốc được trừ khỏi kho khi khoản thanh toán tiền thuốc được xác nhận.

## Tái khám
Nếu bác sĩ ghi ngày tái khám trong hồ sơ bệnh án, bạn đặt một lịch hẹn mới với bác sĩ đó vào ngày phù hợp. Lịch tái khám được đặt và thanh toán như một lịch hẹn bình thường.

## Đánh giá bác sĩ
Sau khi lịch hẹn hoàn thành, bệnh nhân có thể đánh giá bác sĩ từ 1 đến 5 sao kèm nhận xét. Mỗi lịch hẹn chỉ đánh giá một lần, nhưng bạn có thể chỉnh sửa đánh giá của mình sau đó. Điểm đánh giá trung bình hiển thị công khai trên trang bác sĩ.
