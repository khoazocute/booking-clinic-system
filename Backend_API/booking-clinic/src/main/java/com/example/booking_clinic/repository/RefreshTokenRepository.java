package com.example.booking_clinic.repository;
import com.example.booking_clinic.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;



public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
     Optional<RefreshToken> findByRefreshToken(String refreshToken);

    List<RefreshToken> findByUserId(Long userId);
}


//Ở RESPONSITORY này, chúng ta định nghĩa một interface RefreshTokenRepository kế thừa từ JpaRepository,
// TẠI ĐÂY ĐẶT RA CÂU HỎI VỀ DB ĐANG CẦN GÌ, CHỈ LÀM NHỮNG VIỆC LIÊN QUAN TỚI TRUY CẬP DỮ LIỆU 

//JpaRepository cung cấp các phương thức CRUD cơ bản như save(), findById(), findAll(), deleteById()... 
// giúp chúng ta dễ dàng thao tác với cơ sở dữ liệu mà không cần phải viết nhiều mã lệnh SQL phức tạp.
// truyền vào gồm có tên của entity (RefreshToken) và kiểu dữ liệu của khóa chính (Long) để JpaRepository có thể tự động tạo ra các phương thức truy vấn phù hợp với entity đó.