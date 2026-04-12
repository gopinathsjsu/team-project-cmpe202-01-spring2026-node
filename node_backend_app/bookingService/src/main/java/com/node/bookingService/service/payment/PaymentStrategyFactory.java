package com.node.bookingService.service.payment;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
public class PaymentStrategyFactory {

    private final Map<String, PaymentStrategy> strategies;
    private final String defaultStrategy;

    public PaymentStrategyFactory(
            Map<String, PaymentStrategy> strategies,
            @Value("${booking.payment.strategy:mock}") String defaultStrategy) {
        this.strategies = strategies;
        this.defaultStrategy = defaultStrategy;
        log.info("Payment strategies available: {}, default: '{}'", strategies.keySet(), defaultStrategy);
    }

    public PaymentStrategy getStrategy() {
        return getStrategy(defaultStrategy);
    }

    public PaymentStrategy getStrategy(String providerName) {
        String beanName = providerName.toLowerCase() + "Payment";
        PaymentStrategy strategy = strategies.get(beanName);
        if (strategy == null) {
            log.error("No payment strategy found for provider '{}', falling back to mock", providerName);
            strategy = strategies.get("mockPayment");
        }
        log.debug("Using payment strategy: {}", strategy.getProviderName());
        return strategy;
    }
}
