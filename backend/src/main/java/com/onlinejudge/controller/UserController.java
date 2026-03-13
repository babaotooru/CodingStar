package com.onlinejudge.controller;

import com.onlinejudge.dto.UserProfileResponse;
import com.onlinejudge.entity.Problem;
import com.onlinejudge.entity.User;
import com.onlinejudge.exception.ResourceNotFoundException;
import com.onlinejudge.repository.SubmissionRepository;
import com.onlinejudge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;

    @GetMapping("/count")
    public ResponseEntity<java.util.Map<String, Long>> getUserCount() {
        long count = userRepository.count();
        return ResponseEntity.ok(java.util.Map.of("total", count));
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Problem> solvedProblems = submissionRepository.findSolvedProblemsByUserId(user.getId());

        List<UserProfileResponse.SolvedProblem> solvedList = solvedProblems.stream()
                .map(p -> UserProfileResponse.SolvedProblem.builder()
                        .id(p.getId())
                        .title(p.getTitle())
                        .difficulty(p.getDifficulty().name())
                        .build())
                .toList();

        int rank = userRepository.calculateRank(user.getStars(), user.getScore());

        UserProfileResponse profile = UserProfileResponse.builder()
                .username(user.getUsername())
                .email(user.getEmail())
                .totalSolved(user.getTotalSolved())
                .totalSubmissions(user.getTotalSubmissions())
                .score(user.getScore())
                .stars(user.getStars())
                .rank(rank)
                .createdAt(user.getCreatedAt())
                .solvedProblems(solvedList)
                .build();

        return ResponseEntity.ok(profile);
    }
}
