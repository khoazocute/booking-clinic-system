package com.example.booking_clinic.ai.eval;

import com.example.booking_clinic.ai.eval.EvalCase.CaseType;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Predicate;

/**
 * Scores a {@link SpecialtyRouter} on two axes at once:
 * <ul>
 *   <li><b>Accuracy</b>: Top-1 / Top-3 on ANSWERABLE cases.</li>
 *   <li><b>Safety</b>: false-refusal rate (refused an answerable case), false-answer rate
 *       (suggested a specialty for an OUT_OF_SCOPE case) and red-flag recall.</li>
 * </ul>
 * Failures are only listed for the dev split; the test split is reported as aggregates
 * so it is not used, even unintentionally, to tune keywords or thresholds.
 */
public final class RoutingEvaluator {

    private static final double TIE_EPSILON = 1e-9;

    private RoutingEvaluator() {
    }

    public record Outcome(EvalCase evalCase, SpecialtyRouter.Result result) {

        boolean top1Hit() {
            return !result.refused() && !result.ranked().isEmpty()
                    && evalCase.expected().contains(result.ranked().get(0));
        }

        boolean top3Hit() {
            return !result.refused() && result.ranked().stream().limit(3)
                    .anyMatch(evalCase.expected()::contains);
        }

        /** Top-1 is only "chosen" by list order because the two best scores are equal. */
        boolean tiedAtTop() {
            List<Double> s = result.scores();
            return !result.refused() && s.size() > 1 && Math.abs(s.get(0) - s.get(1)) < TIE_EPSILON;
        }
    }

    public record SplitMetrics(
            String split,
            int answerable, double top1, double top3, double falseRefusal, double tiedAtTop,
            int outOfScope, double falseAnswer,
            int redFlags, double redFlagRecall
    ) {
    }

    public record Report(String routerName, List<SplitMetrics> splits,
                         Map<String, double[]> perSpecialtyTop1, List<Outcome> devFailures) {
    }

    public static Report evaluate(SpecialtyRouter router, List<EvalCase> cases) {
        List<Outcome> outcomes = cases.stream()
                .map(c -> new Outcome(c, router.route(c.query())))
                .toList();

        List<SplitMetrics> splits = List.of(
                metrics("dev", outcomes, o -> "dev".equals(o.evalCase().split())),
                metrics("test", outcomes, o -> "test".equals(o.evalCase().split())),
                metrics("all", outcomes, o -> true)
        );

        // specialty -> [hits, total], keyed by the primary (first) expected label
        Map<String, double[]> perSpecialty = new LinkedHashMap<>();
        for (Outcome o : outcomes) {
            if (o.evalCase().type() != CaseType.ANSWERABLE) {
                continue;
            }
            double[] counts = perSpecialty.computeIfAbsent(o.evalCase().expected().get(0), k -> new double[2]);
            counts[0] += o.top1Hit() ? 1 : 0;
            counts[1] += 1;
        }

        List<Outcome> devFailures = new ArrayList<>();
        for (Outcome o : outcomes) {
            if (!"dev".equals(o.evalCase().split())) {
                continue;
            }
            boolean failed = switch (o.evalCase().type()) {
                case ANSWERABLE -> !o.top1Hit();
                case OUT_OF_SCOPE -> !o.result().refused();
                case RED_FLAG -> !o.result().redFlag();
            };
            if (failed) {
                devFailures.add(o);
            }
        }

        return new Report(router.name(), splits, perSpecialty, devFailures);
    }

    private static SplitMetrics metrics(String split, List<Outcome> all, Predicate<Outcome> inSplit) {
        List<Outcome> answerable = filter(all, inSplit, CaseType.ANSWERABLE);
        List<Outcome> outOfScope = filter(all, inSplit, CaseType.OUT_OF_SCOPE);
        List<Outcome> redFlags = filter(all, inSplit, CaseType.RED_FLAG);

        return new SplitMetrics(
                split,
                answerable.size(),
                rate(answerable, Outcome::top1Hit),
                rate(answerable, Outcome::top3Hit),
                rate(answerable, o -> o.result().refused()),
                rate(answerable, Outcome::tiedAtTop),
                outOfScope.size(),
                rate(outOfScope, o -> !o.result().refused()),
                redFlags.size(),
                rate(redFlags, o -> o.result().redFlag())
        );
    }

    private static List<Outcome> filter(List<Outcome> all, Predicate<Outcome> inSplit, CaseType type) {
        return all.stream().filter(inSplit).filter(o -> o.evalCase().type() == type).toList();
    }

    private static double rate(List<Outcome> outcomes, Predicate<Outcome> predicate) {
        if (outcomes.isEmpty()) {
            return 0.0;
        }
        return (double) outcomes.stream().filter(predicate).count() / outcomes.size();
    }

    public static String toMarkdown(Report report) {
        StringBuilder md = new StringBuilder();
        md.append("# Specialty routing eval: ").append(report.routerName()).append("\n\n");

        md.append("| Split | Answerable | Top-1 ↑ | Top-3 ↑ | False refusal ↓ | Top-1 decided by tie ↓ | Out-of-scope | False answer ↓ | Red flags | Red-flag recall ↑ |\n");
        md.append("|---|---|---|---|---|---|---|---|---|---|\n");
        for (SplitMetrics m : report.splits()) {
            md.append("| ").append(m.split())
                    .append(" | ").append(m.answerable())
                    .append(" | ").append(pct(m.top1()))
                    .append(" | ").append(pct(m.top3()))
                    .append(" | ").append(pct(m.falseRefusal()))
                    .append(" | ").append(pct(m.tiedAtTop()))
                    .append(" | ").append(m.outOfScope())
                    .append(" | ").append(pct(m.falseAnswer()))
                    .append(" | ").append(m.redFlags())
                    .append(" | ").append(pct(m.redFlagRecall()))
                    .append(" |\n");
        }

        md.append("\n## Top-1 per specialty (dev + test)\n\n| Specialty | Top-1 |\n|---|---|\n");
        report.perSpecialtyTop1().forEach((specialty, c) -> md.append("| ").append(specialty).append(" | ")
                .append((int) c[0]).append("/").append((int) c[1]).append(" |\n"));

        md.append("\n## Dev failures\n\n| Id | Type | Query | Expected | Got (top-3, score) |\n|---|---|---|---|---|\n");
        for (Outcome o : report.devFailures()) {
            md.append("| ").append(o.evalCase().id())
                    .append(" | ").append(o.evalCase().type())
                    .append(" | ").append(o.evalCase().query())
                    .append(" | ").append(String.join(", ", o.evalCase().expected()))
                    .append(" | ").append(describe(o.result()))
                    .append(" |\n");
        }
        return md.toString();
    }

    private static String describe(SpecialtyRouter.Result r) {
        if (r.refused()) {
            return "_refused_";
        }
        List<String> parts = new ArrayList<>();
        for (int i = 0; i < Math.min(3, r.ranked().size()); i++) {
            parts.add(r.ranked().get(i) + String.format(Locale.ROOT, " (%.2f)", r.scores().get(i)));
        }
        return String.join(", ", parts);
    }

    private static String pct(double value) {
        return String.format(Locale.ROOT, "%.1f%%", value * 100);
    }
}
