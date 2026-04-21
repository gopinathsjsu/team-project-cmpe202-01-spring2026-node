package com.eventplatform.identity.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Token pair returned from login, register, and refresh. Includes OAuth2-style
 * lifetimes (similar to Keycloak/Realm) so clients can schedule refresh without
 * decoding the JWT. Refresh tokens are rotated on each /auth/refresh call.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private UserResponse user;
    private String accessToken;
    private String refreshToken;

    /** Access token lifetime in seconds (for Bearer expiry scheduling). */
    @JsonProperty("expires_in")
    private long expiresIn;

    /**
     * Refresh token max lifetime in seconds (new token issued on each refresh;
     * client should always replace the stored refresh token).
     */
    @JsonProperty("refresh_expires_in")
    private long refreshExpiresIn;

    @JsonProperty("token_type")
    @Builder.Default
    private String tokenType = "Bearer";
}
