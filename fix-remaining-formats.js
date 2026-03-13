const { Client } = require('pg');

const client = new Client({
  host: 'db.bixevsugeuajmxlzuxxj.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'CodingJudge!@',
  ssl: { rejectUnauthorized: false }
});

// Problem-specific templates
const specificProblems = {
  'Two Sum': {
    inputFormat: 'First line: n (array size)\nSecond line: n space-separated integers\nThird line: target integer',
    outputFormat: 'Print indices of two numbers that add up to target (0-indexed)'
  },
  'Best Time to Buy and Sell Stock': {
    inputFormat: 'First line: n (number of days)\nSecond line: n space-separated integers representing stock prices',
    outputFormat: 'Print maximum profit (0 if no profit possible)'
  },
  'Contains Duplicate': {
    inputFormat: 'First line: n (array size)\nSecond line: n space-separated integers',
    outputFormat: 'Print "true" if any value appears twice, "false" otherwise'
  },
  'Product of Array Except Self': {
    inputFormat: 'First line: n (array size)\nSecond line: n space-separated integers',
    outputFormat: 'Print n space-separated integers representing product except self'
  },
  'Maximum Subarray': {
    inputFormat: 'First line: n (array size)\nSecond line: n space-separated integers',
    outputFormat: 'Print the maximum sum of contiguous subarray'
  },
  'Valid Palindrome': {
    inputFormat: 'A single string (may contain letters, numbers, and special characters)',
    outputFormat: 'Print "true" if palindrome (ignoring non-alphanumeric), "false" otherwise'
  },
  'Valid Anagram': {
    inputFormat: 'Two strings s and t on separate lines',
    outputFormat: 'Print "true" if t is anagram of s, "false" otherwise'
  },
  'Longest Substring Without Repeating': {
    inputFormat: 'A single string s (0 ≤ s.length ≤ 5×10⁴)',
    outputFormat: 'Print the length of longest substring without repeating characters'
  }
};

// Generic format generators by category
function getFormatByCategory(category, title) {
  const mainCategory = category ? category.split(/\s+/)[0].trim() : 'General';
  
  // Check if we have a specific template
  for (const [key, template] of Object.entries(specificProblems)) {
    if (title.includes(key)) {
      return template;
    }
  }
  
  const categoryFormats = {
    'Arrays': {
      inputFormat: 'First line: n (array size)\nSecond line: n space-separated integers',
      outputFormat: 'Print the result as specified (integer, array, or boolean)'
    },
    'Strings': {
      inputFormat: 'One or more strings on separate lines',
      outputFormat: 'Print the resulting string, integer, or boolean'
    },
    'Hashing': {
      inputFormat: 'Array size, array elements, and target/query parameters',
      outputFormat: 'Print indices, count, or boolean result'
    },
    'Two': { // Two Pointers
      inputFormat: 'Array or linked list elements with additional parameters if needed',
      outputFormat: 'Print result (indices, modified array, or boolean)'
    },
    'Sliding': { // Sliding Window
      inputFormat: 'First line: n k (array size and window size)\nSecond line: n array elements',
      outputFormat: 'Print the sliding window maximum/minimum or result array'
    },
    'Recursion': {
      inputFormat: 'Integer n or problem-specific parameters for recursive function',
      outputFormat: 'Print the computed result'
    },
    'Backtracking': {
      inputFormat: 'Problem parameters (n, k, array, string, etc.)',
      outputFormat: 'Print all valid solutions or count'
    },
    'Linked': { // Linked List
      inputFormat: 'Space-separated integers representing list nodes (or array format with position)',
      outputFormat: 'Print modified list or boolean result (cycle detection, palindrome)'
    },
    'Stack': {
      inputFormat: 'Array elements or string for stack operations',
      outputFormat: 'Print result using LIFO operations'
    },
    'Queue': {
      inputFormat: 'Elements for queue operations',
      outputFormat: 'Print result using FIFO operations'
    },
    'Trees': {
      inputFormat: 'Binary tree in level-order format (use null for missing nodes)',
      outputFormat: 'Print integer, boolean, or array result'
    },
    'Binary': { // Binary Search
      inputFormat: 'Sorted array and target value on separate lines',
      outputFormat: 'Print index (or -1 if not found)'
    },
    'BST': {
      inputFormat: 'Binary Search Tree in level-order format',
      outputFormat: 'Print result of BST operation'
    },
    'Heap': {
      inputFormat: 'Array elements, k value, or intervals as specified',
      outputFormat: 'Print result using heap/priority queue'
    },
    'Graphs': {
      inputFormat: 'First line: n m (vertices, edges)\nNext m lines: edge pairs\nOptional: starting vertex',
      outputFormat: 'Print traversal order, path, distance, or boolean result'
    },
    'Dynamic': { // Dynamic Programming
      inputFormat: 'Problem-specific parameters (n, array, target, etc.) on separate lines',
      outputFormat: 'Print optimal value computed using dynamic programming'
    },
    'Greedy': {
      inputFormat: 'Array of values, intervals, or problem-specific input',
      outputFormat: 'Print optimal result from greedy strategy'
    },
    'Bit': { // Bit Manipulation
      inputFormat: 'Integer(s) for bitwise operations',
      outputFormat: 'Print result of bit manipulation'
    },
    'Trie': {
      inputFormat: 'List of words and query string/prefix',
      outputFormat: 'Print matching words or boolean result'
    },
    'Segment': { // Segment Tree
      inputFormat: 'Array and range query parameters (L, R)',
      outputFormat: 'Print result of range query'
    },
    'Core': {
      inputFormat: 'Problem-specific input (integers, strings, or arrays)',
      outputFormat: 'Print calculated result as specified'
    },
    'Java': {
      inputFormat: 'Java-specific input following problem requirements',
      outputFormat: 'Print result using Java conventions'
    },
    'Python': {
      inputFormat: 'Python-specific input following problem requirements',
      outputFormat: 'Print result using Python conventions'
    }
  };
  
  // Find matching category
  for (const [key, format] of Object.entries(categoryFormats)) {
    if (mainCategory.toLowerCase().includes(key.toLowerCase()) || category.toLowerCase().includes(key.toLowerCase())) {
      return format;
    }
  }
  
  // Default
  return {
    inputFormat: 'Input according to problem specification',
    outputFormat: 'Print the required result'
  };
}

async function fixRemainingFormats() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL');

    // Get all problems with any generic format text
    const result = await client.query(`
      SELECT id, title, category, input_format, output_format 
      FROM problems 
      WHERE LOWER(input_format) LIKE '%standard%' 
         OR LOWER(output_format) LIKE '%standard%'
         OR LOWER(input_format) LIKE '%see problem%'
         OR LOWER(output_format) LIKE '%see problem%'
         OR input_format = 'Input format'
         OR output_format = 'Output format'
         OR input_format = 'Standard input'
         OR output_format = 'Standard output'
      ORDER BY id
    `);

    console.log(`Found ${result.rows.length} problems to fix`);

    let fixed = 0;

    for (let i = 0; i < result.rows.length; i++) {
      const problem = result.rows[i];
      
      if ((i + 1) % 50 === 0) {
        console.log(`  Processing ${i + 1}/${result.rows.length}...`);
      }

      const formats = getFormatByCategory(problem.category, problem.title);

      await client.query(
        `UPDATE problems 
         SET input_format = $1, 
             output_format = $2
         WHERE id = $3`,
        [formats.inputFormat, formats.outputFormat, problem.id]
      );

      fixed++;
    }

    console.log(`\n✅ Successfully fixed ${fixed} problems!`);

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the fixer
fixRemainingFormats()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  });
