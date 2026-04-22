package com.node.bookingService.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Min;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBookingRequest {

    @NotNull(message = "Event ID is required")
    private String eventId;

    @NotNull(message = "User ID is required")
    private String userId;

    private String userEmail;

    private String ticketTypeId;

    private String ticketType;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    /*@NotEmpty(message = "At least one ticket item is required")
    @Valid
    private List<BookingItemRequest> items;
    */

    private String paymentMethod;
}
