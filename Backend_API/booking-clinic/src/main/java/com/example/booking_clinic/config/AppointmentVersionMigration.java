package com.example.booking_clinic.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Rows created before Appointment got its {@code @Version} column have version = NULL. Hibernate cannot
 * increment a null version (NullPointerException on every update), which made the expiry schedulers fail
 * every minute and left past appointments un-cancelled. Idempotent: a no-op once every row has a version.
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class AppointmentVersionMigration implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            int fixed = jdbcTemplate.update("UPDATE appointments SET version = 0 WHERE version IS NULL");
            if (fixed > 0) {
                log.info("[Migration] Initialised optimistic-lock version on {} legacy appointments", fixed);
            }
        } catch (Exception e) {
            log.warn("[Migration] Could not initialise appointment versions: {}", e.getMessage());
        }
    }
}
