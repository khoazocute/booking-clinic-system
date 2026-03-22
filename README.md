# Booking Clinic System

Hệ thống quản lý đặt lịch phòng khám được xây dựng phục vụ đồ án môn học.

## Mô tả dự án
Dự án hỗ trợ quản lý việc đặt lịch khám bệnh giữa bệnh nhân và phòng khám.  
Hệ thống được phát triển theo mô hình tách biệt frontend và backend:

- Frontend: ReactJS
- Backend: Java Spring Boot
- Database: MySQL
- API: RESTful API

## Mục tiêu
- Xây dựng hệ thống đặt lịch khám bệnh cơ bản
- Quản lý người dùng, bác sĩ, bệnh nhân và lịch hẹn
- Thực hành phát triển fullstack với ReactJS + Spring Boot
- Làm quen với quy trình thiết kế database, API và kết nối frontend/backend

## Công nghệ sử dụng
### Backend
- Java
- Spring Boot
- Spring Data JPA
- MySQL
- Maven

### Frontend
- ReactJS

### Công cụ hỗ trợ
- Postman
- VS Code / IntelliJ IDEA
- GitHub

## Chức năng dự kiến
- Đăng ký / đăng nhập
- Quản lý thông tin người dùng
- Quản lý bác sĩ
- Quản lý bệnh nhân
- Đặt lịch khám
- Xem danh sách lịch hẹn
- Cập nhật / hủy lịch hẹn
- Phân quyền người dùng bằng JWT

## Cách chạy backend
1. Clone project : git clone https://github.com/khoazocute/booking-clinic-system.git
2. Di chuyển vào đúng thư mục : cd DAMH_JAVA/Backend_API/booking-clinic
3. Cấu hình database trong:  application.properties
4. Chạy ứng dụng : mvnw.cmd spring-boot:run


## Cấu trúc thư mục
```text
DAMH_JAVA
├── Backend_API
│   └── booking-clinic
└── Frontend_ReactJ
