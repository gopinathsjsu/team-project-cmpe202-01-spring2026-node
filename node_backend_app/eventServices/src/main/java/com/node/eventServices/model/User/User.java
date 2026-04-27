package com.node.eventServices.model.User;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Builder
@Entity
@Data
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String username;

    private String userEmail;

    private String passwordHash;

    private Role roles;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "first_name", length = 100)
    private  String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(length = 20)
    private String phone;

    private String location;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private LocalDate createdAt;

    private LocalDate updatedAt;

    public String getHashedPassword() {
        return passwordHash;
    }

    /**
     * Spring Security principal name; must match {@code loadUserByUsername} (email) and JWT email/subject checks.
     */

    public String getUsername() {
        return username;
    }

    /** Profile display name (the {@code username} column), not the security principal. */
    public String getProfileUsername() {
        if (username != null && !username.isBlank()) {
            return username;
        }
        return userEmail;
    }

    public boolean isEnabled() {
        return true;
    }
}
