package com.node.bookingService.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.node.bookingService.dto.BookingAdminMetricsDto;
import com.node.bookingService.dto.BookingResponseForUser;
import com.node.bookingService.dto.BookingResponse;
import com.node.bookingService.dto.CreateBookingRequest;
import com.node.bookingService.dto.EventAvailabilityResponse;
import com.node.bookingService.dto.EventBookingSummaryDto;
import com.node.bookingService.dto.UserBookingCountsDto;
import com.node.bookingService.model.BookingStatus;
import com.node.bookingService.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        log.info("POST /api/v1/bookings — eventId={}, userId={}", request.getEventId(), request.getUserId());
        BookingResponse response = bookingService.createBooking(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/bookingById/{id}")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable String id) {
        log.debug("GET /api/v1/bookings/{}", id);
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    @GetMapping("/userBookingById/{id}")
    public ResponseEntity<BookingResponseForUser> getUserBookingById(@PathVariable String id) {
        log.debug("GET /api/v1/bookings/{}", id);
        return ResponseEntity.ok(bookingService.getUserBookingById(id));
    }

    @GetMapping("/allBookings")
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        log.debug("GET /api/v1/bookings/allBookings");
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/admin/metrics")
    public ResponseEntity<BookingAdminMetricsDto> getBookingAdminMetrics() {
        log.debug("GET /api/v1/bookings/admin/metrics");
        return ResponseEntity.ok(bookingService.getAdminMetrics());
    }

    @GetMapping("/admin/paged")
    public ResponseEntity<Page<BookingResponse>> getAllBookingsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.debug("GET /api/v1/bookings/admin/paged — page={}, size={}", page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(bookingService.getAllBookingsPaged(pageable));
    }

    @GetMapping("/reference/{reference}")
    public ResponseEntity<BookingResponse> getBookingByReference(@PathVariable String reference) {
        log.debug("GET /api/v1/bookings/reference/{}", reference);
        return ResponseEntity.ok(bookingService.getBookingByReference(reference));
    }

    @GetMapping("/user/{userId}/counts")
    public ResponseEntity<UserBookingCountsDto> getUserBookingCounts(@PathVariable String userId) {
        log.debug("GET /api/v1/bookings/user/{}/counts", userId);
        return ResponseEntity.ok(bookingService.getUserBookingCounts(userId));
    }

    @GetMapping("/user/{userId}/paged")
    public ResponseEntity<Page<BookingResponseForUser>> getBookingsByUserPaged(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.debug("GET /api/v1/bookings/user/{}/paged — page={}, size={}", userId, page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(bookingService.getBookingsByUserPaged(userId, pageable));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BookingResponseForUser>> getBookingsByUser(@PathVariable String userId) {
        log.debug("GET /api/v1/bookings/user/{}", userId);
        return ResponseEntity.ok(bookingService.getBookingsByUser(userId));
    }

    @GetMapping("/event/{eventId}/summary")
    public ResponseEntity<EventBookingSummaryDto> getEventBookingSummary(@PathVariable String eventId) {
        log.debug("GET /api/v1/bookings/event/{}/summary", eventId);
        return ResponseEntity.ok(bookingService.getEventBookingSummary(eventId));
    }

    @GetMapping("/event/{eventId}/paged")
    public ResponseEntity<Page<BookingResponse>> getBookingsByEventPaged(
            @PathVariable String eventId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.debug("GET /api/v1/bookings/event/{}/paged — page={}, size={}", eventId, page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(bookingService.getBookingsByEventPaged(eventId, pageable));
    }

    @GetMapping({"/event/{eventId}", "/event/{eventId}/"})
    public ResponseEntity<List<BookingResponse>> getBookingsByEvent(@PathVariable String eventId) {
        log.debug("GET /api/v1/bookings/event/{}", eventId);
        return ResponseEntity.ok(bookingService.getBookingsByEvent(eventId));
    }

    @GetMapping("/event/{eventId}/status/{status}")
    public ResponseEntity<List<BookingResponse>> getBookingsByEventAndStatus(
            @PathVariable String eventId,
            @PathVariable BookingStatus status) {
        log.debug("GET /api/v1/bookings/event/{}/status/{}", eventId, status);
        return ResponseEntity.ok(bookingService.getBookingsByEventAndStatus(eventId, status));
    }

    @GetMapping("/event/{eventId}/availability")
    public ResponseEntity<EventAvailabilityResponse> getEventAvailability(@PathVariable String eventId) {
        log.debug("GET /api/v1/bookings/event/{}/availability", eventId);
        return ResponseEntity.ok(bookingService.getEventAvailability(eventId));
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<BookingResponse> confirmBooking(@PathVariable String id) {
        log.info("PUT /api/v1/bookings/{}/confirm", id);
        return ResponseEntity.ok(bookingService.confirmBooking(id));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancelBooking(@PathVariable String id) {
        log.info("PUT /api/v1/bookings/{}/cancel", id);
        return ResponseEntity.ok(bookingService.cancelBooking(id));
    }

    @PutMapping("/{id}/checkin")
    public ResponseEntity<BookingResponse> checkInBooking(@PathVariable String id) {
        log.info("PUT /api/v1/bookings/{}/checkin", id);
        return ResponseEntity.ok(bookingService.checkInBooking(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBooking(@PathVariable String id) {
        log.info("DELETE /api/v1/bookings/{}", id);
        bookingService.deleteBooking(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{userId}/{eventId}/cancel")
    public ResponseEntity<Void> cancelBookingByUserIdAndEventId(@PathVariable String userId, @PathVariable String eventId) {
        log.info("DELETE /api/v1/bookings/{}/{}/cancel", userId, eventId);
        bookingService.cancelBookingByUserIdAndEventId(userId, eventId);
        return ResponseEntity.noContent().build();
    }
}
