package com.example.booking_clinic.service.impl;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FakeAiEmbeddingServiceImplTest {

    // vector layout: cardio, skin, ent, neuro, pediatric, respiratory, digestive,
    //                musculoskeletal, obstetrics, oncology, general
    private static final int CARDIO = 0, SKIN = 1, ENT = 2, RESPIRATORY = 5, DIGESTIVE = 6, GENERAL = 10;

    private final FakeAiEmbeddingServiceImpl embedding = new FakeAiEmbeddingServiceImpl();

    @Test
    void keywordsOnlyMatchWholeWords() {
        // "khong" used to match "ho" and "hong" (ENT); "dau" used to match "da" (skin)
        List<Double> v = embedding.embed("Kinh nguyệt không đều, đau nhiều");
        assertEquals(0.0, v.get(ENT));
        assertEquals(0.0, v.get(SKIN));
    }

    @Test
    void longerKeywordWinsOverTheKeywordsInsideIt() {
        List<Double> v = embedding.embed("Tôi bị đau dạ dày");
        assertEquals(1.0, v.get(DIGESTIVE));
        assertEquals(0.0, v.get(SKIN), "'da' inside 'dau da day' must not count as skin");

        List<Double> cough = embedding.embed("ho kéo dài 3 tuần");
        assertEquals(1.0, cough.get(RESPIRATORY));
        assertEquals(0.0, cough.get(ENT), "'ho' inside 'ho keo dai' must not also count as ENT");
    }

    @Test
    void keywordSharedByTwoCategoriesCountsForBoth() {
        List<Double> v = embedding.embed("KHÓ THỞ!!!");
        assertEquals(1.0, v.get(CARDIO));
        assertEquals(1.0, v.get(RESPIRATORY));
    }

    @Test
    void generalBiasIsAlwaysPresent() {
        assertEquals(1.0, embedding.embed("").get(GENERAL));
        assertEquals(1.0, embedding.embed(null).get(GENERAL));
    }

    @Test
    void normalizeStripsDiacriticsAndPunctuation() {
        assertEquals("dau nguc kho tho", FakeAiEmbeddingServiceImpl.normalize("  Đau ngực, khó   thở... "));
    }
}
