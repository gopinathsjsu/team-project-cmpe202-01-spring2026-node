package com.eventplatform.identity.service;

import com.eventplatform.identity.entity.RefreshToken;
import com.eventplatform.identity.exception.TokenRefreshException;
import com.eventplatform.identity.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private RefreshTokenService refreshTokenService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(refreshTokenService, "refreshTokenExpirationMs", 120_000L);
    }

    @Test
    void createRefreshToken_savesTokenAndReturnsBase64UrlEncodedRawToken() {
        UUID userId = UUID.randomUUID();
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        String encoded = refreshTokenService.createRefreshToken(userId);

        String decoded = new String(Base64.getUrlDecoder().decode(encoded));
        assertThat(decoded).isNotBlank();
        assertThat(decoded).contains("-");

        ArgumentCaptor<RefreshToken> tokenCaptor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(tokenCaptor.capture());
        RefreshToken persisted = tokenCaptor.getValue();
        assertThat(persisted.getUserId()).isEqualTo(userId);
        assertThat(persisted.getTokenHash()).isNotBlank();
        assertThat(persisted.getExpiresAt()).isAfter(Instant.now());
        assertThat(persisted.isRevoked()).isFalse();
    }

    @Test
    void validateAndRotate_whenActiveToken_revokesAndReturnsToken() {
        String raw = "raw-token";
        String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes());
        RefreshToken active = RefreshToken.builder()
                .id(UUID.randomUUID())
                .userId(UUID.randomUUID())
                .tokenHash(hash(raw))
                .expiresAt(Instant.now().plusSeconds(60))
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByTokenHashAndRevokedFalse(active.getTokenHash()))
                .thenReturn(Optional.of(active));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        RefreshToken result = refreshTokenService.validateAndRotate(encoded);

        assertThat(result).isEqualTo(active);
        assertThat(active.isRevoked()).isTrue();
        verify(refreshTokenRepository).save(active);
    }

    @Test
    void validateAndRotate_whenExpiredToken_revokesAndThrows() {
        String raw = "expired-token";
        String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes());
        RefreshToken expired = RefreshToken.builder()
                .id(UUID.randomUUID())
                .userId(UUID.randomUUID())
                .tokenHash(hash(raw))
                .expiresAt(Instant.now().minusSeconds(1))
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByTokenHashAndRevokedFalse(expired.getTokenHash()))
                .thenReturn(Optional.of(expired));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThatThrownBy(() -> refreshTokenService.validateAndRotate(encoded))
                .isInstanceOf(TokenRefreshException.class)
                .hasMessage("Refresh token has expired");

        assertThat(expired.isRevoked()).isTrue();
        verify(refreshTokenRepository).save(expired);
    }

    @Test
    void validateAndRotate_whenRevokedTokenReused_revokesAllAndAudits() {
        UUID userId = UUID.randomUUID();
        RefreshToken revoked = RefreshToken.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .tokenHash(hash("reused"))
                .expiresAt(Instant.now().plusSeconds(60))
                .revoked(true)
                .build();
        String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString("reused".getBytes());

        when(refreshTokenRepository.findByTokenHashAndRevokedFalse(revoked.getTokenHash()))
                .thenReturn(Optional.empty());
        when(refreshTokenRepository.findByTokenHash(revoked.getTokenHash()))
                .thenReturn(Optional.of(revoked));

        assertThatThrownBy(() -> refreshTokenService.validateAndRotate(encoded))
                .isInstanceOf(TokenRefreshException.class)
                .hasMessage("Refresh token reuse detected; all sessions have been logged out");

        verify(refreshTokenRepository).revokeAllByUserId(userId);
        verify(auditLogService).log(
                eq(userId),
                eq("REFRESH_TOKEN_REUSE"),
                eq("REFRESH_TOKEN"),
                eq(revoked.getId().toString()),
                eq(Map.of("reason", "rotated token presented again; all sessions revoked")),
                eq(null)
        );
    }

    @Test
    void validateAndRotate_whenUnknownToken_throwsInvalidOrRevoked() {
        String raw = "unknown";
        String tokenHash = hash(raw);
        String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes());
        when(refreshTokenRepository.findByTokenHashAndRevokedFalse(tokenHash)).thenReturn(Optional.empty());
        when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> refreshTokenService.validateAndRotate(encoded))
                .isInstanceOf(TokenRefreshException.class)
                .hasMessage("Invalid or revoked refresh token");

        verify(auditLogService, never()).log(any(), any(), any(), any(), any(), any());
    }

    private String hash(String rawToken) {
        return (String) ReflectionTestUtils.invokeMethod(refreshTokenService, "hashToken", rawToken);
    }
}
