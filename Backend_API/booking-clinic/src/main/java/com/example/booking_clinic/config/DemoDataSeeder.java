package com.example.booking_clinic.config;

import com.example.booking_clinic.entity.Doctor;
import com.example.booking_clinic.entity.DoctorSchedule;
import com.example.booking_clinic.entity.Role;
import com.example.booking_clinic.entity.Specialty;
import com.example.booking_clinic.entity.User;
import com.example.booking_clinic.event.AiKnowledgeChangedEvent;
import com.example.booking_clinic.repository.DoctorRepository;
import com.example.booking_clinic.repository.DoctorScheduleRepository;
import com.example.booking_clinic.repository.RoleRepository;
import com.example.booking_clinic.repository.SpecialtyRepository;
import com.example.booking_clinic.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Fictional data for a public demo (DEMO_DATA=true): the specialties and doctors of the AI evaluation
 * fixtures, plus free slots that are topped up every night so the demo never runs out of bookable times.
 * Idempotent: only what is missing is created. Demo doctors get random passwords (nobody can log in as them).
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "app.demo.enabled", havingValue = "true")
public class DemoDataSeeder {

    static final String DEMO_EMAIL_DOMAIN = "@demo.bookingclinic.local";
    static final int DAYS_AHEAD = 7;
    static final List<LocalTime> SLOT_STARTS = List.of(
            LocalTime.of(8, 0), LocalTime.of(8, 30), LocalTime.of(9, 0), LocalTime.of(9, 30), LocalTime.of(10, 0),
            LocalTime.of(14, 0), LocalTime.of(14, 30), LocalTime.of(15, 0), LocalTime.of(15, 30), LocalTime.of(16, 0));
    static final int SLOT_MINUTES = 30;

    record DemoData(List<DemoSpecialty> specialties, List<DemoDoctor> doctors) {
    }

    record DemoSpecialty(String name, String description) {
    }

    record DemoDoctor(String fullName, String email, String specialty, Integer experienceYears, String qualification,
                      String biography, String clinicRoom, BigDecimal consultationFee) {
    }

    private final SpecialtyRepository specialties;
    private final UserRepository users;
    private final RoleRepository roles;
    private final DoctorRepository doctors;
    private final DoctorScheduleRepository schedules;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher events;
    private final TransactionTemplate tx;
    private final Clock clock;

    @org.springframework.beans.factory.annotation.Autowired
    public DemoDataSeeder(SpecialtyRepository specialties, UserRepository users, RoleRepository roles,
                          DoctorRepository doctors, DoctorScheduleRepository schedules, PasswordEncoder passwordEncoder,
                          ApplicationEventPublisher events, TransactionTemplate tx) {
        this(specialties, users, roles, doctors, schedules, passwordEncoder, events, tx,
                Clock.system(ZoneId.of("Asia/Ho_Chi_Minh")));
    }

    DemoDataSeeder(SpecialtyRepository specialties, UserRepository users, RoleRepository roles, DoctorRepository doctors,
                   DoctorScheduleRepository schedules, PasswordEncoder passwordEncoder, ApplicationEventPublisher events,
                   TransactionTemplate tx, Clock clock) {
        this.specialties = specialties;
        this.users = users;
        this.roles = roles;
        this.doctors = doctors;
        this.schedules = schedules;
        this.passwordEncoder = passwordEncoder;
        this.events = events;
        this.tx = tx;
        this.clock = clock;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() {
        int created = seedCatalog();
        refreshSlots();
        if (created > 0) {
            events.publishEvent(new AiKnowledgeChangedEvent("demo data")); // re-index the assistant's knowledge
        }
    }

    /** @return number of specialties + doctors created */
    int seedCatalog() {
        DemoData data = load();
        Integer created = tx.execute(status -> {
            int count = 0;
            for (DemoSpecialty s : data.specialties()) {
                if (!specialties.existsByName(s.name())) {
                    specialties.save(Specialty.builder().name(s.name()).description(s.description()).build());
                    count++;
                }
            }
            Map<String, Specialty> byName = specialties.findAll().stream()
                    .collect(Collectors.toMap(Specialty::getName, Function.identity(), (a, b) -> a));
            Role doctorRole = roles.findByName("DOCTOR").orElseThrow(() -> new IllegalStateException("Role DOCTOR missing"));
            for (DemoDoctor d : data.doctors()) {
                if (users.findByEmail(d.email()).isPresent()) {
                    continue;
                }
                User user = users.save(User.builder()
                        .role(doctorRole)
                        .fullName(d.fullName())
                        .email(d.email())
                        .phone("0900000000")
                        .password(passwordEncoder.encode(UUID.randomUUID().toString())) // not a login account
                        .avatarUrl("")
                        .status("ACTIVE")
                        .build());
                doctors.save(Doctor.builder()
                        .user(user)
                        .specialty(byName.get(d.specialty()))
                        .experienceYears(d.experienceYears())
                        .qualification(d.qualification())
                        .biography(d.biography())
                        .clinicRoom(d.clinicRoom())
                        .consultationFee(d.consultationFee())
                        .status("ACTIVE")
                        .licenseNumber("DEMO-" + user.getId())
                        .licenseStatus("ACTIVE")
                        .licenseExpiryDate(LocalDate.now(clock).plusYears(2))
                        .build());
                count++;
            }
            return count;
        });
        if (created != null && created > 0) {
            log.info("Demo data: created {} specialties/doctors", created);
        }
        return created == null ? 0 : created;
    }

    /** Free 30-minute slots, Monday to Saturday, for the next 7 days; existing or overlapping slots are left alone. */
    @Scheduled(cron = "0 15 0 * * *", zone = "Asia/Ho_Chi_Minh")
    public void refreshSlots() {
        LocalDateTime now = LocalDateTime.now(clock);
        Integer created = tx.execute(status -> {
            int count = 0;
            List<Doctor> demoDoctors = doctors.findAll().stream()
                    .filter(d -> d.getUser() != null && d.getUser().getEmail() != null
                            && d.getUser().getEmail().endsWith(DEMO_EMAIL_DOMAIN))
                    .toList();
            for (Doctor doctor : demoDoctors) {
                for (int day = 0; day < DAYS_AHEAD; day++) {
                    LocalDate date = now.toLocalDate().plusDays(day);
                    if (date.getDayOfWeek() == DayOfWeek.SUNDAY) {
                        continue;
                    }
                    for (LocalTime start : SLOT_STARTS) {
                        LocalTime end = start.plusMinutes(SLOT_MINUTES);
                        if (date.atTime(start).isBefore(now.plusMinutes(30))
                                || schedules.existsOverlappingSchedule(doctor.getId(), date, start, end)) {
                            continue;
                        }
                        schedules.save(DoctorSchedule.builder()
                                .doctor(doctor).workDate(date).startTime(start).endTime(end).status("AVAILABLE").build());
                        count++;
                    }
                }
            }
            return count;
        });
        if (created != null && created > 0) {
            log.info("Demo data: created {} free slots for the next {} days", created, DAYS_AHEAD);
        }
    }

    private static DemoData load() {
        try (InputStream in = new ClassPathResource("demo/demo-data.json").getInputStream()) {
            return JsonMapper.builder().build().readValue(in, DemoData.class);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot read demo/demo-data.json", e);
        }
    }
}
