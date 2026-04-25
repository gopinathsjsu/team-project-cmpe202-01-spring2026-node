package com.eventplatform.identity.service;

import com.eventplatform.identity.dto.request.UpdateProfileRequest;
import com.eventplatform.identity.dto.response.ProfileResponse;
import com.eventplatform.identity.dto.response.UserResponse;
import com.eventplatform.identity.entity.User;
import com.eventplatform.identity.entity.AttendeeProfile;
import com.eventplatform.identity.exception.EntityNotFoundException;
import com.eventplatform.identity.repository.AttendeeProfileRepository;
import com.eventplatform.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AttendeeProfileRepository attendeeProfileRepository;

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));

        AttendeeProfile profile = user.getAttendeeProfile();

        ProfileResponse.ProfileResponseBuilder builder = ProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .role(user.getRole())
                .active(user.isActive())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .location(user.getLocation())
                .createdAt(user.getCreatedAt());

        if (profile != null) {
            if (user.getFirstName() == null) builder.firstName(profile.getFirstName());
            if (user.getLastName() == null) builder.lastName(profile.getLastName());
            if (user.getPhone() == null) builder.phone(profile.getPhone());
            if (user.getAvatarUrl() == null) builder.avatarUrl(profile.getAvatarUrl());
            builder.timezone(profile.getTimezone());
            builder.interest(profile.getInterest());
        }

        return builder.build();
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));
        return toUserResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserByEmail(String email) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new EntityNotFoundException("User", normalizedEmail));
        return toUserResponse(user);
    }

    @Transactional
    public ProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));

        AttendeeProfile profile = user.getAttendeeProfile();
        if (profile == null) {
            profile = AttendeeProfile.builder().user(user).build();
        }

        if (request.getUsername() != null) {
            String username = request.getUsername().trim();
            boolean changed = user.getUsername() == null || !username.equalsIgnoreCase(user.getUsername());
            if (changed && userRepository.existsByUsername(username)) {
                throw new IllegalArgumentException("Username is already taken");
            }
            user.setUsername(username);
        }
        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
            profile.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
            profile.setLastName(request.getLastName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
            profile.setPhone(request.getPhone());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
            profile.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getLocation() != null) user.setLocation(request.getLocation());
        if (request.getTimezone() != null) profile.setTimezone(request.getTimezone());
        if (request.getInterest() != null) profile.setInterest(request.getInterest());

        userRepository.save(user);
        attendeeProfileRepository.save(profile);

        return getProfile(userId);
    }

    private UserResponse toUserResponse(User user) {
        AttendeeProfile profile = user.getAttendeeProfile();
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .avatarUrl(user.getAvatarUrl())
                .interest(profile != null ? profile.getInterest() : null)
                .active(user.isActive())
                .role(user.getRole())
                .build();
    }
}
