package com.onlinejudge.dto;

import com.onlinejudge.entity.Problem;
import lombok.Builder;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
public class ProblemResponse implements Serializable {
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
    private String topics;
    private String companies;
    private String intuition;
    private String approach;
    private String algorithm;
    private String syntaxNotes;
    private String hints;
    private String editorial;
    private int timeLimitMs;
    private int memoryLimitMb;
    private int totalSubmissions;
    private int acceptedSubmissions;
    private LocalDateTime createdAt;
    private double acceptanceRate;
}
