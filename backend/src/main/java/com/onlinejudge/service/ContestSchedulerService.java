package com.onlinejudge.service;

import com.onlinejudge.entity.Contest;
import com.onlinejudge.entity.Problem;
import com.onlinejudge.repository.ContestRepository;
import com.onlinejudge.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContestSchedulerService {

    private final ContestRepository contestRepository;
    private final ProblemRepository problemRepository;

    // Run every day at midnight
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void scheduleContests() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        generateContestsForDate(tomorrow);
    }

    // Also run at startup to ensure today/tomorrow have contests
    @jakarta.annotation.PostConstruct
    @Transactional
    public void initContests() {
        LocalDate today = LocalDate.now();
        generateContestsForDate(today);

        LocalDate tomorrow = today.plusDays(1);
        generateContestsForDate(tomorrow);

        // Generate for next 7 days
        for (int i = 2; i <= 7; i++) {
            generateContestsForDate(today.plusDays(i));
        }

        // Update statuses
        updateStatuses();
    }

    private void generateContestsForDate(LocalDate date) {
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.atTime(23, 59, 59);

        List<Contest> existing = contestRepository.findByStartTimeBetween(dayStart, dayEnd);
        if (!existing.isEmpty()) return;

        boolean isSunday = date.getDayOfWeek() == DayOfWeek.SUNDAY;

        if (isSunday) {
            createContest(date, LocalTime.of(8, 0), 90, "Sunday Morning Challenge", "EASY", "MEDIUM");
            createContest(date, LocalTime.of(11, 0), 120, "Sunday Midday Marathon", "MEDIUM", "HARD");
            createContest(date, LocalTime.of(15, 0), 90, "Sunday Afternoon Sprint", "EASY", "MEDIUM");
            createContest(date, LocalTime.of(19, 0), 120, "Sunday Evening Grand Contest", "EASY", "HARD");
            log.info("Created 4 Sunday contests for {}", date);
        } else {
            String dayName = date.getDayOfWeek().name();
            dayName = dayName.charAt(0) + dayName.substring(1).toLowerCase();
            createContest(date, LocalTime.of(20, 0), 90,
                    dayName + " Daily Challenge", "EASY", "HARD");
            log.info("Created daily contest for {}", date);
        }
    }

    private void createContest(LocalDate date, LocalTime startTime, int durationMinutes,
                               String title, String minDifficulty, String maxDifficulty) {
        LocalDateTime start = date.atTime(startTime);
        LocalDateTime end = start.plusMinutes(durationMinutes);

        long totalProblems = problemRepository.count();
        if (totalProblems < 4) {
            log.warn("Not enough problems to create contest");
            return;
        }

        // Pick random problems: 2 easy, 1 medium, 1 hard (or adjust based on difficulty range)
        List<Problem> easy = new java.util.ArrayList<>(problemRepository.findByDifficulty(Problem.Difficulty.EASY,
                PageRequest.of(0, (int) Math.min(totalProblems, 500))).getContent());
        List<Problem> medium = new java.util.ArrayList<>(problemRepository.findByDifficulty(Problem.Difficulty.MEDIUM,
                PageRequest.of(0, (int) Math.min(totalProblems, 500))).getContent());
        List<Problem> hard = new java.util.ArrayList<>(problemRepository.findByDifficulty(Problem.Difficulty.HARD,
                PageRequest.of(0, (int) Math.min(totalProblems, 500))).getContent());

        Collections.shuffle(easy);
        Collections.shuffle(medium);
        Collections.shuffle(hard);

        List<Problem> contestProblems = new java.util.ArrayList<>();
        if (!easy.isEmpty()) contestProblems.add(easy.get(0));
        if (easy.size() > 1) contestProblems.add(easy.get(1));
        if (!medium.isEmpty()) contestProblems.add(medium.get(0));
        if (!hard.isEmpty()) contestProblems.add(hard.get(0));

        String desc = String.format("Solve %d problems in %d minutes. Problems range from %s to %s difficulty.",
                contestProblems.size(), durationMinutes,
                minDifficulty.toLowerCase(), maxDifficulty.toLowerCase());

        Contest contest = Contest.builder()
                .title(title)
                .description(desc)
                .startTime(start)
                .endTime(end)
                .durationMinutes(durationMinutes)
                .problems(contestProblems)
                .status(start.isAfter(LocalDateTime.now()) ? Contest.ContestStatus.UPCOMING : Contest.ContestStatus.ACTIVE)
                .build();

        contestRepository.save(contest);
    }

    // Update contest statuses every minute
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void updateStatuses() {
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
}
