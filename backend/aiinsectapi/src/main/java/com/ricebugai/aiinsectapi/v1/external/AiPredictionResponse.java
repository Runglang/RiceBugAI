package com.ricebugai.aiinsectapi.v1.external;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AiPredictionResponse(
                String stage,
                String stage_th,
                String predicted_label,
                String predicted_class,
                Double confidence,
                Object top3,
                Object all_scores) {
}