package com.universidad.redes.application.port.out.facial;

import com.universidad.redes.domain.model.facial.FacialEnrollment;
import com.universidad.redes.domain.model.facial.FacialPreview;
import com.universidad.redes.domain.model.facial.FacialSurveillance;
import com.universidad.redes.domain.model.facial.FacialVerification;

public interface FacialIdentityPort {

    boolean isEnrolled(String subjectId);

    FacialEnrollment enroll(String subjectId);

    FacialVerification verify(String subjectId);

    FacialPreview previewStatus(String subjectId);

    byte[] previewFrame(String subjectId);

    FacialSurveillance startSurveillance(String subjectId);

    FacialSurveillance surveillanceStatus(String subjectId);

    byte[] surveillanceFrame(String subjectId);

    void stopSurveillance(String subjectId);

    void delete(String subjectId);
}
