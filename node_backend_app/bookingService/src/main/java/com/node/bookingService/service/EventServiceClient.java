package com.node.bookingService.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.Map;
import java.util.List;
import java.util.Collections;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;
import com.node.bookingService.dto.EventLocationDto;
import com.node.bookingService.dto.EventInfoDto;

@Slf4j
@Component
public class EventServiceClient {

    private final WebClient webClient;
    private final int timeoutSeconds;

    public EventServiceClient(
            @Value("${booking.event-service.base-url}") String baseUrl,
            @Value("${booking.event-service.timeout-seconds:10}") int timeoutSeconds) {
        this.webClient = WebClient.builder().baseUrl(baseUrl).build();
        this.timeoutSeconds = timeoutSeconds;
        log.info("EventServiceClient initialized: baseUrl={}, timeout={}s", baseUrl, timeoutSeconds);
    }

    @SuppressWarnings("unchecked")
    public EventInfoDto getEventById(String eventId) {
        log.debug("Fetching event id={} from event service", eventId);
        try {
           EventInfoDto event = webClient.get()
                    .uri("/api/v1/events/{id}", eventId)
                    .retrieve()
                    .bodyToMono(EventInfoDto.class)
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .block();
            log.debug("Event id={} retrieved from event service", eventId);
            return event;
        } catch (WebClientResponseException.NotFound e) {
            log.warn("Event id={} not found in event service", eventId);
            return null;
        } catch (Exception e) {
            log.error("Failed to fetch event id={} from event service: {}", eventId, e.getMessage());
            throw new RuntimeException("Event service unavailable: " + e.getMessage(), e);
        }
    }

    /**
     * Batch-fetch events by id. Returns a map from eventId -> event map.
     * If an individual event fails to fetch, its value will be null.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Map<String, Object>> getEventsByIds(List<String> eventIds) {
        if (eventIds == null || eventIds.isEmpty()) return Collections.emptyMap();

        try {
            // Parallelize requests and keep mapping by the original id as the key.
            return Flux.fromIterable(eventIds)
                    .flatMap(id -> webClient.get()
                            .uri("/api/v1/events/{id}", id)
                            .retrieve()
                            .bodyToMono(Map.class)
                            .timeout(Duration.ofSeconds(timeoutSeconds))
                            .map(m -> Tuples.of(id, (Map<String, Object>) m))
                            .onErrorResume(e -> {
                                if (e instanceof WebClientResponseException.NotFound) {
                                    log.warn("Event id={} not found in event service", id);
                                } else {
                                    log.warn("Failed to fetch event id={}: {}", id, e.getMessage());
                                }
                                return Mono.just(Tuples.of(id, (Map<String, Object>) null));
                            })
                    )
                    .collectMap(Tuple2::getT1, Tuple2::getT2)
                    .block(Duration.ofSeconds(Math.max(5, timeoutSeconds * 2)));
        } catch (Exception e) {
            log.error("Failed to fetch events: {}", e.getMessage());
            throw new RuntimeException("Event service unavailable: " + e.getMessage(), e);
        }
    }

    public boolean eventExists(String eventId) {
        return getEventById(eventId) != null;
    }
}
