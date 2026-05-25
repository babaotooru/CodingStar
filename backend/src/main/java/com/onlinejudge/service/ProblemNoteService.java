package com.onlinejudge.service;

import com.onlinejudge.dto.ProblemNoteRequest;
import com.onlinejudge.dto.ProblemNoteResponse;
import com.onlinejudge.entity.Problem;
import com.onlinejudge.entity.ProblemNote;
import com.onlinejudge.entity.User;
import com.onlinejudge.exception.ResourceNotFoundException;
import com.onlinejudge.repository.ProblemNoteRepository;
import com.onlinejudge.repository.ProblemRepository;
import com.onlinejudge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ProblemNoteService {

        private final ProblemNoteRepository problemNoteRepository;
        private final ProblemRepository problemRepository;
        private final UserRepository userRepository;

        @Transactional
        public ProblemNoteResponse saveNote(String username, ProblemNoteRequest request) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                Problem problem = problemRepository.findById(request.getProblemId())
                                .orElseThrow(() -> new ResourceNotFoundException("Problem not found"));

                ProblemNote note = problemNoteRepository
                                .findByUserIdAndProblemId(user.getId(), problem.getId())
                                .orElse(ProblemNote.builder()
                                                .user(user)
                                                .problem(problem)
                                                .build());

                note.setApproach(request.getApproach());
                note.setLogic(request.getLogic());
                note.setLearnings(request.getLearnings());
                note.setTimeComplexity(request.getTimeComplexity());
                note.setSpaceComplexity(request.getSpaceComplexity());

                note = problemNoteRepository.save(note);

                return toResponse(note);
        }

        public ProblemNoteResponse getNote(String username, Long problemId) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                ProblemNote note = problemNoteRepository
                                .findByUserIdAndProblemId(user.getId(), problemId)
                                .orElseThrow(() -> new ResourceNotFoundException("Note not found"));

                return toResponse(note);
        }

        public List<ProblemNoteResponse> getUserNotes(String username) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                return problemNoteRepository.findByUserId(user.getId()).stream()
                                .map(this::toResponse)
                                .collect(Collectors.toList());
        }

        public boolean hasNote(String username, Long problemId) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                return problemNoteRepository.existsByUserIdAndProblemId(user.getId(), problemId);
        }

        @Transactional
        public void deleteNote(String username, Long problemId) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

                ProblemNote note = problemNoteRepository
                                .findByUserIdAndProblemId(user.getId(), problemId)
                                .orElseThrow(() -> new ResourceNotFoundException("Note not found"));

                problemNoteRepository.delete(note);
        }

        private ProblemNoteResponse toResponse(ProblemNote note) {
                return ProblemNoteResponse.builder()
                                .id(note.getId())
                                .problemId(note.getProblem().getId())
                                .problemTitle(note.getProblem().getTitle())
                                .approach(note.getApproach())
                                .logic(note.getLogic())
                                .learnings(note.getLearnings())
                                .timeComplexity(note.getTimeComplexity())
                                .spaceComplexity(note.getSpaceComplexity())
                                .createdAt(note.getCreatedAt())
                                .updatedAt(note.getUpdatedAt())
                                .build();
        }
}
