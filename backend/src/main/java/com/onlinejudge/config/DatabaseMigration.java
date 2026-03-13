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
    }
}
