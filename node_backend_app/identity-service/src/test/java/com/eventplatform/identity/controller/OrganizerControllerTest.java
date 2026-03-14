package com.eventplatform.identity.controller;

import com.eventplatform.identity.dto.request.UpdateOrganizerProfileRequest;
import com.eventplatform.identity.dto.response.OrganizerProfileResponse;
import com.eventplatform.identity.entity.Role;
import com.eventplatform.identity.security.UserPrincipal;
import com.eventplatform.identity.service.OrganizerService;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrganizerControllerTest {

    @Mock
    private OrganizerService organizerService;

    @InjectMocks
    private OrganizerController organizerController;

    private UUID userId;
    private UserPrincipal principal;

    @BeforeEach
    void setUp() {
        userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440031");
        principal = new UserPrincipal(
                userId,
                "organizer@test.com",
                "hash",
                Role.ORGANIZER,
                true,
                List.of(new SimpleGrantedAuthority("ROLE_ORGANIZER"))
        );
    }

    @Test
    void getMyOrganizerProfile_returnsOkAndDelegates() {
        OrganizerProfileResponse responseBody = OrganizerProfileResponse.builder()
                .userId(userId)
                .displayName("Node Org")
                .build();
        when(organizerService.getOrganizerProfile(userId)).thenReturn(responseBody);

        ResponseEntity<OrganizerProfileResponse> response =
                organizerController.getMyOrganizerProfile(principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(responseBody);
        verify(organizerService).getOrganizerProfile(userId);
    }

    @Test
    void updateMyOrganizerProfile_returnsOkAndDelegates() {
        UpdateOrganizerProfileRequest request = UpdateOrganizerProfileRequest.builder()
                .displayName("Node Org")
                .bio("bio")
                .build();
        OrganizerProfileResponse responseBody = OrganizerProfileResponse.builder()
                .userId(userId)
                .displayName("Node Org")
                .bio("bio")
                .build();
        when(organizerService.upsertOrganizerProfile(userId, request)).thenReturn(responseBody);

        ResponseEntity<OrganizerProfileResponse> response =
                organizerController.updateMyOrganizerProfile(principal, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(responseBody);
        verify(organizerService).upsertOrganizerProfile(userId, request);
    }
}
