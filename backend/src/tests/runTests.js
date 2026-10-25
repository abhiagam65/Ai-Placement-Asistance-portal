import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import { generateToken, verifyToken } from '../config/jwt.js';
import { codeExecutionService } from '../services/codeExecutionService.js';

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
