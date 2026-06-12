// Exercises sourced from:
// https://github.com/dinanathsj29/javascript-exercise-beginners/tree/master/_examples-javascript-exercise-beginners

export interface JSExercise {
  title: string;
  description: string;
  starterCode: string;
}

const POOL: Record<string, JSExercise[]> = {
  '0-2': [
    {
      title: 'Swap Variables',
      description:
        'Swap the values of two variables `a = "hello"` and `b = "world"` WITHOUT using a third/temp variable.\nLog both values after swapping.\nExpected output:\na: "world"\nb: "hello"',
      starterCode: `let a = 'hello';
let b = 'world';

// Write your solution here

console.log('a:', a); // expected: "world"
console.log('b:', b); // expected: "hello"
`,
    },
    {
      title: 'Max of Three Numbers',
      description:
        'Write a function `maxNumber(a, b, c)` that returns the largest of three numbers WITHOUT using `Math.max()`.\n\nTest cases:\nmaxNumber(1, 2, 3)  → 3\nmaxNumber(9, 1, 5)  → 9\nmaxNumber(2, 7, 3)  → 7',
      starterCode: `function maxNumber(a, b, c) {
  // Write your solution here
}

console.log(maxNumber(1, 2, 3)); // 3
console.log(maxNumber(9, 1, 5)); // 9
console.log(maxNumber(2, 7, 3)); // 7
`,
    },
    {
      title: 'FizzBuzz',
      description:
        'Write a function `fizzBuzz(n)` that returns:\n- "Fizz" if n is divisible by 3\n- "Buzz" if n is divisible by 5\n- "FizzBuzz" if divisible by both\n- the number itself otherwise\n\nCall it for every number 1-20 and log the result.',
      starterCode: `function fizzBuzz(n) {
  // Write your solution here
}

for (let i = 1; i <= 20; i++) {
  console.log(fizzBuzz(i));
}
`,
    },
    {
      title: 'Odd or Even Loop',
      description:
        'Write a function `showOddEven(limit)` that logs whether each number from 1 to `limit` is "odd" or "even".\n\nExample output for limit = 5:\n1 → odd\n2 → even\n3 → odd\n4 → even\n5 → odd',
      starterCode: `function showOddEven(limit) {
  // Write your solution here
}

showOddEven(10);
`,
    },
    {
      title: 'Count Truthy & Falsy',
      description:
        'Write a function `countTruthyFalsy(arr)` that returns an object `{ truthy: N, falsy: N }` counting truthy and falsy values.\n\nExample:\ncountTruthyFalsy([1, 0, \'\', \'hello\', null, true, false, 42])\n→ { truthy: 4, falsy: 4 }',
      starterCode: `function countTruthyFalsy(arr) {
  // Write your solution here
}

console.log(countTruthyFalsy([1, 0, '', 'hello', null, true, false, 42]));
// { truthy: 4, falsy: 4 }
`,
    },
  ],

  '2-5': [
    {
      title: 'FizzBuzz (1-30)',
      description:
        'Write a function `fizzBuzz(n)` that returns "Fizz", "Buzz", "FizzBuzz", or the number. Then loop 1-30 and log each result. Handle non-number inputs by returning "NaN - Not a Number!".',
      starterCode: `function fizzBuzz(n) {
  // Write your solution here
}

for (let i = 1; i <= 30; i++) {
  console.log(fizzBuzz(i));
}
`,
    },
    {
      title: 'Sum of Multiples',
      description:
        'Write a function `sumOfMultiples(limit)` that returns the sum of all numbers from 1 to `limit` that are divisible by 3 or 5.\n\nTest cases:\nsumOfMultiples(10) → 33  (3+5+6+9+10)\nsumOfMultiples(20) → 98',
      starterCode: `function sumOfMultiples(limit) {
  // Write your solution here
}

console.log(sumOfMultiples(10)); // 33
console.log(sumOfMultiples(20)); // 98
`,
    },
    {
      title: 'Marks Average & Grade',
      description:
        'Write a function `getGrade(marks)` that takes an array of marks, calculates the average, and returns a letter grade:\nA: avg >= 90  |  B: avg >= 80  |  C: avg >= 70  |  D: avg >= 60  |  F: below 60',
      starterCode: `function getGrade(marks) {
  // Write your solution here
}

console.log(getGrade([90, 80, 85, 92, 88])); // 'A'
console.log(getGrade([70, 65, 78, 72]));       // 'C'
console.log(getGrade([50, 45, 55, 60]));       // 'F'
`,
    },
    {
      title: 'Sum of Any Arguments',
      description:
        'Write a function `sum()` using rest parameters (`...args`) that accepts any number of numeric arguments and returns their total sum.\n\nTest cases:\nsum(1, 2, 3, 4) → 10\nsum(10, 20)     → 30\nsum(5, -3, 2)   → 4',
      starterCode: `function sum(...args) {
  // Write your solution here — use rest parameters + reduce
}

console.log(sum(1, 2, 3, 4)); // 10
console.log(sum(10, 20));     // 30
console.log(sum(5, -3, 2));   // 4
`,
    },
    {
      title: 'Custom Array Includes',
      description:
        'Write a function `includes(arr, value)` that checks whether a value exists in an array WITHOUT using `Array.prototype.includes()` or `indexOf()`. Return `true` or `false`.',
      starterCode: `function includes(arr, value) {
  // No .includes() or .indexOf() allowed
}

console.log(includes([1, 2, 3], 2));       // true
console.log(includes([1, 2, 3], 5));       // false
console.log(includes(['a','b','c'], 'b')); // true
`,
    },
  ],

  '5-8': [
    {
      title: 'Get Prime Numbers',
      description:
        'Write a function `getPrimes(limit)` that returns an array of all prime numbers up to (and including) the given limit.\n\nTest cases:\ngetPrimes(20) → [2, 3, 5, 7, 11, 13, 17, 19]\ngetPrimes(10) → [2, 3, 5, 7]',
      starterCode: `function getPrimes(limit) {
  // Write your solution here
}

console.log(getPrimes(20)); // [2, 3, 5, 7, 11, 13, 17, 19]
console.log(getPrimes(10)); // [2, 3, 5, 7]
`,
    },
    {
      title: 'Create Range Array',
      description:
        'Write a function `range(start, end)` that returns an array of integers from `start` to `end` (inclusive). Throw an Error if `start > end`.\n\nTest cases:\nrange(1, 5)  → [1, 2, 3, 4, 5]\nrange(5, 10) → [5, 6, 7, 8, 9, 10]',
      starterCode: `function range(start, end) {
  // Write your solution here
}

console.log(range(1, 5));  // [1, 2, 3, 4, 5]
console.log(range(5, 10)); // [5, 6, 7, 8, 9, 10]
`,
    },
    {
      title: 'Count Occurrences',
      description:
        'Write a function `countOccurrences(arr, value)` that returns how many times `value` appears in `arr`.\n\nTest cases:\ncountOccurrences([1,2,3,1,2,1], 1)       → 3\ncountOccurrences([\'a\',\'b\',\'a\',\'c\'], \'a\') → 2',
      starterCode: `function countOccurrences(arr, value) {
  // Write your solution here
}

console.log(countOccurrences([1, 2, 3, 1, 2, 1], 1));          // 3
console.log(countOccurrences(['a', 'b', 'a', 'c', 'a'], 'a')); // 3
`,
    },
    {
      title: 'Array Filter → Sort → Map Pipeline',
      description:
        'Given the `students` array, use a single chain of `.filter()`, `.sort()`, and `.map()` to get names of students from 2019 with ranking >= 5, sorted by ranking descending.\n\nExpected: [\'Dan\', \'Bob\']',
      starterCode: `const students = [
  { name: 'Alice', year: 2019, ranking: 4 },
  { name: 'Bob',   year: 2019, ranking: 6 },
  { name: 'Carol', year: 2018, ranking: 8 },
  { name: 'Dan',   year: 2019, ranking: 7 },
  { name: 'Eve',   year: 2017, ranking: 3 },
];

const result = students
  // .filter(...)
  // .sort(...)
  // .map(...)
  ;

console.log(result); // ['Dan', 'Bob']
`,
    },
    {
      title: 'Exclude Values from Array',
      description:
        'Write a function `excludeValues(arr, ...values)` that returns a new array with all specified values removed. Do NOT mutate the original array.\n\nexcludeValues([1,2,3,4,5], 2, 4) → [1, 3, 5]',
      starterCode: `function excludeValues(arr, ...values) {
  // Write your solution here
}

console.log(excludeValues([1, 2, 3, 4, 5], 2, 4));          // [1, 3, 5]
console.log(excludeValues(['a','b','c','d'], 'b', 'd'));      // ['a', 'c']
`,
    },
  ],

  '8+': [
    {
      title: 'Deep Equal',
      description:
        'Write a function `deepEqual(a, b)` that returns `true` if two values are deeply equal — including nested objects and arrays. Do NOT use `JSON.stringify`.',
      starterCode: `function deepEqual(a, b) {
  // Write your solution here — no JSON.stringify
}

console.log(deepEqual({ x: 1, y: 2 }, { x: 1, y: 2 }));    // true
console.log(deepEqual({ x: 1 }, { x: 2 }));                  // false
console.log(deepEqual({ a: { b: 1 } }, { a: { b: 1 } }));   // true
console.log(deepEqual([1, 2, 3], [1, 2, 3]));                 // true
console.log(deepEqual([1, 2], [1, 2, 3]));                    // false
`,
    },
    {
      title: 'Factory vs Constructor',
      description:
        'Implement a factory function `createPerson(name, age)` AND a constructor function `Person(name, age)`. Both should return/produce an object with a `greet()` method returning "Hi, I\'m [name] and I\'m [age]".',
      starterCode: `// Factory function
function createPerson(name, age) {
  // Write here
}

// Constructor function
function Person(name, age) {
  // Write here
}

const p1 = createPerson('Alice', 30);
console.log(p1.greet()); // "Hi, I'm Alice and I'm 30"

const p2 = new Person('Bob', 25);
console.log(p2.greet()); // "Hi, I'm Bob and I'm 25"
`,
    },
    {
      title: 'Flatten & Sum (No flat())',
      description:
        'Write a function `flatSum(arr)` that takes a deeply nested array of numbers and returns the sum of ALL numbers inside it — without using `Array.prototype.flat()` or `flatMap()`.',
      starterCode: `function flatSum(arr) {
  // Write your solution — no flat() or flatMap() allowed
}

console.log(flatSum([1, [2, 3], [4, [5, 6]]]));       // 21
console.log(flatSum([[1, 2], [3, [4, [5]]]]));         // 15
console.log(flatSum([1, [2, [3, [4, [5]]]]]));         // 15
`,
    },
    {
      title: 'Array Max with reduce()',
      description:
        'Write a function `arrayMax(arr)` that finds the maximum number in an array using ONLY `Array.prototype.reduce()`. No `Math.max`, no sort, no loops.',
      starterCode: `function arrayMax(arr) {
  // Use only Array.reduce() — no Math.max, no sort, no loops
}

console.log(arrayMax([3, 1, 4, 1, 5, 9, 2, 6])); // 9
console.log(arrayMax([100, 50, 75]));             // 100
console.log(arrayMax([-3, -1, -7]));              // -1
`,
    },
    {
      title: 'Object Equality Check',
      description:
        'Write a function `areObjectsEqual(obj1, obj2)` that compares two flat objects (no nesting) and returns `true` if they have the same keys and values. Must work with any value types.',
      starterCode: `function areObjectsEqual(obj1, obj2) {
  // Write your solution here
}

console.log(areObjectsEqual({ a: 1, b: 2 }, { a: 1, b: 2 })); // true
console.log(areObjectsEqual({ a: 1, b: 2 }, { a: 1, b: 3 })); // false
console.log(areObjectsEqual({ a: 1 }, { a: 1, b: 2 }));       // false
`,
    },
  ],
};

// Pick `count` exercises for the given experience level using Fisher-Yates shuffle
export function pickExercises(experience: string, count: number = 4): JSExercise[] {
  const pool = POOL[experience] ?? POOL['0-2'];
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
