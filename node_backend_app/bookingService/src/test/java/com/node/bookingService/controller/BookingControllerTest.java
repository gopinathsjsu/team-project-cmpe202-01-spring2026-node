package com.node.bookingService.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.node.bookingService.dto.BookingAdminMetricsDto;
import com.node.bookingService.dto.BookingResponse;
import com.node.bookingService.dto.BookingResponseForUser;
import com.node.bookingService.dto.CreateBookingRequest;
import com.node.bookingService.dto.EventAvailabilityResponse;
import com.node.bookingService.dto.EventBookingSummaryDto;
import com.node.bookingService.dto.UserBookingCountsDto;
import com.node.bookingService.model.BookingStatus;
import com.node.bookingService.service.BookingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = BookingController.class)
@AutoConfigureMockMvc(addFilters = false)
class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BookingService bookingService;

    @Test
    void createBookingReturnsCreated() throws Exception {
        CreateBookingRequest request = new CreateBookingRequest();
        request.setEventId("event-1");
        request.setUserId("user-1");
        request.setQuantity(2);
        request.setPaymentMethod("CARD");

        when(bookingService.createBooking(any(CreateBookingRequest.class))).thenReturn(mock(BookingResponse.class));

        mockMvc.perform(post("/api/v1/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void getBookingByIdReturnsOk() throws Exception {
        when(bookingService.getBookingById("booking-1")).thenReturn(mock(BookingResponse.class));

        mockMvc.perform(get("/api/v1/bookings/bookingById/booking-1"))
                .andExpect(status().isOk());
    }

    @Test
    void getUserBookingByIdReturnsOk() throws Exception {
        when(bookingService.getUserBookingById("booking-1")).thenReturn(mock(BookingResponseForUser.class));

        mockMvc.perform(get("/api/v1/bookings/userBookingById/booking-1"))
                .andExpect(status().isOk());
    }

    @Test
    void getAllBookingsReturnsOk() throws Exception {
        when(bookingService.getAllBookings()).thenReturn(List.of(mock(BookingResponse.class)));

        mockMvc.perform(get("/api/v1/bookings/allBookings"))
                .andExpect(status().isOk());
    }

    @Test
    void getBookingAdminMetricsReturnsOk() throws Exception {
        when(bookingService.getAdminMetrics()).thenReturn(mock(BookingAdminMetricsDto.class));

        mockMvc.perform(get("/api/v1/bookings/admin/metrics"))
                .andExpect(status().isOk());
    }

    @Test
    void getAllBookingsPagedReturnsOk() throws Exception {
        when(bookingService.getAllBookingsPaged(any())).thenReturn(new PageImpl<>(List.of(mock(BookingResponse.class))));

        mockMvc.perform(get("/api/v1/bookings/admin/paged")
                        .param("page", "1")
                        .param("size", "5"))
                .andExpect(status().isOk());
    }

    @Test
    void getBookingByReferenceReturnsOk() throws Exception {
        when(bookingService.getBookingByReference("ref-1")).thenReturn(mock(BookingResponse.class));

        mockMvc.perform(get("/api/v1/bookings/reference/ref-1"))
                .andExpect(status().isOk());
    }

    @Test
    void getUserBookingCountsReturnsOk() throws Exception {
        when(bookingService.getUserBookingCounts("user-1")).thenReturn(mock(UserBookingCountsDto.class));

        mockMvc.perform(get("/api/v1/bookings/user/user-1/counts"))
                .andExpect(status().isOk());
    }

    @Test
    void getBookingsByUserPagedReturnsOk() throws Exception {
        when(bookingService.getBookingsByUserPaged(eq("user-1"), any()))
                .thenReturn(new PageImpl<>(List.of(mock(BookingResponseForUser.class))));

        mockMvc.perform(get("/api/v1/bookings/user/user-1/paged")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk());
    }

    @Test
    void getBookingsByUserReturnsOk() throws Exception {
        when(bookingService.getBookingsByUser("user-1")).thenReturn(List.of(mock(BookingResponseForUser.class)));

        mockMvc.perform(get("/api/v1/bookings/user/user-1"))
                .andExpect(status().isOk());
    }

    @Test
    void getEventBookingSummaryReturnsOk() throws Exception {
        when(bookingService.getEventBookingSummary("event-1")).thenReturn(mock(EventBookingSummaryDto.class));

        mockMvc.perform(get("/api/v1/bookings/event/event-1/summary"))
                .andExpect(status().isOk());
    }

    @Test
    void getBookingsByEventPagedReturnsOk() throws Exception {
        when(bookingService.getBookingsByEventPaged(eq("event-1"), any()))
                .thenReturn(new PageImpl<>(List.of(mock(BookingResponse.class))));

        mockMvc.perform(get("/api/v1/bookings/event/event-1/paged")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk());
    }

    @Test
    void getBookingsByEventReturnsOk() throws Exception {
        when(bookingService.getBookingsByEvent("event-1")).thenReturn(List.of(mock(BookingResponse.class)));

        mockMvc.perform(get("/api/v1/bookings/event/event-1"))
                .andExpect(status().isOk());
    }

    @Test
    void getBookingsByEventAndStatusReturnsOk() throws Exception {
        when(bookingService.getBookingsByEventAndStatus("event-1", BookingStatus.CONFIRMED))
                .thenReturn(List.of(mock(BookingResponse.class)));

        mockMvc.perform(get("/api/v1/bookings/event/event-1/status/CONFIRMED"))
                .andExpect(status().isOk());
    }

    @Test
    void getEventAvailabilityReturnsOk() throws Exception {
        when(bookingService.getEventAvailability("event-1")).thenReturn(mock(EventAvailabilityResponse.class));

        mockMvc.perform(get("/api/v1/bookings/event/event-1/availability"))
                .andExpect(status().isOk());
    }

    @Test
    void confirmBookingReturnsOk() throws Exception {
        when(bookingService.confirmBooking("booking-1")).thenReturn(mock(BookingResponse.class));

        mockMvc.perform(put("/api/v1/bookings/booking-1/confirm"))
                .andExpect(status().isOk());
    }

    @Test
    void cancelBookingReturnsOk() throws Exception {
        when(bookingService.cancelBooking("booking-1")).thenReturn(mock(BookingResponse.class));

        mockMvc.perform(put("/api/v1/bookings/booking-1/cancel"))
                .andExpect(status().isOk());
    }

    @Test
    void checkInBookingReturnsOk() throws Exception {
        when(bookingService.checkInBooking("booking-1")).thenReturn(mock(BookingResponse.class));

        mockMvc.perform(put("/api/v1/bookings/booking-1/checkin"))
                .andExpect(status().isOk());
    }

    @Test
    void deleteBookingReturnsNoContent() throws Exception {
        doNothing().when(bookingService).deleteBooking("booking-1");

        mockMvc.perform(delete("/api/v1/bookings/booking-1"))
                .andExpect(status().isNoContent());

        verify(bookingService).deleteBooking("booking-1");
    }

    @Test
    void cancelBookingByUserIdAndEventIdReturnsNoContent() throws Exception {
        doNothing().when(bookingService).cancelBookingByUserIdAndEventId("user-1", "event-1");

        mockMvc.perform(put("/api/v1/bookings/user-1/event-1/cancel"))
                .andExpect(status().isNoContent());

        verify(bookingService).cancelBookingByUserIdAndEventId("user-1", "event-1");
    }
}
