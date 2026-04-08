# Booking Clinic System

Đây là project fullstack cho đồ án hệ thống đặt lịch phòng khám. Project được tách thành:

- `Backend_API/booking-clinic`: backend dùng Spring Boot
- `Frontend_ReactJs`: frontend dùng ReactJS + Vite

Mục tiêu của hệ thống là hỗ trợ:

- xác thực và phân quyền người dùng
- quản lý chuyên khoa, bác sĩ, lịch làm việc
- đặt lịch khám bệnh
- mở rộng sang hồ sơ khám, đơn thuốc, thanh toán, báo cáo

## Công nghệ sử dụng

### Backend

- Java 17
- Spring Boot
- Spring Data JPA
- Spring Security
- JWT
- MySQL
- Maven Wrapper

### Frontend

- ReactJS
- Vite
- React Router DOM

## Cấu trúc thư mục


DAMH_JAVA
|-- Backend_API/
|   `-- booking-clinic/
|       |-- src/main/java/com/example/booking_clinic/
|       |   |-- common/
|       |   |-- config/
|       |   |-- controller/
|       |   |-- dto/
|       |   |-- entity/
|       |   |-- repository/
|       |   |-- security/
|       |   `-- service/
|       `-- src/main/resources/
|-- Frontend_ReactJs/
|   |-- src/
|   |   |-- assets/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- layouts/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- styles/
|   |   |-- utils/
|   |   |-- App.jsx
|   |   `-- main.jsx
|   `-- package.json
|-- README.md
|-- SETUP_GUIDE.md
`-- UI_PAGES_LIST.md


## Hướng dẫn cài đặt môi trường

### Phần mềm cần cài
|-----------|-----------|----------|---------|
| **JDK** | 17 | https://adoptium.net/temurin/releases/?version=17 | Chọn bản `.msi` Windows x64 |
| **XAMPP** | Mới nhất | https://www.apachefriends.org/download.html | Dùng để chạy MySQL |
| **Git** | Mới nhất | https://git-scm.com/downloads | Quản lý source code |
| **VS Code** hoặc **IntelliJ IDEA** | Mới nhất | https://code.visualstudio.com / https://www.jetbrains.com/idea/ | IDE lập trình |
### Bắt buộc khi làm Frontend

|-----------|-----------|----------|
| **Node.js** | 18 trở lên | https://nodejs.org/ (chọn bản LTS) |
Không cần cài riêng:

- `Maven` vì project đã có `mvnw.cmd`
- `Tomcat` vì Spring Boot dùng embedded server

### Kiểm tra Java

```powershell
java -version
```

Kết quả nên hiển thị Java 17.

Nếu máy có nhiều bản Java, hãy đảm bảo `JAVA_HOME` đang trỏ đúng tới JDK 17.

### Cài MySQL bằng XAMPP và tạo database

1. Mở `XAMPP Control Panel`
2. Start `MySQL`
3. Mở `http://localhost/phpmyadmin`
4. Tạo database `booking_clinic_db`
5. Nên dùng collation `utf8mb4_unicode_ci`

Thông tin mặc định thường dùng:

- Host: `localhost`
- Port: `3306`
- Username: `root`
- Password: để trống

## Cấu hình backend

File cấu hình:

`Backend_API/booking-clinic/src/main/resources/application.properties`

Cấu hình hiện tại:

```properties
server.port=8081

spring.datasource.url=jdbc:mysql://localhost:3306/booking_clinic_db?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=

app.cors.allowed-origins=http://localhost:5173,http://127.0.0.1:5173
```

Nếu máy của bạn dùng username hoặc password MySQL khác, chỉ sửa ở local và không commit lên GitHub.

## Cách chạy backend

```powershell
cd Backend_API\booking-clinic
.\mvnw.cmd clean compile
.\mvnw.cmd spring-boot:run
```

Lưu ý:

- lần đầu có thể mất vài phút để tải dependency
- backend mặc định chạy ở `http://localhost:8081`
- có thể test nhanh bằng `http://localhost:8081/api/v1/health`

## Cách chạy frontend

```powershell
cd Frontend_ReactJs
npm install
npm run dev
```

Frontend mặc định chạy tại:

- `http://localhost:5173`

## Các lỗi thường gặp

- `release version 17 not supported`: chưa dùng đúng JDK 17
- `Communications link failure` hoặc `Access denied`: MySQL chưa bật hoặc sai username/password
- `Unknown database 'booking_clinic_db'`: chưa tạo database
- `mvnw.cmd is not recognized`: đang chạy sai thư mục
- `Port 8081 already in use`: có ứng dụng khác đang dùng cổng 8081

## Tóm tắt chạy nhanh

```text
1. Cài JDK 17
2. Cài XAMPP và bật MySQL
3. Tạo database booking_clinic_db
4. Vào thư mục Backend_API\booking-clinic
5. Chạy .\mvnw.cmd clean compile
6. Chạy .\mvnw.cmd spring-boot:run
7. Mở /api/v1/health để kiểm tra backend
```

## Ghi chú

- Frontend hiện kết nối với backend thông qua `VITE_API_BASE_URL`
- Tài liệu UI đang nằm trong file [`UI_PAGES_LIST.md`](/d:/HocTap/Nam3Ky2/Java/DAMH_JAVA/UI_PAGES_LIST.md)
- Hướng dẫn cài đặt chi tiết hơn có thể tham khảo thêm trong [`SETUP_GUIDE.md`](/d:/HocTap/Nam3Ky2/Java/DAMH_JAVA/SETUP_GUIDE.md)
