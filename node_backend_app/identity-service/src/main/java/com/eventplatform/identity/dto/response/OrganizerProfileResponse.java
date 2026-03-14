package com.eventplatform.identity.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizerProfileResponse {
    private UUID userId;
    private String displayName;
    private String bio;
    private String websiteUrl;
    private String contactEmail;
    private String instagramUrl;
}
