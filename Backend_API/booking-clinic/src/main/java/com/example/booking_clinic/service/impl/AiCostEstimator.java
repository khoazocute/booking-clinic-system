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
    private final BigDecimal geminiInputPerMillion;
    private final BigDecimal geminiOutputPerMillion;

    @org.springframework.beans.factory.annotation.Autowired
    public AiCostEstimator(@Value("${AI_PRICE_INPUT_USD_PER_1M:0.40}") BigDecimal inputPerMillion,
                           @Value("${AI_PRICE_OUTPUT_USD_PER_1M:1.60}") BigDecimal outputPerMillion,
                           @Value("${AI_USD_TO_VND:26000}") BigDecimal usdToVnd,
                           // Gemini free tier: 0. Set the paid-tier prices if the project is upgraded.
                           @Value("${AI_PRICE_GEMINI_INPUT_USD_PER_1M:0}") BigDecimal geminiInputPerMillion,
                           @Value("${AI_PRICE_GEMINI_OUTPUT_USD_PER_1M:0}") BigDecimal geminiOutputPerMillion) {
        this.inputPerMillion = inputPerMillion;
        this.outputPerMillion = outputPerMillion;
        this.usdToVnd = usdToVnd;
        this.geminiInputPerMillion = geminiInputPerMillion;
        this.geminiOutputPerMillion = geminiOutputPerMillion;
    }

    public AiCostEstimator(BigDecimal inputPerMillion, BigDecimal outputPerMillion, BigDecimal usdToVnd) {
        this(inputPerMillion, outputPerMillion, usdToVnd, BigDecimal.ZERO, BigDecimal.ZERO);
    }

    /** Cost of one turn for the model that answered ("gemini/..." or "openai/..."). */
    public BigDecimal usd(String model, Integer promptTokens, Integer completionTokens) {
        if (model != null && model.startsWith("gemini/")) {
            return price(promptTokens, completionTokens, geminiInputPerMillion, geminiOutputPerMillion);
        }
        return usd(promptTokens, completionTokens);
    }

    public BigDecimal usd(Integer promptTokens, Integer completionTokens) {
        return price(promptTokens, completionTokens, inputPerMillion, outputPerMillion);
    }

    private static BigDecimal price(Integer promptTokens, Integer completionTokens, BigDecimal inPerM, BigDecimal outPerM) {
        if (promptTokens == null && completionTokens == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal in = BigDecimal.valueOf(promptTokens == null ? 0 : promptTokens).multiply(inPerM);
        BigDecimal out = BigDecimal.valueOf(completionTokens == null ? 0 : completionTokens).multiply(outPerM);
        return in.add(out).divide(MILLION, 6, RoundingMode.HALF_UP);
    }

    public long vnd(BigDecimal usd) {
        return usd.multiply(usdToVnd).setScale(0, RoundingMode.HALF_UP).longValue();
    }

    public String note() {
        return "Ước tính: OpenAI $" + inputPerMillion + " / $" + outputPerMillion
                + " cho 1 triệu token vào / ra; Gemini $" + geminiInputPerMillion + " / $" + geminiOutputPerMillion
                + " (gói free = 0); 1 USD = " + usdToVnd.toPlainString() + " đ";
    }
}
