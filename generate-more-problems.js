/**
 * Second batch problem generator - adds ~2000 more problems
 * Brings total from ~3175 to 5000+
 */
const { Client } = require('pg');

const DB_CONFIG = {
  host: 'db.bixevsugeuajmxlzuxxj.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'CodingJudge!@',
  ssl: { rejectUnauthorized: false },
};

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const isPrime = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };

function generateProblems(startId) {
  const problems = [];
  let id = startId;

  // ═══════ BATCH 2: More diverse problems ═══════

  // 1. Absolute Difference (100)
  for (let v = 1; v <= 100; v++) {
    const a1 = v * 5 + 3, b1 = v * 3 + 7;
    const a2 = v * 11, b2 = v * 8 + 2;
    const a3 = v * 2 + 15, b3 = v * 9;
    problems.push({
      id: id++, title: `Absolute Difference #${v}`, difficulty: 'EASY', category: 'Math',
      description: `Given two integers A and B, print the absolute difference |A - B|.`,
      inputFormat: 'Two space-separated integers A and B.', outputFormat: 'Print |A - B|.',
      constraints: '-10^9 <= A, B <= 10^9',
      sampleInput: `${a1} ${b1}`, sampleOutput: `${Math.abs(a1 - b1)}`,
      testCases: [
        { input: `${a1} ${b1}`, output: `${Math.abs(a1 - b1)}`, isSample: true },
        { input: `${a2} ${b2}`, output: `${Math.abs(a2 - b2)}`, isSample: false },
        { input: `${a3} ${b3}`, output: `${Math.abs(a3 - b3)}`, isSample: false },
      ],
    });
  }

  // 2. Swap Two Numbers (50)
  for (let v = 1; v <= 50; v++) {
    const a1 = v * 3, b1 = v * 7 + 1;
    const a2 = v * 5 + 2, b2 = v * 2 + 9;
    const a3 = v * 11, b3 = v * 4 + 6;
    problems.push({
      id: id++, title: `Swap Two Numbers #${v}`, difficulty: 'EASY', category: 'Math',
      description: `Given two integers A and B, print them in swapped order (B first, then A).`,
      inputFormat: 'Two space-separated integers A and B.', outputFormat: 'Print B and A space-separated.',
      constraints: '-10^9 <= A, B <= 10^9',
      sampleInput: `${a1} ${b1}`, sampleOutput: `${b1} ${a1}`,
      testCases: [
        { input: `${a1} ${b1}`, output: `${b1} ${a1}`, isSample: true },
        { input: `${a2} ${b2}`, output: `${b2} ${a2}`, isSample: false },
        { input: `${a3} ${b3}`, output: `${b3} ${a3}`, isSample: false },
      ],
    });
  }

  // 3. Check Divisibility (100)
  for (let v = 1; v <= 100; v++) {
    const a = v * 6 + 3, b = v % 7 + 2;
    const a2 = v * 4 + 7, b2 = v % 5 + 3;
    const a3 = v * 10, b3 = v % 3 + 2;
    problems.push({
      id: id++, title: `Divisibility Check #${v}`, difficulty: 'EASY', category: 'Math',
      description: `Given two integers A and B, check if A is divisible by B. Print "Yes" if A % B == 0, "No" otherwise.`,
      inputFormat: 'Two space-separated integers A and B (B > 0).', outputFormat: 'Print "Yes" or "No".',
      constraints: '1 <= B <= A <= 10^9',
      sampleInput: `${a} ${b}`, sampleOutput: a % b === 0 ? 'Yes' : 'No',
      testCases: [
        { input: `${a} ${b}`, output: a % b === 0 ? 'Yes' : 'No', isSample: true },
        { input: `${a2} ${b2}`, output: a2 % b2 === 0 ? 'Yes' : 'No', isSample: false },
        { input: `${a3} ${b3}`, output: a3 % b3 === 0 ? 'Yes' : 'No', isSample: false },
      ],
    });
  }

  // 4. Square and Cube (100)
  for (let v = 1; v <= 100; v++) {
    const n = v + 1;
    problems.push({
      id: id++, title: `Square and Cube #${v}`, difficulty: 'EASY', category: 'Math',
      description: `Given an integer N, print its square (N*N) and cube (N*N*N) on separate lines.`,
      inputFormat: 'A single integer N.', outputFormat: 'First line: N squared.\nSecond line: N cubed.',
      constraints: '-1000 <= N <= 1000',
      sampleInput: `${n}`, sampleOutput: `${n * n}\n${n * n * n}`,
      testCases: [
        { input: `${n}`, output: `${n * n}\n${n * n * n}`, isSample: true },
        { input: `${n + 5}`, output: `${(n + 5) ** 2}\n${(n + 5) ** 3}`, isSample: false },
        { input: `${n + 10}`, output: `${(n + 10) ** 2}\n${(n + 10) ** 3}`, isSample: false },
      ],
    });
  }

  // 5. Sum of AP (100)
  for (let v = 1; v <= 100; v++) {
    const a = v, d = v % 5 + 1, n = v % 20 + 5;
    const sumAP = (a, d, n) => (n * (2 * a + (n - 1) * d)) / 2;
    const n2 = v % 15 + 3, d2 = v % 4 + 2, a2 = v + 3;
    const n3 = v % 10 + 8, d3 = v % 6 + 1, a3 = v * 2;
    problems.push({
      id: id++, title: `Sum of Arithmetic Progression #${v}`, difficulty: 'MEDIUM', category: 'Math',
      description: `Given the first term A, common difference D, and number of terms N of an Arithmetic Progression, find the sum of the AP.`,
      inputFormat: 'Three space-separated integers: A D N.', outputFormat: 'Print the sum of the AP.',
      constraints: '-1000 <= A, D <= 1000\n1 <= N <= 10^5',
      sampleInput: `${a} ${d} ${n}`, sampleOutput: `${sumAP(a, d, n)}`,
      testCases: [
        { input: `${a} ${d} ${n}`, output: `${sumAP(a, d, n)}`, isSample: true },
        { input: `${a2} ${d2} ${n2}`, output: `${sumAP(a2, d2, n2)}`, isSample: false },
        { input: `${a3} ${d3} ${n3}`, output: `${sumAP(a3, d3, n3)}`, isSample: false },
      ],
    });
  }

  // 6. Nth term of AP (80)
  for (let v = 1; v <= 80; v++) {
    const a = v * 2, d = v % 7 + 1, n = v % 30 + 5;
    const nthAP = (a, d, n) => a + (n - 1) * d;
    const n2 = v % 20 + 3, d2 = v % 5 + 2, a2 = v + 7;
    const n3 = v % 15 + 10, d3 = v % 4 + 3, a3 = v * 3;
    problems.push({
      id: id++, title: `Nth Term of AP #${v}`, difficulty: 'EASY', category: 'Math',
      description: `Given the first term A, common difference D, and position N, find the Nth term of the Arithmetic Progression.`,
      inputFormat: 'Three space-separated integers: A D N.', outputFormat: 'Print the Nth term.',
      constraints: '-1000 <= A, D <= 1000\n1 <= N <= 10^5',
      sampleInput: `${a} ${d} ${n}`, sampleOutput: `${nthAP(a, d, n)}`,
      testCases: [
        { input: `${a} ${d} ${n}`, output: `${nthAP(a, d, n)}`, isSample: true },
        { input: `${a2} ${d2} ${n2}`, output: `${nthAP(a2, d2, n2)}`, isSample: false },
        { input: `${a3} ${d3} ${n3}`, output: `${nthAP(a3, d3, n3)}`, isSample: false },
      ],
    });
  }

  // 7. Decimal to Binary (80)
  for (let v = 1; v <= 80; v++) {
    const n1 = v * 7 + 5, n2 = v * 13 + 3, n3 = v * 11 + 1;
    problems.push({
      id: id++, title: `Decimal to Binary #${v}`, difficulty: 'MEDIUM', category: 'Math',
      description: `Given a positive integer N, convert it to its binary representation.`,
      inputFormat: 'A single positive integer N.', outputFormat: 'Print the binary representation of N.',
      constraints: '1 <= N <= 10^9',
      sampleInput: `${n1}`, sampleOutput: n1.toString(2),
      testCases: [
        { input: `${n1}`, output: n1.toString(2), isSample: true },
        { input: `${n2}`, output: n2.toString(2), isSample: false },
        { input: `${n3}`, output: n3.toString(2), isSample: false },
      ],
    });
  }

  // 8. Count Set Bits (80)
  for (let v = 1; v <= 80; v++) {
    const n1 = v * 13 + 7, n2 = v * 17 + 3, n3 = v * 19 + 1;
    const countBits = (n) => n.toString(2).split('').filter(c => c === '1').length;
    problems.push({
      id: id++, title: `Count Set Bits #${v}`, difficulty: 'MEDIUM', category: 'Bit Manipulation',
      description: `Given a non-negative integer N, count the number of 1-bits (set bits) in its binary representation.`,
      inputFormat: 'A single non-negative integer N.', outputFormat: 'Print the number of set bits.',
      constraints: '0 <= N <= 10^9',
      sampleInput: `${n1}`, sampleOutput: `${countBits(n1)}`,
      testCases: [
        { input: `${n1}`, output: `${countBits(n1)}`, isSample: true },
        { input: `${n2}`, output: `${countBits(n2)}`, isSample: false },
        { input: `${n3}`, output: `${countBits(n3)}`, isSample: false },
      ],
    });
  }

  // 9. Digit Product (80)
  for (let v = 1; v <= 80; v++) {
    const n1 = v * 11 + 23, n2 = v * 7 + 45, n3 = v * 13 + 12;
    const digitProduct = (n) => Math.abs(n).toString().split('').reduce((p, d) => p * parseInt(d), 1);
    problems.push({
      id: id++, title: `Product of Digits #${v}`, difficulty: 'EASY', category: 'Math',
      description: `Given a positive integer N, find the product of its digits.`,
      inputFormat: 'A single positive integer N.', outputFormat: 'Print the product of digits.',
      constraints: '1 <= N <= 10^9',
      sampleInput: `${n1}`, sampleOutput: `${digitProduct(n1)}`,
      testCases: [
        { input: `${n1}`, output: `${digitProduct(n1)}`, isSample: true },
        { input: `${n2}`, output: `${digitProduct(n2)}`, isSample: false },
        { input: `${n3}`, output: `${digitProduct(n3)}`, isSample: false },
      ],
    });
  }

  // 10. HCF of Array (50)
  for (let v = 1; v <= 50; v++) {
    const arr1 = Array.from({ length: 4 }, (_, i) => (v + i * 3) * (v % 5 + 2));
    const arr2 = Array.from({ length: 3 }, (_, i) => (v * 2 + i * 5) * (v % 3 + 1));
    const arr3 = Array.from({ length: 5 }, (_, i) => (v * 3 + i * 7) * (v % 4 + 1));
    const arrGcd = (arr) => arr.reduce((g, x) => gcd(g, x));
    problems.push({
      id: id++, title: `GCD of Array #${v}`, difficulty: 'MEDIUM', category: 'Math',
      description: `Given an array of N positive integers, find the GCD (Greatest Common Divisor) of all elements.`,
      inputFormat: 'First line: integer N.\nSecond line: N space-separated positive integers.',
      outputFormat: 'Print the GCD of all elements.',
      constraints: '1 <= N <= 10^5\n1 <= arr[i] <= 10^9',
      sampleInput: `${arr1.length}\n${arr1.join(' ')}`, sampleOutput: `${arrGcd(arr1)}`,
      testCases: [
        { input: `${arr1.length}\n${arr1.join(' ')}`, output: `${arrGcd(arr1)}`, isSample: true },
        { input: `${arr2.length}\n${arr2.join(' ')}`, output: `${arrGcd(arr2)}`, isSample: false },
        { input: `${arr3.length}\n${arr3.join(' ')}`, output: `${arrGcd(arr3)}`, isSample: false },
      ],
    });
  }

  // 11. Check Power of 2 (80)
  for (let v = 1; v <= 80; v++) {
    const vals = [1 << (v % 20 + 1), v * 7 + 3, 1 << (v % 15 + 2)];
    const isPow2 = (n) => n > 0 && (n & (n - 1)) === 0;
    problems.push({
      id: id++, title: `Power of Two Check #${v}`, difficulty: 'EASY', category: 'Bit Manipulation',
      description: `Given a positive integer N, determine if it is a power of 2. Print "Yes" or "No".`,
      inputFormat: 'A single positive integer N.', outputFormat: 'Print "Yes" or "No".',
      constraints: '1 <= N <= 10^9',
      sampleInput: `${vals[0]}`, sampleOutput: isPow2(vals[0]) ? 'Yes' : 'No',
      testCases: vals.map((v2, i) => ({
        input: `${v2}`, output: isPow2(v2) ? 'Yes' : 'No', isSample: i === 0,
      })),
    });
  }

  // 12. Sum of Multiples (80)
  for (let v = 1; v <= 80; v++) {
    const n = v * 10 + 20, k = v % 7 + 2;
    const n2 = v * 5 + 30, k2 = v % 5 + 3;
    const n3 = v * 8 + 15, k3 = v % 9 + 2;
    const sumMult = (n, k) => { let s = 0; for (let i = k; i <= n; i += k) s += i; return s; };
    problems.push({
      id: id++, title: `Sum of Multiples #${v}`, difficulty: 'EASY', category: 'Math',
      description: `Given two positive integers N and K, find the sum of all multiples of K that are less than or equal to N.`,
      inputFormat: 'Two space-separated positive integers N and K.',
      outputFormat: 'Print the sum of all multiples of K up to N.',
      constraints: '1 <= K <= N <= 10^6',
      sampleInput: `${n} ${k}`, sampleOutput: `${sumMult(n, k)}`,
      testCases: [
        { input: `${n} ${k}`, output: `${sumMult(n, k)}`, isSample: true },
        { input: `${n2} ${k2}`, output: `${sumMult(n2, k2)}`, isSample: false },
        { input: `${n3} ${k3}`, output: `${sumMult(n3, k3)}`, isSample: false },
      ],
    });
  }

  // 13. Concatenate Strings (50)
  const words = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel',
    'india', 'juliet', 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa',
    'quebec', 'romeo', 'sierra', 'tango', 'uniform', 'victor', 'whiskey', 'xray',
    'yankee', 'zulu', 'ace', 'bolt', 'core', 'dash', 'edge', 'flux', 'grid',
    'hive', 'icon', 'jade', 'knot', 'link', 'maze', 'node', 'orbit', 'pulse',
    'quest', 'root', 'scan', 'trim', 'unit', 'view', 'wave', 'zero'];
  for (let v = 0; v < 50; v++) {
    const w1 = words[v % words.length], w2 = words[(v + 7) % words.length];
    const w3 = words[(v + 13) % words.length], w4 = words[(v + 23) % words.length];
    const w5 = words[(v + 31) % words.length], w6 = words[(v + 37) % words.length];
    problems.push({
      id: id++, title: `Concatenate Strings #${v + 1}`, difficulty: 'EASY', category: 'Strings',
      description: `Given two strings A and B, print them concatenated (AB) without any separator.`,
      inputFormat: 'First line: string A.\nSecond line: string B.',
      outputFormat: 'Print the concatenation of A and B.',
      constraints: '1 <= |A|, |B| <= 1000',
      sampleInput: `${w1}\n${w2}`, sampleOutput: `${w1}${w2}`,
      testCases: [
        { input: `${w1}\n${w2}`, output: `${w1}${w2}`, isSample: true },
        { input: `${w3}\n${w4}`, output: `${w3}${w4}`, isSample: false },
        { input: `${w5}\n${w6}`, output: `${w5}${w6}`, isSample: false },
      ],
    });
  }

  // 14. First and Last Character (50)
  for (let v = 0; v < 50; v++) {
    const w = words[v % words.length] + words[(v + 11) % words.length];
    const w2 = words[(v + 5) % words.length] + words[(v + 17) % words.length];
    const w3 = words[(v + 9) % words.length];
    problems.push({
      id: id++, title: `First and Last Character #${v + 1}`, difficulty: 'EASY', category: 'Strings',
      description: `Given a string S, print its first and last character separated by a space.`,
      inputFormat: 'A single string S.', outputFormat: 'Print the first and last character space-separated.',
      constraints: '1 <= |S| <= 1000',
      sampleInput: w, sampleOutput: `${w[0]} ${w[w.length - 1]}`,
      testCases: [
        { input: w, output: `${w[0]} ${w[w.length - 1]}`, isSample: true },
        { input: w2, output: `${w2[0]} ${w2[w2.length - 1]}`, isSample: false },
        { input: w3, output: `${w3[0]} ${w3[w3.length - 1]}`, isSample: false },
      ],
    });
  }

  // 15. Count Even and Odd (80)
  for (let v = 1; v <= 80; v++) {
    const arr = Array.from({ length: 6 }, (_, i) => v * 3 + i * 4 + (i % 2));
    const even = arr.filter(x => x % 2 === 0).length;
    const odd = arr.length - even;
    const arr2 = Array.from({ length: 5 }, (_, i) => v * 5 + i * 7);
    const even2 = arr2.filter(x => x % 2 === 0).length;
    const odd2 = arr2.length - even2;
    const arr3 = Array.from({ length: 7 }, (_, i) => v * 2 + i * 3 + 1);
    const even3 = arr3.filter(x => x % 2 === 0).length;
    const odd3 = arr3.length - even3;
    problems.push({
      id: id++, title: `Count Even and Odd #${v}`, difficulty: 'EASY', category: 'Arrays',
      description: `Given an array of N integers, count how many are even and how many are odd. Print the counts space-separated.`,
      inputFormat: 'First line: integer N.\nSecond line: N space-separated integers.',
      outputFormat: 'Print two space-separated integers: count of even numbers and count of odd numbers.',
      constraints: '1 <= N <= 10^5',
      sampleInput: `${arr.length}\n${arr.join(' ')}`, sampleOutput: `${even} ${odd}`,
      testCases: [
        { input: `${arr.length}\n${arr.join(' ')}`, output: `${even} ${odd}`, isSample: true },
        { input: `${arr2.length}\n${arr2.join(' ')}`, output: `${even2} ${odd2}`, isSample: false },
        { input: `${arr3.length}\n${arr3.join(' ')}`, output: `${even3} ${odd3}`, isSample: false },
      ],
    });
  }

  // 16. Array Product (80)
  for (let v = 1; v <= 80; v++) {
    const arr = Array.from({ length: 3 }, (_, i) => (v % 5 + 1) + i);
    const arr2 = Array.from({ length: 3 }, (_, i) => (v % 4 + 2) + i * 2);
    const arr3 = Array.from({ length: 4 }, (_, i) => (v % 3 + 1) + i);
    const prod = (a) => a.reduce((p, x) => p * x, 1);
    problems.push({
      id: id++, title: `Array Product #${v}`, difficulty: 'EASY', category: 'Arrays',
      description: `Given an array of N positive integers, compute the product of all elements.`,
      inputFormat: 'First line: integer N.\nSecond line: N space-separated positive integers.',
      outputFormat: 'Print the product of all elements.',
      constraints: '1 <= N <= 20\n1 <= arr[i] <= 10',
      sampleInput: `${arr.length}\n${arr.join(' ')}`, sampleOutput: `${prod(arr)}`,
      testCases: [
        { input: `${arr.length}\n${arr.join(' ')}`, output: `${prod(arr)}`, isSample: true },
        { input: `${arr2.length}\n${arr2.join(' ')}`, output: `${prod(arr2)}`, isSample: false },
        { input: `${arr3.length}\n${arr3.join(' ')}`, output: `${prod(arr3)}`, isSample: false },
      ],
    });
  }

  // 17. Descending Sort (80)
  for (let v = 1; v <= 80; v++) {
    const arr = Array.from({ length: 5 }, (_, i) => (v * 7 + i * 11) % 100 + 1);
    const arr2 = Array.from({ length: 4 }, (_, i) => (v * 13 + i * 17) % 100 + 1);
    const arr3 = Array.from({ length: 6 }, (_, i) => (v * 3 + i * 23) % 100 + 1);
    problems.push({
      id: id++, title: `Sort Descending #${v}`, difficulty: 'EASY', category: 'Sorting',
      description: `Given an array of N integers, sort them in descending order.`,
      inputFormat: 'First line: integer N.\nSecond line: N space-separated integers.',
      outputFormat: 'Print the sorted array in descending order, space-separated.',
      constraints: '1 <= N <= 10^5',
      sampleInput: `${arr.length}\n${arr.join(' ')}`, sampleOutput: [...arr].sort((a, b) => b - a).join(' '),
      testCases: [
        { input: `${arr.length}\n${arr.join(' ')}`, output: [...arr].sort((a, b) => b - a).join(' '), isSample: true },
        { input: `${arr2.length}\n${arr2.join(' ')}`, output: [...arr2].sort((a, b) => b - a).join(' '), isSample: false },
        { input: `${arr3.length}\n${arr3.join(' ')}`, output: [...arr3].sort((a, b) => b - a).join(' '), isSample: false },
      ],
    });
  }

  // 18. Smallest Positive Divisor (50)
  for (let v = 1; v <= 50; v++) {
    const n = v * 6 + 5;
    const n2 = v * 10 + 9;
    const n3 = v * 14 + 3;
    const smallestDiv = (n) => { for (let i = 2; i <= n; i++) if (n % i === 0) return i; return n; };
    problems.push({
      id: id++, title: `Smallest Divisor #${v}`, difficulty: 'EASY', category: 'Math',
      description: `Given a positive integer N > 1, find its smallest divisor greater than 1.`,
      inputFormat: 'A single positive integer N.', outputFormat: 'Print the smallest divisor of N greater than 1.',
      constraints: '2 <= N <= 10^9',
      sampleInput: `${n}`, sampleOutput: `${smallestDiv(n)}`,
      testCases: [
        { input: `${n}`, output: `${smallestDiv(n)}`, isSample: true },
        { input: `${n2}`, output: `${smallestDiv(n2)}`, isSample: false },
        { input: `${n3}`, output: `${smallestDiv(n3)}`, isSample: false },
      ],
    });
  }

  // 19. N-th Prime (50)
  for (let v = 1; v <= 50; v++) {
    const findNthPrime = (n) => {
      let count = 0, num = 1;
      while (count < n) { num++; if (isPrime(num)) count++; }
      return num;
    };
    const n1 = v + 5, n2 = v + 10, n3 = v + 2;
    problems.push({
      id: id++, title: `Nth Prime Number #${v}`, difficulty: 'MEDIUM', category: 'Math',
      description: `Given a positive integer N, find the N-th prime number. The first prime is 2, the second is 3, the third is 5, and so on.`,
      inputFormat: 'A single positive integer N.', outputFormat: 'Print the N-th prime number.',
      constraints: '1 <= N <= 1000',
      sampleInput: `${n1}`, sampleOutput: `${findNthPrime(n1)}`,
      testCases: [
        { input: `${n1}`, output: `${findNthPrime(n1)}`, isSample: true },
        { input: `${n2}`, output: `${findNthPrime(n2)}`, isSample: false },
        { input: `${n3}`, output: `${findNthPrime(n3)}`, isSample: false },
      ],
    });
  }

  // 20. Largest Prime Factor (50)
  for (let v = 1; v <= 50; v++) {
    const n = v * 6 + 10;
    const n2 = v * 10 + 15;
    const n3 = v * 14 + 6;
    const largestPrimeFactor = (n) => {
      let largest = 1;
      for (let i = 2; i * i <= n; i++) { while (n % i === 0) { largest = i; n /= i; } }
      if (n > 1) largest = n;
      return largest;
    };
    problems.push({
      id: id++, title: `Largest Prime Factor #${v}`, difficulty: 'MEDIUM', category: 'Math',
      description: `Given a positive integer N > 1, find its largest prime factor.`,
      inputFormat: 'A single positive integer N.', outputFormat: 'Print the largest prime factor of N.',
      constraints: '2 <= N <= 10^9',
      sampleInput: `${n}`, sampleOutput: `${largestPrimeFactor(n)}`,
      testCases: [
        { input: `${n}`, output: `${largestPrimeFactor(n)}`, isSample: true },
        { input: `${n2}`, output: `${largestPrimeFactor(n2)}`, isSample: false },
        { input: `${n3}`, output: `${largestPrimeFactor(n3)}`, isSample: false },
      ],
    });
  }

  // 21. Pair Sum Count (50)
  for (let v = 1; v <= 50; v++) {
    const arr = Array.from({ length: 5 }, (_, i) => v + i * 2);
    const target = arr[0] + arr[arr.length - 1];
    const pairCount = (a, t) => { let c = 0; for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] + a[j] === t) c++; return c; };
    const arr2 = Array.from({ length: 4 }, (_, i) => v * 2 + i * 3);
    const target2 = arr2[1] + arr2[2];
    const arr3 = Array.from({ length: 6 }, (_, i) => v + i);
    const target3 = arr3[0] + arr3[5];
    problems.push({
      id: id++, title: `Count Pairs with Sum #${v}`, difficulty: 'MEDIUM', category: 'Arrays',
      description: `Given an array of N integers and a target sum T, count the number of pairs (i, j) where i < j and arr[i] + arr[j] = T.`,
      inputFormat: 'First line: integer N.\nSecond line: N space-separated integers.\nThird line: target T.',
      outputFormat: 'Print the count of valid pairs.',
      constraints: '2 <= N <= 1000',
      sampleInput: `${arr.length}\n${arr.join(' ')}\n${target}`, sampleOutput: `${pairCount(arr, target)}`,
      testCases: [
        { input: `${arr.length}\n${arr.join(' ')}\n${target}`, output: `${pairCount(arr, target)}`, isSample: true },
        { input: `${arr2.length}\n${arr2.join(' ')}\n${target2}`, output: `${pairCount(arr2, target2)}`, isSample: false },
        { input: `${arr3.length}\n${arr3.join(' ')}\n${target3}`, output: `${pairCount(arr3, target3)}`, isSample: false },
      ],
    });
  }

  // 22. Running Sum (50)
  for (let v = 1; v <= 50; v++) {
    const arr = Array.from({ length: 5 }, (_, i) => v + i * 3);
    const running = arr.reduce((acc, x) => { acc.push((acc.length ? acc[acc.length - 1] : 0) + x); return acc; }, []);
    const arr2 = Array.from({ length: 4 }, (_, i) => v * 2 + i * 5);
    const running2 = arr2.reduce((acc, x) => { acc.push((acc.length ? acc[acc.length - 1] : 0) + x); return acc; }, []);
    const arr3 = Array.from({ length: 6 }, (_, i) => v * 3 + i);
    const running3 = arr3.reduce((acc, x) => { acc.push((acc.length ? acc[acc.length - 1] : 0) + x); return acc; }, []);
    problems.push({
      id: id++, title: `Running Sum #${v}`, difficulty: 'EASY', category: 'Arrays',
      description: `Given an array of N integers, compute the running sum. The running sum at index i is the sum of elements from index 0 to i.`,
      inputFormat: 'First line: integer N.\nSecond line: N space-separated integers.',
      outputFormat: 'Print the running sum array, space-separated.',
      constraints: '1 <= N <= 10^5',
      sampleInput: `${arr.length}\n${arr.join(' ')}`, sampleOutput: running.join(' '),
      testCases: [
        { input: `${arr.length}\n${arr.join(' ')}`, output: running.join(' '), isSample: true },
        { input: `${arr2.length}\n${arr2.join(' ')}`, output: running2.join(' '), isSample: false },
        { input: `${arr3.length}\n${arr3.join(' ')}`, output: running3.join(' '), isSample: false },
      ],
    });
  }

  // 23. Check Sorted (80)
  for (let v = 1; v <= 80; v++) {
    const sorted = Array.from({ length: 5 }, (_, i) => v + i * 3);
    const notSorted = [...sorted]; notSorted[2] = notSorted[2] + 100;
    const sorted2 = Array.from({ length: 4 }, (_, i) => v * 2 + i * 7);
    const isSorted = (a) => { for (let i = 1; i < a.length; i++) if (a[i] < a[i - 1]) return false; return true; };
    problems.push({
      id: id++, title: `Check Sorted #${v}`, difficulty: 'EASY', category: 'Arrays',
      description: `Given an array of N integers, determine if the array is sorted in non-decreasing order. Print "Yes" or "No".`,
      inputFormat: 'First line: integer N.\nSecond line: N space-separated integers.',
      outputFormat: 'Print "Yes" if sorted in non-decreasing order, "No" otherwise.',
      constraints: '1 <= N <= 10^5',
      sampleInput: `${sorted.length}\n${sorted.join(' ')}`, sampleOutput: 'Yes',
      testCases: [
        { input: `${sorted.length}\n${sorted.join(' ')}`, output: 'Yes', isSample: true },
        { input: `${notSorted.length}\n${notSorted.join(' ')}`, output: isSorted(notSorted) ? 'Yes' : 'No', isSample: false },
        { input: `${sorted2.length}\n${sorted2.join(' ')}`, output: 'Yes', isSample: false },
      ],
    });
  }

  // 24. Sum of Squares (50)
  for (let v = 1; v <= 50; v++) {
    const n1 = v * 5 + 3, n2 = v * 3 + 7, n3 = v * 8 + 1;
    const sumSq = (n) => (n * (n + 1) * (2 * n + 1)) / 6;
    problems.push({
      id: id++, title: `Sum of Squares #${v}`, difficulty: 'EASY', category: 'Math',
      description: `Given a positive integer N, find the sum of squares of first N natural numbers: 1² + 2² + 3² + ... + N².`,
      inputFormat: 'A single positive integer N.', outputFormat: 'Print the sum of squares.',
      constraints: '1 <= N <= 10^4',
      sampleInput: `${n1}`, sampleOutput: `${sumSq(n1)}`,
      testCases: [
        { input: `${n1}`, output: `${sumSq(n1)}`, isSample: true },
        { input: `${n2}`, output: `${sumSq(n2)}`, isSample: false },
        { input: `${n3}`, output: `${sumSq(n3)}`, isSample: false },
      ],
    });
  }

  // 25. nCr (Combination) (50)
  for (let v = 1; v <= 50; v++) {
    const n = v + 5, r = v % (v + 4) + 1;
    const n2 = v + 8, r2 = v % (v + 7) + 1;
    const n3 = v + 3, r3 = v % (v + 2) + 1;
    const nCr = (n, r) => {
      if (r > n) return 0;
      if (r === 0 || r === n) return 1;
      let num = 1n, den = 1n;
      for (let i = 0; i < Math.min(r, n - r); i++) {
        num *= BigInt(n - i);
        den *= BigInt(i + 1);
      }
      return Number(num / den);
    };
    problems.push({
      id: id++, title: `Combination nCr #${v}`, difficulty: 'MEDIUM', category: 'Math',
      description: `Given two non-negative integers N and R (R <= N), compute the binomial coefficient C(N, R) = N! / (R! × (N-R)!).`,
      inputFormat: 'Two space-separated non-negative integers N and R.',
      outputFormat: 'Print C(N, R).',
      constraints: '0 <= R <= N <= 20',
      sampleInput: `${n} ${r}`, sampleOutput: `${nCr(n, r)}`,
      testCases: [
        { input: `${n} ${r}`, output: `${nCr(n, r)}`, isSample: true },
        { input: `${n2} ${r2}`, output: `${nCr(n2, r2)}`, isSample: false },
        { input: `${n3} ${r3}`, output: `${nCr(n3, r3)}`, isSample: false },
      ],
    });
  }

  // 26. Harshad Number (50)
  for (let v = 1; v <= 50; v++) {
    const vals = [v * 9, v * 12 + 6, v * 18 + 3];
    const isHarshad = (n) => { const ds = n.toString().split('').reduce((s, d) => s + parseInt(d), 0); return n % ds === 0; };
    problems.push({
      id: id++, title: `Harshad Number Check #${v}`, difficulty: 'MEDIUM', category: 'Math',
      description: `A Harshad number is an integer that is divisible by the sum of its digits. Given N, check if it is a Harshad number. Print "Yes" or "No".`,
      inputFormat: 'A single positive integer N.', outputFormat: 'Print "Yes" or "No".',
      constraints: '1 <= N <= 10^9',
      sampleInput: `${vals[0]}`, sampleOutput: isHarshad(vals[0]) ? 'Yes' : 'No',
      testCases: vals.map((v2, i) => ({
        input: `${v2}`, output: isHarshad(v2) ? 'Yes' : 'No', isSample: i === 0
      })),
    });
  }

  // 27. Unique Characters (50)
  for (let v = 0; v < 50; v++) {
    const w1 = words[v % words.length];
    const w2 = words[(v + 7) % words.length];
    const w3 = words[(v + 19) % words.length];
    const uniqueChars = (s) => [...new Set(s)].length;
    problems.push({
      id: id++, title: `Count Unique Characters #${v + 1}`, difficulty: 'EASY', category: 'Strings',
      description: `Given a string S, count the number of unique (distinct) characters in it.`,
      inputFormat: 'A single string S.', outputFormat: 'Print the number of unique characters.',
      constraints: '1 <= |S| <= 10^5',
      sampleInput: w1, sampleOutput: `${uniqueChars(w1)}`,
      testCases: [
        { input: w1, output: `${uniqueChars(w1)}`, isSample: true },
        { input: w2, output: `${uniqueChars(w2)}`, isSample: false },
        { input: w3, output: `${uniqueChars(w3)}`, isSample: false },
      ],
    });
  }

  return problems;
}

