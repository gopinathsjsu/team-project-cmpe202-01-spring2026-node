package com.node.bookingService.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.node.bookingService.dto.CreateTicketTypeRequest;
import com.node.bookingService.dto.TicketTypeItemRequest;
import com.node.bookingService.dto.TicketTypeResponse;
import com.node.bookingService.service.TicketTypeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = TicketTypeController.class)
@AutoConfigureMockMvc(addFilters = false)
class TicketTypeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TicketTypeService ticketTypeService;

    @Test
    void createTicketTypeReturnsCreated() throws Exception {
        CreateTicketTypeRequest request = new CreateTicketTypeRequest();
        request.setEventId("event-1");
        request.setTicketType("VIP");
        request.setPrice(BigDecimal.valueOf(120));
        request.setTotalQuantity(50);

        when(ticketTypeService.createTicketType(any(CreateTicketTypeRequest.class))).thenReturn(mock(TicketTypeResponse.class));

        mockMvc.perform(post("/api/v1/ticket-types")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void assignTicketTypesToEventReturnsCreated() throws Exception {
        TicketTypeItemRequest item = new TicketTypeItemRequest();
        item.setTicketType("GENERAL");
        item.setPrice(BigDecimal.valueOf(40));
        item.setTotalQuantity(200);

        when(ticketTypeService.assignTicketTypesToEvent(any(), any())).thenReturn(List.of(mock(TicketTypeResponse.class)));

        mockMvc.perform(post("/api/v1/ticket-types/event/event-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(item))))
                .andExpect(status().isCreated());
    }

    @Test
    void getTicketTypesByEventReturnsOk() throws Exception {
        when(ticketTypeService.getTicketTypesByEvent("event-1")).thenReturn(List.of(mock(TicketTypeResponse.class)));

        mockMvc.perform(get("/api/v1/ticket-types/event/event-1"))
                .andExpect(status().isOk());
    }

    @Test
    void getTicketTypeByIdReturnsOk() throws Exception {
        when(ticketTypeService.getTicketTypeById("tt-1")).thenReturn(mock(TicketTypeResponse.class));

        mockMvc.perform(get("/api/v1/ticket-types/tt-1"))
                .andExpect(status().isOk());
    }

    @Test
    void updateTicketTypeReturnsOk() throws Exception {
        CreateTicketTypeRequest request = new CreateTicketTypeRequest();
        request.setEventId("event-1");
        request.setTicketType("EARLY_BIRD");
        request.setPrice(BigDecimal.valueOf(25));
        request.setTotalQuantity(150);

        when(ticketTypeService.updateTicketType(any(), any(CreateTicketTypeRequest.class))).thenReturn(mock(TicketTypeResponse.class));

        mockMvc.perform(put("/api/v1/ticket-types/tt-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void deleteTicketTypeReturnsNoContent() throws Exception {
        doNothing().when(ticketTypeService).deleteTicketType("tt-1");

        mockMvc.perform(delete("/api/v1/ticket-types/tt-1"))
                .andExpect(status().isNoContent());

        verify(ticketTypeService).deleteTicketType("tt-1");
    }
}
