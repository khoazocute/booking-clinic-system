package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Spring Data JPA sẽ tự động cung cấp các hàm save, findAll, findById...
}