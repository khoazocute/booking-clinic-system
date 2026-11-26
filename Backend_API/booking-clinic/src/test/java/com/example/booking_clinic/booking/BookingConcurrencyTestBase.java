package com.example.booking_clinic.booking;

import com.example.booking_clinic.common.exception.SlotUnavailableException;
import com.example.booking_clinic.dto.appointment.CreateAppointmentRequest;
import com.example.booking_clinic.entity.Appointment;
import com.example.booking_clinic.entity.Doctor;
import com.example.booking_clinic.entity.DoctorSchedule;
import com.example.booking_clinic.entity.Patient;
import com.example.booking_clinic.entity.Role;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.entity.enums.AppointmentStatus;
import com.example.booking_clinic.repository.AppointmentRepository;
import com.example.booking_clinic.repository.DoctorRepository;
import com.example.booking_clinic.repository.DoctorScheduleRepository;
import com.example.booking_clinic.repository.PatientRepository;
import com.example.booking_clinic.repository.RoleRepository;
import com.example.booking_clinic.repository.UserRepository;
import com.example.booking_clinic.service.AppointmentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Double booking, tested the way it happens: many patients press "Book" for the same slot at the same moment.
 * Real service, real transactions, real database locks; only the HTTP layer is skipped.
 */
@SpringBootTest
abstract class BookingConcurrencyTestBase {

    static final int PATIENTS = 50;

    @Autowired AppointmentService appointmentService;
    @Autowired AppointmentRepository appointmentRepository;
    @Autowired DoctorScheduleRepository scheduleRepository;
    @Autowired DoctorRepository doctorRepository;
    @Autowired PatientRepository patientRepository;
    @Autowired UserRepository userRepository;
    @Autowired RoleRepository roleRepository;

    private User user(String roleName, String name) {
        Role role = roleRepository.findByName(roleName).orElseThrow();
        return userRepository.save(User.builder()
                .role(role)
                .fullName(name)
                .email(name.toLowerCase().replace(' ', '.') + "." + UUID.randomUUID() + "@example.test")
                .phone("0900000000")
                .password("{noop}not-used")
                .avatarUrl("")
                .status("ACTIVE")
                .build());
    }

    private DoctorSchedule freeSlotTomorrow() {
        Doctor doctor = doctorRepository.save(Doctor.builder()
                .user(user("DOCTOR", "Doctor Test"))
                .consultationFee(new BigDecimal("300000"))
                .status("ACTIVE")
                .licenseStatus("ACTIVE")
                .licenseExpiryDate(LocalDate.now().plusYears(1))
                .build());
        return scheduleRepository.save(DoctorSchedule.builder()
                .doctor(doctor)
                .workDate(LocalDate.now().plusDays(1))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 30))
                .status("AVAILABLE")
                .build());
    }

    @Test
    void fiftyPatientsPressBookOnTheSameSlotAtTheSameMoment_exactlyOneGetsIt() throws Exception {
        DoctorSchedule slot = freeSlotTomorrow();
        List<User> patients = new ArrayList<>();
        for (int i = 0; i < PATIENTS; i++) {
            User u = user("PATIENT", "Patient " + i);
            patientRepository.save(Patient.builder().user(u).build());
            patients.add(u);
        }

        ExecutorService pool = Executors.newFixedThreadPool(PATIENTS);
        CountDownLatch ready = new CountDownLatch(PATIENTS);
        CountDownLatch go = new CountDownLatch(1);
        List<Future<String>> results = new ArrayList<>();
        for (User patient : patients) {
            results.add(pool.submit(() -> {
                SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                        patient, null, List.of(new SimpleGrantedAuthority("ROLE_PATIENT"))));
                ready.countDown();
                go.await(); // all threads start together
                try {
                    appointmentService.createAppointment(new CreateAppointmentRequest(slot.getId(), "concurrency test"));
                    return "BOOKED";
                } catch (SlotUnavailableException e) {
                    return "SLOT_TAKEN_409";
                } catch (Exception e) {
                    return "UNEXPECTED " + e.getClass().getSimpleName() + ": " + e.getMessage();
                } finally {
                    SecurityContextHolder.clearContext();
                }
            }));
        }
        ready.await();
        long start = System.nanoTime();
        go.countDown();

        List<String> outcomes = new ArrayList<>();
        for (Future<String> f : results) {
            outcomes.add(f.get(60, TimeUnit.SECONDS));
        }
        pool.shutdown();
        long ms = (System.nanoTime() - start) / 1_000_000;

        Map<String, Long> summary = outcomes.stream().collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
        System.out.printf("[%s] %d concurrent bookings of one slot in %d ms -> %s%n", database(), PATIENTS, ms, summary);

        assertEquals(Map.of("BOOKED", 1L, "SLOT_TAKEN_409", (long) PATIENTS - 1), summary);

        List<Appointment> active = appointmentRepository.findAll().stream()
                .filter(a -> a.getSchedule() != null && a.getSchedule().getId().equals(slot.getId()))
                .filter(a -> a.getStatus() == AppointmentStatus.PENDING)
                .toList();
        assertEquals(1, active.size(), "exactly one appointment holds the slot in the database");
        assertEquals("BOOKED", scheduleRepository.findById(slot.getId()).orElseThrow().getStatus());
    }

    abstract String database();
}
