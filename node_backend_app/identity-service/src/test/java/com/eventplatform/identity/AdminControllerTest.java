package com.eventplatform.identity.controller;

import com.eventplatform.identity.dto.response.MessageResponse;
import com.eventplatform.identity.entity.Role;
import com.eventplatform.identity.security.UserPrincipal;
import com.eventplatform.identity.service.AdminService;
import jakarta.servlet.http.HttpServletRequest;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    private static final UUID ADMIN_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440001");
    private static final String EVENT_ID = "evt-123";

    @Mock
    private AdminService adminService;

    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private AdminController adminController;

    private UserPrincipal principal;

    @BeforeEach
    void setUp() {
        principal = new UserPrincipal(
                ADMIN_ID,
                "admin@test.com",
                "hash",
                Role.ADMIN,
                true,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
    }

    @Test
    void approveEvent_returnsOkAndDelegatesToService_usingRemoteAddrWhenNoForwardedHeader() {
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        when(httpRequest.getRemoteAddr()).thenReturn("203.0.113.10");
        MessageResponse expected = MessageResponse.builder().message("Approved").build();
        when(adminService.approveEvent(eq(EVENT_ID), eq(ADMIN_ID), eq("203.0.113.10")))
                .thenReturn(expected);

        ResponseEntity<MessageResponse> response =
                adminController.approveEvent(EVENT_ID, principal, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(expected);
        verify(adminService).approveEvent(EVENT_ID, ADMIN_ID, "203.0.113.10");
    }

    @Test
    void approveEvent_passesFirstIpFromXForwardedFor() {
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn("198.51.100.1, 10.0.0.1");
        MessageResponse expected = MessageResponse.builder().message("ok").build();
        when(adminService.approveEvent(eq(EVENT_ID), eq(ADMIN_ID), eq("198.51.100.1")))
                .thenReturn(expected);

        ResponseEntity<MessageResponse> response =
                adminController.approveEvent(EVENT_ID, principal, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(expected);
        verify(adminService).approveEvent(EVENT_ID, ADMIN_ID, "198.51.100.1");
    }

    @Test
    void rejectEvent_returnsOkAndDelegatesToService_usingRemoteAddr() {
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn("");
        when(httpRequest.getRemoteAddr()).thenReturn("192.0.2.5");
        MessageResponse expected = MessageResponse.builder().message("Rejected").build();
        when(adminService.rejectEvent(eq(EVENT_ID), eq(ADMIN_ID), eq("192.0.2.5")))
                .thenReturn(expected);

        ResponseEntity<MessageResponse> response =
                adminController.rejectEvent(EVENT_ID, principal, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(expected);
        verify(adminService).rejectEvent(EVENT_ID, ADMIN_ID, "192.0.2.5");
    }

    @Test
    void rejectEvent_passesFirstIpFromXForwardedFor() {
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn("203.0.113.99");
        MessageResponse expected = MessageResponse.builder().message("done").build();
        when(adminService.rejectEvent(eq(EVENT_ID), eq(ADMIN_ID), eq("203.0.113.99")))
                .thenReturn(expected);

        ResponseEntity<MessageResponse> response =
                adminController.rejectEvent(EVENT_ID, principal, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(expected);
        verify(adminService).rejectEvent(EVENT_ID, ADMIN_ID, "203.0.113.99");
    }
}
