package com.onlinejudge.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class UserProfileResponse {
    private String username;
    private String email;
    private int totalSolved;
    private int totalSubmissions;
    private int score;
    private int stars;
    private int rank;
    private LocalDateTime createdAt;
    private List<SolvedProblem> solvedProblems;

    @Data
    @Builder
    public static class SolvedProblem {
        private Long id;
        private String title;
        private String difficulty;
    }
}
