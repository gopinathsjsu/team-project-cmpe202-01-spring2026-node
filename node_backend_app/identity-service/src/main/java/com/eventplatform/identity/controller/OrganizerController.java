package com.eventplatform.identity.controller;

import com.eventplatform.identity.dto.request.UpdateOrganizerProfileRequest;
import com.eventplatform.identity.dto.response.OrganizerProfileResponse;
import com.eventplatform.identity.security.UserPrincipal;
import com.eventplatform.identity.service.OrganizerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/organizers")
@RequiredArgsConstructor
@Tag(name = "Organizer", description = "Organizer profile management")
public class OrganizerController {

    private final OrganizerService organizerService;

    @GetMapping("/me")
    @Operation(summary = "Get current organizer profile")
    public ResponseEntity<OrganizerProfileResponse> getMyOrganizerProfile(
            @AuthenticationPrincipal UserPrincipal principal) {
        OrganizerProfileResponse response = organizerService.getOrganizerProfile(principal.getId());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    @Operation(summary = "Create or update organizer profile")
    public ResponseEntity<OrganizerProfileResponse> updateMyOrganizerProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateOrganizerProfileRequest request) {
        OrganizerProfileResponse response = organizerService.upsertOrganizerProfile(principal.getId(), request);
        return ResponseEntity.ok(response);
    }
}
