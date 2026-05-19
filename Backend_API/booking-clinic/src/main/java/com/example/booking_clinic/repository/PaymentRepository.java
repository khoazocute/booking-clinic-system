package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    boolean existsByAppointment_IdAndStatusNot(Long appointmentId, String status);
    Optional<Payment> findByAppointment_Id(Long appointmentId);
}
