package com.node.discoveryService.controller;

import com.node.discoveryService.dto.EventFilters;
import com.node.discoveryService.model.Event;
import com.node.discoveryService.model.EventStatus;
import com.node.discoveryService.service.EventService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EventController.class)
class EventControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EventService eventService;

    @Test
    @DisplayName("GET /api/v1/discover/events -> 200 with default filters")
    void browseAllEventsDefaults() throws Exception {
        Page<Event> empty = new PageImpl<>(List.of());
        when(eventService.searchAllEvents(any(Pageable.class), any(EventFilters.class))).thenReturn(empty);

        mockMvc.perform(get("/api/v1/discover/events"))
                .andExpect(status().isOk());

        ArgumentCaptor<EventFilters> filterCap = ArgumentCaptor.forClass(EventFilters.class);
        verify(eventService).searchAllEvents(any(Pageable.class), filterCap.capture());
        EventFilters f = filterCap.getValue();
        assertThat(f.getQ()).isNull();
        assertThat(f.getPriceType()).isEqualTo(EventFilters.PriceType.ALL);
        assertThat(f.isFutureOnly()).isTrue();
    }

    @Test
    @DisplayName("priceType=free is parsed leniently to FREE")
    void browseAllEventsParsesPriceType() throws Exception {
        when(eventService.searchAllEvents(any(Pageable.class), any(EventFilters.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/discover/events").param("priceType", "free"))
                .andExpect(status().isOk());

        ArgumentCaptor<EventFilters> filterCap = ArgumentCaptor.forClass(EventFilters.class);
        verify(eventService).searchAllEvents(any(Pageable.class), filterCap.capture());
        assertThat(filterCap.getValue().getPriceType()).isEqualTo(EventFilters.PriceType.FREE);
    }

    @Test
    @DisplayName("Unknown status param falls through to null (defaults to PUBLISHED in spec)")
    void browseAllEventsUnknownStatus() throws Exception {
        when(eventService.searchAllEvents(any(Pageable.class), any(EventFilters.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/discover/events").param("status", "BOGUS"))
                .andExpect(status().isOk());

        ArgumentCaptor<EventFilters> filterCap = ArgumentCaptor.forClass(EventFilters.class);
        verify(eventService).searchAllEvents(any(Pageable.class), filterCap.capture());
        assertThat(filterCap.getValue().getStatus()).isNull();
    }

    @Test
    @DisplayName("Valid status param is parsed to the enum")
    void browseAllEventsValidStatus() throws Exception {
        when(eventService.searchAllEvents(any(Pageable.class), any(EventFilters.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/discover/events").param("status", "approved"))
                .andExpect(status().isOk());

        ArgumentCaptor<EventFilters> filterCap = ArgumentCaptor.forClass(EventFilters.class);
        verify(eventService).searchAllEvents(any(Pageable.class), filterCap.capture());
        assertThat(filterCap.getValue().getStatus()).isEqualTo(EventStatus.APPROVED);
    }

    @Test
    @DisplayName("Geo params (lat/lng/radiusKm) propagate into filters")
    void browseAllEventsGeoFilter() throws Exception {
        when(eventService.searchAllEvents(any(Pageable.class), any(EventFilters.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/discover/events")
                        .param("lat", "37.3382")
                        .param("lng", "-121.8863")
                        .param("radiusKm", "10"))
                .andExpect(status().isOk());

        ArgumentCaptor<EventFilters> filterCap = ArgumentCaptor.forClass(EventFilters.class);
        verify(eventService).searchAllEvents(any(Pageable.class), filterCap.capture());
        EventFilters f = filterCap.getValue();
        assertThat(f.hasGeoFilter()).isTrue();
        assertThat(f.getLat()).isEqualTo(37.3382);
        assertThat(f.getLng()).isEqualTo(-121.8863);
        assertThat(f.getRadiusKm()).isEqualTo(10.0);
    }

    @Test
    @DisplayName("Page size is clamped to <=100 to protect the DB")
    void browseAllEventsClampsPageSize() throws Exception {
        when(eventService.searchAllEvents(any(Pageable.class), any(EventFilters.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/discover/events").param("size", "9999"))
                .andExpect(status().isOk());

        ArgumentCaptor<Pageable> pageCap = ArgumentCaptor.forClass(Pageable.class);
        verify(eventService).searchAllEvents(pageCap.capture(), any(EventFilters.class));
        assertThat(pageCap.getValue().getPageSize()).isEqualTo(100);
    }

    @Test
    @DisplayName("Negative page is clamped to 0")
    void browseAllEventsClampsNegativePage() throws Exception {
        when(eventService.searchAllEvents(any(Pageable.class), any(EventFilters.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/discover/events").param("page", "-5"))
                .andExpect(status().isOk());

        ArgumentCaptor<Pageable> pageCap = ArgumentCaptor.forClass(Pageable.class);
        verify(eventService).searchAllEvents(pageCap.capture(), any(EventFilters.class));
        assertThat(pageCap.getValue().getPageNumber()).isEqualTo(0);
    }

    @Test
    @DisplayName("Unsortable field falls back to default sort (eventStartInstant)")
    void browseAllEventsUnknownSortFallsBack() throws Exception {
        when(eventService.searchAllEvents(any(Pageable.class), any(EventFilters.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/discover/events").param("sortBy", "evilColumn"))
                .andExpect(status().isOk());

        ArgumentCaptor<Pageable> pageCap = ArgumentCaptor.forClass(Pageable.class);
        verify(eventService).searchAllEvents(pageCap.capture(), any(EventFilters.class));
        assertThat(pageCap.getValue().getSort().iterator().next().getProperty())
                .isEqualTo("eventStartInstant");
    }
}
