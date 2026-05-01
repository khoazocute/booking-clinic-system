package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findByAppointment_Id(Long appointmentId);

    boolean existsByAppointment_Id(Long appointmentId);

    List<Review> findByDoctor_Id(Long doctorId);
}
