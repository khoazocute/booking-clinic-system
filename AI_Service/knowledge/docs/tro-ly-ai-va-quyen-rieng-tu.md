# Trợ lý AI và quyền riêng tư

<!-- Source of truth: AI_Service (safety/pii.py, safety/red_flags.py, agent), AiChatServiceImpl, RedisAiRateLimiter. -->

## Trợ lý AI làm được gì
Trợ lý AI gợi ý chuyên khoa phù hợp với triệu chứng, tìm bác sĩ, xem khung giờ còn trống, giải đáp quy định của phòng khám (đặt lịch, thanh toán, huỷ lịch, hoàn tiền, tài khoản) và chuẩn bị đề xuất lịch khám để bạn xác nhận. Câu trả lời về quy định có ghi nguồn tham khảo.

## Trợ lý AI không làm gì
Trợ lý không chẩn đoán bệnh, không kê đơn và không tư vấn tên thuốc hay liều dùng. Trợ lý không tự đặt lịch: lịch chỉ được tạo khi bạn bấm nút xác nhận. Trợ lý không xem được hồ sơ bệnh án, đơn thuốc hay thông tin thanh toán của bạn.

## Dấu hiệu cấp cứu
Khi bạn mô tả dấu hiệu có thể là cấp cứu (ví dụ đau ngực dữ dội, méo miệng, yếu nửa người, khó thở nặng, co giật, chảy máu nhiều, ý định tự tử), trợ lý hiển thị ngay khuyến cáo gọi 115 hoặc đến khoa cấp cứu gần nhất, thay vì gợi ý đặt lịch khám thông thường.

## Dữ liệu cá nhân trong tin nhắn
Trước khi nội dung tin nhắn được gửi tới dịch vụ AI bên ngoài, hệ thống tự động che các thông tin định danh như họ tên giới thiệu trong câu, số điện thoại, email, số căn cước và số thẻ bảo hiểm y tế. Bạn không cần cung cấp các thông tin này để được gợi ý chuyên khoa.

## Giới hạn sử dụng
Mỗi tài khoản gửi tối đa 10 tin nhắn mỗi phút cho trợ lý AI. Khi trợ lý AI tạm gián đoạn, hệ thống vẫn gợi ý chuyên khoa cơ bản theo triệu chứng và bạn vẫn có thể đặt lịch trực tiếp trên trang Bác sĩ.
