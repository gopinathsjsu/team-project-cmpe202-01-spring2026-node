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
public class BookingClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public BookingClient(RestTemplate restTemplate,
                         @Value("${notification.booking-service.base-url:http://localhost:8082}") String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    public List<ConfirmedBookingDto> getConfirmedBookingsForEvent(String eventId) {
        String url = baseUrl + "/api/v1/bookings/event/" + eventId + "/status/CONFIRMED";
        try {
            ResponseEntity<List<ConfirmedBookingDto>> resp = restTemplate.exchange(
                    url, HttpMethod.GET, null,
                    new ParameterizedTypeReference<List<ConfirmedBookingDto>>() {});
            List<ConfirmedBookingDto> body = resp.getBody();
            return body != null ? body : Collections.emptyList();
        } catch (Exception e) {
            log.error("Failed to fetch confirmed bookings for event {} from {}: {}", eventId, url, e.getMessage());
            return Collections.emptyList();
        }
    }
}
