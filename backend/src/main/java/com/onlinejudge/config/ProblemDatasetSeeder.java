package com.onlinejudge.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onlinejudge.entity.Problem;
import com.onlinejudge.entity.TestCase;
import com.onlinejudge.repository.ProblemRepository;
import com.onlinejudge.repository.TestCaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProblemDatasetSeeder implements ApplicationRunner {

    private static final String DATASET_RESOURCE = "data/problems_5000.json";
    private static final int BATCH_SIZE = 100;

    private final ProblemRepository problemRepository;
    private final TestCaseRepository testCaseRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (problemRepository.count() > 0) {
            log.info("Skipping problem seed: database already contains {} problems", problemRepository.count());
            return;
        }

        ClassPathResource resource = new ClassPathResource(DATASET_RESOURCE);
        if (!resource.exists()) {
            log.warn("Skipping problem seed: dataset resource {} not found", DATASET_RESOURCE);
            return;
        }

        log.info("Seeding problems from {}", DATASET_RESOURCE);
        try (InputStream inputStream = resource.getInputStream()) {
            JsonNode root = objectMapper.readTree(inputStream);
            Map<Integer, String> topicNames = loadTopicNames(root.path("topics"));
            JsonNode problemsNode = root.path("problems");
            if (!problemsNode.isArray() || problemsNode.isEmpty()) {
                log.warn("Skipping problem seed: no problems found in dataset");
                return;
            }

            List<Problem> batch = new ArrayList<>(BATCH_SIZE);
            int seededCount = 0;

            for (JsonNode problemNode : problemsNode) {
                Problem problem = buildProblem(problemNode, topicNames);
                batch.add(problem);

                if (batch.size() >= BATCH_SIZE) {
                    seededCount += saveBatch(batch);
                    batch.clear();
                }
            }

            if (!batch.isEmpty()) {
                seededCount += saveBatch(batch);
            }

            log.info("Seeded {} problems from dataset", seededCount);
        }
    }

    protected int saveBatch(List<Problem> batch) {
        int inserted = 0;
        for (Problem problem : batch) {
            Problem savedProblem = problemRepository.save(problem);
            if (problem.getTestCases() != null && !problem.getTestCases().isEmpty()) {
                for (TestCase testCase : problem.getTestCases()) {
                    testCase.setProblem(savedProblem);
                }
                testCaseRepository.saveAll(problem.getTestCases());
            }
            inserted++;
        }
        return inserted;
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

    private Problem buildProblem(JsonNode problemNode, Map<Integer, String> topicNames) {
        String title = text(problemNode, "title", "Untitled Problem");
        String difficulty = text(problemNode, "difficulty", "EASY").toUpperCase();
        String statement = text(problemNode, "statement", text(problemNode, "description", ""));
        String description = text(problemNode, "description", statement);
        String inputFormat = text(problemNode, "input_format", null);
        String outputFormat = text(problemNode, "output_format", null);
        String constraints = text(problemNode, "constraints", null);
        String sampleInput = text(problemNode, "sample_input", null);
        String sampleOutput = text(problemNode, "sample_output", null);
        int timeLimitMs = problemNode.path("time_limit_ms").asInt(2000);
        int memoryLimitMb = problemNode.path("memory_limit_mb").asInt(256);
        int totalSubmissions = problemNode.path("submissions").asInt(0);
        double acceptanceRate = problemNode.path("acceptance_rate").isNull()
                ? 0.0
                : problemNode.path("acceptance_rate").asDouble(0.0);

        String topicName = null;
        JsonNode topicIdNode = problemNode.get("topic_id");
        if (topicIdNode != null && !topicIdNode.isNull()) {
            topicName = topicNames.get(topicIdNode.asInt());
        }
        if (topicName == null) {
            JsonNode topicArray = problemNode.path("topic");
            if (topicArray.isArray() && !topicArray.isEmpty()) {
                topicName = topicArray.get(0).asText("General");
            }
        }
        if (topicName == null || topicName.isBlank()) {
            topicName = "General";
        }

        String category = topicName.toLowerCase().contains("sql")
                ? "SQL - " + topicName
                : topicName;

        Problem problem = Problem.builder()
                .title(title)
                .description(description)
                .difficulty(Problem.Difficulty.valueOf(difficulty))
                .inputFormat(inputFormat)
                .outputFormat(outputFormat)
                .constraints(constraints)
                .sampleInput(sampleInput)
                .sampleOutput(sampleOutput)
                .timeLimitMs(timeLimitMs)
                .memoryLimitMb(memoryLimitMb)
                .category(category)
                .topics(topicName)
                .totalSubmissions(totalSubmissions)
                .acceptedSubmissions((int) Math.round((acceptanceRate / 100.0) * totalSubmissions))
                .build();

        List<TestCase> testCases = new ArrayList<>();
        JsonNode testcasesNode = problemNode.path("testcases");
        if (testcasesNode.isArray()) {
            int orderIndex = 0;
            for (JsonNode testcaseNode : testcasesNode) {
                testCases.add(TestCase.builder()
                        .problem(problem)
                        .input(text(testcaseNode, "input", null))
                        .expectedOutput(text(testcaseNode, "output", null))
                        .isSample(orderIndex == 0)
                        .orderIndex(orderIndex++)
                        .build());
            }
        }
        problem.setTestCases(testCases);
        return problem;
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