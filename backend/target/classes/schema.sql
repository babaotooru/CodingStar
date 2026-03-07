-- Create database (run manually)
-- CREATE DATABASE online_judge;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    total_solved INT DEFAULT 0,
    total_submissions INT DEFAULT 0,
    score INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Problems table
CREATE TABLE IF NOT EXISTS problems (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    input_format TEXT,
    output_format TEXT,
    constraints TEXT,
    sample_input TEXT,
    sample_output TEXT,
    time_limit_ms INT DEFAULT 2000,
    memory_limit_mb INT DEFAULT 256,
    category VARCHAR(100) DEFAULT 'General',
    total_submissions INT DEFAULT 0,
    accepted_submissions INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Test cases table
CREATE TABLE IF NOT EXISTS test_cases (
    id BIGSERIAL PRIMARY KEY,
    problem_id BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    is_sample BOOLEAN DEFAULT FALSE,
    order_index INT DEFAULT 0
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id BIGINT NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    language VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    execution_time_ms INT,
    memory_used_kb INT,
    output TEXT,
    error_message TEXT,
    test_cases_passed INT DEFAULT 0,
    total_test_cases INT DEFAULT 0,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Contests table
CREATE TABLE IF NOT EXISTS contests (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'UPCOMING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_users_score ON users(score DESC);

-- Seed sample problems
INSERT INTO problems (title, description, difficulty, input_format, output_format, constraints, sample_input, sample_output, category)
VALUES
('Two Sum', 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', 'EASY',
 'First line: n (size of array)\nSecond line: n space-separated integers\nThird line: target value',
 'Two space-separated indices',
 '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9',
 '4\n2 7 11 15\n9', '0 1', 'Arrays'),

('Reverse String', 'Write a function that reverses a string. The input string is given as an array of characters.', 'EASY',
 'A string to reverse',
 'The reversed string',
 '1 <= s.length <= 10^5',
 'hello', 'olleh', 'Strings'),

('Longest Substring Without Repeating Characters', 'Given a string s, find the length of the longest substring without repeating characters.', 'MEDIUM',
 'A string s',
 'Length of the longest substring without repeating characters',
 '0 <= s.length <= 5 * 10^4',
 'abcabcbb', '3', 'Strings'),

('Merge Sort', 'Implement merge sort algorithm to sort an array of integers in ascending order.', 'MEDIUM',
 'First line: n (size of array)\nSecond line: n space-separated integers',
 'Sorted array as space-separated integers',
 '1 <= n <= 10^5',
 '5\n5 3 1 4 2', '1 2 3 4 5', 'Sorting'),

('N-Queens', 'Place N queens on an NxN chessboard such that no two queens attack each other. Return the number of distinct solutions.', 'HARD',
 'An integer N',
 'Number of distinct solutions',
 '1 <= N <= 15',
 '4', '2', 'Backtracking');

-- Seed test cases for Two Sum
INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index)
VALUES
(1, '4\n2 7 11 15\n9', '0 1', true, 0),
(1, '3\n3 2 4\n6', '1 2', false, 1),
(1, '2\n3 3\n6', '0 1', false, 2);

-- Seed test cases for Reverse String
INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index)
VALUES
(2, 'hello', 'olleh', true, 0),
(2, 'world', 'dlrow', false, 1),
(2, 'a', 'a', false, 2);

-- Seed test cases for Longest Substring
INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index)
VALUES
(3, 'abcabcbb', '3', true, 0),
(3, 'bbbbb', '1', false, 1),
(3, 'pwwkew', '3', false, 2);

-- Seed test cases for Merge Sort
INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index)
VALUES
(4, '5\n5 3 1 4 2', '1 2 3 4 5', true, 0),
(4, '3\n3 2 1', '1 2 3', false, 1);

-- Seed test cases for N-Queens
INSERT INTO test_cases (problem_id, input, expected_output, is_sample, order_index)
VALUES
(5, '4', '2', true, 0),
(5, '8', '92', false, 1);
