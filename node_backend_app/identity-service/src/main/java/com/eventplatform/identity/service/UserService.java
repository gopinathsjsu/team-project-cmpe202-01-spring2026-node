package com.eventplatform.identity.service;

import com.eventplatform.identity.dto.request.UpdateProfileRequest;
import com.eventplatform.identity.dto.response.ProfileResponse;
import com.eventplatform.identity.entity.User;
import com.eventplatform.identity.entity.UserProfile;
import com.eventplatform.identity.exception.EntityNotFoundException;
import com.eventplatform.identity.repository.UserProfileRepository;
import com.eventplatform.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));

        UserProfile profile = user.getUserProfile();

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
        }

        return builder.build();
    }

    @Transactional
    public ProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));

        UserProfile profile = user.getUserProfile();
        if (profile == null) {
            profile = UserProfile.builder().user(user).build();
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

        userRepository.save(user);
        userProfileRepository.save(profile);

        return getProfile(userId);
    }
}
