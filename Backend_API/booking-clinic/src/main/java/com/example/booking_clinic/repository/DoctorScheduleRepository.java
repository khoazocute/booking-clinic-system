package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.DoctorSchedule;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, Long> {

    // Tìm toàn bộ lịch của 1 bác sĩ
    List<DoctorSchedule> findByDoctor_Id(Long doctorId);

    List<DoctorSchedule> findByDoctor_IdAndWorkDate(Long doctorId, LocalDate workDate);

    // Kiểm tra xem có bị trùng/giao lấn thời gian với các lịch đã có không
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END " +
           "FROM DoctorSchedule s " +
           "WHERE s.doctor.id = :doctorId " +
           "AND s.workDate = :workDate " +
           "AND s.startTime < :endTime " +
           "AND s.endTime > :startTime")
    boolean existsOverlappingSchedule(@Param("doctorId") Long doctorId, 
                                      @Param("workDate") LocalDate workDate, 
                                      @Param("startTime") LocalTime startTime, 
                                      @Param("endTime") LocalTime endTime);

    // Kiểm tra trùng/giao lấn thời gian nhưng bỏ qua một lịch cụ thể (dùng khi cập nhật)
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END " +
           "FROM DoctorSchedule s " +
           "WHERE s.doctor.id = :doctorId " +
           "AND s.id != :excludeId " +
           "AND s.workDate = :workDate " +
           "AND s.startTime < :endTime " +
           "AND s.endTime > :startTime")
    boolean existsOverlappingScheduleExcluding(@Param("doctorId") Long doctorId,
                                               @Param("excludeId") Long excludeId,
                                               @Param("workDate") LocalDate workDate,
                                               @Param("startTime") LocalTime startTime,
                                               @Param("endTime") LocalTime endTime);

    // Atomic booking: chỉ cập nhật nếu vẫn còn AVAILABLE, trả về số row bị ảnh hưởng
    @Modifying
    @Query("UPDATE DoctorSchedule s SET s.status = 'BOOKED' WHERE s.id = :id AND s.status = 'AVAILABLE'")
    int tryBookSchedule(@Param("id") Long id);

    // Trả lại AVAILABLE cho các slot bị giữ bởi lịch hẹn hết hạn
    @Modifying
    @Query("UPDATE DoctorSchedule s SET s.status = 'AVAILABLE' WHERE s.id = :id AND s.status = 'BOOKED'")
    int releaseSchedule(@Param("id") Long id);

    // Pessimistic write lock: đảm bảo không có race condition khi booking
    @Query("SELECT s FROM DoctorSchedule s WHERE s.id = :id")
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<DoctorSchedule> findByIdWithLock(@Param("id") Long id);
}
