package com.eventplatform.identity.dto.response;

import com.eventplatform.identity.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {
    private UUID id;
    private String email;
    private String username;
    private Role role;
    private boolean active;
    private String firstName;
    private String lastName;
    private String phone;
    private String avatarUrl;
    private String bio;
    private String location;
    private String timezone;
    private Instant createdAt;
}
