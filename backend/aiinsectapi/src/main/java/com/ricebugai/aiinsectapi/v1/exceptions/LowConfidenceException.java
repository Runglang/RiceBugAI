package com.ricebugai.aiinsectapi.v1.exceptions;

public class LowConfidenceException extends RuntimeException {
    public LowConfidenceException(String message) {
        super(message);
    }
}