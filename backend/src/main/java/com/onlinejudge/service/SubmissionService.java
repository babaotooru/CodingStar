package com.onlinejudge.service;

import com.onlinejudge.dto.SubmissionRequest;
import com.onlinejudge.dto.SubmissionResponse;
import com.onlinejudge.entity.*;
import com.onlinejudge.exception.ResourceNotFoundException;
import com.onlinejudge.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class SubmissionService {

        private final SubmissionRepository submissionRepository;
        private final ProblemRepository problemRepository;
        private final UserRepository userRepository;
        private final TestCaseRepository testCaseRepository;
        private final CodeExecutionService codeExecutionService;

        @Transactional
        public SubmissionResponse submitCode(String username, SubmissionRequest request) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                Problem problem = problemRepository.findById(request.getProblemId())
                                .orElseThrow(
                                                () -> new ResourceNotFoundException("Problem not found with id: "
                                                                + request.getProblemId()));

                Submission submission = Submission.builder()
                                .user(user)
                                .problem(problem)
                                .code(request.getCode())
                                .language(request.getLanguage())
                                .status(Submission.Status.RUNNING)
                                .build();

                submission = submissionRepository.save(submission);

                // Get test cases for the problem
                List<TestCase> testCases = testCaseRepository.findByProblemIdOrderByOrderIndexAsc(problem.getId());
                submission.setTotalTestCases(testCases.size());

                // Execute code against test cases
                CodeExecutionService.ExecutionResult result = codeExecutionService.executeCode(
                                request.getCode(),
                                request.getLanguage(),
                                testCases,
                                problem.getTimeLimitMs(),
                                problem.getMemoryLimitMb());

                // Update submission with results
                submission.setStatus(result.getStatus());
                submission.setTestCasesPassed(result.getTestCasesPassed());
                submission.setExecutionTimeMs(result.getExecutionTimeMs());
                submission.setMemoryUsedKb(result.getMemoryUsedKb());
                submission.setOutput(result.getOutput());
                submission.setErrorMessage(result.getErrorMessage());

                submission = submissionRepository.save(submission);

                // Update problem stats
                problem.setTotalSubmissions(problem.getTotalSubmissions() + 1);
                if (result.getStatus() == Submission.Status.ACCEPTED) {
                        problem.setAcceptedSubmissions(problem.getAcceptedSubmissions() + 1);
                }
                problemRepository.save(problem);

                // Update user stats
                int scoreEarned = 0;
                int starsEarned = 0;
                user.setTotalSubmissions(user.getTotalSubmissions() + 1);
                if (result.getStatus() == Submission.Status.ACCEPTED) {
                        // Check if this is the first accepted solution for this problem
                        List<Submission> previousAccepted = submissionRepository.findAcceptedByUserAndProblem(
                                        user.getId(),
                                        problem.getId());
                        if (previousAccepted.isEmpty()
                                        || (previousAccepted.size() == 1 && previousAccepted.get(0).getId()
                                                        .equals(submission.getId()))) {
                                user.setTotalSolved(user.getTotalSolved() + 1);
                                scoreEarned = switch (problem.getDifficulty()) {
                                        case EASY -> 10;
                                        case MEDIUM -> 20;
                                        case HARD -> 40;
                                };
                                starsEarned = switch (problem.getDifficulty()) {
                                        case EASY -> 1;
                                        case MEDIUM -> 2;
                                        case HARD -> 3;
                                };
                                user.setScore(user.getScore() + scoreEarned);
                                user.setStars(user.getStars() + starsEarned);
                        }
                }
                userRepository.save(user);

                // Persist score and stars earned on the submission
                submission.setScoreEarned(scoreEarned);
                submission.setStarsEarned(starsEarned);
                submission = submissionRepository.save(submission);

                SubmissionResponse response = toResponse(submission);
                return response;
        }

        public SubmissionResponse runCode(SubmissionRequest request) {
                Problem problem = problemRepository.findById(request.getProblemId())
                                .orElseThrow(
                                                () -> new ResourceNotFoundException("Problem not found with id: "
                                                                + request.getProblemId()));

                List<TestCase> testCases = testCaseRepository.findByProblemIdOrderByOrderIndexAsc(problem.getId());

                CodeExecutionService.ExecutionResult result = codeExecutionService.executeCode(
                                request.getCode(),
                                request.getLanguage(),
                                testCases,
                                problem.getTimeLimitMs(),
                                problem.getMemoryLimitMb());

                return SubmissionResponse.builder()
                                .problemId(problem.getId())
                                .problemTitle(problem.getTitle())
                                .language(request.getLanguage())
                                .status(result.getStatus())
                                .executionTimeMs(result.getExecutionTimeMs())
                                .memoryUsedKb(result.getMemoryUsedKb())
                                .output(result.getOutput())
                                .errorMessage(result.getErrorMessage())
                                .testCasesPassed(result.getTestCasesPassed())
                                .totalTestCases(testCases.size())
                                .build();
        }

        public Page<SubmissionResponse> getUserSubmissions(Long userId, Pageable pageable) {
                return submissionRepository.findByUserIdOrderBySubmittedAtDesc(userId, pageable)
                                .map(this::toResponse);
        }

        public Page<SubmissionResponse> getSubmissionsByUsername(String username, Pageable pageable) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                return submissionRepository.findByUserIdOrderBySubmittedAtDesc(user.getId(), pageable)
                                .map(this::toResponse);
        }

        public Page<SubmissionResponse> getProblemSubmissions(Long problemId, Pageable pageable) {
                return submissionRepository.findByProblemIdOrderBySubmittedAtDesc(problemId, pageable)
                                .map(this::toResponse);
        }

        public Page<SubmissionResponse> getAllSubmissions(Pageable pageable) {
                return submissionRepository.findAllByOrderBySubmittedAtDesc(pageable)
                                .map(this::toResponse);
        }

        public Map<String, Object> getSubmissionStats(Long problemId, Integer executionTimeMs, Integer memoryUsedKb) {
                Map<String, Object> stats = new HashMap<>();

                List<Integer> allTimes = submissionRepository.findAcceptedExecutionTimesByProblemId(problemId);
                List<Integer> allMemory = submissionRepository.findAcceptedMemoryByProblemId(problemId);

                // Runtime beats percentage
                if (executionTimeMs != null && !allTimes.isEmpty()) {
                        long beatsCount = allTimes.stream().filter(t -> t > executionTimeMs).count();
                        double beatsPercent = (double) beatsCount / allTimes.size() * 100;
                        stats.put("runtimeBeats", Math.round(beatsPercent * 100.0) / 100.0);
                        stats.put("runtimeMs", executionTimeMs);

                        // Distribution (buckets of execution times)
                        Map<String, Integer> runtimeDist = buildDistribution(allTimes, executionTimeMs);
                        stats.put("runtimeDistribution", runtimeDist);
                } else {
                        stats.put("runtimeBeats", 0);
                        stats.put("runtimeMs", executionTimeMs != null ? executionTimeMs : 0);
                        stats.put("runtimeDistribution", Map.of());
                }

                // Memory beats percentage
                if (memoryUsedKb != null && !allMemory.isEmpty()) {
                        long beatsCount = allMemory.stream().filter(m -> m > memoryUsedKb).count();
                        double beatsPercent = (double) beatsCount / allMemory.size() * 100;
                        stats.put("memoryBeats", Math.round(beatsPercent * 100.0) / 100.0);
                        stats.put("memoryKb", memoryUsedKb);

                        Map<String, Integer> memoryDist = buildDistribution(allMemory, memoryUsedKb);
                        stats.put("memoryDistribution", memoryDist);
                } else {
                        stats.put("memoryBeats", 0);
                        stats.put("memoryKb", memoryUsedKb != null ? memoryUsedKb : 0);
                        stats.put("memoryDistribution", Map.of());
                }

                stats.put("totalAccepted", allTimes.size());
                return stats;
        }

        private Map<String, Integer> buildDistribution(List<Integer> values, int currentValue) {
                if (values.isEmpty())
                        return Map.of();
                int min = values.stream().mapToInt(Integer::intValue).min().orElse(0);
                int max = values.stream().mapToInt(Integer::intValue).max().orElse(1);
                int bucketCount = 10;
                int range = Math.max(max - min, 1);
                int bucketSize = Math.max(range / bucketCount, 1);

                Map<String, Integer> distribution = new HashMap<>();
                for (int val : values) {
                        int bucket = Math.min((val - min) / bucketSize, bucketCount - 1);
                        int bucketStart = min + bucket * bucketSize;
                        String key = String.valueOf(bucketStart);
                        distribution.put(key, distribution.getOrDefault(key, 0) + 1);
                }
                return distribution;
        }

        public SubmissionResponse getSubmissionById(Long id) {
                Submission submission = submissionRepository.findById(id)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Submission not found with id: " + id));
                return toResponse(submission);
        }

        private SubmissionResponse toResponse(Submission submission) {
                return SubmissionResponse.builder()
                                .id(submission.getId())
                                .problemId(submission.getProblem().getId())
                                .problemTitle(submission.getProblem().getTitle())
                                .username(submission.getUser().getUsername())
                                .code(submission.getCode())
                                .language(submission.getLanguage())
                                .status(submission.getStatus())
                                .executionTimeMs(submission.getExecutionTimeMs())
                                .memoryUsedKb(submission.getMemoryUsedKb())
                                .output(submission.getOutput())
                                .errorMessage(submission.getErrorMessage())
                                .testCasesPassed(submission.getTestCasesPassed())
                                .totalTestCases(submission.getTotalTestCases())
                                .scoreEarned(submission.getScoreEarned())
                                .starsEarned(submission.getStarsEarned())
                                .submittedAt(submission.getSubmittedAt())
                                .build();
        }
}
