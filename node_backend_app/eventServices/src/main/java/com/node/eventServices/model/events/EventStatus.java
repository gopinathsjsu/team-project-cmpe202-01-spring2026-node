package com.node.eventServices.model.events;

import java.util.Arrays;
import java.util.stream.Collectors;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonValue;

public enum EventStatus {
    DRAFT,

    @JsonProperty("submitted")
    SUBMITTED,
    APPROVED,
    PUBLISHED,
    REJECTED,
    COMPLETED,
    CANCELLED;

    /**
     * Case-insensitive mapping from a provided string to EventStatus.
     * If input is null or blank, returns DRAFT as a safe default.
     * Throws IllegalArgumentException with a helpful message when the value is invalid.
     */
    @JsonCreator
    public static EventStatus fromString(String value) {
        if (value == null || value.isBlank()) {
            return DRAFT;
        }
        String normalized = value.trim().toUpperCase();
        try {
            return EventStatus.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            String allowed = Arrays.stream(EventStatus.values())
                    .map(Enum::name)
                    .collect(Collectors.joining(", "));
            throw new IllegalArgumentException("Invalid EventStatus '" + value + "'. Allowed values: " + allowed);
        }
    }

    @JsonValue
    public String toValue() {
        return this.name();
    }
}
