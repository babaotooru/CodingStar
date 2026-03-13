package com.onlinejudge.controller;

import com.onlinejudge.dto.ProblemNoteRequest;
import com.onlinejudge.dto.ProblemNoteResponse;
import com.onlinejudge.service.ProblemNoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/problem-notes")
@RequiredArgsConstructor
public class ProblemNoteController {

    private final ProblemNoteService problemNoteService;

    @PostMapping
    public ResponseEntity<ProblemNoteResponse> saveNote(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ProblemNoteRequest request) {
        return ResponseEntity.ok(problemNoteService.saveNote(userDetails.getUsername(), request));
    }

    @GetMapping("/problem/{problemId}")
    public ResponseEntity<ProblemNoteResponse> getNote(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long problemId) {
        return ResponseEntity.ok(problemNoteService.getNote(userDetails.getUsername(), problemId));
    }

    @GetMapping("/my-notes")
    public ResponseEntity<List<ProblemNoteResponse>> getMyNotes(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(problemNoteService.getUserNotes(userDetails.getUsername()));
    }

    @GetMapping("/has-note/{problemId}")
    public ResponseEntity<Map<String, Boolean>> hasNote(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long problemId) {
        boolean hasNote = problemNoteService.hasNote(userDetails.getUsername(), problemId);
        return ResponseEntity.ok(Map.of("hasNote", hasNote));
    }

    @DeleteMapping("/problem/{problemId}")
    public ResponseEntity<Void> deleteNote(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long problemId) {
        problemNoteService.deleteNote(userDetails.getUsername(), problemId);
        return ResponseEntity.noContent().build();
    }
}
