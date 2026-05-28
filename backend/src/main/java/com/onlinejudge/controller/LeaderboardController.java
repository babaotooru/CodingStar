package com.onlinejudge.controller;

import com.onlinejudge.dto.LeaderboardEntry;
import com.onlinejudge.service.LeaderboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @GetMapping
    public ResponseEntity<List<LeaderboardEntry>> getLeaderboard() {
        try {
            List<LeaderboardEntry> leaderboard = leaderboardService.getLeaderboard();
            System.out.println("Leaderboard fetched successfully: " + leaderboard.size() + " users");
            return ResponseEntity.ok(leaderboard);
        } catch (Exception e) {
            System.err.println("ERROR fetching leaderboard: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(List.of());
        }
    }
}
