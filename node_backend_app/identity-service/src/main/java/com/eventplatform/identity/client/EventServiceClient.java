package com.eventplatform.identity.client;

import com.eventplatform.identity.exception.ExternalServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventServiceClient {

    private final WebClient eventServiceWebClient;

    public void approveEvent(String eventId) {
        log.info("Calling Event Service to approve event: {}", eventId);

        eventServiceWebClient.post()
                .uri("/api/v1/events/{eventId}/approve", eventId)
                .retrieve()
                .onStatus(HttpStatusCode::isError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(new ExternalServiceException(
                                        "EventService",
                                        "Failed to approve event " + eventId + ": " + body))))
                .bodyToMono(Map.class)
                .block();

        log.info("Event {} approved successfully via Event Service", eventId);
    }

    public void rejectEvent(String eventId) {
        log.info("Calling Event Service to reject event: {}", eventId);

        eventServiceWebClient.post()
                .uri("/api/v1/events/{eventId}/reject", eventId)
                .retrieve()
                .onStatus(HttpStatusCode::isError, response ->
                        response.bodyToMono(String.class)
                                .flatMap(body -> Mono.error(new ExternalServiceException(
                                        "EventService",
                                        "Failed to reject event " + eventId + ": " + body))))
                .bodyToMono(Map.class)
                .block();

        log.info("Event {} rejected successfully via Event Service", eventId);
    }
}
