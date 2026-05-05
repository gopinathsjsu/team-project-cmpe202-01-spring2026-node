package com.node.notificationService.events;

/**
 * Marker for notification payloads carried over Kafka. Polymorphism on the wire is
 * handled by Spring Kafka's `__TypeId__` header (set by the producer-side
 * JsonSerializer, resolved against `spring.json.trusted.packages` on the consumer)
 * — there is no JSON-body discriminator. Annotating this interface with
 * @JsonTypeInfo would make Jackson demand a `"type"` property in the body and
 * fail every deserialize, so it is intentionally absent.
 *
 * The sealed `permits` clause is kept for exhaustive `instanceof` switches in
 * NotificationConsumer; it has no effect on serialization.
 */
public sealed interface NotificationEvent
    permits BookingConfirmedEvent, BookingPendingEvent, BookingCancelledEvent, NewEventPublishedEvent, BookingReminderEvent {
}
