package com.universidad.redes.domain.exception;

public class PendingAuthenticationException extends RuntimeException {

    public PendingAuthenticationException(String message) {
        super(message);
    }
}
