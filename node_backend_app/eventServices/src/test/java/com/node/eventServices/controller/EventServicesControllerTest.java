// java
package com.node.eventServices.controller;

import com.node.eventServices.dto.EventAdminMetricsDto;
import com.node.eventServices.dto.EventInfoDto;
import com.node.eventServices.dto.OrganizerEventSummaryDto;
import com.node.eventServices.dto.TicketTypeResponse;
import com.node.eventServices.model.events.Events;
import com.node.eventServices.service.EventManagementService;
import com.node.eventServices.utils.MapperUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.json.JacksonTester;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EventServicesController.class)
class EventServicesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EventManagementService eventManagementService;

    @MockBean
    private MapperUtils mapper;

    @Test
    @DisplayName("POST /api/v1/events -> 201")
    void createEvent() throws Exception {
        Events event = Mockito.mock(Events.class);
        EventInfoDto created = Mockito.mock(EventInfoDto.class);
        when(mapper.convertCreateEventDtoToEvent(any())).thenReturn(event);
        when(eventManagementService.createEvent(event)).thenReturn(created);

        mockMvc.perform(post("/api/v1/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "eventName": "Spring Fest",
                                  "eventStartInstant": "2026-05-01T10:00:00Z",
                                  "eventOwnerId": "123e4567-e89b-12d3-a456-426614174000"
                                }
                                """))
                .andExpect(status().isCreated());

        verify(mapper).convertCreateEventDtoToEvent(any());
        verify(eventManagementService).createEvent(event);
    }

    @Test
    @DisplayName("GET /api/v1/events/{id} - found -> 200")
    void getEventById_found() throws Exception {
        EventInfoDto dto = Mockito.mock(EventInfoDto.class);
        when(eventManagementService.getEventById("1")).thenReturn(Optional.of(dto));

        mockMvc.perform(get("/api/v1/events/1"))
                .andExpect(status().isOk());

        verify(eventManagementService).getEventById("1");
    }

    @Test
    @DisplayName("GET /api/v1/events/{id} - not found -> 404")
    void getEventById_notFound() throws Exception {
        when(eventManagementService.getEventById("42")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/events/42"))
                .andExpect(status().isNotFound());

        verify(eventManagementService).getEventById("42");
    }

    @Test
    @DisplayName("GET /api/v1/events - returns list -> 200")
    void getAllEvents() throws Exception {
        EventInfoDto dto = Mockito.mock(EventInfoDto.class);
        when(eventManagementService.getAllEvents()).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/v1/events"))
                .andExpect(status().isOk());

        verify(eventManagementService).getAllEvents();
    }

    @Test
    @DisplayName("GET /api/v1/events/admin/metrics -> 200")
    void getAdminMetrics() throws Exception {
        EventAdminMetricsDto metrics = Mockito.mock(EventAdminMetricsDto.class);
        when(eventManagementService.getAdminMetrics()).thenReturn(metrics);

        mockMvc.perform(get("/api/v1/events/admin/metrics"))
                .andExpect(status().isOk());

        verify(eventManagementService).getAdminMetrics();
    }

    @Test
    @DisplayName("GET /api/v1/events/admin/paged -> 200")
    void getAdminEventsPaged() throws Exception {
        EventInfoDto dto = Mockito.mock(EventInfoDto.class);
        when(eventManagementService.getAdminEventsPage(any(), anyString(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(dto)));

        mockMvc.perform(get("/api/v1/events/admin/paged")
                        .param("status", "PUBLISHED")
                        .param("q", "term")
                        .param("page", "0")
                        .param("size", "5"))
                .andExpect(status().isOk());

        verify(eventManagementService).getAdminEventsPage(any(), eq("term"), any(Pageable.class));
    }

    @Test
    @DisplayName("GET /api/v1/events/activeEvents -> 200")
    void getAllActiveEvents() throws Exception {
        EventInfoDto dto = Mockito.mock(EventInfoDto.class);
        when(eventManagementService.getAllActiveEvents()).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/v1/events/activeEvents"))
                .andExpect(status().isOk());

        verify(eventManagementService).getAllActiveEvents();
    }

    @Test
    @DisplayName("GET /api/v1/events/activeEvents/paged -> 200")
    void getActiveEventsPaged() throws Exception {
        EventInfoDto dto = Mockito.mock(EventInfoDto.class);
        when(eventManagementService.getActiveEventsPage(anyString(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(dto)));

        mockMvc.perform(get("/api/v1/events/activeEvents/paged")
                        .param("q", "search")
                        .param("page", "1")
                        .param("size", "12"))
                .andExpect(status().isOk());

        verify(eventManagementService).getActiveEventsPage(eq("search"), any(Pageable.class));
    }

    @Test
    @DisplayName("GET /api/v1/events/filter -> 200")
    void getEventsByDateAndStatus() throws Exception {
        EventInfoDto dto = Mockito.mock(EventInfoDto.class);
        when(eventManagementService.getAllEventsWithDateAndStatus(anyString(), any(Instant.class)))
                .thenReturn(List.of(dto));

        String now = Instant.now().toString();
        mockMvc.perform(get("/api/v1/events/filter")
                        .param("status", "PUBLISHED")
                        .param("after", now))
                .andExpect(status().isOk());

        verify(eventManagementService).getAllEventsWithDateAndStatus(eq("PUBLISHED"), any(Instant.class));
    }

    @Test
    @DisplayName("DELETE /api/v1/events/{id} -> 204")
    void deleteEvent() throws Exception {
        doNothing().when(eventManagementService).deleteEvent("abc");

        mockMvc.perform(delete("/api/v1/events/abc"))
                .andExpect(status().isNoContent());

        verify(eventManagementService).deleteEvent("abc");
    }

    @Test
    @DisplayName("DELETE /api/v1/events/all -> 204")
    void deleteAllEvents() throws Exception {
        doNothing().when(eventManagementService).deleteAllEvent();

        mockMvc.perform(delete("/api/v1/events/all"))
                .andExpect(status().isNoContent());

        verify(eventManagementService).deleteAllEvent();
    }

    @Test
    @DisplayName("PUT /api/v1/events/{id} -> 200")
    void updateEvent() throws Exception {
        Events event = Mockito.mock(Events.class);
        EventInfoDto updated = Mockito.mock(EventInfoDto.class);
        when(mapper.convertCreateEventDtoToEvent(any())).thenReturn(event);
        when(eventManagementService.updateEvent("evt1", event)).thenReturn(updated);

        mockMvc.perform(put("/api/v1/events/evt1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "eventName": "Updated Event",
                                  "eventStartInstant": "2026-06-15T09:30:00Z",
                                  "eventOwnerId": "123e4567-e89b-12d3-a456-426614174000"
                                }
                                """))
                .andExpect(status().isOk());

        verify(mapper).convertCreateEventDtoToEvent(any());
        verify(eventManagementService).updateEvent("evt1", event);
    }

    @Test
    @DisplayName("GET /api/v1/events/status/{status} -> 200")
    void getEventsByStatus() throws Exception {
        EventInfoDto dto = Mockito.mock(EventInfoDto.class);
        when(eventManagementService.getEventsByStatus("PUBLISHED")).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/v1/events/status/PUBLISHED"))
                .andExpect(status().isOk());

        verify(eventManagementService).getEventsByStatus("PUBLISHED");
    }

    @Test
    @DisplayName("GET /api/v1/events/pending -> delegates to getEventsByStatus(SUBMITTED) -> 200")
    void getPendingEvents() throws Exception {
        EventInfoDto dto = Mockito.mock(EventInfoDto.class);
        when(eventManagementService.getEventsByStatus("SUBMITTED")).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/v1/events/pending"))
                .andExpect(status().isOk());

        verify(eventManagementService).getEventsByStatus("SUBMITTED");
    }

    @Test
    @DisplayName("PUT /api/v1/events/{id}/approve -> 200")
    void approveEvent() throws Exception {
        EventInfoDto dto = Mockito.mock(EventInfoDto.class);
        when(eventManagementService.approveEvent("1", "approverX")).thenReturn(dto);

        mockMvc.perform(put("/api/v1/events/1/approve")
                        .param("approverId", "approverX"))
                .andExpect(status().isOk());

        verify(eventManagementService).approveEvent("1", "approverX");
    }

    @Test
    @DisplayName("PUT /api/v1/events/{id}/reject -> 200")
    void rejectEvent() throws Exception {
        EventInfoDto dto = Mockito.mock(EventInfoDto.class);
        when(eventManagementService.rejectEvent("2", "admin1", "reason")).thenReturn(dto);

        mockMvc.perform(put("/api/v1/events/2/reject")
                        .param("adminId", "admin1")
                        .param("reason", "reason"))
                .andExpect(status().isOk());

        verify(eventManagementService).rejectEvent("2", "admin1", "reason");
    }

    @Test
    @DisplayName("PATCH /api/v1/events/{id}/status -> 200")
    void updateEventStatus() throws Exception {
        EventInfoDto dto = Mockito.mock(EventInfoDto.class);
        when(eventManagementService.updateEventStatus("3", "CANCELLED")).thenReturn(dto);

        mockMvc.perform(patch("/api/v1/events/3/status")
                        .param("status", "CANCELLED"))
                .andExpect(status().isOk());

        verify(eventManagementService).updateEventStatus("3", "CANCELLED");
    }

    @Test
    @DisplayName("GET /api/v1/events/organizer/{organizerId} -> 200")
    void getEventsByOrganizer() throws Exception {
        EventInfoDto dto = Mockito.mock(EventInfoDto.class);
        when(eventManagementService.getEventsByOrganizer("org1")).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/v1/events/organizer/org1"))
                .andExpect(status().isOk());

        verify(eventManagementService).getEventsByOrganizer("org1");
    }

    @Test
    @DisplayName("GET /api/v1/events/organizer/{organizerId}/summary -> 200")
    void getOrganizerSummary() throws Exception {
        Object summaryDto = Mockito.mock(Object.class);
        when(eventManagementService.getOrganizerSummary("org1")).thenReturn((OrganizerEventSummaryDto) summaryDto);

        mockMvc.perform(get("/api/v1/events/organizer/org1/summary"))
                .andExpect(status().isOk());

        verify(eventManagementService).getOrganizerSummary("org1");
    }

    @Test
    @DisplayName("GET /api/v1/events/organizer/{organizerId}/events/paged -> 200")
    void getOrganizerEventsPaged() throws Exception {
        EventInfoDto dto = Mockito.mock(EventInfoDto.class);
        when(eventManagementService.getOrganizerEventsPage(eq("org1"), eq("all"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(dto)));

        mockMvc.perform(get("/api/v1/events/organizer/org1/events/paged")
                        .param("tab", "all")
                        .param("page", "0")
                        .param("size", "8"))
                .andExpect(status().isOk());

        verify(eventManagementService).getOrganizerEventsPage(eq("org1"), eq("all"), any(Pageable.class));
    }

    @Test
    @DisplayName("GET /api/v1/events/search -> 200")
    void searchEvents() throws Exception {
        EventInfoDto dto = Mockito.mock(EventInfoDto.class);
        when(eventManagementService.searchEvents("concert")).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/v1/events/search")
                        .param("name", "concert"))
                .andExpect(status().isOk());

        verify(eventManagementService).searchEvents("concert");
    }

    @Test
    @DisplayName("GET /api/v1/events/organizer/{organizerId}/status/{status} -> 200")
    void getEventsByOrganizerAndStatus() throws Exception {
        EventInfoDto dto = Mockito.mock(EventInfoDto.class);
        when(eventManagementService.getEventsByOrganizerAndStatus("org1", "PUBLISHED")).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/v1/events/organizer/org1/status/PUBLISHED"))
                .andExpect(status().isOk());

        verify(eventManagementService).getEventsByOrganizerAndStatus("org1", "PUBLISHED");
    }

    @Test
    @DisplayName("GET /api/v1/events/ticketType/{eventId} -> 200")
    void getTicketTypesByEvent() throws Exception {
        TicketTypeResponse t = Mockito.mock(TicketTypeResponse.class);
        when(eventManagementService.getTicketTypesByEvent("evt1")).thenReturn(List.of(t));

        mockMvc.perform(get("/api/v1/events/ticketType/evt1"))
                .andExpect(status().isOk());

        verify(eventManagementService).getTicketTypesByEvent("evt1");
    }

    @Test
    @DisplayName("POST /api/v1/events/ticketType/{eventId} -> 201")
    void assignTicketTypesToEvent() throws Exception {
        TicketTypeResponse t = Mockito.mock(TicketTypeResponse.class);
        when(eventManagementService.assignTicketTypesToEvent(eq("evt1"), anyList()))
                .thenReturn(List.of(t));

        mockMvc.perform(post("/api/v1/events/ticketType/evt1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [
                                  {
                                    "ticketType": "General Admission",
                                    "description": "Access to main event",
                                    "price": 49.99,
                                    "totalQuantity": 100,
                                    "waitlistCapacity": 25
                                  }
                                ]
                                """))
                .andExpect(status().isCreated());

        verify(eventManagementService).assignTicketTypesToEvent(eq("evt1"), anyList());
    }
}
