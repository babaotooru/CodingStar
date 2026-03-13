package com.onlinejudge.repository;

import com.onlinejudge.entity.Problem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long> {
    List<Problem> findByDifficulty(Problem.Difficulty difficulty);

    Page<Problem> findByDifficulty(Problem.Difficulty difficulty, Pageable pageable);

    List<Problem> findByCategory(String category);

    Page<Problem> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    Page<Problem> findByCategoryStartingWith(String categoryPrefix, Pageable pageable);

    Page<Problem> findByCategoryStartingWithAndDifficulty(String categoryPrefix, Problem.Difficulty difficulty,
            Pageable pageable);

    boolean existsByCategory(String category);

    List<Problem> findByIntuitionIsNull();

    @Query("SELECT p.category, COUNT(p) FROM Problem p GROUP BY p.category ORDER BY p.category")
    List<Object[]> findCategoriesWithCount();

    List<Problem> findBySampleInput(String sampleInput);
}
