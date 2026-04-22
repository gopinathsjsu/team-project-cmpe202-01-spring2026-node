package com.node.bookingService.repository;

import com.node.bookingService.model.Booking;
import com.node.bookingService.model.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, String> {

    Optional<Booking> findByBookingReference(String bookingReference);

    Page<Booking> findByStatusNot(BookingStatus status, Pageable pageable);

    long countByStatusNot(BookingStatus status);

    long countByStatus(BookingStatus status);

    List<Booking> findByUserId(String userId);

    Page<Booking> findByUserId(String userId, Pageable pageable);

    List<Booking> findByEventId(String eventId);

    Page<Booking> findByEventId(String eventId, Pageable pageable);

    long countByEventIdAndStatusIn(String eventId, Collection<BookingStatus> statuses);

    long countByEventIdAndStatus(String eventId, BookingStatus status);

    @Query("SELECT COALESCE(SUM(b.quantity), 0) FROM Booking b WHERE b.eventId = :eventId AND b.status IN ('CONFIRMED', 'CHECKED_IN')")
    Integer sumConfirmedQuantityForEvent(@Param("eventId") String eventId);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Booking b WHERE b.eventId = :eventId AND b.status IN ('CONFIRMED', 'CHECKED_IN')")
    BigDecimal sumConfirmedAmountForEvent(@Param("eventId") String eventId);

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
