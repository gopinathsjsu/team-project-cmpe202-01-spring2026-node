package com.eventplatform.identity.controller;

import com.eventplatform.identity.dto.request.UpdateProfileRequest;
import com.eventplatform.identity.dto.response.ProfileResponse;
import com.eventplatform.identity.security.UserPrincipal;
import com.eventplatform.identity.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
@Tag(name = "Profile", description = "User profile management")
public class ProfileController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ProfileResponse> getMyProfile(@AuthenticationPrincipal UserPrincipal principal) {
        ProfileResponse response = userService.getProfile(principal.getId());
        return ResponseEntity.ok(response);
    }

    @PatchMapping
    @Operation(summary = "Update current user profile")
    public ResponseEntity<ProfileResponse> updateMyProfile(@AuthenticationPrincipal UserPrincipal principal,
                                                            @Valid @RequestBody UpdateProfileRequest request) {
        ProfileResponse response = userService.updateProfile(principal.getId(), request);
        return ResponseEntity.ok(response);
    }
}
