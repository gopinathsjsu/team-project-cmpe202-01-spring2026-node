package com.eventplatform.identity.repository;

import com.eventplatform.identity.entity.OrganizerProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface OrganizerProfileRepository extends JpaRepository<OrganizerProfile, UUID> {
}
