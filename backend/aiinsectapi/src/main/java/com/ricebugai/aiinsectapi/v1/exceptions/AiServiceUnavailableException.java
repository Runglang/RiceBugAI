package com.ricebugai.aiinsectapi.v1.exceptions;

public class AiServiceUnavailableException extends RuntimeException {
    public AiServiceUnavailableException(String message) {
        super(message);
    }
}