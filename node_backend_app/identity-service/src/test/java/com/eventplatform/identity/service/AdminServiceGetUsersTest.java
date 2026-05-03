package com.eventplatform.identity.service;

import com.eventplatform.identity.client.EventServiceClient;
import com.eventplatform.identity.dto.response.PagedUsersResponse;
import com.eventplatform.identity.entity.Role;
import com.eventplatform.identity.entity.User;
import com.eventplatform.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceGetUsersTest {

    @Mock
    private EventServiceClient eventServiceClient;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AdminService adminService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .id(UUID.fromString("11111111-1111-1111-1111-111111111111"))
                .email("organizer@test.com")
                .passwordHash("hash")
                .username("orguser")
                .firstName("Casey")
                .lastName("Organizer")
                .role(Role.ORGANIZER)
                .isActive(true)
                .build();
    }

    @Test
    void getAllUsers_mapsRepositoryPageIntoPagedUsersResponse() {
        PageImpl<User> page = new PageImpl<>(List.of(sampleUser),
                PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt")), 1);
        when(userRepository.findFiltered(isNull(), isNull(), any(Pageable.class))).thenReturn(page);

        PagedUsersResponse result = adminService.getAllUsers(0, 10, null, null);

        assertThat(result.getPage()).isZero();
        assertThat(result.getSize()).isEqualTo(10);
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getTotalPages()).isEqualTo(1);
        assertThat(result.isHasNext()).isFalse();
        assertThat(result.getUsers()).hasSize(1);
        assertThat(result.getUsers().get(0).getEmail()).isEqualTo("organizer@test.com");
        assertThat(result.getUsers().get(0).getFirstName()).isEqualTo("Casey");
        assertThat(result.getUsers().get(0).getLastName()).isEqualTo("Organizer");
        assertThat(result.getUsers().get(0).getUsername()).isEqualTo("orguser");
        assertThat(result.getUsers().get(0).getRole()).isEqualTo(Role.ORGANIZER);
    }

    @Test
    void getAllUsers_passesParsedOrganizerRoleToRepository() {
        when(userRepository.findFiltered(eq(Role.ORGANIZER), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleUser), PageRequest.of(0, 5), 1));

        adminService.getAllUsers(0, 5, "organizer", null);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(userRepository).findFiltered(eq(Role.ORGANIZER), isNull(), pageableCaptor.capture());
        Pageable pb = pageableCaptor.getValue();
        assertThat(pb.getPageSize()).isEqualTo(5);
    }

    @Test
    void getAllUsers_invalidRolePassesNullRoleFilterToRepository() {
        when(userRepository.findFiltered(isNull(), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        adminService.getAllUsers(0, 10, "not-a-real-role", null);

        verify(userRepository).findFiltered(isNull(), isNull(), any(Pageable.class));
    }

    @Test
    void getAllUsers_buildsEmailContainsPatternForQuery() {
        when(userRepository.findFiltered(isNull(), eq("%acme.com%"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        adminService.getAllUsers(0, 10, null, "  Acme.Com  ");

        verify(userRepository).findFiltered(isNull(), eq("%acme.com%"), any(Pageable.class));
    }

    @Test
    void getAllUsers_blankEmailQueryPassesNullPattern() {
        when(userRepository.findFiltered(isNull(), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        adminService.getAllUsers(0, 10, null, "   ");

        verify(userRepository).findFiltered(isNull(), isNull(), any(Pageable.class));
    }

    @Test
    void getAllUsers_stripsSqlWildcardsFromEmailFragment() {
        when(userRepository.findFiltered(isNull(), eq("%alice%"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0));

        adminService.getAllUsers(0, 10, null, "%ali_ce%");

        verify(userRepository).findFiltered(isNull(), eq("%alice%"), any(Pageable.class));
    }
}
