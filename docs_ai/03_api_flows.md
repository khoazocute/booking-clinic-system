# 🔄 API Flows — Booking Clinic System

> **Mục đích:** Tóm tắt các luồng API quan trọng nhất từ Controller → Service.  
> **Base URL:** `/api/v1`  
> **Cập nhật lần cuối:** 2026-05-07

---

## Mục lục

1. [Luồng Xác thực (Auth)](#1-luồng-xác-thực-auth)
2. [Luồng Quản lý Doctor](#2-luồng-quản-lý-doctor)
3. [Luồng Đặt lịch khám (Appointment)](#3-luồng-đặt-lịch-khám-appointment)
4. [Luồng Khám bệnh & Kê đơn](#4-luồng-khám-bệnh--kê-đơn)
5. [Luồng Thanh toán (Payment)](#5-luồng-thanh-toán-payment)
6. [Luồng Đánh giá (Review)](#6-luồng-đánh-giá-review)
7. [Luồng Thông báo (Notification)](#7-luồng-thông-báo-notification)
8. [Luồng Quản lý danh mục (Admin)](#8-luồng-quản-lý-danh-mục-admin)

---

## 1. Luồng Xác thực (Auth)

### 1.1. Đăng ký tài khoản

**`POST /api/v1/auth/register`** — Public

**Request Body:**
```json
{
  "fullName": "Nguyen Van A",
  "email": "user@example.com",
  "phone": "0912345678",
  "password": "password123"
}
```

**Logic (`AuthServiceImpl.register`):**
1. Kiểm tra email đã tồn tại chưa (`userRepository.existsByEmail`).
2. Tìm Role `PATIENT` trong DB (default role).
3. Tạo `User` với password được BCrypt encode, status = `ACTIVE`.
4. Lưu và trả về `RegisterResponse`.

> ⚠️ Mọi tài khoản đăng ký qua API này đều mặc định là `PATIENT`. Tài khoản `DOCTOR` do Admin tạo.

---

### 1.2. Đăng nhập & Sinh JWT

**`POST /api/v1/auth/login`** — Public

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "id": 1,
  "fullName": "Nguyen Van A",
  "email": "user@example.com",
  "role": "PATIENT",
  "status": "ACTIVE"
}
```

**Logic (`AuthServiceImpl.login`):**
1. Tìm User theo email.
2. So khớp password bằng BCrypt (`passwordEncoder.matches`).
3. Kiểm tra `status == ACTIVE`.
4. Sinh **Access Token** (JWT ngắn hạn) bằng `JwtService.generateAccessToken`:
   - `subject` = email
   - claim `role` = tên role (ADMIN/DOCTOR/PATIENT)
   - expiry = cấu hình từ `app.jwt.access-token-expiration`
5. Sinh **Refresh Token** (JWT dài hạn 7 ngày) bằng `JwtService.generateRefreshToken`.
6. Lưu `RefreshToken` vào bảng `refresh_tokens` với `revoked = false`.
7. Trả về cả hai token + thông tin user.

**Cơ chế xác thực mỗi request:**
```
Client request
    → Header: Authorization: Bearer <accessToken>
    → JwtAuthenticationFilter.doFilterInternal()
        → Trích xuất token từ header
        → jwtService.extractEmail(token)
        → Tìm User theo email từ DB
        → jwtService.isTokenValid(token, user) — kiểm tra email khớp & chưa hết hạn
        → Trích xuất role từ JWT claim
        → Tạo UsernamePasswordAuthenticationToken với authority "ROLE_{role}"
        → Đặt vào SecurityContextHolder
    → SecurityConfig kiểm tra URL-level authorization
```

---

### 1.3. Refresh Token

**`POST /api/v1/auth/refresh-token`** — Public

**Request Body:**
```json
{ "refreshToken": "eyJ..." }
```

**Logic (`AuthServiceImpl.refreshToken`):**
1. Tìm `RefreshToken` trong DB theo giá trị token.
2. Kiểm tra `revoked != true`.
3. Kiểm tra token chưa hết hạn bằng `jwtService.isTokenValid`.
4. Sinh Access Token mới, trả về.

> ⚠️ Chỉ cấp lại **Access Token** mới, KHÔNG cấp lại Refresh Token.

---

### 1.4. Đăng xuất

**`POST /api/v1/auth/logout`** — Yêu cầu xác thực

**Request Body:**
```json
{ "refreshToken": "eyJ..." }
```

**Logic:** Tìm `RefreshToken` trong DB → set `revoked = true` → save.

---

### 1.5. Lấy thông tin người dùng hiện tại

**`GET /api/v1/auth/me`** — Yêu cầu xác thực

**Logic:** Lấy `User` từ `SecurityContextHolder.getContext().getAuthentication().getPrincipal()` → trả về `CurrentUserResponse`.

---

### 1.6. Đổi mật khẩu

**`PUT /api/v1/auth/change-password`** — Yêu cầu xác thực

**Request Body:**
```json
{
  "oldPassword": "password123",
  "newPassword": "NewPass@456"
}
```

**Logic:**
1. Lấy user hiện tại từ SecurityContext.
2. Kiểm tra `oldPassword` khớp.
3. Nếu user là `DOCTOR`: validate mật khẩu mạnh (regex: chữ hoa, chữ thường, số, ký tự đặc biệt, ≥8 ký tự).
4. Encode và lưu mật khẩu mới.
5. Xóa toàn bộ refresh token của user (`refreshTokenRepository.deleteByUserId`) — **bắt buộc logout toàn bộ thiết bị**.

---

### 1.7. Quên mật khẩu (OTP Flow)

**Bước 1 — Gửi OTP:**
**`POST /api/v1/auth/forgot-password`**
```json
{ "email": "user@example.com" }
```

**Logic:**
1. Tìm User theo email.
2. Kiểm tra rate limit: không gửi OTP quá 1 lần/phút.
3. Sinh OTP 6 chữ số ngẫu nhiên.
4. Lưu OTP, thời gian hết hạn (15 phút), reset `otpFailedAttempts = 0`.
5. Gửi email OTP.

**Bước 2 — Reset mật khẩu:**
**`POST /api/v1/auth/reset-password`**
```json
{
  "email": "user@example.com",
  "otpCode": "123456",
  "newPassword": "NewPass@456"
}
```

**Logic:**
1. Kiểm tra `otpFailedAttempts < 5` (chống brute-force).
2. Kiểm tra OTP khớp và chưa hết hạn.
3. Nếu sai: tăng `otpFailedAttempts`. Nếu đủ 5 lần: xóa OTP.
4. Nếu đúng: reset mật khẩu, xóa OTP fields, xóa toàn bộ refresh token.

---

## 2. Luồng Quản lý Doctor

### 2.1. Tạo Doctor (Admin)

**`POST /api/v1/doctors`** — `ADMIN`

**Logic (`DoctorServiceImpl.createDoctor`):**
1. Kiểm tra email chưa tồn tại.
2. Tìm Role `DOCTOR`.
3. Tạo `User` (email, password encode, role=DOCTOR).
4. Tạo `Doctor` liên kết với `User` qua `OneToOne`.
5. Lưu cả hai và trả về `DoctorResponse`.

> Đây là cách duy nhất tạo tài khoản DOCTOR — Admin tạo, không phải tự đăng ký.

### 2.2. Doctor tự cập nhật Profile

**`PATCH /api/v1/doctors/me`** — `DOCTOR`
- Cập nhật: `experienceYears`, `qualification`, `biography`, `clinicRoom`, `consultationFee`.
- Logic: lấy Doctor từ `user_id` của người đang đăng nhập.

### 2.3. Lấy danh sách Doctor (Public)

**`GET /api/v1/doctors?specialtyId=1&keyword=tim`** — Public
- Hỗ trợ filter theo `specialtyId` và `keyword` (tìm theo tên).

### 2.4. Xem lịch làm việc của Doctor (Public)

**`GET /api/v1/doctors/{id}/schedules?workDate=2026-05-10`** — Public

---

## 3. Luồng Đặt lịch khám (Appointment)

> **Điều kiện tiên quyết:** Bệnh nhân phải có `Patient` profile (tạo sau khi đăng ký).

### Bước 1 — Patient cập nhật hồ sơ

**`PATCH /api/v1/patients/me`** — `PATIENT`
```json
{
  "dateOfBirth": "1990-01-15",
  "gender": "MALE",
  "address": "123 Nguyen Hue, HCM",
  "bloodType": "A+"
}
```

### Bước 2 — Xem lịch trống của Doctor

**`GET /api/v1/doctors/{doctorId}/schedules?workDate=2026-05-10`** — Public

Hoặc: **`GET /api/v1/doctor-schedules?doctorId=1&workDate=2026-05-10`** — Public

Chỉ lấy những slot có `status = AVAILABLE`.

### Bước 3 — Đặt lịch

**`POST /api/v1/appointments`** — `PATIENT`

**Request Body:**
```json
{
  "scheduleId": 5,
  "reason": "Dau dau, met moi"
}
```

**Logic (`AppointmentServiceImpl.createAppointment`):**
1. Lấy `currentUser` từ SecurityContext.
2. Tìm `Patient` theo `user_id` (bắt buộc phải có Patient profile).
3. Tìm `DoctorSchedule` theo `scheduleId`.
4. Kiểm tra `schedule.status == AVAILABLE` (nếu không: throw lỗi).
5. Kiểm tra Patient chưa đặt đúng slot này (`existsByPatient_IdAndSchedule_Id`).
6. Lấy `Doctor` từ `schedule.doctor`.
7. Tạo `Appointment` với status = `PENDING`, `appointmentDate` = `schedule.workDate`.
8. Đổi `schedule.status = BOOKED` (khóa slot, ngăn người khác đặt).
9. Lưu và gửi Notification cho Patient.

**Response:** `AppointmentResponse` với đầy đủ thông tin.

---

### Bước 4 — Doctor xác nhận lịch

**`PATCH /api/v1/appointments/{id}/status`** — `DOCTOR` hoặc `ADMIN`

**Request Body:**
```json
{
  "status": "CONFIRMED",
  "cancelReason": null
}
```

**Logic (`AppointmentServiceImpl.updateStatus`):**
1. Lấy `currentUser` từ SecurityContext.
2. Nếu role = DOCTOR: tìm Doctor profile → kiểm tra `appointment.doctor.id == currentDoctor.id` bằng `.longValue() !=` (tuân thủ Luật So Sánh ID).
3. Parse và validate `status` bằng Enum (chỉ cho phép: CONFIRMED, CANCELLED, COMPLETED).
4. Nếu CANCELLED: lưu `cancelReason`, trả lại `schedule.status = AVAILABLE`.
5. Lưu Appointment và gửi Notification tương ứng.

**Các trạng thái hợp lệ:**

```
PENDING ──────────────► CONFIRMED ──────────────► COMPLETED
   │                        │
   └────────────────────────┴──────────────────► CANCELLED
```

---

### Bước 5 — Patient huỷ lịch (nếu cần)

**`DELETE /api/v1/appointments/{id}`** — `PATIENT`

**Logic:**
1. Kiểm tra `appointment.patient.user.id == currentUser.id` (ownership check qua bảng User — tuân thủ Luật Phân Quyền Object).
2. Chỉ huỷ được khi status = `PENDING` hoặc `CONFIRMED`.
3. Trả lại `schedule.status = AVAILABLE`.
4. Gửi Notification cho Doctor.

---

## 4. Luồng Khám bệnh & Kê đơn

### Bước 1 — Doctor tạo Medical Record

> **Điều kiện:** `Appointment.status == CONFIRMED`

**`POST /api/v1/medical-records`** — `DOCTOR`

**Request Body:**
```json
{
  "appointmentId": 10,
  "symptoms": "Dau dau, chong mat",
  "diagnosis": "Tang huyet ap do 1",
  "treatmentPlan": "Nghi ngoi, giam muoi, dung thuoc",
  "notes": "Theo doi them",
  "followUpDate": "2026-05-20"
}
```

**Logic (`MedicalRecordServiceImpl.createMedicalRecord`):**
1. Lấy Doctor từ `user_id` của người đang đăng nhập.
2. Tìm Appointment theo `appointmentId`.
3. Kiểm tra `appointment.doctor.id == doctor.id` (quyền sở hữu).
4. Kiểm tra `appointment.status == CONFIRMED` (không phải PENDING hay COMPLETED).
5. Kiểm tra chưa có MedicalRecord nào cho appointment này.
6. Tạo `MedicalRecord`.
7. **Tự động chuyển `appointment.status = COMPLETED`** — đây là hành động ngầm định.
8. Lưu cả hai entity.

> ⚠️ **Lưu ý quan trọng:** Sau khi tạo MedicalRecord, Appointment tự động chuyển sang `COMPLETED`. Điều này là tiền đề để tạo Prescription và Payment sau đó.

---

### Bước 2 — Doctor kê đơn thuốc

> **Điều kiện:** `Appointment.status == COMPLETED` và MedicalRecord đã tồn tại.

**`POST /api/v1/prescriptions`** — `DOCTOR` (`@PreAuthorize("hasRole('DOCTOR')")`)

**Request Body:**
```json
{
  "medicalRecordId": 7,
  "generalNote": "Uong thuoc dung gio, khong bo bua",
  "items": [
    {
      "medicineId": 2,
      "dosePerTime": 1,
      "timesPerDay": 2,
      "durationDays": 7,
      "dosageText": "1 vien x 2 lan/ngay x 7 ngay",
      "instruction": "Uong sau bua an",
      "note": null
    }
  ]
}
```

> ⚠️ Frontend KHÔNG gửi `quantity`, `unitPrice`, `lineTotal`. Backend tự tính hoàn toàn.

**Logic (`PrescriptionServiceImpl.createPrescription`):**
1. Resolve current User từ SecurityContext.
2. Tìm Doctor theo `user_id`.
3. Tìm MedicalRecord theo `medicalRecordId`.
4. Lấy Appointment từ MedicalRecord.
5. Kiểm tra quyền: `doctor.id.longValue() == appointment.doctor.id.longValue()` (Luật So Sánh ID).
6. Kiểm tra `appointment.status == COMPLETED`.
7. Kiểm tra chưa có Prescription nào cho MedicalRecord này.
8. Kiểm tra không có thuốc trùng lặp trong danh sách items.
9. **Batch validation thuốc:**
   - Tìm tất cả Medicine theo danh sách ID.
   - Kiểm tra từng thuốc tồn tại và `status == ACTIVE`.
10. **Với mỗi PrescriptionItem:**
    - `quantity` = `dosePerTime × timesPerDay × durationDays` ← **Backend tự tính, không tin Frontend**
    - `unitPrice` = `medicine.unitPrice` ← **Price snapshot tại thời điểm kê đơn**
    - `lineTotal` = `unitPrice × quantity`
11. `Prescription.totalPrice` được tự động tính bởi `@PrePersist` = tổng tất cả `lineTotal`.
12. Gửi Notification cho Patient.

**Response:** `PrescriptionResponse` với danh sách items đầy đủ.

---

### Bước 3 (Tùy chọn) — Doctor cập nhật đơn thuốc

**`PATCH /api/v1/prescriptions/{id}`** — `DOCTOR`

**Logic:**
- Kiểm tra quyền sở hữu: `checkDoctorOwnership` — tìm Doctor theo `user_id`, so sánh `doctor.id.longValue() != prescription.doctor.id.longValue()`.
- Nếu cập nhật `items`: xóa toàn bộ items cũ (`orphanRemoval = true`), thêm items mới.
- Tự động tính lại `quantity`, `unitPrice` (snapshot mới), `lineTotal` cho từng item.

---

### API đọc Medical Record & Prescription

| Method | URL | Role | Mô tả |
|---|---|---|---|
| GET | `/api/v1/medical-records/{id}` | DOCTOR, PATIENT, ADMIN | Xem theo ID |
| GET | `/api/v1/medical-records/appointment/{appointmentId}` | DOCTOR, PATIENT, ADMIN | Xem theo Appointment |
| GET | `/api/v1/prescriptions/{id}` | DOCTOR, PATIENT, ADMIN | Xem chi tiết đơn thuốc |
| GET | `/api/v1/prescriptions/medical-record/{medicalRecordId}` | DOCTOR, PATIENT, ADMIN | Xem đơn thuốc theo MedicalRecord |

**Authorization check (`checkReadPermission`):**
- **ADMIN:** toàn quyền xem.
- **DOCTOR:** lấy role từ `SecurityContextHolder` (tránh Lazy Error), tìm Doctor → kiểm tra `doctor.id == prescription.doctor.id`.
- **PATIENT:** tìm Patient → kiểm tra `patient.id == prescription.patient.id`.

---

## 5. Luồng Thanh toán (Payment)

### Tổng quan tính tiền

```
amount = Doctor.consultationFee + Prescription.totalPrice
```

- `consultationFee`: phí khám cố định từ bảng `doctors`.
- `totalPrice`: tổng tiền thuốc từ đơn thuốc (nếu có).
- Nếu không có Prescription: chỉ tính `consultationFee`.

### Tạo Payment

> **Điều kiện:** `Appointment.status == COMPLETED`

**`POST /api/v1/payments`** — `PATIENT` hoặc `ADMIN`

**Request Body:**
```json
{
  "appointmentId": 10,
  "paymentMethod": "CASH"
}
```

**Logic (`PaymentServiceImpl.createPayment`):**
1. Tìm Appointment.
2. Kiểm tra chưa có Payment nào (`existsByAppointment_Id`).
3. Kiểm tra `appointment.status == COMPLETED`.
4. Nếu role = PATIENT: kiểm tra `appointment.patient.user.id == currentUser.id` (Luật Phân Quyền Object).
5. Tính `totalAmount`:
   - Bắt đầu bằng `doctor.consultationFee`.
   - Tìm MedicalRecord → Prescription → cộng thêm `prescription.totalPrice` nếu có.
6. Tạo Payment với `status = PENDING`.
7. Gửi Notification cho Patient.

### Cập nhật trạng thái Payment (Admin)

**`PATCH /api/v1/payments/{id}/status`** — `ADMIN`

```json
{ "status": "PAID" }
```

- Trạng thái hợp lệ: `PAID`, `FAILED`, `CANCELLED`, `PENDING`.
- Khi `PAID`: gửi Notification "thanh toán thành công".

### Xem Payment

| Method | URL | Role | Mô tả |
|---|---|---|---|
| GET | `/api/v1/payments/{id}` | PATIENT, DOCTOR, ADMIN | Xem theo ID |
| GET | `/api/v1/payments/appointment/{appointmentId}` | PATIENT, DOCTOR, ADMIN | Xem theo Appointment |

**Ownership check:**
- PATIENT: `payment.patient.user.id == currentUser.id`
- DOCTOR: `payment.appointment.doctor.user.id == currentUser.id`

---

## 6. Luồng Đánh giá (Review)

> **Điều kiện:** Chỉ đánh giá sau khi appointment `COMPLETED`.

### Tạo Review

**`POST /api/v1/reviews`** — `PATIENT`

```json
{
  "appointmentId": 10,
  "rating": 5,
  "comment": "Bac si kham rat ky, nhiet tinh"
}
```

**Logic (`ReviewServiceImpl.createReview`):**
1. Tìm Appointment.
2. Kiểm tra Patient sở hữu appointment.
3. Kiểm tra `appointment.status == COMPLETED`.
4. Kiểm tra chưa có Review cho appointment này.
5. Tạo Review với Doctor và Patient từ Appointment.
6. Tự động cập nhật `doctor.averageRating`.

### Cập nhật Review

**`PATCH /api/v1/reviews/{id}`** — `PATIENT`

### Xem Review

| Method | URL | Role |
|---|---|---|
| GET | `/api/v1/reviews/doctor/{doctorId}` | Public |
| GET | `/api/v1/reviews/{id}` | PATIENT, DOCTOR, ADMIN |

---

## 7. Luồng Thông báo (Notification)

Hệ thống tự động tạo Notification tại các sự kiện:

| Sự kiện | Người nhận | Type |
|---|---|---|
| Đặt lịch thành công | Patient | `APPOINTMENT_CREATED` |
| Lịch được xác nhận | Patient | `APPOINTMENT_CONFIRMED` |
| Lịch bị huỷ (Doctor/Admin huỷ) | Patient | `APPOINTMENT_CANCELLED` |
| Patient huỷ lịch | Doctor | `APPOINTMENT_CANCELLED` |
| Đơn thuốc được tạo | Patient | `PRESCRIPTION_CREATED` |
| Hóa đơn được tạo | Patient | `PAYMENT_CREATED` |
| Thanh toán thành công | Patient | `PAYMENT_COMPLETED` |

### API Notification

| Method | URL | Role | Mô tả |
|---|---|---|---|
| GET | `/api/v1/notifications/me` | Auth | Lấy tất cả thông báo của mình |
| GET | `/api/v1/notifications/{id}` | Auth | Xem chi tiết |
| PATCH | `/api/v1/notifications/{id}/read` | Auth | Đánh dấu đã đọc |
| PATCH | `/api/v1/notifications/read-all` | Auth | Đánh dấu tất cả đã đọc |

---

## 8. Luồng Quản lý danh mục (Admin)

### Chuyên khoa (Specialty)

| Method | URL | Role |
|---|---|---|
| GET | `/api/v1/specialties` | Public |
| GET | `/api/v1/specialties/{id}` | Public |
| POST | `/api/v1/specialties` | ADMIN |
| PATCH | `/api/v1/specialties/{id}` | ADMIN |
| DELETE | `/api/v1/specialties/{id}` | ADMIN |

### Thuốc (Medicine)

| Method | URL | Role |
|---|---|---|
| GET | `/api/v1/medicines` | Public |
| GET | `/api/v1/medicines/{id}` | Public |
| POST | `/api/v1/medicines` | ADMIN |
| PATCH | `/api/v1/medicines/{id}` | ADMIN |
| PATCH | `/api/v1/medicines/{id}/status` | ADMIN |

### Lịch làm việc (DoctorSchedule)

| Method | URL | Role | Mô tả |
|---|---|---|---|
| GET | `/api/v1/doctor-schedules?doctorId=1&workDate=...` | Public | Lọc theo Doctor và ngày |
| POST | `/api/v1/doctor-schedules` | ADMIN, DOCTOR | Tạo khung giờ |
| PUT | `/api/v1/doctor-schedules/{id}` | ADMIN, DOCTOR | Cập nhật khung giờ |
| DELETE | `/api/v1/doctor-schedules/{id}` | ADMIN, DOCTOR | Xóa khung giờ |
| PATCH | `/api/v1/doctor-schedules/{id}/status` | ADMIN, DOCTOR | Cập nhật status |

**Trạng thái DoctorSchedule:** `AVAILABLE` → `BOOKED` (khi có Appointment) → `AVAILABLE` (khi Appointment huỷ)

---

## 9. Sơ đồ tổng quan luồng chính

```
[PATIENT đăng ký]
       │
       ▼
[PATIENT cập nhật Patient profile]
       │
       ▼
[Xem Doctor & DoctorSchedule (Public)]
       │
       ▼
[POST /appointments → tạo Appointment (PENDING)]
       │   schedule.status → BOOKED
       ▼
[DOCTOR: PATCH /appointments/{id}/status → CONFIRMED]
       │   Notification gửi Patient
       ▼
[DOCTOR: POST /medical-records → tạo MedicalRecord]
       │   appointment.status → COMPLETED (auto)
       ▼
[DOCTOR: POST /prescriptions → kê đơn thuốc]
       │   quantity = dosePerTime × timesPerDay × durationDays (Backend tính)
       │   unitPrice = snapshot từ Medicine
       │   totalPrice = sum(lineTotal)
       ▼
[PATIENT/ADMIN: POST /payments → tạo Payment]
       │   amount = consultationFee + prescription.totalPrice
       ▼
[ADMIN: PATCH /payments/{id}/status → PAID]
       │
       ▼
[PATIENT: POST /reviews → đánh giá Doctor]
```

---

## 10. Cấu trúc Response chuẩn

```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

**Error Response (từ GlobalExceptionHandler):**
```json
{
  "success": false,
  "message": "Mô tả lỗi",
  "data": null
}
```

| Exception | HTTP Code |
|---|---|
| `ResourceNotFoundException` | 404 |
| `InvalidAppointmentStateException` | 400 |
| `PrescriptionAlreadyExistsException` | 409 |
| `PaymentAlreadyExistsException` | 409 |
| `MedicineInactiveException` | 400 |
| `IllegalArgumentException` | 400 |
| `AccessDeniedException` | 403 |
| Unauthenticated | 401 |
