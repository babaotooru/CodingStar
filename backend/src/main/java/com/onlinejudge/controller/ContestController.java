package com.onlinejudge.controller;

import com.onlinejudge.dto.ContestRankEntry;
import com.onlinejudge.dto.ContestResponse;
import com.onlinejudge.service.ContestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contests")
@RequiredArgsConstructor
public class ContestController {

    private final ContestService contestService;

    @GetMapping
    public ResponseEntity<List<ContestResponse>> getAllContests() {
        return ResponseEntity.ok(contestService.getAllContests());
    }

    @GetMapping("/active")
    public ResponseEntity<List<ContestResponse>> getActiveAndUpcoming() {
        return ResponseEntity.ok(contestService.getActiveAndUpcomingContests());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContestResponse> getContestById(@PathVariable Long id) {
        return ResponseEntity.ok(contestService.getContestById(id));
    }

    @PostMapping("/{id}/register")
    public ResponseEntity<ContestResponse> register(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(contestService.registerForContest(id, userDetails.getUsername()));
    }

    @GetMapping("/{id}/registered")
    public ResponseEntity<Map<String, Boolean>> isRegistered(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean registered = contestService.isRegistered(id, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("registered", registered));
    }

    @GetMapping("/{id}/rankings")
    public ResponseEntity<List<ContestRankEntry>> getRankings(@PathVariable Long id) {
        return ResponseEntity.ok(contestService.getContestRankings(id));
    }
}
