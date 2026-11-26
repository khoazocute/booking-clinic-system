package com.example.booking_clinic.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/** Enables @Async (AI index sync runs off the request thread) on Spring Boot's applicationTaskExecutor. */
@Configuration
@EnableAsync
public class AsyncConfig {
}
