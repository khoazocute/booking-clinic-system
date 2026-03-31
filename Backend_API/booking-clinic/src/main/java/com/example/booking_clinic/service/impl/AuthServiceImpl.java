package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.ResourceNotFoundException;
import com.example.booking_clinic.dto.auth.RegisterRequest;
import com.example.booking_clinic.dto.auth.RegisterResponse;
import com.example.booking_clinic.entity.Role;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.repository.RoleRepository;
import com.example.booking_clinic.repository.UserRepository;
import com.example.booking_clinic.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service // Đánh dấu lớp này là một service component trong Spring, cho phép Spring quản lý và tiêm phụ thuộc
@RequiredArgsConstructor // Tự động tạo constructor với tất cả các trường final, giúp giảm boilerplate code
public class AuthServiceImpl implements AuthService {

    private static final String DEFAULT_ROLE = "PATIENT"; // Mặc định khi đăng ký sẽ gán role PATIENT cho người dùng mới
    private static final String DEFAULT_STATUS = "ACTIVE";
    
    // Các repository và encoder được tiêm vào thông qua constructor do @RequiredArgsConstructor
    // UserRepository để tương tác với bảng người dùng trong cơ sở dữ liệu
    // RoleRepository để tương tác với bảng vai trò trong cơ sở dữ liệu
    // PasswordEncoder để mã hóa mật khẩu trước khi lưu vào cơ sở dữ liệu, đảm bảo an toàn thông tin người dùng
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override // Ghi đè phương thức register từ interface AuthService để xử lý logic đăng ký người dùng
    public RegisterResponse register(RegisterRequest request) {
         //Nhận một đối tượng RegisterRequest chứa thông tin đăng ký từ client
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already in use: " + request.email());
        }

        Role patientRole = roleRepository.findByName(DEFAULT_ROLE)
                .orElseThrow(() -> new ResourceNotFoundException("Role PATIENT was not found"));
// Tạo một đối tượng User mới dựa trên thông tin từ RegisterRequest và lưu vào cơ sở dữ liệu
// Sử dụng builder pattern để tạo đối tượng User, giúp code rõ ràng và dễ đọc hơn
//builder pattern giúp tạo đối tượng User một cách linh hoạt và dễ đọc hơn, đặc biệt khi có nhiều trường cần khởi tạo.
        User savedUser = userRepository.save(
                User.builder()
                        .role(patientRole)
                        .fullName(request.fullName())
                        .email(request.email())
                        .phone(request.phone())
                        // Mã hóa mật khẩu trước khi lưu vào cơ sở dữ liệu để đảm bảo an toàn thông tin người dùng
                        .password(passwordEncoder.encode(request.password()))
                        .avatarUrl("default-avatar.png")
                        .status(DEFAULT_STATUS)
                        //Dùng loombook builder để tạo đối tượng User một cách linh hoạt và dễ đọc hơn, 
                        // đặc biệt khi có nhiều trường cần khởi tạo.
                        .build() // Xây dựng đối tượng User và lưu vào cơ sở dữ liệu,
                        //  trả về đối tượng đã được lưu (có chứa ID được tạo tự động)
        );
// Trả về một đối tượng RegisterResponse chứa thông tin người dùng đã được tạo, 
// không bao gồm mật khẩu để đảm bảo bảo mật
//Trả dữ liệu về cho controller để gửi lại cho client, 
// giúp client có thể hiển thị thông tin người dùng đã đăng ký thành công.
        return new RegisterResponse(
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                savedUser.getRole().getName(),
                savedUser.getStatus(),
                savedUser.getCreatedAt()
        );
    }
}
