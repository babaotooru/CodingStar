package com.onlinejudge.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "problems")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Problem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Difficulty difficulty;

    @Column(columnDefinition = "TEXT")
    private String inputFormat;

    @Column(columnDefinition = "TEXT")
    private String outputFormat;

    @Column(columnDefinition = "TEXT")
    private String constraints;

    @Column(name = "sample_input", columnDefinition = "TEXT")
    private String sampleInput;

    @Column(name = "sample_output", columnDefinition = "TEXT")
    private String sampleOutput;

    @Column(name = "sample_explanation", columnDefinition = "TEXT")
    private String sampleExplanation;

    @Column(name = "time_limit_ms")
    @Builder.Default
    private int timeLimitMs = 2000;

    @Column(name = "memory_limit_mb")
    @Builder.Default
    private int memoryLimitMb = 256;

    @Column(nullable = false)
    @Builder.Default
    private String category = "General";

    @Column(name = "topics")
    private String topics; // Comma-separated: Array,HashMap,TwoPointer

    @Column(name = "companies")
    private String companies; // Comma-separated: Google,Amazon,Microsoft

    @Column(columnDefinition = "TEXT")
    private String intuition;

    @Column(columnDefinition = "TEXT")
    private String approach;

    @Column(columnDefinition = "TEXT")
    private String algorithm;

    @Column(columnDefinition = "TEXT")
    private String syntaxNotes;

    @Column(name = "hints", columnDefinition = "TEXT")
    private String hints; // Newline-separated hints

    @Column(columnDefinition = "TEXT")
    private String editorial; // Comprehensive tutorial content

    @Column(name = "total_submissions")
    @Builder.Default
    private int totalSubmissions = 0;

    @Column(name = "accepted_submissions")
    @Builder.Default
    private int acceptedSubmissions = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<TestCase> testCases = new ArrayList<>();

    @OneToMany(mappedBy = "problem", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Submission> submissions = new ArrayList<>();

    public enum Difficulty {
        EASY, MEDIUM, HARD
    }
}
