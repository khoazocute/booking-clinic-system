package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Long> {
    List<Medicine> findByIdIn(List<Long> ids);

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    // Atomic stock deduction: chỉ trừ được nếu tồn kho vẫn còn đủ tại thời điểm chạy câu lệnh này
    @Modifying
    @Query("UPDATE Medicine m SET m.stockQuantity = m.stockQuantity - :qty WHERE m.id = :id AND m.stockQuantity >= :qty")
    int tryDeductStock(@Param("id") Long id, @Param("qty") int qty);
}
