package com.node.bookingService.service.payment;

import com.node.bookingService.dto.PaymentRequest;
import com.node.bookingService.dto.PaymentResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Stripe payment integration placeholder.
 * Replace the mock logic with actual Stripe SDK calls when ready.
 */
@Slf4j
@Component("stripePayment")
public class StripePaymentStrategy implements PaymentStrategy {

    @Override
    public PaymentResult processPayment(PaymentRequest request) {
        log.info("[Stripe] Processing payment: booking={}, amount={} {}",
                request.getBookingReference(), request.getAmount(), request.getCurrency());

        // TODO: Integrate with Stripe PaymentIntent API
        // StripeClient stripe = new StripeClient(apiKey);
        // PaymentIntent intent = stripe.paymentIntents().create(params);

        log.warn("[Stripe] Stripe integration not yet configured — falling back to simulated success");
        return PaymentResult.builder()
                .success(true)
                .transactionId("STRIPE-PLACEHOLDER")
                .provider(getProviderName())
                .message("Stripe payment placeholder — integration pending")
                .build();
    }

    @Override
    public PaymentResult processRefund(String transactionId, BigDecimal amount) {
        log.info("[Stripe] Processing refund: txnId={}, amount={}", transactionId, amount);

        // TODO: Integrate with Stripe Refund API
        log.warn("[Stripe] Stripe refund integration not yet configured");
        return PaymentResult.builder()
                .success(true)
                .transactionId("STRIPE-REFUND-PLACEHOLDER")
                .provider(getProviderName())
                .message("Stripe refund placeholder — integration pending")
                .build();
    }

    @Override
    public String getProviderName() {
        return "STRIPE";
    }
}
