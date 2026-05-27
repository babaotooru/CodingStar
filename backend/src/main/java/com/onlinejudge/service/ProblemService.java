package com.onlinejudge.service;

import com.onlinejudge.dto.ProblemRequest;
import com.onlinejudge.dto.ProblemResponse;
import com.onlinejudge.dto.TestCaseRequest;
import com.onlinejudge.entity.Problem;
import com.onlinejudge.entity.TestCase;
import com.onlinejudge.exception.ResourceNotFoundException;
import com.onlinejudge.repository.ProblemRepository;
import com.onlinejudge.repository.TestCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ProblemService {

    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;

    @Cacheable(value = "problems", key = "#pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<ProblemResponse> getAllProblems(Pageable pageable) {
        return problemRepository.findAll(pageable).map(this::toResponse);
    }

    @Cacheable(value = "problem", key = "#id")
    public ProblemResponse getProblemById(Long id) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Problem not found with id: " + id));
        return toResponse(problem);
    }

    public Page<ProblemResponse> getProblemsByDifficulty(Problem.Difficulty difficulty, Pageable pageable) {
        return problemRepository.findByDifficulty(difficulty, pageable).map(this::toResponse);
    }

    public Page<ProblemResponse> searchProblems(String query, Pageable pageable) {
        return problemRepository.findByTitleContainingIgnoreCase(query, pageable).map(this::toResponse);
    }

    public Page<ProblemResponse> getProblemsByCategoryPrefix(String prefix, Pageable pageable) {
        return problemRepository.findByCategoryStartingWith(prefix, pageable).map(this::toResponse);
    }

    public Page<ProblemResponse> getProblemsByCategoryPrefixAndDifficulty(String prefix, Problem.Difficulty difficulty,
            Pageable pageable) {
        return problemRepository.findByCategoryStartingWithAndDifficulty(prefix, difficulty, pageable)
                .map(this::toResponse);
    }

    public Long getRandomProblemId() {
        long count = problemRepository.count();
        if (count == 0)
            throw new ResourceNotFoundException("No problems available");
        long randomIndex = (long) (Math.random() * count);
        return problemRepository.findAll(
                org.springframework.data.domain.PageRequest.of((int) randomIndex, 1)).getContent().get(0).getId();
    }

    @Transactional
    @CacheEvict(value = { "problems", "problem" }, allEntries = true)
    public ProblemResponse createProblem(ProblemRequest request) {
        Problem problem = Problem.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .difficulty(request.getDifficulty())
                .inputFormat(request.getInputFormat())
                .outputFormat(request.getOutputFormat())
                .constraints(request.getConstraints())
                .sampleInput(request.getSampleInput())
                .sampleOutput(request.getSampleOutput())
                .category(request.getCategory() != null ? request.getCategory() : "General")
                .timeLimitMs(request.getTimeLimitMs())
                .memoryLimitMb(request.getMemoryLimitMb())
                .build();

        problem = problemRepository.save(problem);

        if (request.getTestCases() != null) {
            int index = 0;
            for (TestCaseRequest tc : request.getTestCases()) {
                TestCase testCase = TestCase.builder()
                        .problem(problem)
                        .input(tc.getInput())
                        .expectedOutput(tc.getExpectedOutput())
                        .isSample(tc.isSample())
                        .orderIndex(index++)
                        .build();
                testCaseRepository.save(testCase);
            }
        }

        return toResponse(problem);
    }

    @Transactional
    @CacheEvict(value = { "problems", "problem" }, allEntries = true)
    public ProblemResponse updateProblem(Long id, ProblemRequest request) {
        Problem problem = problemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Problem not found with id: " + id));

        problem.setTitle(request.getTitle());
        problem.setDescription(request.getDescription());
        problem.setDifficulty(request.getDifficulty());
        problem.setInputFormat(request.getInputFormat());
        problem.setOutputFormat(request.getOutputFormat());
        problem.setConstraints(request.getConstraints());
        problem.setSampleInput(request.getSampleInput());
        problem.setSampleOutput(request.getSampleOutput());
        if (request.getCategory() != null) {
            problem.setCategory(request.getCategory());
        }
        problem.setTimeLimitMs(request.getTimeLimitMs());
        problem.setMemoryLimitMb(request.getMemoryLimitMb());

        problem = problemRepository.save(problem);
        return toResponse(problem);
    }

    @Transactional
    @CacheEvict(value = { "problems", "problem" }, allEntries = true)
    public void deleteProblem(Long id) {
        if (!problemRepository.existsById(id)) {
            throw new ResourceNotFoundException("Problem not found with id: " + id);
        }
        problemRepository.deleteById(id);
    }

    public List<Map<String, Object>> getCategoriesWithCount() {
        return problemRepository.findCategoriesWithCount().stream()
                .map(row -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("category", row[0]);
                    map.put("count", ((Number) row[1]).longValue());
                    return map;
                })
                .collect(Collectors.toList());
    }

    private ProblemResponse toResponse(Problem problem) {
        double acceptanceRate = problem.getTotalSubmissions() > 0
                ? (double) problem.getAcceptedSubmissions() / problem.getTotalSubmissions() * 100
                : 0.0;

        return ProblemResponse.builder()
                .id(problem.getId())
                .title(problem.getTitle())
                .description(problem.getDescription())
                .difficulty(problem.getDifficulty())
                .inputFormat(problem.getInputFormat())
                .outputFormat(problem.getOutputFormat())
                .constraints(problem.getConstraints())
                .sampleInput(problem.getSampleInput())
                .sampleOutput(problem.getSampleOutput())
                .category(problem.getCategory())
                .topics(problem.getTopics())
                .companies(problem.getCompanies())
                .intuition(problem.getIntuition())
                .approach(problem.getApproach())
                .algorithm(problem.getAlgorithm())
                .syntaxNotes(problem.getSyntaxNotes())
                .hints(problem.getHints())
                .editorial(problem.getEditorial())
                .timeLimitMs(problem.getTimeLimitMs())
                .memoryLimitMb(problem.getMemoryLimitMb())
                .totalSubmissions(problem.getTotalSubmissions())
                .acceptedSubmissions(problem.getAcceptedSubmissions())
                .createdAt(problem.getCreatedAt())
                .acceptanceRate(Math.round(acceptanceRate * 100.0) / 100.0)
                .build();
    }
}
