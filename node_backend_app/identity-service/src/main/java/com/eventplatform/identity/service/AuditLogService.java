package com.eventplatform.identity.service;

import com.eventplatform.identity.entity.AuditLog;
import com.eventplatform.identity.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void log(UUID actorUserId, String action, String targetType,
                    String targetId, Map<String, Object> metadata, String ipAddress) {
        AuditLog entry = AuditLog.builder()
                .actorUserId(actorUserId)
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .metadata(metadata)
                .ipAddress(ipAddress)
                .build();

        auditLogRepository.save(entry);
        log.debug("Audit log: actor={}, action={}, target={}:{}", actorUserId, action, targetType, targetId);
    }
}
