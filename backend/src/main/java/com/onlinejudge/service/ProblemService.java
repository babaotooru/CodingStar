package com.onlinejudge.service;

import com.onlinejudge.dto.ProblemRequest;
import com.onlinejudge.dto.ProblemResponse;
import com.onlinejudge.dto.TestCaseRequest;
import com.onlinejudge.entity.Problem;
import com.onlinejudge.entity.TestCase;
import com.onlinejudge.exception.ResourceNotFoundException;
import com.onlinejudge.repository.ProblemRepository;
import com.onlinejudge.repository.TestCaseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.dao.DataAccessException;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ProblemService {

    private static final String DATASET_RESOURCE = "data/problems_5000.json";

    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private volatile List<ProblemResponse> fallbackProblems;

    @Cacheable(value = "problems", key = "#pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<ProblemResponse> getAllProblems(Pageable pageable) {
        try {
            return problemRepository.findAll(pageable).map(this::toResponse);
        } catch (DataAccessException | RuntimeException ex) {
            return fallbackPage(pageable);
        }
    }

    private Page<ProblemResponse> fallbackPage(Pageable pageable) {
        List<ProblemResponse> problems = loadFallbackProblems();
        int total = problems.size();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), total);
        List<ProblemResponse> pageContent = (start >= end) ? List.of() : problems.subList(start, end);
        return new PageImpl<>(pageContent, pageable, total);
    }

    @Cacheable(value = "problem", key = "#id")
    public ProblemResponse getProblemById(Long id) {
        try {
            Problem problem = problemRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Problem not found with id: " + id));
            return toResponse(problem);
        } catch (DataAccessException | RuntimeException ex) {
            return loadFallbackProblems().stream()
                    .filter(problem -> problem.getId() != null && problem.getId().equals(id))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Problem not found with id: " + id));
        }
    }

    public Page<ProblemResponse> getProblemsByDifficulty(Problem.Difficulty difficulty, Pageable pageable) {
        try {
            return problemRepository.findByDifficulty(difficulty, pageable).map(this::toResponse);
        } catch (DataAccessException | RuntimeException ex) {
            return pageFromList(loadFallbackProblems().stream()
                    .filter(problem -> problem.getDifficulty() == difficulty)
                    .collect(Collectors.toList()), pageable);
        }
    }

    public Page<ProblemResponse> searchProblems(String query, Pageable pageable) {
        try {
            return problemRepository.findByTitleContainingIgnoreCase(query, pageable).map(this::toResponse);
        } catch (DataAccessException | RuntimeException ex) {
            String needle = query == null ? "" : query.toLowerCase();
            return pageFromList(loadFallbackProblems().stream()
                    .filter(problem -> problem.getTitle() != null && problem.getTitle().toLowerCase().contains(needle))
                    .collect(Collectors.toList()), pageable);
        }
    }

    public Page<ProblemResponse> getProblemsByCategoryPrefix(String prefix, Pageable pageable) {
        try {
            return problemRepository.findByCategoryStartingWith(prefix, pageable).map(this::toResponse);
        } catch (DataAccessException | RuntimeException ex) {
            String needle = prefix == null ? "" : prefix.toLowerCase();
            return pageFromList(loadFallbackProblems().stream()
                    .filter(problem -> problem.getCategory() != null
                            && problem.getCategory().toLowerCase().startsWith(needle))
                    .collect(Collectors.toList()), pageable);
        }
    }

    public Page<ProblemResponse> getProblemsByCategoryPrefixAndDifficulty(String prefix, Problem.Difficulty difficulty,
            Pageable pageable) {
        try {
            return problemRepository.findByCategoryStartingWithAndDifficulty(prefix, difficulty, pageable)
                    .map(this::toResponse);
        } catch (DataAccessException | RuntimeException ex) {
            String needle = prefix == null ? "" : prefix.toLowerCase();
            return pageFromList(loadFallbackProblems().stream()
                    .filter(problem -> problem.getCategory() != null
                            && problem.getCategory().toLowerCase().startsWith(needle))
                    .filter(problem -> problem.getDifficulty() == difficulty)
                    .collect(Collectors.toList()), pageable);
        }
    }

    public Long getRandomProblemId() {
        try {
            long count = problemRepository.count();
            if (count == 0)
                throw new ResourceNotFoundException("No problems available");
            long randomIndex = (long) (Math.random() * count);
            return problemRepository.findAll(
                    org.springframework.data.domain.PageRequest.of((int) randomIndex, 1)).getContent().get(0).getId();
        } catch (DataAccessException | RuntimeException ex) {
            List<ProblemResponse> problems = loadFallbackProblems();
            if (problems.isEmpty()) {
                throw new ResourceNotFoundException("No problems available");
            }
            int index = (int) (Math.random() * problems.size());
            return problems.get(index).getId();
        }
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

    private Page<ProblemResponse> pageFromList(List<ProblemResponse> items, Pageable pageable) {
        int total = items.size();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), total);
        List<ProblemResponse> pageContent = (start >= end) ? List.of() : items.subList(start, end);
        return new PageImpl<>(pageContent, pageable, total);
    }

    private List<ProblemResponse> loadFallbackProblems() {
        List<ProblemResponse> cached = fallbackProblems;
        if (cached != null) {
            return cached;
        }

        synchronized (this) {
            if (fallbackProblems != null) {
                return fallbackProblems;
            }

            try {
                ClassPathResource resource = new ClassPathResource(DATASET_RESOURCE);
                if (!resource.exists()) {
                    throw new IllegalStateException("Fallback dataset not found: " + DATASET_RESOURCE);
                }

                try (InputStream inputStream = resource.getInputStream()) {
                    JsonNode root = objectMapper.readTree(inputStream);
                    JsonNode problemsNode = root.path("problems");
                    if (!problemsNode.isArray() || problemsNode.isEmpty()) {
                        throw new IllegalStateException("Fallback dataset has no problems");
                    }

                    Map<Integer, String> topicNames = loadTopicNames(root.path("topics"));
                    List<ProblemResponse> converted = new ArrayList<>(problemsNode.size());
                    for (JsonNode problemNode : problemsNode) {
                        converted.add(buildFallbackProblem(problemNode, topicNames));
                    }

                    fallbackProblems = converted;
                    return converted;
                }
            } catch (Exception e) {
                throw new RuntimeException("Failed to load fallback problems from dataset", e);
            }
        }
    }

    private Map<Integer, String> loadTopicNames(JsonNode topicsNode) {
        Map<Integer, String> topicNames = new HashMap<>();
        if (topicsNode.isArray()) {
            for (JsonNode topicNode : topicsNode) {
                int id = topicNode.path("id").asInt();
                String name = topicNode.path("name").asText("General");
                topicNames.put(id, name);
            }
        }
        return topicNames;
    }

    private ProblemResponse buildFallbackProblem(JsonNode problemNode, Map<Integer, String> topicNames) {
        Long id = problemNode.path("id").isMissingNode() ? null : problemNode.path("id").asLong();
        String title = text(problemNode, "title", "Untitled Problem");
        String difficultyText = text(problemNode, "difficulty", "EASY").toUpperCase();
        Problem.Difficulty difficulty = parseDifficulty(difficultyText);
        String description = text(problemNode, "statement", text(problemNode, "description", ""));
        String category = resolveCategory(problemNode, topicNames);
        String sampleInput = firstTestcaseValue(problemNode, "input");
        String sampleOutput = firstTestcaseValue(problemNode, "output");
        int timeLimitMs = problemNode.path("time_limit_ms").asInt(2000);
        int memoryLimitMb = problemNode.path("memory_limit_mb").asInt(256);
        int totalSubmissions = problemNode.path("submissions").asInt(0);
        double acceptanceRate = problemNode.path("acceptance_rate").isNull()
                ? 0.0
                : problemNode.path("acceptance_rate").asDouble(0.0);

        return ProblemResponse.builder()
                .id(id)
                .title(title)
                .description(description)
                .difficulty(difficulty)
                .inputFormat(text(problemNode, "input_format", null))
                .outputFormat(text(problemNode, "output_format", null))
                .constraints(text(problemNode, "constraints", null))
                .sampleInput(sampleInput)
                .sampleOutput(sampleOutput)
                .category(category)
                .topics(category)
                .companies(null)
                .intuition(null)
                .approach(null)
                .algorithm(null)
                .syntaxNotes(null)
                .hints(null)
                .editorial(text(problemNode, "canonical_answer", null))
                .timeLimitMs(timeLimitMs)
                .memoryLimitMb(memoryLimitMb)
                .totalSubmissions(totalSubmissions)
                .acceptedSubmissions((int) Math.round((acceptanceRate / 100.0) * totalSubmissions))
                .createdAt(null)
                .acceptanceRate(Math.round(acceptanceRate * 100.0) / 100.0)
                .build();
    }

    private Problem.Difficulty parseDifficulty(String difficultyText) {
        String normalized = difficultyText == null ? "EASY" : difficultyText.trim().toUpperCase();
        return switch (normalized) {
            case "EASY" -> Problem.Difficulty.EASY;
            case "MEDIUM" -> Problem.Difficulty.MEDIUM;
            case "HARD" -> Problem.Difficulty.HARD;
            default -> Problem.Difficulty.EASY;
        };
    }

    private String resolveCategory(JsonNode problemNode, Map<Integer, String> topicNames) {
        JsonNode topicIdNode = problemNode.get("topic_id");
        if (topicIdNode != null && !topicIdNode.isNull()) {
            String topicName = topicNames.get(topicIdNode.asInt());
            if (topicName != null && !topicName.isBlank()) {
                return topicName;
            }
        }

        JsonNode topicArray = problemNode.path("topic");
        if (topicArray.isArray() && !topicArray.isEmpty()) {
            return topicArray.get(0).asText("General");
        }

        return "General";
    }

    private String firstTestcaseValue(JsonNode problemNode, String field) {
        JsonNode testcasesNode = problemNode.path("testcases");
        if (testcasesNode.isArray() && !testcasesNode.isEmpty()) {
            return text(testcasesNode.get(0), field, null);
        }
        return null;
    }

    private String text(JsonNode node, String field, String defaultValue) {
        JsonNode valueNode = node.get(field);
        if (valueNode == null || valueNode.isNull()) {
            return defaultValue;
        }
        String value = valueNode.asText();
        return value == null || value.isBlank() ? defaultValue : value;
    }
}
