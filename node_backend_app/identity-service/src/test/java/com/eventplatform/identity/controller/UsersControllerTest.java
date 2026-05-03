package com.eventplatform.identity.controller;

import com.eventplatform.identity.dto.response.UserResponse;
import com.eventplatform.identity.entity.Role;
import com.eventplatform.identity.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsersControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UsersController usersController;

    @Test
    void getUserById_returnsOkAndDelegatesToService() {
        UUID id = UUID.fromString("6ba7b810-9dad-11d1-80b4-00c04fd430c8");
        UserResponse body = UserResponse.builder()
                .id(id)
                .email("organizer@test.com")
                .username("org1")
                .firstName("Org")
                .lastName("User")
                .active(true)
                .role(Role.ORGANIZER)
                .build();
        when(userService.getUserById(id)).thenReturn(body);

        ResponseEntity<UserResponse> response = usersController.getUserById(id);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(body);
        verify(userService).getUserById(id);
    }

    @Test
    void getUserByEmail_returnsOkAndDelegatesToService() {
        UserResponse body = UserResponse.builder()
                .id(UUID.randomUUID())
                .email("x@company.org")
                .active(true)
                .role(Role.ATTENDEE)
                .build();
        when(userService.getUserByEmail("x@company.org")).thenReturn(body);

        ResponseEntity<UserResponse> response =
                usersController.getUserByEmail("x@company.org");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEqualTo(body);
        verify(userService).getUserByEmail("x@company.org");
    }
}
