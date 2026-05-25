package com.onlinejudge.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            // Allow NULL for email and password (needed for OAuth users)
            jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN email DROP NOT NULL");
            jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN password DROP NOT NULL");
            log.info("Database migration: email and password columns set to nullable");
        } catch (Exception e) {
            // Columns may already be nullable
            log.debug("Database migration skipped (columns may already be nullable): {}", e.getMessage());
        }

        try {
            // Add OAuth-related columns if missing
            if (!columnExists("users", "phone")) {
                jdbcTemplate.execute("ALTER TABLE users ADD COLUMN phone VARCHAR(50)");
                log.info("Database migration: added users.phone column");
            }
            if (!columnExists("users", "auth_provider")) {
                jdbcTemplate.execute("ALTER TABLE users ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'LOCAL'");
                log.info("Database migration: added users.auth_provider column");
            }
            if (!columnExists("users", "provider_id")) {
                jdbcTemplate.execute("ALTER TABLE users ADD COLUMN provider_id VARCHAR(255)");
                log.info("Database migration: added users.provider_id column");
            }
        } catch (Exception e) {
            log.debug("OAuth user columns migration skipped or partially applied: {}", e.getMessage());
        }

        try {
            if (!columnExists("contests", "duration_minutes")) {
                jdbcTemplate.execute("ALTER TABLE contests ADD COLUMN duration_minutes INT NOT NULL DEFAULT 90");
                log.info("Database migration: added contests.duration_minutes column");
            }
            if (!tableExists("contest_problems")) {
                jdbcTemplate.execute(
                        "CREATE TABLE contest_problems (contest_id BIGINT NOT NULL, problem_id BIGINT NOT NULL, PRIMARY KEY (contest_id, problem_id))");
                log.info("Database migration: created contest_problems table");
            }
            if (!tableExists("contest_participants")) {
                jdbcTemplate.execute(
                        "CREATE TABLE contest_participants (contest_id BIGINT NOT NULL, user_id BIGINT NOT NULL, PRIMARY KEY (contest_id, user_id))");
                log.info("Database migration: created contest_participants table");
            }
        } catch (Exception e) {
            log.debug("Contest schema migration skipped or partially applied: {}", e.getMessage());
        }
    }

    private boolean tableExists(String tableName) {
        Boolean exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.TABLES WHERE LOWER(TABLE_NAME) = ?",
                Boolean.class,
                tableName.toLowerCase());
        return Boolean.TRUE.equals(exists);
    }

    private boolean columnExists(String tableName, String columnName) {
        Boolean exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.COLUMNS WHERE LOWER(TABLE_NAME) = ? AND LOWER(COLUMN_NAME) = ?",
                Boolean.class,
                tableName.toLowerCase(),
                columnName.toLowerCase());
        return Boolean.TRUE.equals(exists);
    }
}
