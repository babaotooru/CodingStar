package com.onlinejudge.repository;

import com.onlinejudge.entity.Submission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    Page<Submission> findByUserIdOrderBySubmittedAtDesc(Long userId, Pageable pageable);

    Page<Submission> findAllByOrderBySubmittedAtDesc(Pageable pageable);

    List<Submission> findByUserIdAndProblemId(Long userId, Long problemId);

    Page<Submission> findByProblemIdOrderBySubmittedAtDesc(Long problemId, Pageable pageable);

    @Query("SELECT s.executionTimeMs FROM Submission s WHERE s.problem.id = :problemId AND s.status = 'ACCEPTED' AND s.executionTimeMs IS NOT NULL")
    List<Integer> findAcceptedExecutionTimesByProblemId(@Param("problemId") Long problemId);

    @Query("SELECT s.memoryUsedKb FROM Submission s WHERE s.problem.id = :problemId AND s.status = 'ACCEPTED' AND s.memoryUsedKb IS NOT NULL")
    List<Integer> findAcceptedMemoryByProblemId(@Param("problemId") Long problemId);

    @Query("SELECT COUNT(DISTINCT s.problem.id) FROM Submission s WHERE s.user.id = :userId AND s.status = 'ACCEPTED'")
    int countDistinctAcceptedProblemsByUserId(@Param("userId") Long userId);

    @Query("SELECT s FROM Submission s WHERE s.user.id = :userId AND s.problem.id = :problemId AND s.status = 'ACCEPTED'")
    List<Submission> findAcceptedByUserAndProblem(@Param("userId") Long userId, @Param("problemId") Long problemId);

    @Query("SELECT DISTINCT s.problem FROM Submission s WHERE s.user.id = :userId AND s.status = 'ACCEPTED'")
    List<com.onlinejudge.entity.Problem> findSolvedProblemsByUserId(@Param("userId") Long userId);

    List<Submission> findByUserIdAndProblemIdAndSubmittedAtBetweenOrderBySubmittedAtAsc(
            Long userId, Long problemId, LocalDateTime start, LocalDateTime end);
}
