package com.onlinejudge.dto;

import lombok.Data;

@Data
public class ProblemNoteRequest {
    private Long problemId;
    private String approach;
    private String logic;
    private String learnings;
    private String timeComplexity;
    private String spaceComplexity;
}
