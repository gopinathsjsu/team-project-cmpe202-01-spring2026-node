package com.eventplatform.identity.controller;

import com.eventplatform.identity.dto.request.LoginRequest;
import com.eventplatform.identity.dto.request.CreateAdminRequest;
import com.eventplatform.identity.dto.request.RegisterRequest;
import com.eventplatform.identity.dto.response.AuthResponse;
import com.eventplatform.identity.dto.response.UserResponse;
import com.eventplatform.identity.entity.Role;
import com.eventplatform.identity.security.UserPrincipal;
import com.eventplatform.identity.service.AuthService;
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
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private HttpServletRequest httpRequest;

    @InjectMocks
    private AuthController authController;

    private AuthResponse authResponse;

    @BeforeEach
    void setUp() {
        authResponse = AuthResponse.builder()
                .user(UserResponse.builder()
                        .id(UUID.randomUUID())
                        .email("user@test.com")
                        .role(Role.ATTENDEE)
                        .active(true)
                        .build())
                .accessToken("access")
                .refreshToken("refresh")
                .expiresIn(900)
                .refreshExpiresIn(1200)
                .build();
    }

    @Test
    void register_returnsCreatedAndUsesRemoteAddrWhenNoForwardedHeader() {
        RegisterRequest request = RegisterRequest.builder()
                .email("user@test.com")
                .password("Password123!")
                .build();
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
        when(httpRequest.getRemoteAddr()).thenReturn("203.0.113.20");
        when(authService.register(eq(request), eq("203.0.113.20"))).thenReturn(authResponse);

        ResponseEntity<AuthResponse> response = authController.register(request, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isEqualTo(authResponse);
        verify(authService).register(request, "203.0.113.20");
    }

    @Test
    void login_returnsOkAndUsesFirstForwardedIp() {
        LoginRequest request = LoginRequest.builder()
                .email("user@test.com")
                .password("Password123!")
                .build();
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn("198.51.100.10, 10.0.0.1");
        when(authService.login(eq(request), eq("198.51.100.10"))).thenReturn(authResponse);

        ResponseEntity<AuthResponse> response = authController.login(request, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(authResponse);
        verify(authService).login(request, "198.51.100.10");
    }

    @Test
    void logout_returnsOkAndDelegatesToService() {
        UUID userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440040");
        UserPrincipal principal = new UserPrincipal(
                userId,
                "admin@test.com",
                "hash",
                Role.ADMIN,
                true,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        ResponseEntity<?> response = authController.logout(principal);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(authService).logout(userId);
    }

    @Test
    void bootstrapAdmin_returnsCreatedAndUsesForwardedIp() {
        CreateAdminRequest request = CreateAdminRequest.builder()
                .email("first-admin@test.com")
                .password("Password123!")
                .build();
        when(httpRequest.getHeader("X-Forwarded-For")).thenReturn("198.51.100.77, 10.0.0.1");
        when(authService.bootstrapInitialAdmin(eq(request), eq("198.51.100.77"))).thenReturn(authResponse);

        ResponseEntity<AuthResponse> response = authController.bootstrapAdmin(request, httpRequest);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isEqualTo(authResponse);
        verify(authService).bootstrapInitialAdmin(request, "198.51.100.77");
    }
}
