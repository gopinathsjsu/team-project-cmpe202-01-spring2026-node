package com.eventplatform.identity.exception;

public class ExternalServiceException extends RuntimeException {

    public ExternalServiceException(String serviceName, String message) {
        super("External service [" + serviceName + "] error: " + message);
    }

    public ExternalServiceException(String serviceName, String message, Throwable cause) {
        super("External service [" + serviceName + "] error: " + message, cause);
    }
}
