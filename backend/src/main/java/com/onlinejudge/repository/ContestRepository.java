package com.onlinejudge.repository;

import com.onlinejudge.entity.Contest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ContestRepository extends JpaRepository<Contest, Long> {
    List<Contest> findByStatusOrderByStartTimeAsc(Contest.ContestStatus status);
    List<Contest> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
    List<Contest> findAllByOrderByStartTimeDesc();
    List<Contest> findByStatusInOrderByStartTimeAsc(List<Contest.ContestStatus> statuses);
}
