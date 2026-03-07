package com.onlinejudge.dto;

import com.onlinejudge.entity.Problem;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProblemResponse {
    private Long id;
    private String title;
    private String description;
    private Problem.Difficulty difficulty;
    private String inputFormat;
    private String outputFormat;
    private String constraints;
    private String sampleInput;
    private String sampleOutput;
    private String category;
    private int timeLimitMs;
    private int memoryLimitMb;
    private int totalSubmissions;
    private int acceptedSubmissions;
    private LocalDateTime createdAt;
    private double acceptanceRate;
}
