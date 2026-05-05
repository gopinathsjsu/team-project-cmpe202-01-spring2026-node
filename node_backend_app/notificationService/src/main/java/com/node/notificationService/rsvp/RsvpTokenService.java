package com.node.notificationService.rsvp;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

/**
 * Stateless HMAC-signed RSVP tokens. Format:
 *   base64url(bookingId|eventId|userEmail|status|expiryEpochSeconds) + "." + base64url(HMAC-SHA256(payload))
 * Verification re-signs the payload and constant-time compares.
 */
@Slf4j
@Service
public class RsvpTokenService {

    private static final String HMAC_ALGO = "HmacSHA256";
    private static final String DELIM = "|";

    private final byte[] secret;

    public RsvpTokenService(@Value("${notification.rsvp.token-secret:change-me-in-prod}") String secret) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String mint(String bookingId, String eventId, String userEmail, RsvpStatus status, Instant expiry) {
        String payload = String.join(DELIM,
                bookingId,
                eventId,
                userEmail,
                status.name(),
                Long.toString(expiry.getEpochSecond()));
        String sig = sign(payload);
        return base64Url(payload.getBytes(StandardCharsets.UTF_8)) + "." + sig;
    }

    public Optional<RsvpClaim> verify(String token) {
        if (token == null || token.indexOf('.') < 0) {
            return Optional.empty();
        }
        int dot = token.indexOf('.');
        String payloadB64 = token.substring(0, dot);
        String sig = token.substring(dot + 1);
        String payload;
        try {
            payload = new String(Base64.getUrlDecoder().decode(payloadB64), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
        String expected = sign(payload);
        if (!constantTimeEquals(expected, sig)) {
            return Optional.empty();
        }
        String[] parts = payload.split("\\|", -1);
        if (parts.length != 5) {
            return Optional.empty();
        }
        try {
            RsvpStatus status = RsvpStatus.valueOf(parts[3]);
            Instant expiry = Instant.ofEpochSecond(Long.parseLong(parts[4]));
            if (Instant.now().isAfter(expiry)) {
                return Optional.empty();
            }
            return Optional.of(new RsvpClaim(parts[0], parts[1], parts[2], status, expiry));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            mac.init(new SecretKeySpec(secret, HMAC_ALGO));
            byte[] raw = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return base64Url(raw);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to sign RSVP token", e);
        }
    }

    private static String base64Url(byte[] raw) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
    }

    private static boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }

    public record RsvpClaim(String bookingId, String eventId, String userEmail, RsvpStatus status, Instant expiry) {}
}
