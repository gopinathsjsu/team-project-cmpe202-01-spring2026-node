package com.eventplatform.identity.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrganizerProfileRequest {

    @NotBlank(message = "Display name is required")
    @Size(max = 200, message = "Display name must be at most 200 characters")
    private String displayName;

    private String bio;

    @Size(max = 500, message = "Website URL must be at most 500 characters")
    private String websiteUrl;

    @Email(message = "Must be a valid contact email")
    private String contactEmail;

    @Size(max = 500, message = "Instagram URL must be at most 500 characters")
    private String instagramUrl;
}
