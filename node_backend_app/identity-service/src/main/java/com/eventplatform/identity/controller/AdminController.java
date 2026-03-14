package com.eventplatform.identity.controller;

import com.eventplatform.identity.dto.response.MessageResponse;
import com.eventplatform.identity.security.UserPrincipal;
import com.eventplatform.identity.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin event moderation")
public class AdminController {

    private final AdminService adminService;

    @PostMapping("/events/{eventId}/approve")
    @Operation(summary = "Approve an event")
    public ResponseEntity<MessageResponse> approveEvent(
            @PathVariable String eventId,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {
        MessageResponse response = adminService.approveEvent(eventId, principal.getId(), getClientIp(httpRequest));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/events/{eventId}/reject")
    @Operation(summary = "Reject an event")
    public ResponseEntity<MessageResponse> rejectEvent(
            @PathVariable String eventId,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {
        MessageResponse response = adminService.rejectEvent(eventId, principal.getId(), getClientIp(httpRequest));
        return ResponseEntity.ok(response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
