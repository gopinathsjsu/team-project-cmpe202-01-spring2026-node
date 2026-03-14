package com.eventplatform.identity.service;

import com.eventplatform.identity.dto.request.UpdateOrganizerProfileRequest;
import com.eventplatform.identity.dto.response.OrganizerProfileResponse;
import com.eventplatform.identity.entity.OrganizerProfile;
import com.eventplatform.identity.entity.User;
import com.eventplatform.identity.exception.EntityNotFoundException;
import com.eventplatform.identity.repository.OrganizerProfileRepository;
import com.eventplatform.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrganizerService {

    private final UserRepository userRepository;
    private final OrganizerProfileRepository organizerProfileRepository;

    @Transactional(readOnly = true)
    public OrganizerProfileResponse getOrganizerProfile(UUID userId) {
        OrganizerProfile profile = organizerProfileRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Organizer profile", userId));

        return toResponse(profile);
    }

    @Transactional
    public OrganizerProfileResponse upsertOrganizerProfile(UUID userId, UpdateOrganizerProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));

        OrganizerProfile profile = organizerProfileRepository.findById(userId)
                .orElseGet(() -> OrganizerProfile.builder().user(user).build());

        profile.setDisplayName(request.getDisplayName());
        profile.setBio(request.getBio());
        profile.setWebsiteUrl(request.getWebsiteUrl());
        profile.setContactEmail(request.getContactEmail());
        profile.setInstagramUrl(request.getInstagramUrl());

        organizerProfileRepository.save(profile);

        return toResponse(profile);
    }

    private OrganizerProfileResponse toResponse(OrganizerProfile profile) {
        return OrganizerProfileResponse.builder()
                .userId(profile.getUserId())
                .displayName(profile.getDisplayName())
                .bio(profile.getBio())
                .websiteUrl(profile.getWebsiteUrl())
                .contactEmail(profile.getContactEmail())
                .instagramUrl(profile.getInstagramUrl())
                .build();
    }
}
