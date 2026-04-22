package com.node.bookingService.service.payment;

import com.node.bookingService.dto.PaymentRequest;
import com.node.bookingService.dto.PaymentResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@Component("mockPayment")
public class MockPaymentStrategy implements PaymentStrategy {

    @Override
    public PaymentResult processPayment(PaymentRequest request) {
        log.info("[MockPayment] Processing payment: booking={}, amount={} {}, user={}",
                request.getBookingReference(), request.getAmount(), request.getCurrency(), request.getUserEmail());

        String txnId = "MOCK-TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        log.info("[MockPayment] Payment successful: txnId={}", txnId);
        return PaymentResult.builder()
                .success(true)
                .transactionId(txnId)
                .provider(getProviderName())
                .message("Mock payment processed successfully")
                .build();
    }

    @Override
    public PaymentResult processRefund(String transactionId, BigDecimal amount) {
        log.info("[MockPayment] Processing refund: txnId={}, amount={}", transactionId, amount);

        String refundId = "MOCK-REFUND-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        log.info("[MockPayment] Refund successful: refundId={}", refundId);
        return PaymentResult.builder()
                .success(true)
                .transactionId(refundId)
                .provider(getProviderName())
                .message("Mock refund processed successfully")
                .build();
    }

    @Override
    public String getProviderName() {
        return "MOCK";
    }
}
