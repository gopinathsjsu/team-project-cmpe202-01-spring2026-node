package com.eventplatform.identity.service;

import com.eventplatform.identity.client.EventServiceClient;
import com.eventplatform.identity.dto.response.MessageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final EventServiceClient eventServiceClient;
    private final AuditLogService auditLogService;

    @Transactional
    public MessageResponse approveEvent(String eventId, UUID adminUserId, String ipAddress) {
        eventServiceClient.approveEvent(eventId);

        auditLogService.log(adminUserId, "EVENT_APPROVE", "EVENT", eventId,
                Map.of("eventId", eventId), ipAddress);

        log.info("Admin {} approved event {}", adminUserId, eventId);

        return MessageResponse.builder()
                .message("Event " + eventId + " has been approved")
                .build();
    }

    @Transactional
    public MessageResponse rejectEvent(String eventId, UUID adminUserId, String ipAddress) {
        eventServiceClient.rejectEvent(eventId);

        auditLogService.log(adminUserId, "EVENT_REJECT", "EVENT", eventId,
                Map.of("eventId", eventId), ipAddress);

        log.info("Admin {} rejected event {}", adminUserId, eventId);

        return MessageResponse.builder()
                .message("Event " + eventId + " has been rejected")
                .build();
    }
}
