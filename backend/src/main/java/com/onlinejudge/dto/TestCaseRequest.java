package com.onlinejudge.dto;

import lombok.Data;

@Data
public class TestCaseRequest {
    private String input;
    private String expectedOutput;
    private boolean isSample;
}
