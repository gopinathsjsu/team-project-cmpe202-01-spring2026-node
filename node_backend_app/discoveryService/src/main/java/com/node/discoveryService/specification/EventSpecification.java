package com.node.discoveryService.specification;

import com.node.discoveryService.dto.EventFilters;
import com.node.discoveryService.model.Event;
import com.node.discoveryService.model.EventStatus;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public final class EventSpecification {

    private EventSpecification() {}

    public static Specification<Event> withFilters(EventFilters f) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // status: default PUBLISHED so the public browse never leaks drafts.
            EventStatus status = f.getStatus() != null ? f.getStatus() : EventStatus.PUBLISHED;
            predicates.add(cb.equal(root.get("status"), status));

            if (f.isFutureOnly()) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("eventStartInstant"), Instant.now()));
            }

            if (f.getQ() != null && !f.getQ().isBlank()) {
                String like = "%" + f.getQ().trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("eventName")), like);
                Predicate descMatch = cb.like(cb.lower(root.get("eventDescription")), like);

                // Join on eventLocation only if the venue/address text might match;
                // LEFT JOIN so events without a location don't get dropped from name/desc hits.
                var locJoin = root.join("eventLocation", JoinType.LEFT);
                Predicate venueMatch = cb.like(cb.lower(cb.coalesce(locJoin.get("locationName"), "")), like);
                Predicate addrMatch = cb.like(cb.lower(cb.coalesce(locJoin.get("locationAddress"), "")), like);

                predicates.add(cb.or(nameMatch, descMatch, venueMatch, addrMatch));
            }

            // Location filter: prefer spatial search when lat/lng/radius are present;
            // fall back to a textual LIKE on name + address otherwise.
            if (f.hasGeoFilter()) {
                var locJoin = root.join("eventLocation", JoinType.INNER);
                double radiusMeters = f.getRadiusKm() * 1500.0;

                // ST_SetSRID(ST_MakePoint(lng, lat), 4326) — note PostGIS uses (x=lng, y=lat).
                Expression<?> userPoint = cb.function(
                        "ST_SetSRID",
                        Object.class,
                        cb.function("ST_MakePoint", Object.class, cb.literal(f.getLng()), cb.literal(f.getLat())),
                        cb.literal(4326));

                Expression<Double> distance = cb.function(
                        "ST_DistanceSphere",
                        Double.class,
                        locJoin.get("location"),
                        userPoint);

                predicates.add(cb.lessThanOrEqualTo(distance, cb.literal(radiusMeters)));
            } else if (f.getLocationText() != null && !f.getLocationText().isBlank()) {
                var locJoin = root.join("eventLocation", JoinType.LEFT);
                String like = "%" + f.getLocationText().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(cb.coalesce(locJoin.get("locationName"), "")), like),
                        cb.like(cb.lower(cb.coalesce(locJoin.get("locationAddress"), "")), like)));
            }

            if (f.getDateFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("eventStartInstant"), f.getDateFrom()));
            }
            if (f.getDateTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("eventStartInstant"), f.getDateTo()));
            }

            if (f.getPriceType() != null) {
                switch (f.getPriceType()) {
                    case FREE -> predicates.add(cb.or(
                            cb.isNull(root.get("ticketPrice")),
                            cb.equal(root.get("ticketPrice"), BigDecimal.ZERO)));
                    case PAID -> predicates.add(cb.greaterThan(root.get("ticketPrice"), BigDecimal.ZERO));
                    case ALL -> { /* no operation */ }
                }
            }

            if (f.getCategory() != null && !f.getCategory().isBlank()) {
                var catJoin = root.join("categories", JoinType.INNER);
                predicates.add(cb.equal(
                        cb.lower(catJoin.get("categoryName")),
                        f.getCategory().trim().toLowerCase()));
                // Avoid duplicate rows when an event has multiple categories.
                if (query != null) {
                    query.distinct(true);
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
