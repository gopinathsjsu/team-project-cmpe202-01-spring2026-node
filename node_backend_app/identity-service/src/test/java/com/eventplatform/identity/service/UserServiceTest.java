package com.eventplatform.identity.service;

import com.eventplatform.identity.dto.request.UpdateProfileRequest;
import com.eventplatform.identity.dto.response.ProfileResponse;
import com.eventplatform.identity.entity.AttendeeProfile;
import com.eventplatform.identity.entity.Role;
import com.eventplatform.identity.entity.User;
import com.eventplatform.identity.exception.EntityNotFoundException;
import com.eventplatform.identity.repository.AttendeeProfileRepository;
import com.eventplatform.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AttendeeProfileRepository attendeeProfileRepository;

    @InjectMocks
    private UserService userService;

    private UUID userId;
    private User user;

    @BeforeEach
    void setUp() {
        userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440010");
        user = User.builder()
                .id(userId)
                .email("user@test.com")
                .username("existingUser")
                .passwordHash("hash")
                .role(Role.ATTENDEE)
                .isActive(true)
                .createdAt(Instant.parse("2026-01-01T00:00:00Z"))
                .build();
    }

    @Test
    void getProfile_prefersAttendeeProfileFieldsWhenUserFieldsAreNull() {
        user.setFirstName(null);
        user.setLastName(null);
        user.setPhone(null);
        user.setAvatarUrl(null);
        user.setBio("bio from user");
        user.setLocation("San Jose");

        AttendeeProfile attendeeProfile = AttendeeProfile.builder()
                .user(user)
                .firstName("Megha")
                .lastName("Gangal")
                .phone("1234567890")
                .avatarUrl("https://img")
                .timezone("America/Los_Angeles")
                .interest("music, tech")
                .build();
        user.setAttendeeProfile(attendeeProfile);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        ProfileResponse response = userService.getProfile(userId);

        assertThat(response.getFirstName()).isEqualTo("Megha");
        assertThat(response.getLastName()).isEqualTo("Gangal");
        assertThat(response.getPhone()).isEqualTo("1234567890");
        assertThat(response.getAvatarUrl()).isEqualTo("https://img");
        assertThat(response.getTimezone()).isEqualTo("America/Los_Angeles");
        assertThat(response.getInterest()).isEqualTo("music, tech");
        assertThat(response.getBio()).isEqualTo("bio from user");
        assertThat(response.getLocation()).isEqualTo("San Jose");
    }

    @Test
    void updateProfile_createsAttendeeProfileAndPersistsAllEditableFields() {
        user.setUsername("oldName");
        user.setAttendeeProfile(null);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(attendeeProfileRepository.save(any(AttendeeProfile.class))).thenAnswer(inv -> {
            AttendeeProfile saved = inv.getArgument(0);
            user.setAttendeeProfile(saved);
            return saved;
        });

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .username("newName")
                .firstName("Megha")
                .lastName("Gangal")
                .phone("5551234567")
                .avatarUrl("https://avatar")
                .bio("bio")
                .location("San Jose")
                .timezone("UTC")
                .interest("music")
                .build();

        ProfileResponse response = userService.updateProfile(userId, request);

        assertThat(response.getUsername()).isEqualTo("newName");
        assertThat(response.getFirstName()).isEqualTo("Megha");
        assertThat(response.getLastName()).isEqualTo("Gangal");
        assertThat(response.getPhone()).isEqualTo("5551234567");
        assertThat(response.getAvatarUrl()).isEqualTo("https://avatar");
        assertThat(response.getBio()).isEqualTo("bio");
        assertThat(response.getLocation()).isEqualTo("San Jose");
        assertThat(response.getTimezone()).isEqualTo("UTC");
        assertThat(response.getInterest()).isEqualTo("music");

        verify(userRepository).save(user);
        verify(attendeeProfileRepository).save(any(AttendeeProfile.class));
    }

    @Test
    void updateProfile_throwsWhenUsernameTakenAndSkipsSaving() {
        user.setUsername("old");
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.existsByUsername("takenName")).thenReturn(true);

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .username("takenName")
                .build();

        assertThatThrownBy(() -> userService.updateProfile(userId, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Username is already taken");

        verify(userRepository, never()).save(any(User.class));
        verify(attendeeProfileRepository, never()).save(any(AttendeeProfile.class));
    }

    @Test
    void getProfile_throwsWhenUserMissing() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getProfile(userId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("User");
    }
}
