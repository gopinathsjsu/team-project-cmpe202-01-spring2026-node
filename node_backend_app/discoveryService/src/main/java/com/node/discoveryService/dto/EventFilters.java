package com.node.discoveryService.dto;

import com.node.discoveryService.model.EventStatus;

import java.time.Instant;

/**
 * Query parameters accepted by the public browse-events endpoint. All fields
 * are optional; nulls / blanks mean "do not apply this filter".
 */
public class EventFilters {
    private String q;
    private String locationText;
    private Double lat;
    private Double lng;
    private Double radiusKm;
    private Instant dateFrom;
    private Instant dateTo;
    private PriceType priceType;
    private String category;
    private EventStatus status;
    private boolean futureOnly;

    public String getQ() {
        return q;
    }

    public void setQ(String q) {
        this.q = q;
    }

    public String getLocationText() {
        return locationText;
    }

    public void setLocationText(String locationText) {
        this.locationText = locationText;
    }

    public Double getLat() {
        return lat;
    }

    public void setLat(Double lat) {
        this.lat = lat;
    }

    public Double getLng() {
        return lng;
    }

    public void setLng(Double lng) {
        this.lng = lng;
    }

    public Double getRadiusKm() {
        return radiusKm;
    }

    public void setRadiusKm(Double radiusKm) {
        this.radiusKm = radiusKm;
    }

    public Instant getDateFrom() {
        return dateFrom;
    }

    public void setDateFrom(Instant dateFrom) {
        this.dateFrom = dateFrom;
    }

    public Instant getDateTo() {
        return dateTo;
    }

    public void setDateTo(Instant dateTo) {
        this.dateTo = dateTo;
    }

    public PriceType getPriceType() {
        return priceType;
    }

    public void setPriceType(PriceType priceType) {
        this.priceType = priceType;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public EventStatus getStatus() {
        return status;
    }

    public void setStatus(EventStatus status) {
        this.status = status;
    }

    public boolean isFutureOnly() {
        return futureOnly;
    }

    public void setFutureOnly(boolean futureOnly) {
        this.futureOnly = futureOnly;
    }

    public boolean hasGeoFilter() {
        return lat != null && lng != null && radiusKm != null && radiusKm > 0;
    }

    public enum PriceType {
        ALL,
        FREE,
        PAID;

        /** Lenient parsing: blank / null / unknown → ALL. */
        public static PriceType from(String raw) {
            if (raw == null) return ALL;
            String trimmed = raw.trim();
            if (trimmed.isEmpty()) return ALL;
            try {
                return PriceType.valueOf(trimmed.toUpperCase());
            } catch (IllegalArgumentException ex) {
                return ALL;
            }
        }
    }
}
