package com.node.bookingService.service.payment;

import com.node.bookingService.dto.PaymentRequest;
import com.node.bookingService.dto.PaymentResult;

import java.math.BigDecimal;

public interface PaymentStrategy {

    PaymentResult processPayment(PaymentRequest request);

    PaymentResult processRefund(String transactionId, BigDecimal amount);

    String getProviderName();
}
