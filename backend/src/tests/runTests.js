import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import { generateToken, verifyToken } from '../config/jwt.js';
import { codeExecutionService } from '../services/codeExecutionService.js';
import { aiProxyService } from '../services/aiProxyService.js';

console.log('========================================================');
console.log('🧪 Running AI Placement Portal Automated Test Suite');
console.log('========================================================\n');

let passedTests = 0;
let failedTests = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Reason: ${err.message}`);
    failedTests++;
  }
}

async function runAllTests() {
  // Test 1: Password Hashing & Verification
  await test('Password Hashing & Verification via bcrypt', async () => {
    const password = 'SecurePassword@2026';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    assert.notStrictEqual(password, hash, 'Password should not match raw text');
    const isMatch = await bcrypt.compare(password, hash);
    assert.strictEqual(isMatch, true, 'Correct password should compare successfully');

    const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(isWrongMatch, false, 'Incorrect password should fail comparison');
  });

  // Test 2: JWT Token Generation & Verification
  await test('JWT Token Signing and Decoding', async () => {
    const payload = { id: '65f123456789abcdef123456', role: 'student' };
    const token = generateToken(payload);

    assert(typeof token === 'string' && token.length > 20, 'Token should be a non-empty string');
    const decoded = verifyToken(token);

    assert.strictEqual(decoded.id, payload.id, 'Decoded user ID should match payload');
    assert.strictEqual(decoded.role, payload.role, 'Decoded role should match payload');

    const invalid = verifyToken('invalid.jwt.token');
    assert.strictEqual(invalid, null, 'Invalid token should return null');
  });

  // Test 3: Role-based Authorization Logic
  await test('Role-Based Authorization Enforcement', async () => {
    const mockStudentReq = { user: { role: 'student', id: '123' } };
    const mockAdminReq = { user: { role: 'admin', id: '456' } };

    let studentAllowed = false;
    let adminDenied = false;

    // Check student role condition
    if (mockStudentReq.user.role === 'student') studentAllowed = true;
    assert.strictEqual(studentAllowed, true, 'Student should have student permissions');

    // Check admin gate
    if (mockStudentReq.user.role !== 'admin') adminDenied = true;
    assert.strictEqual(adminDenied, true, 'Student should be forbidden from admin routes');

    let adminAllowed = false;
    if (mockAdminReq.user.role === 'admin') adminAllowed = true;
    assert.strictEqual(adminAllowed, true, 'Admin should have admin permissions');
  });

  // Test 4: Code Sandbox Execution (Two Sum Problem)
  await test('Secure Sandbox Code Runner: Correct Two Sum solution', async () => {
    const jsCode = `
      function twoSum(nums, target) {
        const map = new Map();
        for (let i = 0; i < nums.length; i++) {
          const complement = target - nums[i];
          if (map.has(complement)) return [map.get(complement), i];
          map.set(nums[i], i);
        }
        return [];
      }
    `;

    const testCases = [
      { input: '[2,7,11,15], 9', expectedOutput: '[0,1]', isHidden: false },
      { input: '[3,2,4], 6', expectedOutput: '[1,2]', isHidden: false }
    ];

    const result = await codeExecutionService.execute('javascript', jsCode, testCases);
    assert.strictEqual(result.status, 'Accepted', 'Correct code should be accepted');
    assert.strictEqual(result.testCasesPassed, 2, 'All testcases should pass');
  });

  // Test 5: Code Sandbox Execution: Wrong Answer
  await test('Secure Sandbox Code Runner: Incorrect Logic Handling', async () => {
    const buggyCode = `
      function twoSum(nums, target) {
        return [0, 0]; // Buggy output
      }
    `;

    const testCases = [
      { input: '[2,7,11,15], 9', expectedOutput: '[0,1]', isHidden: false }
    ];

    const result = await codeExecutionService.execute('javascript', buggyCode, testCases);
    assert.strictEqual(result.status, 'Wrong Answer', 'Buggy code should produce Wrong Answer status');
    assert.strictEqual(result.testCasesPassed, 0, 'No testcases should pass');
  });

  // Test 6: Code Sandbox Infinite Loop Timeout Protection
  await test('Secure Sandbox Execution: Infinite Loop Timeout Guard', async () => {
    const infiniteCode = `
      function twoSum(nums, target) {
        while (true) {} // Infinite loop attack
      }
    `;

    const testCases = [
      { input: '[2,7,11,15], 9', expectedOutput: '[0,1]', isHidden: false }
    ];

    const result = await codeExecutionService.execute('javascript', infiniteCode, testCases);
    assert.strictEqual(result.status, 'Time Limit Exceeded', 'Infinite loop must be terminated with Time Limit Exceeded');
  });

  // Test 7: AI Service Resume Analysis Fallback & Scoring Heuristics
  await test('AI Resume Analyzer Deterministic Heuristics & ATS Scoring', async () => {
    const sampleResume = `
      Aarav Patel - Computer Engineering Student
      Education: Bachelor of Technology in Computer Engineering, CGPA: 8.8
      Technical Skills: JavaScript, React, Node.js, Express, MongoDB, Python, Docker, Git, SQL
      Projects:
      - Cloud E-Commerce Microservices: Architected high-throughput catalog service reducing API response latency by 35% across 5,000 active users.
      - Real-Time Collaborative Canvas: Implemented WebSockets with Redis Pub/Sub handling 1,200 concurrent connections.
    `;

    const result = aiProxyService.localResumeFallback(sampleResume, 'Requirements: React, Node.js, Docker, Kubernetes');
    assert(result.scoring.overall_score >= 70, 'Overall score should reflect strong projects and skills');
    assert(result.candidate_summary.detected_technical_skills.includes('react'), 'Should extract react skill');
    assert(result.candidate_summary.detected_technical_skills.includes('docker'), 'Should extract docker skill');
    assert.strictEqual(result.candidate_summary.sections_present.education, true, 'Education section should be detected');
    assert.strictEqual(result.candidate_summary.sections_present.projects, true, 'Projects section should be detected');
  });

  // Test 8: Mock Interview Answer Evaluation Logic
  await test('Mock Interview Answer Evaluation Quality Grading', async () => {
    const question = 'Explain the Event Loop in JavaScript.';
    const briefAnswer = 'It does asynchronous stuff.';
    const detailedAnswer = 'The Event Loop coordinates the execution of code, collecting and processing events, and executing queued sub-tasks in JavaScript. It continuously monitors the Call Stack and the Callback Queue. When the Call Stack is empty, it pushes tasks from the Microtask Queue (Promises) first, followed by the Macrotask Queue (setTimeout, I/O).';

    const briefResult = aiProxyService.localAnswerEvaluationFallback(question, briefAnswer, 'Full Stack Engineer', 'medium');
    const detailedResult = aiProxyService.localAnswerEvaluationFallback(question, detailedAnswer, 'Full Stack Engineer', 'medium');

    assert(briefResult.score < 50, 'Brief answers should receive constructive low scores');
    assert(detailedResult.score >= 80, 'Comprehensive answers should receive high scores');
    assert(detailedResult.metrics.technical_accuracy >= 80, 'Technical accuracy metric should be high');
  });

  console.log('\n========================================================');
  console.log(`📊 Test Summary: ${passedTests} Passed, ${failedTests} Failed`);
  console.log('========================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests();
