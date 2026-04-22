package com.node.bookingService.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PaymentRequest {
    private String bookingReference;
    private String userId;
    private String userEmail;
    private BigDecimal amount;
    private String currency;
    private String description;
}
