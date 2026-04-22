package com.node.bookingService.model;

import java.util.EnumSet;
import java.util.Set;

public enum BookingStatus {
    PENDING {
        @Override
        public Set<BookingStatus> allowedTransitions() {
            return EnumSet.of(CONFIRMED, CANCELLED, FAILED);
        }
    },
    CONFIRMED {
        @Override
        public Set<BookingStatus> allowedTransitions() {
            return EnumSet.of(CANCELLED, CHECKED_IN);
        }
    },
    CANCELLED {
        @Override
        public Set<BookingStatus> allowedTransitions() {
            return EnumSet.of(REFUNDED);
        }
    },
    REFUNDED {
        @Override
        public Set<BookingStatus> allowedTransitions() {
            return EnumSet.noneOf(BookingStatus.class);
        }
    },
    FAILED {
        @Override
        public Set<BookingStatus> allowedTransitions() {
            return EnumSet.of(PENDING);
        }
    },
    CHECKED_IN {
        @Override
        public Set<BookingStatus> allowedTransitions() {
            return EnumSet.noneOf(BookingStatus.class);
        }
    };

    public abstract Set<BookingStatus> allowedTransitions();

    public boolean canTransitionTo(BookingStatus target) {
        return allowedTransitions().contains(target);
    }

    public BookingStatus transitionTo(BookingStatus target) {
        if (!canTransitionTo(target)) {
            throw new IllegalStateException(
                    "Cannot transition booking from " + this.name() + " to " + target.name()
                    + ". Allowed: " + allowedTransitions());
        }
        return target;
    }
}
