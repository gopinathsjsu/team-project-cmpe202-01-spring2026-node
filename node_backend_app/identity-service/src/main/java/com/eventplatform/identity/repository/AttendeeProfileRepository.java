package com.eventplatform.identity.repository;

import com.eventplatform.identity.entity.AttendeeProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AttendeeProfileRepository extends JpaRepository<AttendeeProfile, UUID> {
}
