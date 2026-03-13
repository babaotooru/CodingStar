package com.onlinejudge.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestRankEntry {
    private int rank;
    private Long userId;
    private String username;
    private int totalScore;
    private int problemsSolved;
    private int totalTimePenalty;
    private List<ProblemScore> problemScores;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProblemScore {
        private Long problemId;
        private String problemTitle;
        private boolean solved;
        private int attempts;
        private Integer timeTaken;
    }
}
