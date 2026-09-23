package com.universidad.redes.infrastructure.adapter.out.facial;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.universidad.redes.application.port.out.facial.FacialIdentityPort;
import com.universidad.redes.domain.exception.FacialCaptureException;
import com.universidad.redes.domain.exception.FacialServiceUnavailableException;
import com.universidad.redes.domain.model.facial.FacialEnrollment;
import com.universidad.redes.domain.model.facial.FacialPreview;
import com.universidad.redes.domain.model.facial.FacialSurveillance;
import com.universidad.redes.domain.model.facial.FacialVerification;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.net.http.HttpClient;
import java.time.Duration;

@Component
public class FacialServiceClientAdapter implements FacialIdentityPort {

    private static final String INTERNAL_TOKEN_HEADER = "X-Internal-Token";

    private final boolean enabled;
    private final String internalToken;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public FacialServiceClientAdapter(
            @Value("${app.face.enabled:false}") boolean enabled,
            @Value("${app.face.base-url:http://127.0.0.1:8090}") String baseUrl,
            @Value("${app.face.internal-token:}") String internalToken,
            ObjectMapper objectMapper
    ) {
        this.enabled = enabled;
        this.internalToken = internalToken;
        this.objectMapper = objectMapper;

        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        JdkClientHttpRequestFactory requestFactory =
                new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(45));

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public boolean isEnrolled(String subjectId) {
        if (!enabled) {
            return false;
        }

        StatusPayload payload = execute(() -> restClient.get()
                .uri("/v1/templates/{subjectId}", subjectId)
                .header(INTERNAL_TOKEN_HEADER, requiredToken())
                .retrieve()
                .body(StatusPayload.class));
        return payload != null && payload.enrolled();
    }

    @Override
    public FacialEnrollment enroll(String subjectId) {
        requireEnabled();
        EnrollmentPayload payload = execute(() -> restClient.post()
                .uri("/v1/templates/{subjectId}/enroll", subjectId)
                .header(INTERNAL_TOKEN_HEADER, requiredToken())
                .retrieve()
                .body(EnrollmentPayload.class));

        if (payload == null) {
            throw unavailable("El servicio facial devolvió una respuesta vacía");
        }
        return new FacialEnrollment(
                payload.enrolled(),
                payload.samples(),
                payload.livenessVerified(),
                payload.message()
        );
    }

    @Override
    public FacialVerification verify(String subjectId) {
        requireEnabled();
        VerificationPayload payload = execute(() -> restClient.post()
                .uri("/v1/templates/{subjectId}/verify", subjectId)
                .header(INTERNAL_TOKEN_HEADER, requiredToken())
                .retrieve()
                .body(VerificationPayload.class));

        if (payload == null) {
            throw unavailable("El servicio facial devolvió una respuesta vacía");
        }
        return new FacialVerification(
                payload.matched(),
                payload.score(),
                payload.livenessVerified(),
                payload.message()
        );
    }

    @Override
    public FacialPreview previewStatus(String subjectId) {
        requireEnabled();
        PreviewPayload payload = execute(() -> restClient.get()
                .uri("/v1/templates/{subjectId}/preview/status", subjectId)
                .header(INTERNAL_TOKEN_HEADER, requiredToken())
                .retrieve()
                .body(PreviewPayload.class));

        if (payload == null) {
            throw unavailable("El servicio facial devolvió un estado vacío");
        }
        return new FacialPreview(
                payload.active(),
                payload.samples(),
                payload.required(),
                payload.faceDetected(),
                payload.livenessVerified(),
                payload.message()
        );
    }

    @Override
    public byte[] previewFrame(String subjectId) {
        requireEnabled();
        return execute(() -> restClient.get()
                .uri("/v1/templates/{subjectId}/preview/frame", subjectId)
                .header(INTERNAL_TOKEN_HEADER, requiredToken())
                .retrieve()
                .body(byte[].class));
    }

