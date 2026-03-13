package com.onlinejudge.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProblemNoteResponse {
    private Long id;
    private Long problemId;
    private String problemTitle;
    private String approach;
    private String logic;
    private String learnings;
    private String timeComplexity;
    private String spaceComplexity;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
