package com.onlinejudge.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserDataMigration {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void fixNullValues() {
        if (!usersTableExists()) {
            System.out.println("Skipping user data migration: users table does not exist yet.");
            return;
        }

        System.out.println("Fixing NULL values in users table...");

        jdbcTemplate.execute(
                "UPDATE users SET " +
                        "total_solved = COALESCE(total_solved, 0), " +
                        "total_submissions = COALESCE(total_submissions, 0), " +
                        "score = COALESCE(score, 0), " +
                        "stars = COALESCE(stars, 0) " +
                        "WHERE total_solved IS NULL OR total_submissions IS NULL OR score IS NULL OR stars IS NULL");

        System.out.println("✓ User data migration completed");
    }

    private boolean usersTableExists() {
        try {
            Boolean exists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.TABLES WHERE LOWER(TABLE_NAME) = 'users'",
                    Boolean.class);
            return Boolean.TRUE.equals(exists);
        } catch (Exception ex) {
            return false;
        }
    }
}
