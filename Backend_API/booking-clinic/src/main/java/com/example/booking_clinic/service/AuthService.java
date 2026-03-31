package com.example.booking_clinic.service;

import com.example.booking_clinic.dto.auth.LoginRequest;
import com.example.booking_clinic.dto.auth.LoginResponse;
import com.example.booking_clinic.dto.auth.RegisterRequest;
import com.example.booking_clinic.dto.auth.RegisterResponse;

public interface AuthService {
//Đây là tính trừu tượng trong OOP, 
//định nghĩa một phương thức register mà không cung cấp chi tiết về cách thực hiện,
// giúp tách biệt giữa định nghĩa và triển khai,
// cho phép linh hoạt trong việc thay đổi cách thức đăng ký mà không ảnh hưởng đến phầngọi phương thức này trong controller hoặc các lớp khác sử dụng dịch vụ này.
    RegisterResponse register(RegisterRequest request);
    
    LoginResponse login(LoginRequest request);
}
//Đây là interface định nghĩa phương thức register để xử lý logic đăng ký người dùng. 
// Các lớp triển khai interface này sẽ cung cấp chi tiết về cách thực hiện đăng ký,
// Bao gồm kiểm tra dữ liệu, lưu thông tin người dùng vào cơ sở dữ liệu và trả về thông tin người dùng đã được tạo.