package com.node.bookingService.service;

import com.node.bookingService.dto.*;
import com.node.bookingService.model.BookingStatus;

import java.util.List;

public interface BookingService {

    BookingResponse createBooking(CreateBookingRequest request);

    List<BookingResponse> getAllBookings();

    BookingResponse getBookingById(String bookingId);

    BookingResponseForUser getUserBookingById(String bookingId);

    BookingResponse getBookingByReference(String reference);

    List<BookingResponseForUser> getBookingsByUser(String userId);

    List<BookingResponse> getBookingsByEvent(String eventId);

    BookingResponse confirmBooking(String bookingId);

    BookingResponse cancelBooking(String bookingId);

    BookingResponse checkInBooking(String bookingId);

    List<BookingResponse> getBookingsByEventAndStatus(String eventId, BookingStatus status);

    EventAvailabilityResponse getEventAvailability(String eventId);

    void cancelBookingByUserIdAndEventId(String userId, String eventId);

    void deleteBooking(String bookingId);
}
