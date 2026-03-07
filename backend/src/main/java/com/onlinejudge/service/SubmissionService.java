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

@Service
@RequiredArgsConstructor
@Slf4j
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
                        () -> new ResourceNotFoundException("Problem not found with id: " + request.getProblemId()));

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
        user.setTotalSubmissions(user.getTotalSubmissions() + 1);
        if (result.getStatus() == Submission.Status.ACCEPTED) {
            // Check if this is the first accepted solution for this problem
            List<Submission> previousAccepted = submissionRepository.findAcceptedByUserAndProblem(user.getId(),
                    problem.getId());
            if (previousAccepted.isEmpty()
                    || (previousAccepted.size() == 1 && previousAccepted.get(0).getId().equals(submission.getId()))) {
                user.setTotalSolved(user.getTotalSolved() + 1);
                int points = switch (problem.getDifficulty()) {
                    case EASY -> 10;
                    case MEDIUM -> 20;
                    case HARD -> 40;
                };
                user.setScore(user.getScore() + points);
            }
        }
        userRepository.save(user);

        return toResponse(submission);
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

    public SubmissionResponse getSubmissionById(Long id) {
        Submission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found with id: " + id));
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
                .submittedAt(submission.getSubmittedAt())
                .build();
    }
}
