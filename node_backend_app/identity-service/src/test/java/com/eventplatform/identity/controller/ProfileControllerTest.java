package com.eventplatform.identity.controller;

import com.eventplatform.identity.dto.request.UpdateProfileRequest;
import com.eventplatform.identity.dto.response.ProfileResponse;
import com.eventplatform.identity.entity.Role;
import com.eventplatform.identity.security.UserPrincipal;
import com.eventplatform.identity.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProfileControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private ProfileController profileController;

    private UUID userId;
    private UserPrincipal principal;

    @BeforeEach
    void setUp() {
        userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440020");
        principal = new UserPrincipal(
                userId,
                "profile@test.com",
                "hash",
                Role.ATTENDEE,
                true,
                List.of(new SimpleGrantedAuthority("ROLE_ATTENDEE"))
        );
    }

    @Test
    void getMyProfile_returnsOkAndDelegatesToService() {
        ProfileResponse profile = ProfileResponse.builder()
                .id(userId)
                .email("profile@test.com")
                .firstName("Megha")
                .build();
        when(userService.getProfile(userId)).thenReturn(profile);

        ResponseEntity<ProfileResponse> response = profileController.getMyProfile(principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(profile);
        verify(userService).getProfile(userId);
    }

    @Test
    void updateMyProfile_returnsOkAndDelegatesToService() {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .bio("Updated bio")
                .location("San Jose")
                .build();
        ProfileResponse updated = ProfileResponse.builder()
                .id(userId)
                .bio("Updated bio")
                .location("San Jose")
                .build();
        when(userService.updateProfile(userId, request)).thenReturn(updated);

        ResponseEntity<ProfileResponse> response = profileController.updateMyProfile(principal, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(updated);
        verify(userService).updateProfile(userId, request);
    }

    @Test
    void updateMyProfile_propagatesServiceException() {
        UpdateProfileRequest request = UpdateProfileRequest.builder().bio("bad").build();
        when(userService.updateProfile(userId, request)).thenThrow(new IllegalArgumentException("invalid"));

        assertThatThrownBy(() -> profileController.updateMyProfile(principal, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("invalid");
    }
}
