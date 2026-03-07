package com.onlinejudge.service;

import com.onlinejudge.dto.LeaderboardEntry;
import com.onlinejudge.entity.User;
import com.onlinejudge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final UserRepository userRepository;

    @Cacheable(value = "leaderboard")
    public List<LeaderboardEntry> getLeaderboard() {
        List<User> users = userRepository.findTopUsers();
        List<LeaderboardEntry> leaderboard = new ArrayList<>();

        int rank = 1;
        for (User user : users) {
            leaderboard.add(LeaderboardEntry.builder()
                    .userId(user.getId())
                    .username(user.getUsername())
                    .totalSolved(user.getTotalSolved())
                    .totalSubmissions(user.getTotalSubmissions())
                    .score(user.getScore())
                    .rank(rank++)
                    .build());
        }

        return leaderboard;
    }
}
