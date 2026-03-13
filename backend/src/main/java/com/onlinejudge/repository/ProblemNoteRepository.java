package com.onlinejudge.repository;

import com.onlinejudge.entity.ProblemNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProblemNoteRepository extends JpaRepository<ProblemNote, Long> {
    Optional<ProblemNote> findByUserIdAndProblemId(Long userId, Long problemId);

    List<ProblemNote> findByUserId(Long userId);

    boolean existsByUserIdAndProblemId(Long userId, Long problemId);
}
