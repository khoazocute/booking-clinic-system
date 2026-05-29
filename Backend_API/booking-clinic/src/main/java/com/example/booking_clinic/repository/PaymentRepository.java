package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByAppointment_Id(Long appointmentId);
    List<Payment> findByAppointment_IdOrderByCreatedAtDescIdDesc(Long appointmentId);
    boolean existsByAppointment_IdAndPaymentType(Long appointmentId, String paymentType);
}
