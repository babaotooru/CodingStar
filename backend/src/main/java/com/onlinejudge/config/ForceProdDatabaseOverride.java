package com.onlinejudge.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.Profiles;

import java.util.LinkedHashMap;
import java.util.Map;

public class ForceProdDatabaseOverride implements EnvironmentPostProcessor {

    private static final String PROPERTY_SOURCE_NAME = "forcedProdDatabaseOverride";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        // Always force the production datasource to the Supabase instance to ensure the
        // deployed service reads from the canonical production database.
        // This is intentional to avoid deployments accidentally pointing at
        // empty/ephemeral DBs.
            if (!environment.acceptsProfiles(Profiles.of("prod"))) {
                return;
            }

        Map<String, Object> overrides = new LinkedHashMap<>();
        overrides.put("spring.datasource.url",
                "jdbc:postgresql://db.kefwjrfqnzhbvopljwau.supabase.co:5432/postgres?sslmode=require");
        overrides.put("spring.datasource.username", "postgres");
        overrides.put("spring.datasource.password", "CodingJudge!@");
        overrides.put("spring.datasource.driver-class-name", "org.postgresql.Driver");
        overrides.put("spring.jpa.hibernate.ddl-auto", "none");
        overrides.put("spring.jpa.properties.hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
        overrides.put("spring.sql.init.mode", "never");

        environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, overrides));
    }
}