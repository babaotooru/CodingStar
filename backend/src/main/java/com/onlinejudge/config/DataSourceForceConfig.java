package com.onlinejudge.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Configuration
public class DataSourceForceConfig {

    @Bean
    @Primary
    public DataSource dataSource() {
        // Force the production datasource to Supabase. This overrides Spring Boot
        // auto-configuration so the deployed app always connects to the canonical DB.
        HikariConfig cfg = new HikariConfig();
        cfg.setJdbcUrl("jdbc:postgresql://db.kefwjrfqnzhbvopljwau.supabase.co:5432/postgres?sslmode=require");
        cfg.setUsername("postgres");
        cfg.setPassword("CodingJudge!@");
        cfg.setDriverClassName("org.postgresql.Driver");
        cfg.setMaximumPoolSize(10);
        cfg.setPoolName("forced-supabase-pool");
        return new HikariDataSource(cfg);
    }
}
