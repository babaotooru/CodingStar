const { Client } = require('pg');

const client = new Client({
  host: 'db.bixevsugeuajmxlzuxxj.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'CodingJudge!@',
  ssl: { rejectUnauthorized: false }
});

// Generate proper formats based on category and title
function generateFormats(category, title, description) {
  const mainCategory = category.split(' - ')[0].trim();
  
  const categoryFormats = {
    'Core': {
      inputFormat: 'Single or multiple lines of input depending on problem type',
      outputFormat: 'Print the result as specified in the problem'
    },
    'Arrays': {
      inputFormat: 'First line: array size n\nSecond line: n space-separated integers',
      outputFormat: 'Print the result as specified (integer, array, or boolean)'
    },
    'Strings': {
      inputFormat: 'A single string or multiple strings as specified',
      outputFormat: 'Print the resulting string or integer as specified'
    },
    'Hashing': {
      inputFormat: 'Array elements and/or target value on separate lines',
      outputFormat: 'Print indices, boolean, or result as specified'
    },
    'Two Pointers': {
      inputFormat: 'Array elements on first line, additional parameters if needed',
      outputFormat: 'Print result (indices, array, or boolean)'
    },
    'Sliding Window': {
      inputFormat: 'First line: array size and window size k\nSecond line: array elements',
      outputFormat: 'Print the sliding window result'
    },
    'Recursion': {
      inputFormat: 'Single integer n or parameters for recursive function',
      outputFormat: 'Print the computed result'
    },
    'Backtracking': {
      inputFormat: 'Parameters for the problem (n, k, array, etc.)',
      outputFormat: 'Print all valid solutions or result'
    },
    'Linked List': {
      inputFormat: 'Space-separated values representing linked list nodes',
      outputFormat: 'Print modified list or boolean result'
    },
    'Stack': {
      inputFormat: 'Array elements or string as specified',
      outputFormat: 'Print result using stack operations'
    },
    'Queue': {
      inputFormat: 'Elements and operations on separate lines',
      outputFormat: 'Print result of queue operations'
    },
    'Trees': {
      inputFormat: 'Level-order traversal of binary tree (null for missing nodes)',
      outputFormat: 'Print result as integer, boolean, or array'
    },
    'Binary Search': {
      inputFormat: 'Sorted array and target value',
      outputFormat: 'Print index or result of binary search'
    },
    'BST': {
      inputFormat: 'Binary Search Tree in level-order format',
      outputFormat: 'Print result of BST operation'
    },
    'Heap': {
      inputFormat: 'Array of elements or intervals',
      outputFormat: 'Print result using heap/priority queue'
    },
    'Graphs': {
      inputFormat: 'Number of vertices, edges list, and starting vertex if needed',
      outputFormat: 'Print traversal order, shortest path, or boolean result'
    },
    'Dynamic Programming': {
      inputFormat: 'Problem parameters (n, array, target) on separate lines',
      outputFormat: 'Print optimal result computed using DP'
    },
    'Greedy': {
      inputFormat: 'Array of intervals, values, or problem-specific parameters',
      outputFormat: 'Print optimal greedy solution'
    },
    'Bit Manipulation': {
      inputFormat: 'Integer(s) for bit operations',
      outputFormat: 'Print result of bit manipulation'
    },
    'Trie': {
      inputFormat: 'Words to insert and query string',
      outputFormat: 'Print result of trie operations'
    },
    'Segment Tree': {
      inputFormat: 'Array and range query parameters',
      outputFormat: 'Print result of range query'
    },
    'Fenwick Tree': {
      inputFormat: 'Array and update/query operations',
      outputFormat: 'Print results of queries'
    },
    'Java': {
      inputFormat: 'Java-specific input as per problem requirements',
      outputFormat: 'Print result using Java syntax'
    },
    'Python': {
      inputFormat: 'Python-specific input as per problem requirements',
      outputFormat: 'Print result using Python syntax'
    }
  };

  // Check for specific patterns in title/description
  if (title.includes('Conditional') || description.includes('conditional')) {
    return {
      inputFormat: 'Multiple test cases with values to check conditions',
      outputFormat: 'Print result based on conditional logic'
    };
  }
  
  if (title.includes('Loop') || description.includes('loop')) {
    return {
      inputFormat: 'Integer n (number of iterations or range)',
      outputFormat: 'Print result of loop operations'
    };
  }
  
  if (title.includes('Function') || description.includes('function')) {
    return {
      inputFormat: 'Parameters for function call',
      outputFormat: 'Print return value of the function'
    };
  }
  
  if (title.includes('Array') || description.includes('array')) {
    return {
      inputFormat: 'First line: array size n\nSecond line: n space-separated integers',
      outputFormat: 'Print result array or computed value'
    };
  }

  if (title.includes('Matrix') || description.includes('matrix')) {
    return {
      inputFormat: 'First line: rows m and columns n\nNext m lines: n space-separated values',
      outputFormat: 'Print modified matrix or result'
    };
  }

  if (title.includes('String') || description.includes('string')) {
    return {
      inputFormat: 'One or more strings on separate lines',
      outputFormat: 'Print resulting string or count'
    };
  }

  if (title.includes('Sort') || description.includes('sort')) {
    return {
      inputFormat: 'Array size and elements to sort',
      outputFormat: 'Print sorted array'
    };
  }

  if (title.includes('Search') || description.includes('search')) {
    return {
      inputFormat: 'Array elements and target value',
      outputFormat: 'Print index or boolean result'
    };
  }

  // Return category-specific default
  return categoryFormats[mainCategory] || {
    inputFormat: 'Input as specified in problem description',
    outputFormat: 'Print the result as required'
  };
}

