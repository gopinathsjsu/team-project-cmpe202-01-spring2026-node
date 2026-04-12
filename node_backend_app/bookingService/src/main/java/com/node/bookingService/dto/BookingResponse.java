package com.node.bookingService.dto;

import com.node.bookingService.model.BookingStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
public class BookingResponse {
    private String bookingId;
    private String bookingReference;
    private String eventId;
    private String userId;
    private String userEmail;
    private BookingStatus status;
    private List<String> allowedTransitions;
    private BigDecimal totalAmount;
    private String paymentMethod;
    private String paymentTransactionId;
    //private List<BookingItemResponse> items;
    private String ticketType;
    private Integer quantity;
    private Instant createdAt;
    private Instant updatedAt;
}
