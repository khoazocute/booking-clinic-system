package com.example.booking_clinic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BookingClinicApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookingClinicApplication.class, args);
    }
}
