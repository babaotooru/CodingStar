package com.onlinejudge.service;

import com.onlinejudge.entity.Submission;
import com.onlinejudge.entity.TestCase;
import com.onlinejudge.exception.CodeExecutionException;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.*;

@Service
@Slf4j
public class CodeExecutionService {

    @Value("${code.execution.timeout:10}")
    private int executionTimeoutSeconds;

    @Value("${code.execution.use-docker:false}")
    private boolean useDocker;

    @Data
    @Builder
    @AllArgsConstructor
    public static class ExecutionResult {
        private Submission.Status status;
        private int testCasesPassed;
        private Integer executionTimeMs;
        private Integer memoryUsedKb;
        private String output;
        private String errorMessage;
    }

    public ExecutionResult executeCode(String code, Submission.Language language,
            List<TestCase> testCases, int timeLimitMs, int memoryLimitMb) {
        if (testCases.isEmpty()) {
            return ExecutionResult.builder()
                    .status(Submission.Status.ACCEPTED)
                    .testCasesPassed(0)
                    .executionTimeMs(0)
                    .output("No test cases available")
                    .build();
        }

        try {
            Path tempDir = Files.createTempDirectory("judge_");
            try {
                // Write source file
                String fileName = getFileName(language);
                Path sourceFile = tempDir.resolve(fileName);
                Files.writeString(sourceFile, code);

                // Compile if needed
                String compileError = compileCode(tempDir, fileName, language);
                if (compileError != null) {
                    return ExecutionResult.builder()
                            .status(Submission.Status.COMPILATION_ERROR)
                            .testCasesPassed(0)
                            .errorMessage(compileError)
                            .build();
                }

                // Run against each test case
                int passed = 0;
                long totalTime = 0;
                StringBuilder outputBuilder = new StringBuilder();

                for (int i = 0; i < testCases.size(); i++) {
                    TestCase tc = testCases.get(i);
                    TestResult result = runTestCase(tempDir, language, tc.getInput(),
                            tc.getExpectedOutput(), timeLimitMs);

                    if (result.status == Submission.Status.ACCEPTED) {
                        passed++;
                    } else if (result.status != Submission.Status.ACCEPTED) {
                        outputBuilder.append("Test Case ").append(i + 1).append(": ")
                                .append(result.status).append("\n");
                        if (result.errorMessage != null) {
                            outputBuilder.append(result.errorMessage).append("\n");
                        }

                        return ExecutionResult.builder()
                                .status(result.status)
                                .testCasesPassed(passed)
                                .executionTimeMs((int) totalTime)
                                .output(outputBuilder.toString())
                                .errorMessage(result.errorMessage)
                                .build();
                    }

                    totalTime += result.executionTimeMs;
                    outputBuilder.append("Test Case ").append(i + 1).append(": PASSED\n");
                }

                return ExecutionResult.builder()
                        .status(Submission.Status.ACCEPTED)
                        .testCasesPassed(passed)
                        .executionTimeMs((int) totalTime)
                        .output(outputBuilder.toString())
                        .build();

            } finally {
                deleteDirectory(tempDir.toFile());
            }

        } catch (Exception e) {
            log.error("Code execution failed", e);
            throw new CodeExecutionException("Code execution failed: " + e.getMessage(), e);
        }
    }

    private String compileCode(Path dir, String fileName, Submission.Language language) {
        try {
            ProcessBuilder pb;
            switch (language) {
                case JAVA:
                    pb = new ProcessBuilder("javac", fileName);
                    break;
                case CPP:
                    pb = new ProcessBuilder("g++", "-o", "solution", fileName, "-std=c++17");
                    break;
                case C:
                    pb = new ProcessBuilder("gcc", "-o", "solution", fileName);
                    break;
                default:
                    return null; // No compilation needed for Python, JavaScript
            }

            pb.directory(dir.toFile());
            pb.redirectErrorStream(true);
            Process process = pb.start();

            String output = readStream(process.getInputStream());
            boolean finished = process.waitFor(30, TimeUnit.SECONDS);

            if (!finished) {
                process.destroyForcibly();
                return "Compilation timed out";
            }

            if (process.exitValue() != 0) {
                return output;
            }

            return null;
        } catch (Exception e) {
            return "Compilation error: " + e.getMessage();
        }
    }

    private TestResult runTestCase(Path dir, Submission.Language language,
            String input, String expectedOutput, int timeLimitMs) {
        try {
            ProcessBuilder pb;
            switch (language) {
                case JAVA:
                    pb = new ProcessBuilder("java", "-cp", dir.toString(), "Solution");
                    break;
                case PYTHON:
                    pb = new ProcessBuilder("python3", dir.resolve("solution.py").toString());
                    break;
                case CPP, C:
                    pb = new ProcessBuilder(dir.resolve("solution").toString());
                    break;
                case JAVASCRIPT:
                    pb = new ProcessBuilder("node", dir.resolve("solution.js").toString());
                    break;
                default:
                    return new TestResult(Submission.Status.RUNTIME_ERROR, 0, "Unsupported language");
            }

            pb.directory(dir.toFile());
            pb.redirectErrorStream(false);

            long startTime = System.currentTimeMillis();
            Process process = pb.start();

            // Write input
            if (input != null && !input.isEmpty()) {
                try (OutputStream os = process.getOutputStream()) {
                    os.write(input.getBytes());
                    os.flush();
                }
            }

            boolean finished = process.waitFor(timeLimitMs, TimeUnit.MILLISECONDS);
            long executionTime = System.currentTimeMillis() - startTime;

            if (!finished) {
                process.destroyForcibly();
                return new TestResult(Submission.Status.TIME_LIMIT_EXCEEDED, executionTime,
                        "Time limit exceeded");
            }

            String actualOutput = readStream(process.getInputStream()).trim();
            String errorOutput = readStream(process.getErrorStream()).trim();

            if (process.exitValue() != 0) {
                return new TestResult(Submission.Status.RUNTIME_ERROR, executionTime,
                        errorOutput.isEmpty() ? "Runtime error" : errorOutput);
            }

            // Compare output
            if (normalizeOutput(actualOutput).equals(normalizeOutput(expectedOutput))) {
                return new TestResult(Submission.Status.ACCEPTED, executionTime, null);
            } else {
                return new TestResult(Submission.Status.WRONG_ANSWER, executionTime,
                        "Expected: " + expectedOutput.trim() + "\nGot: " + actualOutput);
            }

        } catch (Exception e) {
            return new TestResult(Submission.Status.RUNTIME_ERROR, 0, e.getMessage());
        }
    }

    private String getFileName(Submission.Language language) {
        return switch (language) {
            case JAVA -> "Solution.java";
            case PYTHON -> "solution.py";
            case CPP -> "solution.cpp";
            case C -> "solution.c";
            case JAVASCRIPT -> "solution.js";
        };
    }

    private String normalizeOutput(String output) {
        if (output == null)
            return "";
        return output.trim().replaceAll("\\r\\n", "\n").replaceAll("\\s+$", "");
    }

    private String readStream(InputStream is) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }
        }
        return sb.toString();
    }

    private void deleteDirectory(File dir) {
        File[] files = dir.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isDirectory()) {
                    deleteDirectory(file);
                } else {
                    file.delete();
                }
            }
        }
        dir.delete();
    }

    @AllArgsConstructor
    private static class TestResult {
        Submission.Status status;
        long executionTimeMs;
        String errorMessage;
    }
}
