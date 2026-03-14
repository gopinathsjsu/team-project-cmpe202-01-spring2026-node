package com.node.notificationService.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "user_fcm_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserFcmToken {

    @Id
    @Column(name = "user_id")
    private String userId;

    @Column(name = "fcm_token", nullable = false)
    private String fcmToken;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
