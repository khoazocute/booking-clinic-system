package com.example.booking_clinic.repository;

import com.example.booking_clinic.entity.DoctorSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

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
}
