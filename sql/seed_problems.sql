-- SQL seed for topics, problems and testcases
-- Run with psql against your database after backing up

BEGIN;

-- Topics
INSERT INTO topics(id, name) VALUES
(1,'Arrays'),(2,'Strings'),(3,'Linked Lists'),(4,'Trees'),(5,'Graphs'),(6,'Dynamic Programming'),(7,'Sorting & Searching'),(8,'Greedy'),(9,'Backtracking'),(10,'Math'),(11,'Bit Manipulation'),(12,'Hashing'),(13,'Geometry'),(14,'Database')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Problems (sample subset)
INSERT INTO problems(id, title, statement, difficulty, topic_id) VALUES
(1001,'Two Sum','Given an array of integers, return indices of the two numbers such that they add up to a specific target.','Easy',1),
(1002,'Best Time to Buy and Sell Stock','Given prices, find max profit.','Easy',1),
(1003,'Reverse String','Reverse a string in-place.','Easy',2)
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, statement=EXCLUDED.statement, difficulty=EXCLUDED.difficulty, topic_id=EXCLUDED.topic_id;

-- Testcases (example)
INSERT INTO testcases(id, problem_id, input, output, is_sample) VALUES
(10011,1001,'[2,7,11,15]\n9','[0,1]',true),
(10012,1001,'[3,2,4]\n6','[1,2]',false),
(10021,1002,'[7,1,5,3,6,4]','5',true),
(10031,1003,'hello','olleh',true)
ON CONFLICT (id) DO UPDATE SET input=EXCLUDED.input, output=EXCLUDED.output, is_sample=EXCLUDED.is_sample;

COMMIT;
