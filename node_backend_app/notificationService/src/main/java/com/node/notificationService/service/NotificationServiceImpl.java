package com.node.notificationService.service;

import com.node.notificationService.model.UserFcmToken;
import com.node.notificationService.repository.UserFcmTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final UserFcmTokenRepository fcmTokenRepository;

    public record UserTokenProjection(String userEmail, String fcmToken) {}

    @Override
    public void registerFcmToken(String userId, String userEmail, String fcmToken) {
        boolean exists = fcmTokenRepository.findById(userId).isPresent();
        UserFcmToken token = fcmTokenRepository.findById(userId)
                .orElse(new UserFcmToken());
        token.setUserId(userId);
        token.setUserEmail(userEmail);
        token.setFcmToken(fcmToken);
        fcmTokenRepository.save(token);
        log.info("FCM token {}: userId={}, hasToken={}",
                exists ? "updated" : "registered", userId, fcmToken != null && !fcmToken.isBlank());
    }

    @Override
    public String getFcmToken(String userId) {
        String token = fcmTokenRepository.findById(userId)
                .map(UserFcmToken::getFcmToken)
                .orElse(null);
        if (token == null || token.isBlank()) {
            log.debug("No FCM token registered for userId={}", userId);
        }
        return token;
    }

    @Override
    public List<UserTokenProjection> getAllUserTokens() {
        List<UserTokenProjection> tokens = fcmTokenRepository.findAll().stream()
                .map(t -> new UserTokenProjection(t.getUserEmail(), t.getFcmToken()))
                .toList();
        log.debug("Loaded {} FCM token projections for broadcast", tokens.size());
        return tokens;
    }
}
