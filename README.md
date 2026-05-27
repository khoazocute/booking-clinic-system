# Booking Clinic System 🏥

Hệ thống quản lý và đặt lịch khám bệnh trực tuyến được phát triển trên kiến trúc Fullstack, hỗ trợ chạy Docker hóa hoàn toàn giúp triển khai nhanh chóng.

---

## 🚀 Hướng dẫn khởi chạy bằng DOCKER (Khuyên dùng - Nhanh nhất)

Dành cho bạn bè hoặc người dùng mới muốn chạy dự án này bằng Docker trên máy cá nhân:

### Bước 1: Chuẩn bị môi trường trên máy cá nhân
Hãy đảm bảo máy tính của bạn đã cài đặt sẵn các phần mềm sau:
1. **Git**: Dùng để tải mã nguồn dự án. [Tải Git tại đây](https://git-scm.com/).
2. **Docker Desktop**: Công cụ bắt buộc để chạy toàn bộ hệ thống. [Tải Docker Desktop tại đây](https://www.docker.com/products/docker-desktop/).
   * *Lưu ý*: Sau khi cài đặt, hãy **mở ứng dụng Docker Desktop lên** trước khi thực hiện các bước tiếp theo.
3. **Giải phóng cổng kết nối**: Đảm bảo bạn đã tắt các ứng dụng chạy MySQL local (Laragon, XAMPP, v.v.) đang chiếm dụng cổng `3306`, và Redis local ở cổng `6379`.

### Bước 2: Tải dự án (Clone Project) về máy
Mở Terminal (CMD, PowerShell hoặc Git Bash) và chạy các lệnh sau:
```bash
git clone https://github.com/khoazocute/booking-clinic-system.git
cd booking-clinic-system
```

### Bước 3: Khởi chạy dự án bằng Docker (Một lệnh duy nhất)
Chạy lệnh:
```bash
docker-compose up -d --build
```
* **Cách hoạt động**: Lệnh này sẽ tự động tải các base image, build source code Frontend/Backend và tự động import dữ liệu mẫu (các chuyên khoa, tài khoản bác sĩ, bệnh nhân cũ) từ file `db_init/init.sql` vào database mà bạn không cần import thủ công.
* **Thời gian khởi chạy lần đầu:** Khoảng từ **3 đến 5 phút** (để tải thư viện và build dự án). Từ lần chạy thứ 2 trở đi chỉ mất **5 - 10 giây**.

### Bước 4: Truy cập và Trải nghiệm
Sau khi Terminal báo `Started` ở tất cả các dịch vụ:
* **Giao diện Web (Frontend):** **[http://localhost:5173](http://localhost:5173)**
* **Trang tài liệu/Kiểm tra Backend:** [http://localhost:8082/api/v1/health](http://localhost:8082/api/v1/health)

---

## ⚙️ Hướng dẫn khởi chạy THỦ CÔNG (Không dùng Docker)

Nếu máy tính của bạn không cài đặt Docker, bạn có thể chạy thủ công từng phần bằng cách cài đặt môi trường trên máy của bạn.

### Yêu cầu chuẩn bị
Trước khi chạy, máy tính của bạn bắt buộc phải có sẵn:
1. **Java Development Kit (JDK) 21**: Dùng để biên dịch và chạy Backend.
2. **Node.js (phiên bản 18 trở lên)**: Dùng để chạy Frontend.
3. **MySQL Server (cổng 3306)**: Có thể cài trực tiếp hoặc qua Laragon, XAMPP.
4. **Redis Server**: Dùng để làm bộ nhớ đệm cache (nếu không cài Redis local, bạn có thể tắt tính năng cache hoặc cài đặt Redis trên Docker/WSL).

---

### Bước 1: Thiết lập Cơ sở dữ liệu (MySQL)
1. Mở công cụ quản lý cơ sở dữ liệu của bạn (HeidiSQL, DBeaver, MySQL Workbench, v.v.).
2. Tạo một database mới tên là `booking_clinic_db` bằng câu lệnh SQL:
   ```sql
   CREATE DATABASE booking_clinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Nhập (Import) toàn bộ bảng dữ liệu mẫu:
   * Chọn database `booking_clinic_db` vừa tạo.
   * Chọn mở file SQL từ đường dẫn: `db_init/init.sql` trong dự án.
   * Chạy (Execute) toàn bộ file SQL này để nạp dữ liệu.

---

### Bước 2: Cấu hình và Chạy Backend (Spring Boot)
1. Mở file cấu hình database của Backend tại đường dẫn:
   `Backend_API/booking-clinic/src/main/resources/application.properties`
2. Chỉnh sửa thông tin kết nối MySQL cho đúng với thông tin máy của bạn:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/booking_clinic_db?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=UTC
   spring.datasource.username=TÊN_ĐĂNG_NHẬP_MYSQL_CỦA_BẠN (thường là root)
   spring.datasource.password=MẬT_KHẨU_MYSQL_CỦA_BẠN (để trống nếu dùng Laragon mặc định)
   ```
3. Cấu hình Redis (nếu bạn có cài đặt Redis local):
   ```properties
   spring.cache.type=redis
   spring.data.redis.host=localhost
   spring.data.redis.port=6379
   ```
   *(Nếu không chạy Redis, hãy đổi cấu hình `spring.cache.type=none` để bỏ qua tính năng lưu cache).*
4. Mở Terminal tại thư mục `Backend_API/booking-clinic` và chạy lệnh để khởi động Backend:
   ```bash
   # Dành cho Windows
   .\mvnw.cmd clean compile spring-boot:run

   # Dành cho macOS / Linux
   ./mvnw clean compile spring-boot:run
   ```
   *Backend sẽ khởi chạy thành công tại địa chỉ: **http://localhost:8082***.

---

### Bước 3: Cài đặt và Chạy Frontend (ReactJS)
1. Mở một cửa sổ Terminal mới và di chuyển vào thư mục Frontend:
   ```bash
   cd Frontend_ReactJs
   ```
2. Cài đặt các thư viện cần thiết (chỉ cần chạy lần đầu):
   ```bash
   npm install
   ```
3. Khởi chạy máy chủ phát triển (Dev Server) của React:
   ```bash
   npm run dev
   ```
4. Mở trình duyệt và truy cập vào địa chỉ hiển thị trong terminal (thường là **[http://localhost:5173](http://localhost:5173)**).

---

## 💻 Hướng dẫn dành cho Lập trình viên khi phát triển (Developer Workflow)

### Khi chỉnh sửa Code trong lúc đang chạy Docker:
* **Khi sửa code Backend (Java):** Chạy lệnh sau để biên dịch lại mã nguồn và cập nhật riêng container Backend:
  ```bash
  docker-compose up -d --build backend
  ```
* **Khi sửa code Frontend (React):** Chạy lệnh sau để build lại các file tĩnh và cập nhật riêng container Frontend:
  ```bash
  docker-compose up -d --build frontend
  ```

---

## 🛠️ Các lệnh Docker hữu ích

* **Kiểm tra trạng thái các dịch vụ:**
  ```bash
  docker-compose ps
  ```
* **Xem logs hệ thống theo thời gian thực (realtime):**
  ```bash
  docker-compose logs -f
  ```
* **Dừng toàn bộ hệ thống (Giữ nguyên dữ liệu):**
  ```bash
  docker-compose down
  ```
* **Dừng hệ thống và XÓA SẠCH dữ liệu database (Để chạy lại từ đầu):**
  ```bash
  docker-compose down -v
  ```
