package com.onlinejudge.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onlinejudge.dto.ProblemResponse;
import com.onlinejudge.entity.Problem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@Slf4j
public class RealtimeProblemFallbackService {

    private static final String DATASET_RESOURCE = "realtime_dataset.json";

    private final ObjectMapper objectMapper;
    private List<ProblemResponse> problems = Collections.emptyList();
    private Map<Long, ProblemResponse> problemById = Collections.emptyMap();

    public RealtimeProblemFallbackService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void load() {
        try {
            ClassPathResource resource = new ClassPathResource(DATASET_RESOURCE);
            if (!resource.exists()) {
                log.warn("Fallback dataset {} not found", DATASET_RESOURCE);
                return;
            }

            List<ProblemResponse> loaded = new ArrayList<>();
            try (InputStream inputStream = resource.getInputStream()) {
                JsonNode root = objectMapper.readTree(inputStream);
                JsonNode problemsNode = root.path("problems");
                if (problemsNode.isArray()) {
                    long syntheticId = 1L;
                    for (JsonNode problemNode : problemsNode) {
                        loaded.add(toProblemResponse(problemNode, syntheticId++));
                    }
                }
            }

            this.problems = Collections.unmodifiableList(loaded);
            this.problemById = loaded.stream().collect(Collectors.toUnmodifiableMap(ProblemResponse::getId, p -> p));
            log.info("Loaded {} fallback problems from {}", loaded.size(), DATASET_RESOURCE);
        } catch (Exception e) {
            log.warn("Unable to load fallback dataset {}: {}", DATASET_RESOURCE, e.getMessage());
            this.problems = Collections.emptyList();
            this.problemById = Collections.emptyMap();
        }
    }

    public Page<ProblemResponse> getAll(Pageable pageable) {
        return page(filterAndSort(problems, pageable), pageable, problems.size());
    }

    public Optional<ProblemResponse> getById(Long id) {
        return Optional.ofNullable(problemById.get(id));
    }

    public Page<ProblemResponse> getByDifficulty(Problem.Difficulty difficulty, Pageable pageable) {
        List<ProblemResponse> filtered = problems.stream()
                .filter(problem -> problem.getDifficulty() == difficulty)
                .collect(Collectors.toList());
        return page(filterAndSort(filtered, pageable), pageable, filtered.size());
    }

    public Page<ProblemResponse> search(String query, Pageable pageable) {
        String needle = query == null ? "" : query.toLowerCase(Locale.ROOT);
        List<ProblemResponse> filtered = problems.stream()
                .filter(problem -> problem.getTitle() != null
                        && problem.getTitle().toLowerCase(Locale.ROOT).contains(needle))
                .collect(Collectors.toList());
        return page(filterAndSort(filtered, pageable), pageable, filtered.size());
    }

    public Page<ProblemResponse> getByCategoryPrefix(String prefix, Pageable pageable) {
        String needle = prefix == null ? "" : prefix.toLowerCase(Locale.ROOT);
        List<ProblemResponse> filtered = problems.stream()
                .filter(problem -> problem.getCategory() != null
                        && problem.getCategory().toLowerCase(Locale.ROOT).startsWith(needle))
                .collect(Collectors.toList());
        return page(filterAndSort(filtered, pageable), pageable, filtered.size());
    }

    public Page<ProblemResponse> getByCategoryPrefixAndDifficulty(String prefix, Problem.Difficulty difficulty,
            Pageable pageable) {
        String needle = prefix == null ? "" : prefix.toLowerCase(Locale.ROOT);
        List<ProblemResponse> filtered = problems.stream()
                .filter(problem -> problem.getCategory() != null
                        && problem.getCategory().toLowerCase(Locale.ROOT).startsWith(needle))
                .filter(problem -> problem.getDifficulty() == difficulty)
                .collect(Collectors.toList());
        return page(filterAndSort(filtered, pageable), pageable, filtered.size());
    }

    public List<Map<String, Object>> getCategoriesWithCount() {
        Map<String, Long> counts = problems.stream()
                .collect(Collectors.groupingBy(
                        problem -> problem.getCategory() == null ? "General" : problem.getCategory(),
                        Collectors.counting()));

        return counts.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("category", entry.getKey());
                    map.put("count", entry.getValue());
                    return map;
                })
                .collect(Collectors.toList());
    }

    private Page<ProblemResponse> page(List<ProblemResponse> content, Pageable pageable, long total) {
        int start = (int) Math.min(pageable.getOffset(), content.size());
        int end = (int) Math.min(start + pageable.getPageSize(), content.size());
        List<ProblemResponse> slice = start >= end ? Collections.emptyList() : content.subList(start, end);
        return new PageImpl<>(slice, pageable, total);
    }

    private List<ProblemResponse> filterAndSort(List<ProblemResponse> source, Pageable pageable) {
        if (pageable == null) {
            return source;
        }

        List<ProblemResponse> sorted = new ArrayList<>(source);
        sorted.sort((left, right) -> Long.compare(
                left.getId() == null ? Long.MAX_VALUE : left.getId(),
                right.getId() == null ? Long.MAX_VALUE : right.getId()));
        return sorted;
    }

    private ProblemResponse toProblemResponse(JsonNode problemNode, long syntheticId) {
        String difficultyText = text(problemNode, "difficulty", "EASY").toUpperCase(Locale.ROOT);
        Problem.Difficulty difficulty;
        try {
            difficulty = Problem.Difficulty.valueOf(difficultyText);
        } catch (IllegalArgumentException ex) {
            difficulty = Problem.Difficulty.EASY;
        }

        String topicName = "General";
        JsonNode topicArray = problemNode.path("topic");
        if (topicArray.isArray() && !topicArray.isEmpty()) {
            topicName = topicArray.get(0).asText("General");
        }

        String category = topicName.toLowerCase(Locale.ROOT).contains("sql")
                ? "SQL - " + topicName
                : topicName;

        int timeLimitMs = problemNode.path("time_limit_ms").asInt(2000);
        int memoryLimitMb = problemNode.path("memory_limit_mb").asInt(256);
        int totalSubmissions = problemNode.path("submissions").asInt(0);
        double acceptanceRate = problemNode.path("acceptance_rate").isNull()
                ? 0.0
                : problemNode.path("acceptance_rate").asDouble(0.0);

        return ProblemResponse.builder()
                .id(syntheticId)
                .title(text(problemNode, "title", "Untitled Problem"))
                .description(text(problemNode, "description", text(problemNode, "statement", "")))
                .difficulty(difficulty)
                .inputFormat(text(problemNode, "input_format", null))
                .outputFormat(text(problemNode, "output_format", null))
                .constraints(text(problemNode, "constraints", null))
                .sampleInput(text(problemNode, "sample_input", null))
                .sampleOutput(text(problemNode, "sample_output", null))
                .category(category)
                .topics(topicName)
                .timeLimitMs(timeLimitMs)
                .memoryLimitMb(memoryLimitMb)
                .totalSubmissions(totalSubmissions)
                .acceptedSubmissions((int) Math.round((acceptanceRate / 100.0) * totalSubmissions))
                .createdAt(LocalDateTime.now())
                .acceptanceRate(Math.round(acceptanceRate * 100.0) / 100.0)
                .build();
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