package com.example.booking_clinic.service;

public interface AiRateLimiter {
    /** @throws com.example.booking_clinic.common.exception.TooManyRequestsException when over the limit */
    void check(String userKey);

    /** Daily budget for calls that reach the paid LLM. Counted once per allowed call. */
    enum Quota { OK, USER_EXCEEDED, GLOBAL_EXCEEDED }

    /** Consumes one unit of the user's and of the whole system's daily LLM quota. */
    default Quota consumeDailyQuota(String userKey) {
        return Quota.OK;
    }
}
