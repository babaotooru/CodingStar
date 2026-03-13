package com.onlinejudge.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestResponse {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private int durationMinutes;
    private String status;
    private int problemCount;
    private int participantCount;
    private List<ProblemResponse> problems;
}
