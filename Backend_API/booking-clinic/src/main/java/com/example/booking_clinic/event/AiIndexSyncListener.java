package com.example.booking_clinic.event;

import com.example.booking_clinic.common.exception.AiServiceUnavailableException;
import com.example.booking_clinic.service.AiKnowledgeService;
import com.example.booking_clinic.service.AiServiceGateway;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Keeps the AI indexes in sync with MySQL.
 * <ul>
 *   <li>After a specialty/doctor change COMMITS (never on rolled-back data), asynchronously, so the
 *       admin's request does not wait for embeddings.</li>
 *   <li>A periodic reconciliation repairs any missed sync (AI_Service down, network error). It is cheap:
 *       AI_Service only re-embeds documents whose content hash changed.</li>
 * </ul>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AiIndexSyncListener {

    private final AiServiceGateway aiServiceGateway;
    private final AiKnowledgeService localKeywordIndex;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onKnowledgeChanged(AiKnowledgeChangedEvent event) {
        try {
            localKeywordIndex.rebuildIndex();
        } catch (RuntimeException e) {
            log.error("Local keyword index rebuild failed after {}", event.reason(), e);
        }
        syncAiService(event.reason());
    }

    @Scheduled(fixedDelayString = "${AI_INDEX_RECONCILE_MS:900000}",
            initialDelayString = "${AI_INDEX_RECONCILE_INITIAL_DELAY_MS:90000}")
    public void reconcile() {
        syncAiService("periodic reconciliation");
    }

    private void syncAiService(String reason) {
        if (!aiServiceGateway.isEnabled()) {
            return;
        }
        try {
            aiServiceGateway.rebuildIndex();
            log.info("AI_Service index synced ({})", reason);
        } catch (AiServiceUnavailableException e) {
            log.warn("AI_Service index sync failed ({}); the periodic reconciliation will retry: {}",
                    reason, e.getMessage());
        }
    }
}
