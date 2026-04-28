package com.node.eventServices.controller;

import com.node.eventServices.model.events.EventCategory;
import com.node.eventServices.service.EventCategoryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EventCategoryController.class)
class EventCategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EventCategoryService eventCategoryService;

    @Test
    @DisplayName("GET /api/v1/events/categories -> 200")
    void getAllEventCategories() throws Exception {
        EventCategory category = Mockito.mock(EventCategory.class);
        when(eventCategoryService.getAllEventCategories()).thenReturn(List.of(category));

        mockMvc.perform(get("/api/v1/events/categories"))
                .andExpect(status().isOk());

        verify(eventCategoryService).getAllEventCategories();
    }

    @Test
    @DisplayName("POST /api/v1/events/categories -> 200")
    void addCategory() throws Exception {
        EventCategory saved = Mockito.mock(EventCategory.class);
        when(eventCategoryService.addCategory(any(EventCategory.class))).thenReturn(saved);

        mockMvc.perform(post("/api/v1/events/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "categoryName": "Music",
                                  "categoryDescription": "Concerts and live performances"
                                }
                                """))
                .andExpect(status().isOk());

        verify(eventCategoryService).addCategory(any(EventCategory.class));
    }
}
