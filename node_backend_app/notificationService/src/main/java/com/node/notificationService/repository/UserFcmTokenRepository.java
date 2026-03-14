package com.node.notificationService.repository;

import com.node.notificationService.model.UserFcmToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserFcmTokenRepository extends JpaRepository<UserFcmToken, String> {
}
