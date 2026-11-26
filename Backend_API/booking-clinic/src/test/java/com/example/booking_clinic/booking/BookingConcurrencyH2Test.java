package com.example.booking_clinic.booking;

import org.springframework.test.context.TestPropertySource;

/** Always runs (also in CI without Docker). H2 has row locks too, but MySQL is the database that matters: see the MySQL variant. */
@TestPropertySource(properties =
        "spring.datasource.url=jdbc:h2:mem:booking_concurrency;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;LOCK_TIMEOUT=30000")
class BookingConcurrencyH2Test extends BookingConcurrencyTestBase {

    @Override
    String database() {
        return "H2";
    }
}
