package com.eventplatform.identity.controller;

import com.eventplatform.identity.dto.request.CreateAdminRequest;
import com.eventplatform.identity.dto.request.LoginRequest;
import com.eventplatform.identity.dto.request.RefreshTokenRequest;
import com.eventplatform.identity.dto.request.RegisterRequest;
import com.eventplatform.identity.dto.response.AuthResponse;
import com.eventplatform.identity.dto.response.MessageResponse;
import com.eventplatform.identity.dto.response.UserResponse;
import com.eventplatform.identity.security.UserPrincipal;
import com.eventplatform.identity.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Registration, login, token refresh, and logout")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request,
                                                  HttpServletRequest httpRequest) {
        AuthResponse response = authService.register(request, getClientIp(httpRequest));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/bootstrap-admin")
    @Operation(summary = "Create initial admin account (one-time)")
    public ResponseEntity<AuthResponse> bootstrapAdmin(@Valid @RequestBody CreateAdminRequest request,
                                                       HttpServletRequest httpRequest) {
        AuthResponse response = authService.bootstrapInitialAdmin(request, getClientIp(httpRequest));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                               HttpServletRequest httpRequest) {
        AuthResponse response = authService.login(request, getClientIp(httpRequest));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token using refresh token")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refresh(request.getRefreshToken());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout and revoke all refresh tokens")
    public ResponseEntity<MessageResponse> logout(@AuthenticationPrincipal UserPrincipal principal) {
        log.debug("POST /logout received: userId={}", principal != null ? principal.getId() : null);
        authService.logout(principal.getId());
        return ResponseEntity.ok(MessageResponse.builder().message("Logged out successfully").build());
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @GetMapping("/allUsers")
    ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = authService.getAllUsers();
        return ResponseEntity.ok(users);
    }

}