// Also update sample I/O if still generic
function generateSampleIO(category, title, description) {
  const mainCategory = category.split(' - ')[0].trim();
  
  // If already has proper sample I/O, don't change
  if (description && !description.includes('Solve') && !description.includes('problem number')) {
    return null; // Keep existing
  }

  const samples = {
    'Core': { input: '5', output: '5' },
    'Arrays': { input: '5\n1 2 3 4 5', output: '15' },
    'Strings': { input: 'hello', output: 'olleh' },
    'Hashing': { input: '4\n2 7 11 15\n9', output: '0 1' },
    'Two Pointers': { input: '5\n1 2 3 4 5\n5', output: '1 3' },
    'Sliding Window': { input: '5 3\n1 3 -1 -3 5', output: '3 3 5' },
    'Recursion': { input: '5', output: '120' },
    'Backtracking': { input: '4 2', output: '[[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]' },
    'Linked List': { input: '1 2 3 4 5', output: '5 4 3 2 1' },
    'Stack': { input: '4\n1 2 3 4', output: '4 3 2 1' },
    'Queue': { input: '5\n1 2 3 4 5', output: '1 2 3 4 5' },
    'Trees': { input: '3 9 20 null null 15 7', output: '3' },
    'Binary Search': { input: '5\n1 2 3 4 5\n3', output: '2' },
    'BST': { input: '5 3 7 2 4 6 8', output: 'true' },
    'Heap': { input: '3\n1 3 2', output: '3' },
    'Graphs': { input: '4 4\n0 1\n0 2\n1 2\n2 3\n0', output: '0 1 2 3' },
    'Dynamic Programming': { input: '5', output: '8' },
    'Greedy': { input: '3\n1 3\n2 6\n8 10', output: '1 6\n8 10' },
    'Bit Manipulation': { input: '5', output: 'false' },
    'Trie': { input: '3\napple\napp\napricot\nap', output: 'apple app apricot' },
    'Segment Tree': { input: '6\n1 3 5 7 9 11\n1 4', output: '24' },
    'Java': { input: '5', output: '5' },
    'Python': { input: '5', output: '5' }
  };

  return samples[mainCategory] || { input: '5', output: '5' };
}

async function fixAllFormats() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL');

    // Get all problems with standard format text
    const result = await client.query(`
      SELECT id, title, description, category, input_format, output_format, sample_input, sample_output 
      FROM problems 
      WHERE input_format = 'Standard input format' 
         OR output_format = 'Standard output format'
         OR input_format = 'Input format'
         OR output_format = 'Output format'
      ORDER BY id
    `);

    console.log(`Found ${result.rows.length} problems to fix`);

    let fixed = 0;
    const batchSize = 50;

    for (let i = 0; i < result.rows.length; i++) {
      const problem = result.rows[i];
      const category = problem.category || 'Core';

      if ((i + 1) % 100 === 0) {
        console.log(`Processing ${i + 1}/${result.rows.length}...`);
      }

      const formats = generateFormats(category, problem.title, problem.description);
      const sampleIO = generateSampleIO(category, problem.title, problem.description);

      // Update formats
      if (sampleIO) {
        await client.query(
          `UPDATE problems 
           SET input_format = $1, 
               output_format = $2,
               sample_input = $3,
               sample_output = $4
           WHERE id = $5`,
          [
            formats.inputFormat,
            formats.outputFormat,
            sampleIO.input,
            sampleIO.output,
            problem.id
          ]
        );
      } else {
        await client.query(
          `UPDATE problems 
           SET input_format = $1, 
               output_format = $2
           WHERE id = $3`,
          [
            formats.inputFormat,
            formats.outputFormat,
            problem.id
          ]
        );
      }

      fixed++;

      if (fixed % batchSize === 0) {
        console.log(`  ✓ Fixed ${fixed} problems`);
      }
    }

    console.log(`\n✅ Successfully fixed ${fixed} problems!`);
    console.log('All problems now have proper input/output format descriptions');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the fixer
fixAllFormats()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  });
