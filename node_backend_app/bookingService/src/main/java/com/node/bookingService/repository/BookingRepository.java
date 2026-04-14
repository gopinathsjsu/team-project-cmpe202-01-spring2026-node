package com.node.bookingService.repository;

import com.node.bookingService.model.Booking;
import com.node.bookingService.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {

    Optional<Booking> findByBookingReference(String bookingReference);

    List<Booking> findByUserId(String userId);

    List<Booking> findByEventId(String eventId);

    List<Booking> findByEventIdAndStatus(String eventId, BookingStatus status);

    List<Booking> findByUserIdAndStatus(String userId, BookingStatus status);

    @Query("SELECT COALESCE(SUM(bi.quantity), 0) FROM BookingItem bi " +
           "JOIN bi.booking b WHERE b.eventId = :eventId AND b.status IN ('CONFIRMED', 'CHECKED_IN')")
    Integer countConfirmedTicketsForEvent(@Param("eventId") String eventId);

    boolean existsByUserIdAndEventIdAndStatusIn(String userId, String eventId, List<BookingStatus> statuses);

    List<Booking> findByUserIdAndEventId(String userId, String eventId);

    List<Booking> findByBookingIdAndStatusIn(String bookingId, List<BookingStatus> statuses);

    void deleteByBookingId(String bookingId);
}
