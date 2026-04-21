package com.node.bookingService.service;

import com.node.bookingService.dto.*;
import com.node.bookingService.exception.BookingException;
import com.node.bookingService.exception.ResourceNotFoundException;
import com.node.bookingService.model.*;
import com.node.bookingService.repository.BookingRepository;
import com.node.bookingService.repository.TicketTypeRepository;
import com.node.bookingService.dto.PaymentRequest;
import com.node.bookingService.dto.PaymentResult;
import com.node.bookingService.service.payment.PaymentStrategy;
import com.node.bookingService.service.payment.PaymentStrategyFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.node.bookingService.dto.EventLocationDto;
import com.node.bookingService.dto.EventInfoDto;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;

import org.springframework.beans.factory.annotation.Autowired;

@Slf4j
@Service
public class BookingServiceImpl implements BookingService {

    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private TicketTypeRepository ticketTypeRepository;
    @Autowired
    private PaymentStrategyFactory paymentStrategyFactory;
    @Autowired
    private EventServiceClient eventServiceClient;

    @Autowired
    ObjectMapper objectMapper;

    @Override
    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request) {
        log.info("Creating booking: eventId={}, userId={}, quanitity={}, ticketType={}",
                request.getEventId(), request.getUserId(), request.getQuantity(), request.getTicketType());

        if (!eventServiceClient.eventExists(request.getEventId())) {
            log.warn("Booking failed: event id={} not found", request.getEventId());
            throw new ResourceNotFoundException("Event not found with id: " + request.getEventId());
        }

        List<BookingStatus> activeStatuses = List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED);
        if (bookingRepository.existsByUserIdAndEventIdAndStatusIn(
                request.getUserId(), request.getEventId(), activeStatuses)) {
            log.warn("Booking failed: user {} already has an active booking for event {}",
                    request.getUserId(), request.getEventId());
            throw new BookingException("User already has an active booking for this event");
        }

        String bookingRef = generateBookingReference();
        Booking booking = Booking.builder()
                .bookingId(UUID.randomUUID().toString())
                .bookingReference(bookingRef)
                .eventId(request.getEventId())
                .userId(request.getUserId())
                .userEmail(request.getUserEmail())
                .status(BookingStatus.PENDING)
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "mock")
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;

        /*for (BookingItemRequest itemReq : request.getItems()) {
            TicketType ticketType = ticketTypeRepository.findById(itemReq.getTicketTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Ticket type not found with id: " + itemReq.getTicketTypeId()));

            if (!ticketType.getEventId().equals(request.getEventId())) {
                throw new BookingException("Ticket type " + ticketType.getId()
                        + " does not belong to event " + request.getEventId());
            }

            if (!ticketType.hasAvailability(itemReq.getQuantity())) {
                log.warn("Insufficient tickets: type={}, available={}, requested={}",
                        ticketType.getName(), ticketType.getAvailableQuantity(), itemReq.getQuantity());
                throw new BookingException("Insufficient tickets for type '" + ticketType.getName()
                        + "'. Available: " + ticketType.getAvailableQuantity());
            }

            BigDecimal subtotal = ticketType.getPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            BookingItem item = BookingItem.builder()
                    .ticketType(ticketType)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(ticketType.getPrice())
                    .subtotal(subtotal)
                    .build();
            booking.addItem(item);
            totalAmount = totalAmount.add(subtotal);

            ticketType.setSoldQuantity(ticketType.getSoldQuantity() + itemReq.getQuantity());
            ticketTypeRepository.save(ticketType);
            log.debug("Reserved {} tickets of type '{}' for booking {}", itemReq.getQuantity(), ticketType.getName(), bookingRef);
        }*/

        TicketType ticketType = ticketTypeRepository.findByTicketTypeAndEventId(request.getTicketType(), request.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ticket type not found with name: " + request.getTicketType() + " and event id: " + request.getEventId()));

        if (!ticketType.hasAvailability(request.getQuantity())) {
            throw new BookingException("Insufficient tickets for type '" + ticketType.getTicketType()
                    + "'. Available: " + ticketType.getAvailableQuantity());
        }

        ticketType.setSoldQuantity(ticketType.getSoldQuantity() + request.getQuantity());
        log.info("Sold quantity for ticket type id={}: {}", ticketType.getId(), ticketType.getSoldQuantity());
        ticketTypeRepository.save(ticketType);

        BigDecimal subtotal = ticketType.getPrice().multiply(BigDecimal.valueOf(request.getQuantity()));
        totalAmount = totalAmount.add(subtotal);

        booking.setTicketType(ticketType.getTicketType());
        booking.setUnitPrice(ticketType.getPrice());
        booking.setSubtotal(subtotal);
        booking.setQuantity(request.getQuantity());

        booking.setTotalAmount(totalAmount);

        PaymentStrategy paymentStrategy = paymentStrategyFactory.getStrategy(booking.getPaymentMethod());
        PaymentResult paymentResult = paymentStrategy.processPayment(
                PaymentRequest.builder()
                        .bookingReference(bookingRef)
                        .userId(request.getUserId())
                        .userEmail(request.getUserEmail())
                        .amount(totalAmount)
                        .currency("USD")
                        .description("Booking for event " + request.getEventId())
                        .build()
        );

        if (paymentResult.isSuccess()) {
            booking.setPaymentTransactionId(paymentResult.getTransactionId());
            booking.transitionTo(BookingStatus.CONFIRMED);
            log.info("Booking {} confirmed: txnId={}, amount={}", bookingRef, paymentResult.getTransactionId(), totalAmount);
        } else {
            releaseTickets(booking);
            booking.transitionTo(BookingStatus.FAILED);
            log.warn("Booking {} failed: {}", bookingRef, paymentResult.getFailureReason());
        }

        Booking saved = bookingRepository.save(booking);
        return toResponse(saved);
    }

    @Override
    public BookingResponse getBookingById(String bookingId) {
        log.debug("Fetching booking id={}", bookingId);
        return toResponse(findBookingOrThrow(bookingId));
    }

    @Override
    public BookingResponseForUser getUserBookingById(String bookingId) {
        log.debug("Fetching booking id={}", bookingId);
        Booking booking = findBookingOrThrow(bookingId);
        EventInfoDto event = eventServiceClient.getEventById(booking.getEventId());
        return toResponseForUser(booking, event);
    }

    @Override
    public BookingResponse getBookingByReference(String reference) {
        log.debug("Fetching booking ref={}", reference);
        return toResponse(bookingRepository.findByBookingReference(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + reference)));
    }

    @Override
    public List<BookingResponseForUser> getBookingsByUser(String userId) {
        log.debug("Fetching bookings for user id={}", userId);
        List<Booking> bookings = bookingRepository.findByUserId(userId);
        // Collect distinct event IDs to batch-fetch event data and avoid N+1 calls
        List<String> eventIds = bookings.stream().map(Booking::getEventId).distinct().toList();
        //List<EventInfoDto> events = eventServiceClient.getEventsByIds(eventIds);
        return bookings.stream()
                .map(b -> toResponseForUser(b, eventServiceClient.getEventById(b.getEventId())))
                .toList();
    }

    @Override
    public Page<BookingResponseForUser> getBookingsByUserPaged(String userId, Pageable pageable) {
        log.debug("Fetching paged bookings for user id={}", userId);
        return bookingRepository.findByUserId(userId, pageable)
                .map(b -> toResponseForUser(b, eventServiceClient.getEventById(b.getEventId())));
    }

    @Override
    public UserBookingCountsDto getUserBookingCounts(String userId) {
        List<Booking> bookings = bookingRepository.findByUserId(userId);
        long total = bookings.size();
        Instant now = Instant.now();
        Map<String, EventInfoDto> cache = new HashMap<>();
        long upcoming = 0;
        for (Booking b : bookings) {
            EventInfoDto ev = cache.computeIfAbsent(b.getEventId(), eventServiceClient::getEventById);
            if (ev == null || ev.getEventStartInstant() == null) {
                continue;
            }
            if (!ev.getEventStartInstant().isBefore(now)) {
                upcoming++;
            }
        }
        return UserBookingCountsDto.builder()
                .totalBookings(total)
                .upcomingBookings(upcoming)
                .build();
    }

    @Override
    public List<BookingResponse> getAllBookings() {
        log.debug("Fetching all bookings");
        List<Booking> bookings = bookingRepository.findAll();
        
        return bookings.stream()
                .map(this::toResponse)
                .filter(booking -> booking.getStatus() != BookingStatus.CANCELLED)
                .toList();
    }

    @Override
    public Page<BookingResponse> getAllBookingsPaged(Pageable pageable) {
        return bookingRepository.findByStatusNot(BookingStatus.CANCELLED, pageable).map(this::toResponse);
    }

    @Override
    public BookingAdminMetricsDto getAdminMetrics() {
        long total = bookingRepository.countByStatusNot(BookingStatus.CANCELLED);
        long confirmed = bookingRepository.countByStatus(BookingStatus.CONFIRMED)
                + bookingRepository.countByStatus(BookingStatus.CHECKED_IN);
        return BookingAdminMetricsDto.builder()
                .totalBookingsNonCancelled(total)
                .confirmedBookings(confirmed)
                .build();
    }

    @Override
    public List<BookingResponse> getBookingsByEvent(String eventId) {
        log.debug("Fetching bookings for event id={}", eventId);
        return bookingRepository.findByEventId(eventId).stream().map(this::toResponse).toList();
    }

    @Override
    public Page<BookingResponse> getBookingsByEventPaged(String eventId, Pageable pageable) {
        log.debug("Fetching paged bookings for event id={}", eventId);
        return bookingRepository.findByEventId(eventId, pageable).map(this::toResponse);
    }

    @Override
    public EventBookingSummaryDto getEventBookingSummary(String eventId) {
        Integer qty = bookingRepository.sumConfirmedQuantityForEvent(eventId);
        BigDecimal amt = bookingRepository.sumConfirmedAmountForEvent(eventId);
        long confirmedCount = bookingRepository.countByEventIdAndStatusIn(
                eventId, List.of(BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN));
        long cancelledCount = bookingRepository.countByEventIdAndStatus(eventId, BookingStatus.CANCELLED);
        return EventBookingSummaryDto.builder()
                .confirmedBookingCount(confirmedCount)
                .confirmedTicketQuantity(qty != null ? qty : 0)
                .confirmedRevenue(amt != null ? amt : BigDecimal.ZERO)
                .cancelledBookingCount(cancelledCount)
                .build();
    }

    @Override
    @Transactional
    public BookingResponse confirmBooking(String bookingId) {
        Booking booking = findBookingOrThrow(bookingId);
        log.info("Confirming booking id={}, ref={}", bookingId, booking.getBookingReference());

        booking.transitionTo(BookingStatus.CONFIRMED);
        return toResponse(bookingRepository.save(booking));
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(String bookingId) {
        Booking booking = findActiveBookingOrThrow(bookingId);
        log.info("Cancelling booking id={}, ref={}", bookingId, booking.getBookingReference());

        BookingStatus previousStatus = booking.getStatus();
        booking.transitionTo(BookingStatus.CANCELLED);
        booking.setCancelledAt(Instant.now());

        releaseTickets(booking);

        if (previousStatus == BookingStatus.CONFIRMED && booking.getPaymentTransactionId() != null) {
            PaymentStrategy strategy = paymentStrategyFactory.getStrategy(booking.getPaymentMethod());
            PaymentResult refundResult = strategy.processRefund(
                    booking.getPaymentTransactionId(), booking.getTotalAmount());

            if (refundResult.isSuccess()) {
                booking.transitionTo(BookingStatus.REFUNDED);
                log.info("Booking {} refunded: refundTxn={}", booking.getBookingReference(), refundResult.getTransactionId());
            } else {
                log.error("Refund failed for booking {}: {}", booking.getBookingReference(), refundResult.getFailureReason());
            }
        }

        return toResponse(bookingRepository.save(booking));
    }

    @Override
    @Transactional
    public BookingResponse checkInBooking(String bookingId) {
        Booking booking = findBookingOrThrow(bookingId);
        log.info("Checking in booking id={}, ref={}", bookingId, booking.getBookingReference());

        booking.transitionTo(BookingStatus.CHECKED_IN);
        return toResponse(bookingRepository.save(booking));
    }

    @Override
    public List<BookingResponse> getBookingsByEventAndStatus(String eventId, BookingStatus status) {
        log.debug("Fetching bookings for event id={}, status={}", eventId, status);
        return bookingRepository.findByEventIdAndStatus(eventId, status).stream()
                .map(this::toResponse).toList();
    }

    @Override
    public EventAvailabilityResponse getEventAvailability(String eventId) {
        log.debug("Fetching availability for event id={}", eventId);
        List<TicketType> ticketTypes = ticketTypeRepository.findByEventId(eventId);
        Integer confirmed = bookingRepository.countConfirmedTicketsForEvent(eventId);

        return EventAvailabilityResponse.builder()
                .eventId(eventId)
                .totalConfirmedTickets(confirmed)
                .ticketTypes(ticketTypes.stream().map(this::toTicketTypeResponse).toList())
                .build();
    }

    private void releaseTickets(Booking booking) {
        TicketType ticketType = ticketTypeRepository.findByTicketTypeAndEventId(booking.getTicketType(), booking.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ticket type not found with name: " + booking.getTicketType()));
        ticketType.setSoldQuantity(Math.max(0, ticketType.getSoldQuantity() - booking.getQuantity()));
        ticketTypeRepository.save(ticketType);
        log.debug("Released {} tickets of type '{}'", booking.getQuantity(), ticketType.getTicketType());
    }

    private Booking findBookingOrThrow(String id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    private Booking findActiveBookingOrThrow(String id) {
        return bookingRepository.findByBookingIdAndStatusIn(id, List.of(BookingStatus.CONFIRMED))
                .stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id + " and status in: " + List.of(BookingStatus.CONFIRMED, BookingStatus.PENDING)));
    }

    private String generateBookingReference() {
        return "BK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    @Override
    public void cancelBookingByUserIdAndEventId(String userId, String eventId) {
        log.info("Cancelling booking for user id={}, event id={}", userId, eventId);
        List<Booking> bookings = bookingRepository.findByUserIdAndEventId(userId, eventId);
        bookings.forEach(booking -> {
            booking.transitionTo(BookingStatus.CANCELLED);
            booking.setCancelledAt(Instant.now());
            bookingRepository.save(booking);
        });
        log.info("Cancelled {} bookings for user id={}, event id={}", bookings.size(), userId, eventId);
    }

    @Override
    @Transactional
    public void deleteBooking(String bookingId) {
        log.info("Deleting booking id={}", bookingId);
        bookingRepository.deleteByBookingId(bookingId);
        log.info("Deleted booking id={}", bookingId);
    }

    private BookingResponse toResponse(Booking booking) {
        log.info("To response: {}", booking);
        List<String> allowed = booking.getStatus().allowedTransitions().stream()
                .map(Enum::name).toList();

        return BookingResponse.builder()
                .bookingId(booking.getBookingId())
                .bookingReference(booking.getBookingReference())
                .eventId(booking.getEventId())
                .userId(booking.getUserId())
                .userEmail(booking.getUserEmail())
                .status(booking.getStatus())
                .allowedTransitions(allowed)
                .totalAmount(booking.getTotalAmount())
                .paymentMethod(booking.getPaymentMethod())
                .paymentTransactionId(booking.getPaymentTransactionId())
                //.items(booking.getItems().stream().map(this::toItemResponse).toList())
                .ticketType(booking.getTicketType())
                .quantity(booking.getQuantity())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }
    private BookingResponseForUser toResponseForUser(Booking booking, EventInfoDto event) {

        log.debug("To response for user: {}", event);

        List<String> allowed = booking.getStatus().allowedTransitions().stream()
                .map(Enum::name).toList();

        System.out.println("eventLocation: " + event.getEventLocation().getLocationName() + " " + event.getEventLocation().getLocationAddress() + " " + event.getEventLocation().getLatitude() + " " + event.getEventLocation().getLongitude());
        String eventDescription = event.getEventDescription();
        String eventImageUrl = event.getImageUrl();

        return BookingResponseForUser.builder()
                .bookingId(booking.getBookingId())
                .bookingReference(booking.getBookingReference())
                .eventId(booking.getEventId())
                .userId(booking.getUserId())
                //.userName(booking.getUserName())
                .userEmail(booking.getUserEmail())
                .status(booking.getStatus())
                .allowedTransitions(allowed)
                .totalAmount(booking.getTotalAmount())
                .paymentMethod(booking.getPaymentMethod())
                .paymentTransactionId(booking.getPaymentTransactionId())
                .eventName(event.getEventName())
                .eventStartInstant(event.getEventStartInstant())
                .eventEndInstant(event.getEventEndInstant())
                //.eventLocation(eventLocation)
                .eventLocation(EventLocationDto.builder()
                        .locationName(event.getEventLocation().getLocationName() != null ? event.getEventLocation().getLocationName() : event.getEventLocation().getLocationAddress())
                        .locationAddress(event.getEventLocation().getLocationAddress() != null ? event.getEventLocation().getLocationAddress() : event.getEventLocation().getLocationName()  )
                        .latitude(event.getEventLocation().getLatitude())
                        .longitude(event.getEventLocation().getLongitude())
                        .build())
                .eventDescription(eventDescription)
                .eventImageUrl(eventImageUrl)

                //.eventWebsite(event.getEventWebsite())
                //.eventContactEmail(event.getEventContactEmail())
                //.eventContactPhone(event.getEventContactPhone())
                .ticketType(booking.getTicketType())
                .quantity(booking.getQuantity())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .eventOwnerName(event.getEventOwnerName())
                .eventOwnerId(event.getEventOwnerId())
                .eventTimeZone(event.getEventTimeZone())
                //.eventPublishInstant(event.getEventPublishInstant())
                //.eventWebsite(event.getEventWebsite())
                //.eventContactEmail(event.getEventContactEmail())
                .build();
    }

    private TicketTypeResponse toTicketTypeResponse(TicketType tt) {
        return TicketTypeResponse.builder()
                .id(tt.getId())
                .eventId(tt.getEventId())
                .ticketType(tt.getTicketType())
                .description(tt.getDescription())
                .price(tt.getPrice())
                .totalQuantity(tt.getTotalQuantity())
                .waitlistCapacity(tt.getWaitlistCapacity())
                .soldQuantity(tt.getSoldQuantity())
                .availableQuantity(tt.getAvailableQuantity())
                .build();
    }

}
