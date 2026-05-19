package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
// Repository để truy xuất dữ liệu người dùng từ cơ sở dữ liệu,
// cung cấp các phương thức để tìm kiếm người dùng theo email và kiểm tra sự tồn tại
// Câu lệnh này dùng để extend JpaRepository, cung cấp các phương thức CRUD cơ bản cho entity User,
// đây là kế thừa từ Spring Data JPA, giúp giảm thiểu việc viết code boilerplate cho các thao tác cơ sở dữ liệu.
// Các hàm có sẵn như 
// save(user)
// findById(id)
// findAll()
// delete(user)
// deleteById(id)
// count()
//=> ta chỉ cần định nghĩa thêm những hàm mà nghiệp vụ cần
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
//Optional dùng để trả về User nếu có và rỗng nếu không tìm được để tránh trả về lỗi null khi ép trực tiếp về User
// sẽ dễ gây ra lỗi NullPointerException
// Kiểm tra xem email đã tồn tại trong cơ sở dữ liệu hay chưa, 
// trả về true nếu tồn tại, false nếu không tồn tại
    boolean existsByEmail(String email);

    List<User> findByRole_Name(String roleName);
}
