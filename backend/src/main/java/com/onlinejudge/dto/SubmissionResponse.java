package com.onlinejudge.dto;

import com.onlinejudge.entity.Submission;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class SubmissionResponse {
    private Long id;
    private Long problemId;
    private String problemTitle;
    private String username;
    private String code;
    private Submission.Language language;
    private Submission.Status status;
    private Integer executionTimeMs;
    private Integer memoryUsedKb;
    private String output;
    private String errorMessage;
    private int testCasesPassed;
    private int totalTestCases;
    private int scoreEarned;
    private int starsEarned;
    private LocalDateTime submittedAt;
}
