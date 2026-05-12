# 📋 Project Overview — Booking Clinic System

> **Mục đích:** File này là Context Base cho AI đọc hiểu toàn bộ hệ thống Booking Clinic.  
> **Cập nhật lần cuối:** 2026-05-07

---

## 1. Domain Logic (Mục đích hệ thống)

**Booking Clinic System** là hệ thống đặt lịch khám bệnh trực tuyến, cho phép:

- **Bệnh nhân (Patient)** đăng ký tài khoản, tìm bác sĩ theo chuyên khoa, xem lịch trống của bác sĩ, đặt lịch khám, nhận thông báo, đánh giá bác sĩ sau khám, và thanh toán.
- **Bác sĩ (Doctor)** quản lý lịch làm việc, xác nhận/từ chối lịch hẹn, tạo hồ sơ bệnh án (Medical Record), kê đơn thuốc (Prescription).
- **Quản trị viên (Admin)** quản lý danh mục chuyên khoa, bác sĩ, thuốc, xem toàn bộ lịch hẹn, và cập nhật trạng thái thanh toán.

---

## 2. Tech Stack

### 2.1. Backend

| Công nghệ | Phiên bản | Mô tả |
|---|---|---|
| **Java** | 24 | Ngôn ngữ chính |
| **Spring Boot** | 4.0.4 | Framework chính |
| **Spring Data JPA (Hibernate)** | (theo Spring Boot BOM) | ORM, truy xuất database |
| **Spring Security** | (theo Spring Boot BOM) | Xác thực & phân quyền |
| **Spring Boot Starter Mail** | (theo Spring Boot BOM) | Gửi email OTP |
| **Spring Boot Starter Validation** | (theo Spring Boot BOM) | Validation DTO bằng annotation |
| **JWT (jjwt)** | 0.12.7 | Sinh & xác thực JSON Web Token |
| **Lombok** | 1.18.44 | Giảm boilerplate code |
| **MySQL** | (runtime) | Cơ sở dữ liệu chính |
| **H2** | (test) | Database cho unit test |
| **Spring Boot Actuator** | (theo Spring Boot BOM) | Health check & monitoring |
| **Maven** | — | Build tool |

### 2.2. Frontend

| Công nghệ | Phiên bản | Mô tả |
|---|---|---|
| **React** | 18.3.1 | UI Library |
| **React DOM** | 18.3.1 | DOM rendering |
| **React Router DOM** | 6.30.1 | Client-side routing |
| **Vite** | 5.4.19 | Build tool & dev server |
| **@vitejs/plugin-react** | 4.4.1 | React plugin cho Vite |

---

## 3. Kiến trúc tổng quan (Backend)

```
com.example.booking_clinic
├── config/              # SecurityConfig, CorsConfig, PasswordConfig, DataSeeder
├── security/            # JwtService, JwtAuthenticationFilter
├── controller/          # REST Controllers (15 controllers)
├── service/             # Service Interfaces
│   └── impl/            # Service Implementations
├── repository/          # Spring Data JPA Repositories
├── entity/              # JPA Entities (15 entities)
│   └── enums/           # AppointmentStatus, MedicineStatus
├── dto/                 # Data Transfer Objects (theo từng module)
│   ├── auth/
│   ├── appointment/
│   ├── doctor/
│   ├── doctor_schedule/
│   ├── medical_record/
│   ├── medicine/
│   ├── notification/
│   ├── patient/
│   ├── payment/
│   ├── prescription/
│   ├── review/
│   ├── specialty/
│   ├── user/
│   └── response/
└── common/
    ├── api/             # ApiResponse wrapper
    └── exception/       # GlobalExceptionHandler + Custom Exceptions
```

### API Response Format (chuẩn hóa)

Tất cả API đều trả về dạng:

