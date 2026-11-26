package com.example.booking_clinic.service.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Estimated LLM cost from token counts. Prices are configuration (they change), defaulting to
 * gpt-4.1-mini list prices per 1M tokens; the dashboard labels the result as an estimate.
 */
@Component
public class AiCostEstimator {

    private static final BigDecimal MILLION = BigDecimal.valueOf(1_000_000);

    private final BigDecimal inputPerMillion;
    private final BigDecimal outputPerMillion;
    private final BigDecimal usdToVnd;

    public AiCostEstimator(@Value("${AI_PRICE_INPUT_USD_PER_1M:0.40}") BigDecimal inputPerMillion,
                           @Value("${AI_PRICE_OUTPUT_USD_PER_1M:1.60}") BigDecimal outputPerMillion,
                           @Value("${AI_USD_TO_VND:26000}") BigDecimal usdToVnd) {
        this.inputPerMillion = inputPerMillion;
        this.outputPerMillion = outputPerMillion;
        this.usdToVnd = usdToVnd;
    }

    public BigDecimal usd(Integer promptTokens, Integer completionTokens) {
        if (promptTokens == null && completionTokens == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal in = BigDecimal.valueOf(promptTokens == null ? 0 : promptTokens).multiply(inputPerMillion);
        BigDecimal out = BigDecimal.valueOf(completionTokens == null ? 0 : completionTokens).multiply(outputPerMillion);
        return in.add(out).divide(MILLION, 6, RoundingMode.HALF_UP);
    }

    public long vnd(BigDecimal usd) {
        return usd.multiply(usdToVnd).setScale(0, RoundingMode.HALF_UP).longValue();
    }

    public String note() {
        return "Ước tính theo giá $" + inputPerMillion + " / $" + outputPerMillion
                + " cho 1 triệu token vào / ra, 1 USD = " + usdToVnd.toPlainString() + " đ";
    }
}
