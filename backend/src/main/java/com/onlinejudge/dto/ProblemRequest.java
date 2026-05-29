package com.onlinejudge.dto;

import com.onlinejudge.entity.Problem;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ProblemRequest {
    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Difficulty is required")
    private Problem.Difficulty difficulty;

    private String inputFormat;
    private String outputFormat;
    private String constraints;
    private String sampleInput;
    private String sampleOutput;
    private String sampleExplanation;
    private String category;
    private int timeLimitMs = 2000;
    private int memoryLimitMb = 256;

    private List<TestCaseRequest> testCases;
}