```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

Được wrap bởi class `ApiResponse<T>`.

---

## 4. Phân quyền (Roles & Authorization)

### 4.1. Các Role trong hệ thống

| Role | Mô tả |
|---|---|
| `ADMIN` | Quản trị viên – toàn quyền quản lý hệ thống |
| `DOCTOR` | Bác sĩ – quản lý lịch, khám bệnh, kê đơn |
| `PATIENT` | Bệnh nhân – đặt lịch, xem hồ sơ, thanh toán, đánh giá |

### 4.2. Luồng phân quyền

1. **Đăng ký:** Mặc định role = `PATIENT`. Bác sĩ được Admin tạo tài khoản.
2. **Đăng nhập:** Trả về Access Token (JWT) chứa claim `role`.
3. **Mỗi request:** `JwtAuthenticationFilter` trích xuất token → lấy `email` & `role` → tạo `Authentication` với authority `ROLE_{role}` → đặt vào `SecurityContextHolder`.
4. **SecurityConfig** khai báo URL-based authorization (`.requestMatchers()`).
5. **Method-level:** Một số endpoint bổ sung `@PreAuthorize("hasRole('...')")` (ví dụ: `PrescriptionController`).

### 4.3. Ma trận phân quyền chi tiết

| Resource | GET | POST | PATCH/PUT | DELETE |
|---|---|---|---|---|
| `/api/v1/auth/**` | Public | Public | Public | — |
| `/api/v1/specialties` | Public | ADMIN | ADMIN | ADMIN |
| `/api/v1/doctors` | Public | ADMIN | ADMIN | — |
| `/api/v1/doctor-schedules` | Public | ADMIN, DOCTOR | ADMIN, DOCTOR | ADMIN, DOCTOR |
| `/api/v1/patients/me` | PATIENT | — | PATIENT | — |
| `/api/v1/appointments` | ADMIN(all), PATIENT(/me), DOCTOR(/doctor/{id}) | PATIENT | DOCTOR, ADMIN | PATIENT |
| `/api/v1/medical-records` | DOCTOR, PATIENT, ADMIN | DOCTOR | DOCTOR | — |
| `/api/v1/prescriptions` | DOCTOR, PATIENT, ADMIN | DOCTOR | DOCTOR | — |
| `/api/v1/medicines` | Public | ADMIN | ADMIN | — |
| `/api/v1/reviews` | Public(doctor/{id}), Others(auth) | PATIENT | PATIENT | — |
| `/api/v1/notifications` | PATIENT, DOCTOR, ADMIN | — | PATIENT, DOCTOR, ADMIN | — |
| `/api/v1/payments` | PATIENT, DOCTOR, ADMIN | PATIENT, ADMIN | ADMIN | — |

### 4.4. Phương thức xác thực (Authentication Providers)

Hệ thống hỗ trợ đa phương thức xác thực, được phân biệt qua trường `authProvider` trong entity `User`.
Trường `authProvider` có thể nhận các giá trị sau:
- `LOCAL`: Đăng nhập bằng Email và Password truyền thống (mặc định).
- `GOOGLE`: Đăng nhập thông qua Google OAuth2.
- `FACEBOOK`: Đăng nhập thông qua Facebook OAuth2.

> **Lưu ý:** Các tài khoản đăng nhập qua mạng xã hội (`GOOGLE`, `FACEBOOK`) sẽ bị chặn các tính năng liên quan đến mật khẩu nội bộ như Đổi mật khẩu (Change Password) hoặc Quên mật khẩu (Forgot Password).

---

## 5. 🚨 CODING RULES (BẮT BUỘC TUÂN THỦ)

> **Các luật dưới đây là BẮT BUỘC cho mọi AI hoặc developer khi viết code trong dự án này.**

### 5.1. ⛔ Luật So Sánh ID

**TUYỆT ĐỐI KHÔNG dùng `.equals()` để so sánh ID của các Entity.**

Vì `getId()` trả về kiểu `Long` (wrapper), `.equals()` có thể cho kết quả sai khi so sánh 2 object Long khác instance nhưng cùng giá trị (đặc biệt ngoài cache range -128 đến 127).

✅ **ĐÚNG:**
```java
if (doctor.getId().longValue() == appointment.getDoctor().getId().longValue()) { ... }
if (doctor.getId().longValue() != currentDoctor.getId().longValue()) { ... }
```

❌ **SAI:**
```java
if (doctor.getId().equals(appointment.getDoctor().getId())) { ... } // KHÔNG ĐƯỢC DÙNG
```

### 5.2. ⛔ Luật Phân Quyền Object (Ownership Check)

**Khi check quyền sở hữu (Bác sĩ với Đơn thuốc, Bệnh nhân với Lịch hẹn...), PHẢI bắt cầu qua bảng `User`.**

Lý do: `Doctor.id` ≠ `User.id` và `Patient.id` ≠ `User.id`. Đây là quan hệ **1-1** riêng biệt. Phải lấy `User.id` thông qua `.getUser().getId()` để so sánh với `currentUser.getId()`.

✅ **ĐÚNG:**
```java
// So sánh User ID của Doctor với User ID hiện tại
Long doctorUserId = prescription.getDoctor().getUser().getId();
if (doctorUserId.longValue() != currentUser.getId().longValue()) {
    throw new AccessDeniedException("...");
}
```

❌ **SAI:**
```java
// KHÔNG so sánh trực tiếp Doctor.id với User.id
if (prescription.getDoctor().getId().longValue() != currentUser.getId().longValue()) { ... }
```

### 5.3. ⛔ Luật Lazy Initialization (Tránh lỗi No Session)

**KHÔNG gọi `user.getRole().getName()` khi đang check quyền ở Service** vì `Role` là `FetchType.LAZY`. Nếu gọi ngoài session/transaction, sẽ bị lỗi `LazyInitializationException`.

✅ **ĐÚNG — Lấy Role từ SecurityContextHolder:**
```java
String role = SecurityContextHolder.getContext().getAuthentication()
    .getAuthorities().stream()
    .findFirst()
    .map(a -> a.getAuthority().replace("ROLE_", ""))
    .orElse("");

if ("ADMIN".equals(role)) { ... }
if ("DOCTOR".equals(role)) { ... }
```

❌ **SAI — Gọi trực tiếp trên entity:**
```java
String role = currentUser.getRole().getName(); // LazyInitializationException!
```

> **Lưu ý:** Trong `JwtAuthenticationFilter`, role đã được trích xuất từ JWT claim và gán vào `authorities` của `Authentication`. Do đó, lấy role từ `SecurityContextHolder` là cách an toàn nhất.

### 5.4. ⛔ Luật Tự Động Tính quantity (Prescription)

**Backend PHẢI tự tính `quantity` cho `PrescriptionItem`, KHÔNG tin tưởng dữ liệu Frontend gửi lên.**

```java
int quantity = dosePerTime * timesPerDay * durationDays;
item.setQuantity(quantity);
```

Frontend chỉ gửi `dosePerTime`, `timesPerDay`, `durationDays`. Backend tự tính `quantity`, `unitPrice` (snapshot từ `Medicine.unitPrice`), và `lineTotal` (`unitPrice × quantity`).

---

## 6. Custom Exceptions

| Exception | HTTP Status | Mục đích |
|---|---|---|
| `ResourceNotFoundException` | 404 | Entity không tìm thấy |
| `InvalidAppointmentStateException` | 400 | Appointment sai trạng thái |
| `PrescriptionAlreadyExistsException` | 409 | Đơn thuốc đã tồn tại cho Medical Record |
| `PaymentAlreadyExistsException` | 409 | Thanh toán đã tồn tại cho Appointment |
| `MedicineInactiveException` | 400 | Thuốc đã ngưng hoạt động |

Tất cả được xử lý bởi `GlobalExceptionHandler`.

---

## 7. Enums

### AppointmentStatus
```
PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
                    ↘ CANCELLED
PENDING → CANCELLED
```

Giá trị: `PENDING`, `CONFIRMED`, `REQUESTED`, `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`

### MedicineStatus
```
ACTIVE, INACTIVE
```
