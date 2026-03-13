package com.onlinejudge.repository;

import com.onlinejudge.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Optional<User> findByAuthProviderAndProviderId(User.AuthProvider authProvider, String providerId);

    @Query("SELECT u FROM User u ORDER BY COALESCE(u.stars, 0) DESC, COALESCE(u.score, 0) DESC, COALESCE(u.totalSolved, 0) DESC")
    List<User> findTopUsers();

    @Query("SELECT COUNT(u) + 1 FROM User u WHERE COALESCE(u.stars, 0) > :stars OR (COALESCE(u.stars, 0) = :stars AND COALESCE(u.score, 0) > :score)")
    int calculateRank(@Param("stars") Integer stars, @Param("score") Integer score);
}
