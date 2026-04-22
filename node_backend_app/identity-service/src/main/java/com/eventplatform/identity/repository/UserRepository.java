package com.eventplatform.identity.repository;

import com.eventplatform.identity.entity.User;
import com.eventplatform.identity.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByRole(Role role);

    long countByRoleAndIsActiveTrue(Role role);

    Optional<User> findFirstByRoleOrderByCreatedAtAsc(Role role);

    Page<User> findAll(Pageable pageable);
}
