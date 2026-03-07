package com.onlinejudge.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LeaderboardEntry {
    private Long userId;
    private String username;
    private int totalSolved;
    private int totalSubmissions;
    private int score;
    private int rank;
}
