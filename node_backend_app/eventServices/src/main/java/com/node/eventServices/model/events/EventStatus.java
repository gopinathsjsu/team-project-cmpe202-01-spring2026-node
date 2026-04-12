package com.node.eventServices.model.events;

import java.util.Arrays;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;


/*public class EventStatus {

    String eventId;
    EventStatusInterface currentStatus;

    ApprovedStatus approvedStatus;
    RejectedStatus rejectedStatus;
    PublishedStatus publishedStatus;
    CompletedStatus completedStatus;
    CancelledStatus cancelledStatus;
    DraftStatus draftStatus;
    SubmittedStatus submittedStatus;

    public EventStatus(String eventId) {
        this.eventId = eventId;
        this.draftStatus = new DraftStatus(this);
        this.submittedStatus = new SubmittedStatus(this);
        this.approvedStatus = new ApprovedStatus(this);
        this.rejectedStatus = new RejectedStatus(this);
        this.publishedStatus = new PublishedStatus(this);
        this.completedStatus = new CompletedStatus(this);
        this.cancelledStatus = new CancelledStatus(this);

        this.currentStatus = draftStatus; // Initial status
    }

    public boolean submit() {
        return currentStatus.submitted();
    }
    public boolean cancel() {
        return currentStatus.cancelled();
    }

    public boolean approve() {
        return currentStatus.approved();
    }

    public boolean reject() {
        return currentStatus.rejected();
    }
    public boolean publish() {
        return currentStatus.published();
    }
    public boolean complete() {
        return currentStatus.completed();
    }






    public void setState(String status) {
        switch (status.toUpperCase()) {
            case "DRAFT":
                this.currentStatus = draftStatus;
                break;
            case "SUBMITTED":
                this.currentStatus = submittedStatus;
                break;
            case "APPROVED":
                this.currentStatus = approvedStatus;
                break;
            case "REJECTED":
                this.currentStatus = rejectedStatus;
                break;
            case "PUBLISHED":
                this.currentStatus = publishedStatus;
                break;
            case "COMPLETED":
                this.currentStatus = completedStatus;
                break;
            case "CANCELLED":
                this.currentStatus = cancelledStatus;
                break;
            default:
                throw new IllegalArgumentException("Invalid status: " + status);
        }
        ;
    }

    public boolean changeStatus(String newStatus) {
        switch (newStatus.toUpperCase()) {
            //case "DRAFT" : return currentStatus.submitted();
            case "SUBMITTED":
                return currentStatus.submitted();
            case "APPROVED":
                return currentStatus.approved();
            case "REJECTED":
                return currentStatus.rejected();
            case "PUBLISHED":
                return currentStatus.published();
            case "COMPLETED":
                return currentStatus.completed();
            case "CANCELLED":
                return currentStatus.cancelled();
            default:
                throw new IllegalArgumentException("Invalid status: " + newStatus);
        }


    }

    public String getCurrentStatus() {
        return currentStatus.getClass().getSimpleName().replace("Status", "").toUpperCase();

    }
}*/

public enum EventStatus {
    DRAFT {
        @Override
        public Set<EventStatus> allowedTransitions() {
            return EnumSet.of(SUBMITTED, CANCELLED);
        }
    },
    SUBMITTED {
        @Override
        public Set<EventStatus> allowedTransitions() {
            return EnumSet.of(APPROVED, REJECTED, CANCELLED);
        }
    },
    APPROVED {
        @Override
        public Set<EventStatus> allowedTransitions() {
            return EnumSet.of(PUBLISHED, CANCELLED);
        }
    },
    PUBLISHED {
        @Override
        public Set<EventStatus> allowedTransitions() {
            return EnumSet.of(COMPLETED, CANCELLED);
        }
    },
    REJECTED {
        @Override
        public Set<EventStatus> allowedTransitions() {
            return EnumSet.of(DRAFT);
        }
    },
    COMPLETED {
        @Override
        public Set<EventStatus> allowedTransitions() {
            return EnumSet.noneOf(EventStatus.class);
        }
    },
    CANCELLED {
        @Override
        public Set<EventStatus> allowedTransitions() {
            return EnumSet.noneOf(EventStatus.class);
        }
    };

    public abstract Set<EventStatus> allowedTransitions();

    public boolean canTransitionTo(EventStatus target) {
        return allowedTransitions().contains(target);
    }

    public EventStatus transitionTo(EventStatus target) {
        if (!canTransitionTo(target)) {
            throw new IllegalStateException(
                    "Cannot transition from " + this.name() + " to " + target.name()
                    + ". Allowed transitions: " + allowedTransitions());
        }
        return target;
    }

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
            throw new IllegalArgumentException(
                    "Invalid EventStatus '" + value + "'. Allowed values: " + allowed);
        }
    }

    @JsonValue
    public String toValue() {
        return this.name();
    }
}
