package com.eventplatform.identity.exception;

public class EntityNotFoundException extends RuntimeException {

    public EntityNotFoundException(String entity, Object id) {
        super(entity + " not found with id: " + id);
    }

    public EntityNotFoundException(String message) {
        super(message);
    }
}
