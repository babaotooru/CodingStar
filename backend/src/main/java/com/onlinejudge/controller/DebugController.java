package com.onlinejudge.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.HashMap;
import java.util.Map;

@RestController
public class DebugController {

    private final DataSource dataSource;

    public DebugController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/internal/db-info")
    public Map<String, Object> dbInfo() {
        Map<String, Object> out = new HashMap<>();
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            ResultSet rs = s
                    .executeQuery("select inet_server_addr() as host, current_database() as db, current_user as user");
            if (rs.next()) {
                out.put("host", rs.getString("host"));
                out.put("database", rs.getString("db"));
                out.put("user", rs.getString("user"));
            }
        } catch (Exception e) {
            out.put("error", e.getMessage());
        }
        return out;
    }
}
