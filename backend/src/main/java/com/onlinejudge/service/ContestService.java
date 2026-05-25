package com.onlinejudge.service;

import com.onlinejudge.dto.ContestRankEntry;
import com.onlinejudge.dto.ContestResponse;
import com.onlinejudge.dto.ProblemResponse;
import com.onlinejudge.entity.Contest;
import com.onlinejudge.entity.Problem;
import com.onlinejudge.entity.Submission;
import com.onlinejudge.entity.User;
import com.onlinejudge.exception.ResourceNotFoundException;
import com.onlinejudge.repository.ContestRepository;
import com.onlinejudge.repository.SubmissionRepository;
import com.onlinejudge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class ContestService {

    private final ContestRepository contestRepository;
    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;

    public List<ContestResponse> getAllContests() {
        return contestRepository.findAllByOrderByStartTimeDesc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<ContestResponse> getActiveAndUpcomingContests() {
        return contestRepository.findByStatusInOrderByStartTimeAsc(
                List.of(Contest.ContestStatus.UPCOMING, Contest.ContestStatus.ACTIVE))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ContestResponse getContestById(Long id) {
        Contest contest = contestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contest not found with id: " + id));
        ContestResponse response = toResponse(contest);
        response.setProblems(contest.getProblems().stream()
                .map(this::problemToResponse).collect(Collectors.toList()));
        return response;
    }

    @Transactional
    public ContestResponse registerForContest(Long contestId, String username) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest not found"));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!contest.getParticipants().contains(user)) {
            contest.getParticipants().add(user);
            contestRepository.save(contest);
        }
        return toResponse(contest);
    }

    public boolean isRegistered(Long contestId, String username) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest not found"));
        return contest.getParticipants().stream()
                .anyMatch(u -> u.getUsername().equals(username));
    }

    public List<ContestRankEntry> getContestRankings(Long contestId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new ResourceNotFoundException("Contest not found"));

        List<Problem> problems = contest.getProblems();
        List<User> participants = contest.getParticipants();

        List<ContestRankEntry> rankings = new ArrayList<>();

        for (User participant : participants) {
            List<ContestRankEntry.ProblemScore> problemScores = new ArrayList<>();
            int totalScore = 0;
            int solved = 0;
            int totalTimePenalty = 0;

            for (Problem problem : problems) {
                List<Submission> subs = submissionRepository
                        .findByUserIdAndProblemIdAndSubmittedAtBetweenOrderBySubmittedAtAsc(
                                participant.getId(), problem.getId(),
                                contest.getStartTime(), contest.getEndTime());

                boolean isSolved = subs.stream().anyMatch(s -> s.getStatus() == Submission.Status.ACCEPTED);
                int attempts = subs.size();
                Integer timeTaken = null;

                if (isSolved) {
                    solved++;
                    totalScore += getDifficultyScore(problem.getDifficulty());
                    Submission accepted = subs.stream()
                            .filter(s -> s.getStatus() == Submission.Status.ACCEPTED)
                            .findFirst().orElse(null);
                    if (accepted != null) {
                        timeTaken = (int) Duration.between(contest.getStartTime(), accepted.getSubmittedAt())
                                .toMinutes();
                        totalTimePenalty += timeTaken + (attempts - 1) * 5;
                    }
                }

                problemScores.add(ContestRankEntry.ProblemScore.builder()
                        .problemId(problem.getId())
                        .problemTitle(problem.getTitle())
                        .solved(isSolved)
                        .attempts(attempts)
                        .timeTaken(timeTaken)
                        .build());
            }

            rankings.add(ContestRankEntry.builder()
                    .userId(participant.getId())
                    .username(participant.getUsername())
                    .totalScore(totalScore)
                    .problemsSolved(solved)
                    .totalTimePenalty(totalTimePenalty)
                    .problemScores(problemScores)
                    .build());
        }

        rankings.sort((a, b) -> {
            if (b.getTotalScore() != a.getTotalScore())
                return b.getTotalScore() - a.getTotalScore();
            return a.getTotalTimePenalty() - b.getTotalTimePenalty();
        });

        for (int i = 0; i < rankings.size(); i++) {
            rankings.get(i).setRank(i + 1);
        }

        return rankings;
    }

    private int getDifficultyScore(Problem.Difficulty difficulty) {
        return switch (difficulty) {
            case EASY -> 100;
            case MEDIUM -> 200;
            case HARD -> 300;
        };
    }

    @Transactional
    public void updateContestStatuses() {
        LocalDateTime now = LocalDateTime.now();
        List<Contest> upcoming = contestRepository.findByStatusOrderByStartTimeAsc(Contest.ContestStatus.UPCOMING);
        for (Contest c : upcoming) {
            if (now.isAfter(c.getStartTime())) {
                c.setStatus(now.isBefore(c.getEndTime()) ? Contest.ContestStatus.ACTIVE : Contest.ContestStatus.ENDED);
                contestRepository.save(c);
            }
        }
        List<Contest> active = contestRepository.findByStatusOrderByStartTimeAsc(Contest.ContestStatus.ACTIVE);
        for (Contest c : active) {
            if (now.isAfter(c.getEndTime())) {
                c.setStatus(Contest.ContestStatus.ENDED);
                contestRepository.save(c);
            }
        }
    }

    private ContestResponse toResponse(Contest contest) {
        return ContestResponse.builder()
                .id(contest.getId())
                .title(contest.getTitle())
                .description(contest.getDescription())
                .startTime(contest.getStartTime())
                .endTime(contest.getEndTime())
                .durationMinutes(contest.getDurationMinutes())
                .status(contest.getStatus().name())
                .problemCount(contest.getProblems().size())
                .participantCount(contest.getParticipants().size())
                .build();
    }

    private ProblemResponse problemToResponse(Problem p) {
        double rate = p.getTotalSubmissions() > 0
                ? (double) p.getAcceptedSubmissions() / p.getTotalSubmissions() * 100
                : 0;
        return ProblemResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .difficulty(p.getDifficulty())
                .category(p.getCategory())
                .acceptanceRate(Math.round(rate * 10.0) / 10.0)
                .build();
    }
}
