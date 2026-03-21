package com.node.eventServices.exception;

/**
 * Thrown when a requested resource (event, ticket, user) is not found.
 * Results in HTTP 404 with JSON error body.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resource, Long id) {
        super(resource + " not found with id: " + id);
    }
}
