package com.example.booking_clinic.ai.eval;

import com.example.booking_clinic.ai.eval.EvalCase.CaseType;
import com.example.booking_clinic.entity.Specialty;
import com.example.booking_clinic.service.impl.FakeAiEmbeddingServiceImpl;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Offline eval of the Java keyword router, which stays in the backend as the fallback when
 * AI_Service is unavailable. Runs in plain {@code mvn test}: no Spring context, no database,
 * no network. Reports are written to {@code target/ai-eval/}.
 * <p>
 * The dataset lives in {@code AI_Service/eval/data} (copied onto the test classpath by the pom)
 * and is shared with the Python eval, see {@code AI_Service/README.md}.
 */
@Tag("ai-eval")
class SpecialtyRoutingEvalTest {

    private static final Path REPORT_DIR = Path.of("target", "ai-eval");
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private static List<Specialty> specialties;
    private static List<EvalCase> cases;

    record SpecialtyFixture(Long id, String name, String description) {
    }

    @BeforeAll
    static void loadFixtures() throws IOException {
        List<SpecialtyFixture> fixtures = read("/ai-eval/specialties.json", new TypeReference<>() {
        });
        specialties = fixtures.stream()
                .map(f -> Specialty.builder().id(f.id()).name(f.name()).description(f.description()).build())
                .toList();
        cases = read("/ai-eval/specialty_routing_v1.json", new TypeReference<>() {
        });
    }

    @Test
    void datasetIsWellFormed() {
        Set<String> specialtyNames = specialties.stream().map(Specialty::getName).collect(Collectors.toSet());
        Set<String> ids = new HashSet<>();

        for (EvalCase c : cases) {
            assertTrue(ids.add(c.id()), "duplicate id " + c.id());
            assertTrue(Set.of("dev", "test").contains(c.split()), c.id() + ": bad split " + c.split());
            assertFalse(c.query() == null || c.query().isBlank(), c.id() + ": empty query");
            assertTrue(specialtyNames.containsAll(c.expected()), c.id() + ": unknown specialty in " + c.expected());
            if (c.type() == CaseType.ANSWERABLE) {
                assertFalse(c.expected().isEmpty(), c.id() + ": answerable case needs an expected specialty");
            }
            if (c.type() == CaseType.OUT_OF_SCOPE) {
                assertTrue(c.expected().isEmpty(), c.id() + ": out-of-scope case must not expect a specialty");
            }
        }

        // every specialty must be covered in both splits, otherwise per-split numbers are meaningless
        for (String split : List.of("dev", "test")) {
            Set<String> covered = cases.stream()
                    .filter(c -> c.type() == CaseType.ANSWERABLE && split.equals(c.split()))
                    .map(c -> c.expected().get(0))
                    .collect(Collectors.toSet());
            assertEquals(specialtyNames, covered, "specialties missing from " + split + " split");
        }
    }

    @Test
    void keywordBaseline() throws IOException {
        SpecialtyRouter router = new ConsultationServiceRouter(
                "keyword-baseline", new FakeAiEmbeddingServiceImpl(), specialties);

        RoutingEvaluator.Report report = RoutingEvaluator.evaluate(router, cases);
        String markdown = RoutingEvaluator.toMarkdown(report);

        Files.createDirectories(REPORT_DIR);
        Files.writeString(REPORT_DIR.resolve(router.name() + ".md"), markdown, StandardCharsets.UTF_8);
        System.out.println(markdown);

        assertEquals(cases.size(),
                report.splits().get(2).answerable() + report.splits().get(2).outOfScope() + report.splits().get(2).redFlags());
    }

    private static <T> T read(String resource, TypeReference<T> type) throws IOException {
        try (InputStream in = SpecialtyRoutingEvalTest.class.getResourceAsStream(resource)) {
            if (in == null) {
                throw new IllegalStateException("missing test resource " + resource);
            }
            return MAPPER.readValue(in, type);
        }
    }
}
