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
                .role(user.getRole())
                .active(user.isActive())
                .createdAt(user.getCreatedAt());

        if (profile != null) {
            builder.firstName(profile.getFirstName())
                    .lastName(profile.getLastName())
                    .phone(profile.getPhone())
                    .avatarUrl(profile.getAvatarUrl())
                    .timezone(profile.getTimezone());
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

        if (request.getFirstName() != null) profile.setFirstName(request.getFirstName());
        if (request.getLastName() != null) profile.setLastName(request.getLastName());
        if (request.getPhone() != null) profile.setPhone(request.getPhone());
        if (request.getAvatarUrl() != null) profile.setAvatarUrl(request.getAvatarUrl());
        if (request.getTimezone() != null) profile.setTimezone(request.getTimezone());

        userProfileRepository.save(profile);

        return getProfile(userId);
    }
}
