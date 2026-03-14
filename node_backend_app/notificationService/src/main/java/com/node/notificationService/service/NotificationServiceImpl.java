package com.node.notificationService.service;

import com.node.notificationService.model.UserFcmToken;
import com.node.notificationService.repository.UserFcmTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final UserFcmTokenRepository fcmTokenRepository;

    public record UserTokenProjection(String userEmail, String fcmToken) {}

    @Override
    public void registerFcmToken(String userId, String userEmail, String fcmToken) {
        UserFcmToken token = fcmTokenRepository.findById(userId)
                .orElse(new UserFcmToken());
        token.setUserId(userId);
        token.setUserEmail(userEmail);
        token.setFcmToken(fcmToken);
        fcmTokenRepository.save(token);
    }

    @Override
    public String getFcmToken(String userId) {
        return fcmTokenRepository.findById(userId)
                .map(UserFcmToken::getFcmToken)
                .orElse(null);
    }

    @Override
    public List<UserTokenProjection> getAllUserTokens() {
        return fcmTokenRepository.findAll().stream()
                .map(t -> new UserTokenProjection(t.getUserEmail(), t.getFcmToken()))
                .toList();
    }
}
