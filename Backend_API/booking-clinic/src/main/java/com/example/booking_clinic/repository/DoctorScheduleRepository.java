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
    List<DoctorSchedule> findByDoctor_IdOrderByCreatedAtDescIdDesc(Long doctorId);

    List<DoctorSchedule> findByDoctor_IdAndWorkDateOrderByCreatedAtDescIdDesc(Long doctorId, LocalDate workDate);

    List<DoctorSchedule> findByWorkDateBeforeAndStatusIn(LocalDate today, List<String> statuses);

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

    // Trả lại AVAILABLE cho các slot bị giữ bởi lịch hẹn hết hạn
    @Modifying
    @Query("UPDATE DoctorSchedule s SET s.status = 'AVAILABLE' WHERE s.id = :id AND s.status = 'BOOKED'")
    int releaseSchedule(@Param("id") Long id);

    /**
     * Pessimistic write lock on one slot row (SELECT ... FOR UPDATE). Concurrent bookings of the same slot queue
     * here until the first transaction commits, then read the committed status. Native SQL because Hibernate's
     * "FOR UPDATE OF alias" is not supported by MariaDB / TiDB.
     */
    @Query(value = "SELECT * FROM doctor_schedules WHERE id = :id FOR UPDATE", nativeQuery = true)
    Optional<DoctorSchedule> findByIdWithLock(@Param("id") Long id);
}