    @Override
    public FacialSurveillance startSurveillance(String subjectId) {
        requireEnabled();
        return toSurveillance(execute(() -> restClient.post()
                .uri("/v1/templates/{subjectId}/surveillance/start", subjectId)
                .header(INTERNAL_TOKEN_HEADER, requiredToken())
                .retrieve()
                .body(SurveillancePayload.class)));
    }

    @Override
    public FacialSurveillance surveillanceStatus(String subjectId) {
        requireEnabled();
        return toSurveillance(execute(() -> restClient.get()
                .uri("/v1/templates/{subjectId}/surveillance/status", subjectId)
                .header(INTERNAL_TOKEN_HEADER, requiredToken())
                .retrieve()
                .body(SurveillancePayload.class)));
    }

    @Override
    public byte[] surveillanceFrame(String subjectId) {
        requireEnabled();
        return execute(() -> restClient.get()
                .uri("/v1/templates/{subjectId}/surveillance/frame", subjectId)
                .header(INTERNAL_TOKEN_HEADER, requiredToken())
                .retrieve()
                .body(byte[].class));
    }

    @Override
    public void stopSurveillance(String subjectId) {
        requireEnabled();
        execute(() -> {
            restClient.post()
                    .uri("/v1/templates/{subjectId}/surveillance/stop", subjectId)
                    .header(INTERNAL_TOKEN_HEADER, requiredToken())
                    .retrieve()
                    .toBodilessEntity();
            return null;
        });
    }

    private FacialSurveillance toSurveillance(SurveillancePayload payload) {
        if (payload == null) {
            throw unavailable("El servicio facial devolvió un estado de vigilancia vacío");
        }
        return new FacialSurveillance(payload.active(), payload.faceDetected(), payload.message());
    }

    @Override
    public void delete(String subjectId) {
        requireEnabled();
        execute(() -> {
            restClient.delete()
                    .uri("/v1/templates/{subjectId}", subjectId)
                    .header(INTERNAL_TOKEN_HEADER, requiredToken())
                    .retrieve()
                    .toBodilessEntity();
            return null;
        });
    }

    private String requiredToken() {
        if (!StringUtils.hasText(internalToken)) {
            throw unavailable("Falta configurar el token interno del servicio facial");
        }
        return internalToken;
    }

    private void requireEnabled() {
        if (!enabled) {
            throw unavailable("El reconocimiento facial no está habilitado en este ambiente");
        }
    }

    private <T> T execute(RemoteCall<T> remoteCall) {
        try {
            return remoteCall.execute();
        } catch (RestClientResponseException exception) {
            String message = extractMessage(exception);
            if (exception.getStatusCode().value() == 422) {
                throw new FacialCaptureException(message);
            }
            if (exception.getStatusCode().value() == 503) {
                throw unavailable(message);
            }
            throw unavailable("El servicio facial rechazó la operación: " + message);
        } catch (ResourceAccessException exception) {
            throw unavailable("No fue posible comunicarse con el servicio facial");
        }
    }

    private String extractMessage(RestClientResponseException exception) {
        try {
            JsonNode response = objectMapper.readTree(exception.getResponseBodyAsString());
            JsonNode detail = response.get("detail");
            if (detail != null && detail.isTextual()) {
                return detail.asText();
            }
        } catch (Exception ignored) {
        }
        return "respuesta HTTP " + exception.getStatusCode().value();
    }

    private FacialServiceUnavailableException unavailable(String message) {
        return new FacialServiceUnavailableException(message);
    }

    @FunctionalInterface
    private interface RemoteCall<T> {
        T execute();
    }

    private record StatusPayload(boolean enrolled) {
    }

    private record EnrollmentPayload(
            boolean enrolled,
            int samples,
            boolean livenessVerified,
            String message
    ) {
    }

    private record VerificationPayload(
            boolean matched,
            double score,
            boolean livenessVerified,
            String message
    ) {
    }

    private record PreviewPayload(
            boolean active,
            int samples,
            int required,
            boolean faceDetected,
            boolean livenessVerified,
            String message
    ) {
    }

    private record SurveillancePayload(
            boolean active,
            boolean faceDetected,
            String message
    ) {
    }
}
