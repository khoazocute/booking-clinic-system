package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
// Repository để truy xuất dữ liệu người dùng từ cơ sở dữ liệu,
// cung cấp các phương thức để tìm kiếm người dùng theo email và kiểm tra sự tồn tại
// Câu lệnh này dùng để extend JpaRepository, cung cấp các phương thức CRUD cơ bản cho entity User,
// đây là kế thừa từ Spring Data JPA, giúp giảm thiểu việc viết code boilerplate cho các thao tác cơ sở dữ liệu.
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
// Kiểm tra xem email đã tồn tại trong cơ sở dữ liệu hay chưa, 
// trả về true nếu tồn tại, false nếu không tồn tại
    boolean existsByEmail(String email);
}
