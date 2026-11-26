package com.example.booking_clinic.service.impl;

import com.example.booking_clinic.common.exception.TooManyRequestsException;
import com.example.booking_clinic.service.AiRateLimiter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Cost guards for the paid LLM:
 * <ul>
 *   <li>a fixed-window limit per patient per minute (burst / spam),</li>
 *   <li>a daily limit per patient (one account cannot run up the bill),</li>
 *   <li>a daily limit for the whole system (open sign-up means anyone can create accounts).</li>
 * </ul>
 * Fails open: if Redis is down the request is allowed. The hard backstop is the spend limit configured
 * on the OpenAI project itself.
 */
@Slf4j
@Component
public class RedisAiRateLimiter implements AiRateLimiter {

    private final StringRedisTemplate redis;
    private final int limitPerMinute;
    private final int dailyLimitPerUser;
    private final int dailyLimitGlobal;

    public RedisAiRateLimiter(StringRedisTemplate redis,
                              @Value("${AI_CHAT_RATE_LIMIT_PER_MINUTE:10}") int limitPerMinute,
                              @Value("${AI_CHAT_DAILY_LIMIT_PER_USER:40}") int dailyLimitPerUser,
                              @Value("${AI_CHAT_DAILY_LIMIT_GLOBAL:500}") int dailyLimitGlobal) {
        this.redis = redis;
        this.limitPerMinute = limitPerMinute;
        this.dailyLimitPerUser = dailyLimitPerUser;
        this.dailyLimitGlobal = dailyLimitGlobal;
    }

    @Override
    public Quota consumeDailyQuota(String userKey) {
        String day = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh")).toString();
        try {
            Long user = incrementWithTtl("ai:quota:user:" + userKey + ":" + day, Duration.ofHours(26));
            if (user != null && user > dailyLimitPerUser) {
                return Quota.USER_EXCEEDED;
            }
            Long global = incrementWithTtl("ai:quota:global:" + day, Duration.ofHours(26));
            if (global != null && global > dailyLimitGlobal) {
                return Quota.GLOBAL_EXCEEDED;
            }
        } catch (RuntimeException e) {
            log.warn("AI quota store unavailable, allowing request: {}", e.getMessage());
        }
        return Quota.OK;
    }

    private Long incrementWithTtl(String key, Duration ttl) {
        Long count = redis.opsForValue().increment(key);
        if (count != null && count == 1) {
            redis.expire(key, ttl);
        }
        return count;
    }

    @Override
    public void check(String userKey) {
        String key = "ai:chat:rate:" + userKey + ":" + (System.currentTimeMillis() / 60_000);
        Long count;
        try {
            count = redis.opsForValue().increment(key);
            if (count != null && count == 1) {
                redis.expire(key, Duration.ofSeconds(70));
            }
        } catch (RuntimeException e) {
            log.warn("AI rate limiter unavailable, allowing request: {}", e.getMessage());
            return;
        }
        if (count != null && count > limitPerMinute) {
            throw new TooManyRequestsException("Bạn gửi quá nhiều tin nhắn. Vui lòng thử lại sau 1 phút.");
        }
    }
}
