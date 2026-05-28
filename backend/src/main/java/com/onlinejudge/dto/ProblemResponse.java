package com.onlinejudge.dto;

import com.onlinejudge.entity.Problem;
import lombok.Builder;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ProblemResponse implements Serializable {
    private Long id;
    private String problemCode;
    private String title;
    private String description;
    private Problem.Difficulty difficulty;
    private String level;
    private String platform;
    private String inputFormat;
    private String outputFormat;
    private String constraints;
    private String sampleInput;
    private String sampleOutput;
    private String sampleExplanation;
    private String category;
    private String topics;
    private String companies;
    private String intuition;
    private String approach;
    private String algorithm;
    private String syntaxNotes;
    private String hints;
    private String editorial;
    private String kind;
    private String family;
    private int timeLimitMs;
    private int memoryLimitMb;
    private int totalSubmissions;
    private int acceptedSubmissions;
    private LocalDateTime createdAt;
    private String updatedAt;
    private double acceptanceRate;
    private List<TestCaseView> testcases;

    @Data
    @Builder
    public static class TestCaseView implements Serializable {
        private String id;
        private String input;
        private String output;
        private boolean isSample;
        private String explanation;
    }
}
