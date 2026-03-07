package com.onlinejudge.repository;

import com.onlinejudge.entity.Problem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long> {
    List<Problem> findByDifficulty(Problem.Difficulty difficulty);

    Page<Problem> findByDifficulty(Problem.Difficulty difficulty, Pageable pageable);

    List<Problem> findByCategory(String category);

    Page<Problem> findByTitleContainingIgnoreCase(String title, Pageable pageable);
}