// ─── Database insertion ─────────────────────────────────────────────
async function seedDatabase() {
  const client = new Client(DB_CONFIG);
  await client.connect();

  const maxProblem = await client.query('SELECT COALESCE(MAX(id), 0) as max_id FROM problems');
  const startId = parseInt(maxProblem.rows[0].max_id) + 1;
  console.log(`Starting from problem ID: ${startId}`);

  const problems = generateProblems(startId);
  console.log(`Generated ${problems.length} additional problems`);

  const maxTestCase = await client.query('SELECT COALESCE(MAX(id), 0) as max_id FROM test_cases');
  let testCaseId = parseInt(maxTestCase.rows[0].max_id) + 1;

  let insertedProblems = 0, insertedTestCases = 0;
  const BATCH_SIZE = 50;

  for (let batchStart = 0; batchStart < problems.length; batchStart += BATCH_SIZE) {
    const batch = problems.slice(batchStart, batchStart + BATCH_SIZE);
    await client.query('BEGIN');
    try {
      for (const p of batch) {
        await client.query(
          `INSERT INTO problems (id, title, description, difficulty, input_format, output_format, constraints, sample_input, sample_output, category, total_submissions, accepted_submissions, time_limit_ms, memory_limit_mb, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0,0,2000,256,NOW()) ON CONFLICT (id) DO NOTHING`,
          [p.id, p.title, p.description, p.difficulty, p.inputFormat, p.outputFormat, p.constraints, p.sampleInput, p.sampleOutput, p.category]
        );
        insertedProblems++;
        for (let i = 0; i < p.testCases.length; i++) {
          const tc = p.testCases[i];
          await client.query(
            `INSERT INTO test_cases (id, problem_id, input, expected_output, is_sample, order_index)
             VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
            [testCaseId++, p.id, tc.input, tc.output, tc.isSample, i]
          );
          insertedTestCases++;
        }
      }
      await client.query('COMMIT');
      process.stdout.write(`\r  Inserted ${insertedProblems}/${problems.length} problems, ${insertedTestCases} test cases...`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`\nBatch error at ${batchStart}: ${err.message}`);
    }
  }

  await client.query("SELECT setval('problems_id_seq', (SELECT COALESCE(MAX(id),0) FROM problems))");
  await client.query("SELECT setval('test_cases_id_seq', (SELECT COALESCE(MAX(id),0) FROM test_cases))");

  const total = await client.query('SELECT COUNT(*) as c FROM problems');
  const totalTc = await client.query('SELECT COUNT(*) as c FROM test_cases');
  console.log(`\n\nDone! Database now has ${total.rows[0].c} problems, ${totalTc.rows[0].c} test cases.`);
  await client.end();
}

seedDatabase().catch(console.error);
