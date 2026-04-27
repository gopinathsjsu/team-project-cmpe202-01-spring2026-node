package com.eventplatform.identity.service;

import com.eventplatform.identity.client.EventServiceClient;
import com.eventplatform.identity.dto.request.CreateAdminRequest;
import com.eventplatform.identity.dto.response.MessageResponse;
import com.eventplatform.identity.dto.response.PagedUsersResponse;
import com.eventplatform.identity.dto.response.UserResponse;
import com.eventplatform.identity.entity.Role;
import com.eventplatform.identity.entity.User;
import com.eventplatform.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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

    @Transactional(readOnly = true)
    public PagedUsersResponse getAllUsers(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> usersPage = userRepository.findAll(pageable);

        return PagedUsersResponse.builder()
                .users(usersPage.getContent().stream().map(this::toUserResponse).toList())
                .page(usersPage.getNumber())
                .size(usersPage.getSize())
                .totalElements(usersPage.getTotalElements())
                .totalPages(usersPage.getTotalPages())
                .hasNext(usersPage.hasNext())
                .build();
    }

    @Transactional
    public UserResponse createAdmin(CreateAdminRequest request, UUID creatorAdminId, String ipAddress) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        String username = request.getUsername() != null ? request.getUsername().trim() : null;
        if (username != null && !username.isBlank() && userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username is already taken");
        }

        User createdAdmin = User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .username((username == null || username.isBlank()) ? normalizedEmail.split("@")[0] : username)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(Role.ADMIN)
                .isActive(true)
                .build();
        createdAdmin = userRepository.save(createdAdmin);

        auditLogService.log(creatorAdminId, "ADMIN_CREATE", "USER", createdAdmin.getId().toString(),
                Map.of("email", createdAdmin.getEmail(), "role", Role.ADMIN.name()), ipAddress);

        log.info("Admin {} created new admin: userId={}, email={}", creatorAdminId, createdAdmin.getId(), createdAdmin.getEmail());
        return toUserResponse(createdAdmin);
    }

    @Transactional
    public MessageResponse removeAdmin(UUID targetUserId, UUID actorAdminId, String ipAddress) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (targetUser.getRole() != Role.ADMIN) {
            throw new IllegalArgumentException("Target user is not an admin");
        }

        if (targetUserId.equals(actorAdminId)) {
            throw new IllegalArgumentException("You cannot remove your own admin role");
        }

        long activeAdmins = userRepository.countByRoleAndIsActiveTrue(Role.ADMIN);
        if (activeAdmins <= 1) {
            throw new IllegalArgumentException("Cannot remove the last active admin");
        }

        targetUser.setRole(Role.ATTENDEE);
        userRepository.save(targetUser);

        auditLogService.log(actorAdminId, "ADMIN_REMOVE", "USER", targetUser.getId().toString(),
                Map.of("email", targetUser.getEmail(), "newRole", Role.ATTENDEE.name()), ipAddress);

        log.info("Admin {} demoted admin {} ({}) to ATTENDEE", actorAdminId, targetUserId, targetUser.getEmail());
        return MessageResponse.builder()
                .message("Admin role removed for user " + targetUser.getEmail())
                .build();
    }

    @Transactional
    public MessageResponse deactivateUser(UUID targetUserId, UUID actorAdminId, String ipAddress) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (targetUserId.equals(actorAdminId)) {
            throw new IllegalArgumentException("You cannot deactivate your own account");
        }

        if (targetUser.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Use remove-admin action before deactivating an admin");
        }

        if (!targetUser.isActive()) {
            throw new IllegalArgumentException("User is already deactivated");
        }

        targetUser.setActive(false);
        userRepository.save(targetUser);

        auditLogService.log(actorAdminId, "USER_DEACTIVATE", "USER", targetUser.getId().toString(),
                Map.of("email", targetUser.getEmail(), "role", targetUser.getRole().name()), ipAddress);

        log.info("Admin {} deactivated user {} ({})", actorAdminId, targetUserId, targetUser.getEmail());
        return MessageResponse.builder()
                .message("User deactivated: " + targetUser.getEmail())
                .build();
    }

    @Transactional
    public MessageResponse reactivateUser(UUID targetUserId, UUID actorAdminId, String ipAddress) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (targetUserId.equals(actorAdminId)) {
            throw new IllegalArgumentException("You cannot reactivate your own account");
        }

        if (targetUser.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Admin users are already handled separately");
        }

        if (targetUser.isActive()) {
            throw new IllegalArgumentException("User is already active");
        }

        targetUser.setActive(true);
        userRepository.save(targetUser);

        auditLogService.log(actorAdminId, "USER_REACTIVATE", "USER", targetUser.getId().toString(),
                Map.of("email", targetUser.getEmail(), "role", targetUser.getRole().name()), ipAddress);

        log.info("Admin {} reactivated user {} ({})", actorAdminId, targetUserId, targetUser.getEmail());
        return MessageResponse.builder()
                .message("User reactivated: " + targetUser.getEmail())
                .build();
    }

    @Transactional
    public MessageResponse deleteUser(UUID targetUserId, UUID actorAdminId, String ipAddress) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (targetUserId.equals(actorAdminId)) {
            throw new IllegalArgumentException("You cannot delete your own account");
        }

        if (targetUser.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("Use remove-admin action before deleting an admin");
        }

        String targetEmail = targetUser.getEmail();
        String targetRole = targetUser.getRole().name();
        userRepository.delete(targetUser);

        auditLogService.log(actorAdminId, "USER_DELETE", "USER", targetUserId.toString(),
                Map.of("email", targetEmail, "role", targetRole), ipAddress);

        log.warn("Admin {} hard-deleted user {} (email={}, role={})", actorAdminId, targetUserId, targetEmail, targetRole);
        return MessageResponse.builder()
                .message("User deleted: " + targetEmail)
                .build();
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .avatarUrl(user.getAvatarUrl())
                .active(user.isActive())
                .role(user.getRole())
                .build();
    }
}
