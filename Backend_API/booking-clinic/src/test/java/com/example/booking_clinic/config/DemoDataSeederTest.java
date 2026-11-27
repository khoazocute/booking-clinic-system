package com.example.booking_clinic.config;

import com.example.booking_clinic.entity.Doctor;
import com.example.booking_clinic.repository.DoctorRepository;
import com.example.booking_clinic.repository.DoctorScheduleRepository;
import com.example.booking_clinic.repository.SpecialtyRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** The public demo must start with bookable data and must not duplicate it on restart. */
@SpringBootTest(properties = {
        "app.demo.enabled=true",
        "spring.datasource.url=jdbc:h2:mem:demo_seed;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE"
})
class DemoDataSeederTest {

    @Autowired DemoDataSeeder seeder;
    @Autowired SpecialtyRepository specialties;
    @Autowired DoctorRepository doctors;
    @Autowired DoctorScheduleRepository schedules;

    @Test
    @Transactional
    void seedsEverySpecialtyWithABookableDoctorAndFreeSlots() {
        // ran once already on ApplicationReadyEvent
        assertEquals(10, specialties.count());
        List<Doctor> demo = doctors.findAll().stream()
                .filter(d -> d.getUser().getEmail().endsWith(DemoDataSeeder.DEMO_EMAIL_DOMAIN)).toList();
        assertEquals(10, demo.size());
        assertEquals(10, demo.stream().map(d -> d.getSpecialty().getId()).distinct().count(), "one per specialty");
        assertTrue(demo.stream().allMatch(d -> "ACTIVE".equals(d.getStatus()) && "ACTIVE".equals(d.getLicenseStatus())
                && d.getLicenseExpiryDate().isAfter(LocalDate.now())), "every demo doctor is bookable");

        long slots = schedules.count();
        assertTrue(slots > 0);
        assertTrue(schedules.findAll().stream().allMatch(s -> s.getWorkDate().getDayOfWeek() != DayOfWeek.SUNDAY
                && "AVAILABLE".equals(s.getStatus())));

        // a restart (or the nightly job) creates nothing new
        assertEquals(0, seeder.seedCatalog());
        seeder.refreshSlots();
        assertEquals(slots, schedules.count());
        assertFalse(slots > 10L * DemoDataSeeder.DAYS_AHEAD * DemoDataSeeder.SLOT_STARTS.size());
    }
}
