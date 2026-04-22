package com.node.eventServices.repository;

import com.node.eventServices.model.User.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByUserEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByUserEmail(String email);
    Optional<User> findByUsername(String username);
}
