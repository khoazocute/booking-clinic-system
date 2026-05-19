package com.example.booking_clinic.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Drops the old single-column unique constraint on payments.appointment_id
 * that Hibernate ddl-auto=update cannot remove automatically.
 * Safe to run multiple times — no-op if constraint doesn't exist.
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class PaymentSchemaMigration implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            List<String> oldConstraints = jdbcTemplate.queryForList(
                "SELECT tc.CONSTRAINT_NAME " +
                "FROM information_schema.TABLE_CONSTRAINTS tc " +
                "JOIN information_schema.KEY_COLUMN_USAGE kcu " +
                "  ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME " +
                "  AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA " +
                "  AND tc.TABLE_NAME = kcu.TABLE_NAME " +
                "WHERE tc.CONSTRAINT_TYPE = 'UNIQUE' " +
                "  AND tc.TABLE_SCHEMA = DATABASE() " +
                "  AND tc.TABLE_NAME = 'payments' " +
                "  AND kcu.COLUMN_NAME = 'appointment_id' " +
                "  AND tc.CONSTRAINT_NAME != 'uk_appointment_payment_type'",
                String.class
            );

            for (String name : oldConstraints) {
                jdbcTemplate.execute("ALTER TABLE payments DROP INDEX `" + name + "`");
                log.info("[Migration] Dropped old unique constraint on payments.appointment_id: {}", name);
            }
        } catch (Exception e) {
            log.warn("[Migration] Could not drop old payment constraint (may not exist): {}", e.getMessage());
        }
    }
}
