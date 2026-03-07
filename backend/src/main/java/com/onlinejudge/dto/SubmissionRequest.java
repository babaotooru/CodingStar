package com.onlinejudge.dto;

import com.onlinejudge.entity.Submission;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmissionRequest {
    @NotNull(message = "Problem ID is required")
    private Long problemId;

    @NotBlank(message = "Code is required")
    private String code;

    @NotNull(message = "Language is required")
    private Submission.Language language;
}
