package com.node.notificationService.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class EventClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public EventClient(RestTemplate restTemplate,
                       @Value("${notification.event-service.base-url:http://localhost:8080}") String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    public List<UpcomingEventDto> getActiveEvents() {
        String url = baseUrl + "/api/v1/events/activeEvents";
        try {
            ResponseEntity<List<UpcomingEventDto>> resp = restTemplate.exchange(
                    url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<List<UpcomingEventDto>>() {});
            List<UpcomingEventDto> body = resp.getBody();
            return body != null ? body : Collections.emptyList();
        } catch (Exception e) {
            log.error("Failed to fetch active events from {}: {}", url, e.getMessage());
            return Collections.emptyList();
        }
    }
}
