package com.example.booking_clinic.controller;

import com.example.booking_clinic.common.api.ApiResponse;
import com.example.booking_clinic.dto.doctor.CreateDoctorRequest;
import com.example.booking_clinic.dto.doctor.DoctorResponse;
import com.example.booking_clinic.dto.doctor.UpdateDoctorRequest;
import com.example.booking_clinic.dto.doctor.UpdateDoctorStatusRequest;
import com.example.booking_clinic.dto.doctor_schedule.CreateDoctorScheduleRequest;
import com.example.booking_clinic.dto.doctor_schedule.DoctorScheduleResponse;
import com.example.booking_clinic.service.DoctorScheduleService;
import com.example.booking_clinic.service.DoctorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;
    private final DoctorScheduleService doctorScheduleService;
    // Gộp các chức năng xem danh sách, tìm kiếm, lọc vào đây
    // Trả về HTTP Response,  data là DoctorResponse
    @GetMapping
    public ResponseEntity<ApiResponse<List<DoctorResponse>>> getAllDoctors(
            @RequestParam(required = false) Long specialtyId, //Lọc theo chuyên khoa, ?speciltyId
            @RequestParam(required = false) String keyword) { // Tìm kiếm bác sĩ , ?keyword
        List<DoctorResponse> doctors = doctorService.getAllDoctors(specialtyId, keyword);//gọi service lấy danh sách bác sĩ
        return ResponseEntity.ok(ApiResponse.success("Doctors fetched successfully", doctors));
    }

    //@PathVariable Long id lấy id từ URL path
    @GetMapping("/{id}")
        public ResponseEntity<ApiResponse<DoctorResponse>> getDoctorById(@PathVariable Long id) {
            DoctorResponse doctor = doctorService.getDoctorById(id); //gọi service
        return ResponseEntity.ok(ApiResponse.success("Doctor fetched successfully", doctor));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DoctorResponse>> createDoctor(@Valid @RequestBody CreateDoctorRequest request) {
        DoctorResponse doctor = doctorService.createDoctor(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Doctor created successfully", doctor));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<DoctorResponse>> updateDoctor(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDoctorRequest request) {
        DoctorResponse doctor = doctorService.updateDoctor(id, request);
        return ResponseEntity.ok(ApiResponse.success("Doctor updated successfully", doctor));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<DoctorResponse>> updateDoctorStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDoctorStatusRequest request) {
        DoctorResponse doctor = doctorService.updateDoctorStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Doctor status updated successfully", doctor));
    }

    // Lấy danh sách lịch của bác sĩ (có thể truyền thêm query ?workDate=2024-05-20)
    @GetMapping("/{id}/schedules")
    public ResponseEntity<ApiResponse<List<DoctorScheduleResponse>>> getSchedules(
            @PathVariable("id") Long doctorId,
            @RequestParam(required = false) LocalDate workDate) {
        List<DoctorScheduleResponse> schedules = doctorScheduleService.getSchedulesByDoctor(doctorId, workDate);
        return ResponseEntity.ok(ApiResponse.success("Schedules fetched successfully", schedules));
    }
    //Tạo lịch làm cho bác sĩ với Id
    @PostMapping("/{id}/schedules")
    public ResponseEntity<ApiResponse<DoctorScheduleResponse>> createSchedule(
            @PathVariable("id") Long doctorId,
            @Valid @RequestBody CreateDoctorScheduleRequest request) {
        
        // Gắn doctorId từ URL path vào request (để đảm bảo đúng bác sĩ)
        CreateDoctorScheduleRequest scheduleRequest = new CreateDoctorScheduleRequest(
                doctorId,
                request.workDate(),
                request.startTime(),
                request.endTime()
        );
        
        DoctorScheduleResponse schedule = doctorScheduleService.createSchedule(scheduleRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Schedule created successfully", schedule));
    }
}
