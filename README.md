# Online Coding Judge System

A full-stack online coding judge platform similar to LeetCode/HackerRank, built with **Spring Boot** and **React**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Monaco Editor |
| Backend | Java 21, Spring Boot 3.2, Spring Security (JWT) |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Containerization | Docker, Docker Compose |

## Features

- **User Authentication** — JWT-based registration and login
- **Problem Management** — CRUD operations with difficulty filters and search
- **Code Submission** — Submit code in Java, Python, C++, C, JavaScript
- **Code Execution Engine** — Compiles and runs code against test cases
- **Leaderboard** — Score-based ranking system
- **Submission History** — View all past submissions with code and results
- **Responsive UI** — Dark-themed, mobile-friendly interface
- **Caching** — Redis caching for problems and leaderboard

## Project Structure

```
Online Coding Judge System/
├── backend/                     # Spring Boot Application
│   ├── src/main/java/com/onlinejudge/
│   │   ├── controller/          # REST API Controllers
│   │   ├── dto/                 # Request/Response DTOs
│   │   ├── entity/              # JPA Entities
│   │   ├── exception/           # Global Exception Handling
│   │   ├── repository/          # Spring Data Repositories
│   │   ├── security/            # JWT Auth & Security Config
│   │   ├── service/             # Business Logic & Code Execution
│   │   └── OnlineJudgeApplication.java
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── schema.sql           # Database schema + seed data
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                    # React Application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── context/             # Auth context (React Context API)
│   │   ├── pages/               # Page components
│   │   ├── services/            # Axios API layer
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
└── docker-compose.yml           # Full-stack orchestration
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |

### Problems
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/problems` | Get all problems (paginated) |
| GET | `/api/problems/{id}` | Get problem by ID |
| GET | `/api/problems/difficulty/{level}` | Filter by difficulty |
| GET | `/api/problems/search?query=` | Search problems |
| POST | `/api/problems` | Create problem (Admin) |
| PUT | `/api/problems/{id}` | Update problem (Admin) |
| DELETE | `/api/problems/{id}` | Delete problem (Admin) |

### Submissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/submissions` | Submit code |
| GET | `/api/submissions/my` | Get my submissions |
| GET | `/api/submissions/{id}` | Get submission by ID |

### Leaderboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaderboard` | Get rankings |

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Option 2: Manual Setup

#### Prerequisites
- Java 21+
- Node.js 18+
- PostgreSQL 16
- Redis 7
- Maven

#### Backend
```bash
cd backend
mvn spring-boot:run
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

## Database Schema

- **users** — id, username, email, password, role, score, total_solved
- **problems** — id, title, description, difficulty, test limits, stats
- **test_cases** — id, problem_id, input, expected_output, is_sample
- **submissions** — id, user_id, problem_id, code, language, status, metrics
- **contests** — id, title, start/end time, status

## Scoring System

| Difficulty | Points |
|-----------|--------|
| Easy | 10 |
| Medium | 20 |
| Hard | 40 |

Points are awarded once per unique problem solved.
