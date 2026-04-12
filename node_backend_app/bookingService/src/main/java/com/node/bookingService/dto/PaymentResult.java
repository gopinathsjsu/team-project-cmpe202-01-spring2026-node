package com.node.bookingService.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentResult {
    private boolean success;
    private String transactionId;
    private String provider;
    private String message;
    private String failureReason;
}
