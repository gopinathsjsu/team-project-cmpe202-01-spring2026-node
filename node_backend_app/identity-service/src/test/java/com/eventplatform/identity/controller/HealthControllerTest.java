package com.eventplatform.identity.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThat;

class HealthControllerTest {

    private final HealthController healthController = new HealthController();

    @Test
    void health_returnsUpStatusServiceAndTimestamp() {
        ResponseEntity<Map<String, Object>> response = healthController.health();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody()).containsEntry("status", "UP");
        assertThat(response.getBody()).containsEntry("service", "identity-service");
        assertThat(response.getBody()).containsKey("timestamp");
        assertThat(response.getBody().get("timestamp")).isInstanceOf(String.class);
    }

    @Test
    void health_timestampIsIsoInstant() {
        Instant before = Instant.now();
        ResponseEntity<Map<String, Object>> response = healthController.health();
        Instant after = Instant.now();

        String timestamp = (String) response.getBody().get("timestamp");
        assertThat(timestamp).isNotBlank();
        Instant parsed = Instant.parse(timestamp);
        assertThat(parsed).isBetween(before.minusSeconds(1), after.plusSeconds(1));
        assertThatCode(() -> Instant.parse(timestamp)).doesNotThrowAnyException();
    }
}
