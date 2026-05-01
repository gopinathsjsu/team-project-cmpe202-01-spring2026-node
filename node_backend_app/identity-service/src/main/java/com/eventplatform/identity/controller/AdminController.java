package com.eventplatform.identity.controller;

import com.eventplatform.identity.dto.request.CreateAdminRequest;
import com.eventplatform.identity.dto.response.MessageResponse;
import com.eventplatform.identity.dto.response.PagedUsersResponse;
import com.eventplatform.identity.dto.response.UserResponse;
import com.eventplatform.identity.security.UserPrincipal;
import com.eventplatform.identity.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PatchMapping;

import java.util.UUID;

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

    @GetMapping("/users")
    @Operation(summary = "Get all users (paginated)")
    public ResponseEntity<PagedUsersResponse> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String q) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 100);
        PagedUsersResponse response = adminService.getAllUsers(normalizedPage, normalizedSize, role, q);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/users/admin")
    @Operation(summary = "Create a new admin user")
    public ResponseEntity<UserResponse> createAdmin(
            @Valid @RequestBody CreateAdminRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {
        UserResponse response = adminService.createAdmin(request, principal.getId(), getClientIp(httpRequest));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/users/admin/{userId}")
    @Operation(summary = "Remove admin role from a user")
    public ResponseEntity<MessageResponse> removeAdmin(
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {
        MessageResponse response = adminService.removeAdmin(userId, principal.getId(), getClientIp(httpRequest));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/users/{userId}")
    @Operation(summary = "Deactivate a non-admin user")
    public ResponseEntity<MessageResponse> deactivateUser(
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {
        MessageResponse response = adminService.deactivateUser(userId, principal.getId(), getClientIp(httpRequest));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/users/{userId}/hard-delete")
    @Operation(summary = "Permanently delete a non-admin user")
    public ResponseEntity<MessageResponse> deleteUser(
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {
        MessageResponse response = adminService.deleteUser(userId, principal.getId(), getClientIp(httpRequest));
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/users/{userId}/reactivate")
    @Operation(summary = "Reactivate a deactivated non-admin user")
    public ResponseEntity<MessageResponse> reactivateUser(
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {
        MessageResponse response = adminService.reactivateUser(userId, principal.getId(), getClientIp(httpRequest));
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
