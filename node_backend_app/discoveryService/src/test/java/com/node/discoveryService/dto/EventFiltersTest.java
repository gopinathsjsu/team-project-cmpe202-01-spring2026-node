package com.node.discoveryService.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EventFiltersTest {

    @Test
    @DisplayName("PriceType.from is lenient: null/blank/unknown -> ALL")
    void priceTypeLenientParsing() {
        assertEquals(EventFilters.PriceType.ALL, EventFilters.PriceType.from(null));
        assertEquals(EventFilters.PriceType.ALL, EventFilters.PriceType.from(""));
        assertEquals(EventFilters.PriceType.ALL, EventFilters.PriceType.from("   "));
        assertEquals(EventFilters.PriceType.ALL, EventFilters.PriceType.from("nonsense"));
    }

    @Test
    @DisplayName("PriceType.from accepts mixed case and whitespace")
    void priceTypeAcceptsMixedCase() {
        assertEquals(EventFilters.PriceType.FREE, EventFilters.PriceType.from("free"));
        assertEquals(EventFilters.PriceType.FREE, EventFilters.PriceType.from(" Free "));
        assertEquals(EventFilters.PriceType.PAID, EventFilters.PriceType.from("PAID"));
        assertEquals(EventFilters.PriceType.ALL, EventFilters.PriceType.from("all"));
    }

    @Test
    @DisplayName("hasGeoFilter requires lat, lng, and a positive radius")
    void hasGeoFilterRequiresAllThree() {
        EventFilters f = new EventFilters();
        assertFalse(f.hasGeoFilter());

        f.setLat(37.0);
        f.setLng(-122.0);
        assertFalse(f.hasGeoFilter());

        f.setRadiusKm(0.0);
        assertFalse(f.hasGeoFilter());

        f.setRadiusKm(5.0);
        assertTrue(f.hasGeoFilter());
    }
}
