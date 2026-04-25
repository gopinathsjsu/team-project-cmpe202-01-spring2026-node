package com.eventplatform.identity.service;

import com.eventplatform.identity.dto.request.LoginRequest;
import com.eventplatform.identity.dto.request.CreateAdminRequest;
import com.eventplatform.identity.dto.request.RegisterRequest;
import com.eventplatform.identity.dto.response.AuthResponse;
import com.eventplatform.identity.dto.response.UserResponse;
import com.eventplatform.identity.entity.RefreshToken;
import com.eventplatform.identity.entity.Role;
import com.eventplatform.identity.entity.User;
import com.eventplatform.identity.repository.UserRepository;
import com.eventplatform.identity.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final RefreshTokenService refreshTokenService;
    private final AuditLogService auditLogService;
    private final AuthenticationManager authenticationManager;

    @Value("${app.jwt.access-token-expiration-ms}")
    private long accessTokenExpirationMs;

    @Value("${app.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    @Transactional
    public AuthResponse register(RegisterRequest request, String ipAddress) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();
        ensureEmailAvailable(normalizedEmail);

        Role role = request.getRole() != null ? request.getRole() : Role.ATTENDEE;
        if (role == Role.ADMIN) {
            throw new IllegalArgumentException("Admin registration is not allowed");
        }

        String username = resolveUsername(request.getUsername(), normalizedEmail);
        ensureUsernameAvailable(username);

        User user = User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .username(username)
                .role(role)
                .isActive(true)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .build();

        user = userRepository.save(user);

        String accessToken = jwtProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = refreshTokenService.createRefreshToken(user.getId());

        auditLogService.log(user.getId(), "REGISTER", "USER", user.getId().toString(),
                Map.of("email", user.getEmail(), "role", role.name()), ipAddress);

        return buildAuthResponse(user, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse bootstrapInitialAdmin(CreateAdminRequest request, String ipAddress) {
        if (userRepository.existsByRole(Role.ADMIN)) {
            throw new IllegalArgumentException("Initial admin already exists. Use admin APIs to create additional admins.");
        }

        String normalizedEmail = request.getEmail().toLowerCase().trim();
        ensureEmailAvailable(normalizedEmail);

        String username = resolveUsername(request.getUsername(), normalizedEmail);
        ensureUsernameAvailable(username);

        User adminUser = User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .username(username)
                .role(Role.ADMIN)
                .isActive(true)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .build();

        adminUser = userRepository.save(adminUser);

        String accessToken = jwtProvider.generateAccessToken(adminUser.getId(), adminUser.getEmail(), adminUser.getRole());
        String refreshToken = refreshTokenService.createRefreshToken(adminUser.getId());

        auditLogService.log(adminUser.getId(), "ADMIN_BOOTSTRAP", "USER", adminUser.getId().toString(),
                Map.of("email", adminUser.getEmail(), "role", Role.ADMIN.name()), ipAddress);

        return buildAuthResponse(adminUser, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        } catch (BadCredentialsException e) {
            auditLogService.log(null, "LOGIN_FAILURE", "USER", null,
                    Map.of("email", request.getEmail()), ipAddress);
            throw new BadCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        String accessToken = jwtProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = refreshTokenService.createRefreshToken(user.getId());

        auditLogService.log(user.getId(), "LOGIN_SUCCESS", "USER", user.getId().toString(),
                Map.of("email", user.getEmail()), ipAddress);

        return buildAuthResponse(user, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse refresh(String encodedRefreshToken) {
        RefreshToken oldToken = refreshTokenService.validateAndRotate(encodedRefreshToken);

        User user = userRepository.findById(oldToken.getUserId())
                .orElseThrow(() -> new BadCredentialsException("User not found"));

        String accessToken = jwtProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole());
        String newRefreshToken = refreshTokenService.createRefreshToken(user.getId());

        auditLogService.log(user.getId(), "TOKEN_REFRESH", "USER", user.getId().toString(),
                Map.of("email", user.getEmail()), null);

        return buildAuthResponse(user, accessToken, newRefreshToken);
    }

    @Transactional
    public void logout(UUID userId) {
        refreshTokenService.revokeAllUserTokens(userId);
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .avatarUrl(user.getAvatarUrl())
                .active(user.isActive())
                .role(user.getRole())
                .build();

        return AuthResponse.builder()
                .user(userResponse)
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(accessTokenExpirationMs / 1000L)
                .refreshExpiresIn(refreshTokenExpirationMs / 1000L)
                .tokenType("Bearer")
                .build();
    }

    private void ensureEmailAvailable(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("An account with this email already exists");
        }
    }

    private void ensureUsernameAvailable(String username) {
        if (username != null && userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username is already taken");
        }
    }

    private String resolveUsername(String requestedUsername, String normalizedEmail) {
        if (requestedUsername != null && !requestedUsername.isBlank()) {
            return requestedUsername.trim();
        }

        String inferred = normalizedEmail.split("@")[0];
        return inferred.isBlank() ? null : inferred;
    }
}
