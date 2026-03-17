package com.eventplatform.identity.service;

import com.eventplatform.identity.dto.request.UpdateOrganizerProfileRequest;
import com.eventplatform.identity.dto.response.OrganizerProfileResponse;
import com.eventplatform.identity.entity.OrganizerProfile;
import com.eventplatform.identity.entity.Role;
import com.eventplatform.identity.entity.User;
import com.eventplatform.identity.exception.EntityNotFoundException;
import com.eventplatform.identity.repository.OrganizerProfileRepository;
import com.eventplatform.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrganizerServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrganizerProfileRepository organizerProfileRepository;

    @InjectMocks
    private OrganizerService organizerService;

    private UUID userId;
    private User user;

    @BeforeEach
    void setUp() {
        userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440030");
        user = User.builder()
                .id(userId)
                .email("org@test.com")
                .passwordHash("hash")
                .role(Role.ORGANIZER)
                .isActive(true)
                .build();
    }

    @Test
    void getOrganizerProfile_returnsMappedResponse() {
        OrganizerProfile profile = OrganizerProfile.builder()
                .userId(userId)
                .user(user)
                .displayName("Node Org")
                .bio("bio")
                .websiteUrl("https://example.org")
                .contactEmail("contact@example.org")
                .instagramUrl("https://instagram.com/node")
                .build();
        when(organizerProfileRepository.findById(userId)).thenReturn(Optional.of(profile));

        OrganizerProfileResponse response = organizerService.getOrganizerProfile(userId);

        assertThat(response.getUserId()).isEqualTo(userId);
        assertThat(response.getDisplayName()).isEqualTo("Node Org");
        assertThat(response.getBio()).isEqualTo("bio");
        assertThat(response.getWebsiteUrl()).isEqualTo("https://example.org");
        assertThat(response.getContactEmail()).isEqualTo("contact@example.org");
        assertThat(response.getInstagramUrl()).isEqualTo("https://instagram.com/node");
    }

    @Test
    void upsertOrganizerProfile_createsWhenMissing() {
        UpdateOrganizerProfileRequest request = UpdateOrganizerProfileRequest.builder()
                .displayName("Node Org")
                .bio("bio")
                .websiteUrl("https://example.org")
                .contactEmail("contact@example.org")
                .instagramUrl("https://instagram.com/node")
                .build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(organizerProfileRepository.findById(userId)).thenReturn(Optional.empty());
        when(organizerProfileRepository.save(any(OrganizerProfile.class))).thenAnswer(inv -> {
            OrganizerProfile saved = inv.getArgument(0);
            if (saved.getUserId() == null) {
                saved.setUserId(userId);
            }
            return saved;
        });

        OrganizerProfileResponse response = organizerService.upsertOrganizerProfile(userId, request);

        assertThat(response.getUserId()).isEqualTo(userId);
        assertThat(response.getDisplayName()).isEqualTo("Node Org");
        verify(organizerProfileRepository).save(any(OrganizerProfile.class));
    }

    @Test
    void upsertOrganizerProfile_throwsWhenUserMissing() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());
        UpdateOrganizerProfileRequest request = UpdateOrganizerProfileRequest.builder()
                .displayName("ignored")
                .build();

        assertThatThrownBy(() -> organizerService.upsertOrganizerProfile(userId, request))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("User");
    }
}
