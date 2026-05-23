# Booking Clinic System

Hệ thống đặt lịch phòng khám gồm:

- `Backend_API/booking-clinic`: Spring Boot API
- `Frontend_ReactJs`: ReactJS + Vite

## Công Nghệ

- Backend: Java 21, Spring Boot 4, Spring Security, JWT, Spring Data JPA, MySQL
- Frontend: ReactJS, Vite
- Cache: Redis chạy bằng Docker

## Chạy MySQL

Tạo database:

```sql
CREATE DATABASE booking_clinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Thông tin mặc định:

```text
Host: localhost
Port: 3306
Username: root
Password: để trống
```

## Chạy Redis

Tạo container Redis:

```powershell
docker run --name booking-redis -p 6379:6379 -d redis:7
```

Nếu đã tạo rồi thì chỉ cần chạy:

```powershell
docker start booking-redis
```

Kiểm tra Redis:

```powershell
docker exec -it booking-redis redis-cli
```

Trong Redis CLI:

```redis
ping
keys *
```

## Cấu Hình Backend

File cấu hình:

```text
Backend_API/booking-clinic/src/main/resources/application.properties
```

Cấu hình chính:

```properties
server.port=8082

spring.datasource.url=jdbc:mysql://localhost:3306/booking_clinic_db?useUnicode=true&characterEncoding=UTF-8&useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=

spring.cache.type=redis
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.cache.redis.time-to-live=10m
spring.cache.redis.cache-null-values=false
spring.data.redis.repositories.enabled=false
```

## Chạy Backend

```powershell
cd Backend_API\booking-clinic
.\mvnw.cmd clean compile
.\mvnw.cmd spring-boot:run
```

Backend chạy tại:

```text
http://localhost:8082
```

## Chạy Frontend

```powershell
cd Frontend_ReactJs
npm install
npm run dev
```

Frontend chạy tại:

```text
http://localhost:5173
```

## Redis Cache

Redis cache đang được dùng cho các dữ liệu đọc nhiều:

- chuyên khoa
- bác sĩ
- thuốc

Cơ chế:

- `@Cacheable`: lưu kết quả GET vào Redis
- `@CacheEvict`: xóa cache khi thêm, sửa, xóa dữ liệu
- TTL cache: 10 phút

Các file chính:

```text
CacheConfig.java
SpecialtyServiceImpl.java
DoctorServiceImpl.java
MedicineServiceImpl.java
```

## Test Redis Cache

Xóa cache cũ:

```redis
flushall
```

Gọi các API:

```http
GET http://localhost:8082/api/v1/specialties
GET http://localhost:8082/api/v1/doctors
GET http://localhost:8082/api/v1/doctors?specialtyId=1
GET http://localhost:8082/api/v1/medicines
GET http://localhost:8082/api/v1/medicines/1
```

Kiểm tra key trong Redis:

```redis
keys *
```

Ví dụ key:

```redis
specialties::all
doctors::null:
doctors::1:
medicines::all
medicine::1
```

Kiểm tra TTL:

```redis
ttl "specialties::all"
```

Nếu trả về số giây thì cache đang hoạt động.

## Tài Liệu API

```text
API_DOCUMENTATION.md
API_DOCUMENTATION.xlsx
```

