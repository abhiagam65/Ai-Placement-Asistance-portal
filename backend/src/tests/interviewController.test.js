import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import InterviewSession from '../models/InterviewSession.js';
import StudentProfile from '../models/StudentProfile.js';
import { interviewAIService } from '../services/interviewAIService.js';
import {
  getInterviewHistory,
  getInterviewSessionById,
  startInterview,
  submitInterviewAnswer
} from '../controllers/interviewController.js';

const userId = '507f1f77bcf86cd799439011';
const sessionId = '507f1f77bcf86cd799439012';
const settings = { role: 'Backend Engineer', interviewType: 'technical', difficulty: 'advanced', totalQuestions: 2 };
const zeroEvaluation = {
  score: 0,
  technicalAccuracy: 0,
  clarityCommunication: 0,
  depthAndCompleteness: 0,
  feedback: 'The response does not answer the question.',
  strengths: [],
  areasForImprovement: ['Explain the requested mechanism.'],
  modelIdealAnswer: 'A concrete explanation of the requested mechanism.'
};

afterEach(() => mock.restoreAll());

function request(body = {}, id = sessionId) {
  return { body, params: { sessionId: id }, user: { _id: userId } };
}

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

async function invoke(handler, req) {
  const res = response();
  let forwardedError;
  await handler(req, res, error => { forwardedError = error; });
  assert.equal(forwardedError, undefined, forwardedError?.message);
  return res;
}

function plannedQuestions(count = 2) {
  return Array.from({ length: count }, (_, index) => ({
    questionIndex: index,
    question: `Explain backend mechanism ${index + 1}.`,
    category: `Backend topic ${index + 1}`,
    expectedFocusPoints: [`Private rubric ${index + 1}`]
  }));
}

function makeSession(overrides = {}) {
  const session = new InterviewSession({
    _id: sessionId,
    user: userId,
    ...settings,
    provider: 'gemini:test-model',
    questions: plannedQuestions(),
    ...overrides
  });
  const save = mock.method(session, 'save', async () => session);
  return { session, save };
}

test('start rejects invalid interview settings before AI generation or persistence', async () => {
  const generate = mock.method(interviewAIService, 'generateQuestions', async () => { throw new Error('Unexpected AI request'); });
  const create = mock.method(InterviewSession, 'create', async () => { throw new Error('Unexpected persistence'); });
  const invalid = [
    { role: '' }, { role: 'ab' }, { role: 'a'.repeat(121) }, { role: 42 },
    { interviewType: 'anything' }, { difficulty: 'impossible' },
    { totalQuestions: 0 }, { totalQuestions: 11 }, { totalQuestions: 2.5 }, { totalQuestions: '2' }
  ];
  for (const invalidSettings of invalid) {
    const res = await invoke(startInterview, request({ ...settings, ...invalidSettings }));
    assert.equal(res.statusCode, 400, JSON.stringify(invalidSettings));
  }
  assert.equal(generate.mock.callCount(), 0);
  assert.equal(create.mock.callCount(), 0);
});

test('start generates the whole requested interview once and exposes only its first question', async () => {
  const generate = mock.method(interviewAIService, 'generateQuestions', async () => ({ questions: plannedQuestions(3), provider: 'gemini:test-model' }));
  let stored;
  mock.method(InterviewSession, 'create', async data => {
    stored = new InterviewSession({ _id: sessionId, ...data });
    return stored;
  });
  const res = await invoke(startInterview, request({ ...settings, role: '  Backend Engineer  ', totalQuestions: 3 }));
  assert.equal(res.statusCode, 201);
  assert.equal(generate.mock.callCount(), 1);
  assert.deepEqual(generate.mock.calls[0].arguments[0], { ...settings, totalQuestions: 3 });
  assert.equal(stored.questions.length, 3);
  assert.deepEqual(stored.questions.map(question => question.questionIndex), [0, 1, 2]);
  assert.equal(String(stored.user), userId);
  assert.deepEqual(res.body.currentQuestion, { index: 0, question: plannedQuestions()[0].question, category: plannedQuestions()[0].category });
  assert.equal(res.body.provider, 'gemini:test-model');
  assert.equal(res.body.questions, undefined);
  assert.equal(JSON.stringify(res.body).includes('Private rubric'), false);
});

test('generation failure returns the sanitized provider error without creating a session', async () => {
  mock.method(interviewAIService, 'generateQuestions', async () => {
    throw Object.assign(new Error('AI quota is unavailable. Please retry.'), { statusCode: 503, code: 'AI_QUOTA_EXCEEDED' });
  });
  const create = mock.method(InterviewSession, 'create', async () => { throw new Error('Unexpected persistence'); });
  const res = await invoke(startInterview, request(settings));
  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.body, { success: false, message: 'AI quota is unavailable. Please retry.', code: 'AI_QUOTA_EXCEEDED' });
  assert.equal(create.mock.callCount(), 0);
});

test('answer validation rejects malformed IDs, non-text answers, oversized answers, and absent question indices', async () => {
  const findOne = mock.method(InterviewSession, 'findOne', async () => { throw new Error('Unexpected query'); });
  const invalid = [
    request({ answer: 'An answer', questionIndex: 0 }, 'not-an-object-id'),
    request({ answer: 123, questionIndex: 0 }),
    request({ answer: '   ', questionIndex: 0 }),
    request({ answer: 'a'.repeat(12001), questionIndex: 0 }),
    request({ answer: 'An answer' }),
    request({ answer: 'An answer', questionIndex: '0' }),
    request({ answer: 'An answer', questionIndex: -1 })
  ];
  for (const req of invalid) {
    assert.equal((await invoke(submitInterviewAnswer, req)).statusCode, 400);
  }
  assert.equal(findOne.mock.callCount(), 0);
});

test('answer lookup is scoped to the authenticated owner', async () => {
  const findOne = mock.method(InterviewSession, 'findOne', async () => null);
  const evaluate = mock.method(interviewAIService, 'evaluateAnswer', async () => { throw new Error('Unexpected evaluation'); });
  const res = await invoke(submitInterviewAnswer, request({ answer: 'An actual response', questionIndex: 0 }));
  assert.equal(res.statusCode, 404);
  assert.deepEqual(findOne.mock.calls[0].arguments[0], { _id: sessionId, user: userId });
  assert.equal(evaluate.mock.callCount(), 0);
});

test('answer evaluation receives the actual question and rubric, preserves zero scores, and advances once', async () => {
  const { session, save } = makeSession({ interviewType: 'hr' });
  mock.method(InterviewSession, 'findOne', async () => session);
  const evaluate = mock.method(interviewAIService, 'evaluateAnswer', async () => zeroEvaluation);
  const res = await invoke(submitInterviewAnswer, request({ answer: '  I do not know.  ', questionIndex: 0 }));
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.isCompleted, false);
  assert.equal(save.mock.callCount(), 1);
  assert.equal(evaluate.mock.callCount(), 1);
  assert.deepEqual(evaluate.mock.calls[0].arguments[0], {
    question: session.questions[0].question,
    expectedFocusPoints: session.questions[0].expectedFocusPoints,
    answer: 'I do not know.',
    role: settings.role,
    interviewType: 'hr',
    difficulty: settings.difficulty
  });
  assert.equal(res.body.evaluation.score, 0);
  assert.equal(res.body.evaluation.technicalAccuracy, 0);
  assert.equal(res.body.evaluation.clarityCommunication, 0);
  assert.equal(res.body.evaluation.depthAndCompleteness, 0);
  assert.equal(session.questions[0].studentAnswer, 'I do not know.');
  assert.ok(session.questions[0].answeredAt instanceof Date);
  assert.equal(session.currentQuestionIndex, 1);
  assert.equal(res.body.questionIndex, 0);
  assert.equal(res.body.nextQuestion.index, 1);
  assert.equal(res.body.nextQuestion.expectedFocusPoints, undefined);
});

test('provider evaluation failure preserves the stored answer and current position for retry', async () => {
  const { session, save } = makeSession();
  mock.method(InterviewSession, 'findOne', async () => session);
  mock.method(interviewAIService, 'evaluateAnswer', async () => {
    throw Object.assign(new Error('AI temporarily unavailable.'), { statusCode: 503, code: 'AI_UNAVAILABLE' });
  });
  const before = session.toObject();
  const res = await invoke(submitInterviewAnswer, request({ answer: 'My original answer', questionIndex: 0 }));
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.code, 'AI_UNAVAILABLE');
  assert.equal(save.mock.callCount(), 0);
  assert.deepEqual(session.toObject(), before);
});

test('a stale or duplicate question index cannot advance or charge for AI evaluation', async () => {
  const { session, save } = makeSession({ currentQuestionIndex: 1 });
  mock.method(InterviewSession, 'findOne', async () => session);
  const evaluate = mock.method(interviewAIService, 'evaluateAnswer', async () => { throw new Error('Unexpected evaluation'); });
  const res = await invoke(submitInterviewAnswer, request({ answer: 'A stale answer', questionIndex: 0 }));
  assert.equal(res.statusCode, 409);
  assert.equal(evaluate.mock.callCount(), 0);
  assert.equal(save.mock.callCount(), 0);
});

test('legacy interviews without a generated question plan require a new interview', async () => {
  const { session, save } = makeSession({ questions: plannedQuestions(1), provider: 'deterministic-engine' });
  mock.method(InterviewSession, 'findOne', async () => session);
  const evaluate = mock.method(interviewAIService, 'evaluateAnswer', async () => { throw new Error('Unexpected evaluation'); });
  const res = await invoke(submitInterviewAnswer, request({ answer: 'A previous-session answer', questionIndex: 0 }));
  assert.equal(res.statusCode, 409);
  assert.match(res.body.message, /Start a new AI interview/);
  assert.equal(evaluate.mock.callCount(), 0);
  assert.equal(save.mock.callCount(), 0);
});

test('final answer computes the actual average, persists results, and updates completed-session statistics', async () => {
  const { session, save } = makeSession({ currentQuestionIndex: 1 });
  session.questions[0].studentAnswer = 'My first answer';
  session.questions[0].answeredAt = new Date();
  session.questions[0].evaluation = { ...zeroEvaluation, score: 20 };
  mock.method(InterviewSession, 'findOne', async () => session);
  mock.method(interviewAIService, 'evaluateAnswer', async () => ({ ...zeroEvaluation, score: 80, technicalAccuracy: 80 }));
  const profile = { stats: {}, save: async () => {} };
  const profileSave = mock.method(profile, 'save', async () => profile);
  mock.method(StudentProfile, 'findOne', async () => profile);
  const completed = mock.method(InterviewSession, 'find', async () => [session, { overallScore: 100 }]);

  const res = await invoke(submitInterviewAnswer, request({ answer: 'My final answer', questionIndex: 1 }));
  assert.equal(res.statusCode, 200);
  assert.equal(save.mock.callCount(), 1);
  assert.equal(res.body.isCompleted, true);
  assert.equal(res.body.nextQuestion, null);
  assert.equal(res.body.overallScore, 50);
  assert.equal(session.status, 'completed');
  assert.ok(session.completedAt instanceof Date);
  assert.equal(res.body.session.questions.length, 2);
  assert.equal(res.body.session.questions[0].studentAnswer, 'My first answer');
  assert.equal(res.body.session.questions[1].studentAnswer, 'My final answer');
  assert.equal(JSON.stringify(res.body.session).includes('expectedFocusPoints'), false);
  assert.equal(profileSave.mock.callCount(), 1);
  assert.deepEqual(profile.stats, { mockInterviewsCompleted: 2, averageInterviewScore: 75 });
  assert.deepEqual(completed.mock.calls[0].arguments[0], { user: userId, status: 'completed' });
});

test('a completed interview rejects further answers without AI calls', async () => {
  const { session, save } = makeSession({ status: 'completed' });
  mock.method(InterviewSession, 'findOne', async () => session);
  const evaluate = mock.method(interviewAIService, 'evaluateAnswer', async () => { throw new Error('Unexpected evaluation'); });
  const res = await invoke(submitInterviewAnswer, request({ answer: 'Another answer', questionIndex: 0 }));
  assert.equal(res.statusCode, 409);
  assert.equal(evaluate.mock.callCount(), 0);
  assert.equal(save.mock.callCount(), 0);
});

test('an optimistic-concurrency conflict returns 409 and does not update profile statistics', async () => {
  const { session } = makeSession({ totalQuestions: 1, questions: plannedQuestions(1) });
  mock.method(session, 'save', async () => { throw Object.assign(new Error('Version changed'), { name: 'VersionError' }); });
  mock.method(InterviewSession, 'findOne', async () => session);
  mock.method(interviewAIService, 'evaluateAnswer', async () => zeroEvaluation);
  const profile = mock.method(StudentProfile, 'findOne', async () => { throw new Error('Unexpected profile write'); });
  const res = await invoke(submitInterviewAnswer, request({ answer: 'Concurrent response', questionIndex: 0 }));
  assert.equal(res.statusCode, 409);
  assert.equal(profile.mock.callCount(), 0);
  assert.equal(InterviewSession.schema.get('optimisticConcurrency'), true);
});

test('profile-statistics failure does not discard an already saved completed interview', async () => {
  const { session, save } = makeSession({ totalQuestions: 1, questions: plannedQuestions(1) });
  mock.method(InterviewSession, 'findOne', async () => session);
  mock.method(interviewAIService, 'evaluateAnswer', async () => zeroEvaluation);
  mock.method(StudentProfile, 'findOne', async () => { throw new Error('Profile storage temporarily unavailable'); });
  mock.method(console, 'warn', () => {});
  const res = await invoke(submitInterviewAnswer, request({ answer: 'I do not know.', questionIndex: 0 }));
  assert.equal(save.mock.callCount(), 1);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.isCompleted, true);
  assert.equal(res.body.overallScore, 0);
});

test('session retrieval hides future questions and grading rubrics while preserving answered results', async () => {
  const { session } = makeSession({ totalQuestions: 3, questions: plannedQuestions(3), currentQuestionIndex: 1 });
  session.questions[0].studentAnswer = 'A saved response';
  session.questions[0].answeredAt = new Date();
  session.questions[0].evaluation = zeroEvaluation;
  const lookup = mock.method(InterviewSession, 'findOne', async () => session);
  const res = await invoke(getInterviewSessionById, request());
  assert.equal(res.statusCode, 200);
  assert.deepEqual(lookup.mock.calls[0].arguments[0], { _id: sessionId, user: userId });
  assert.equal(res.body.data.questions.length, 2);
  assert.equal(res.body.data.questions[0].evaluation.score, 0);
  assert.equal(res.body.data.currentQuestion.index, 1);
  assert.equal(res.body.data.questions.some(question => question.questionIndex === 2), false);
  assert.equal(JSON.stringify(res.body).includes('expectedFocusPoints'), false);
});

test('session retrieval validates IDs and enforces ownership', async () => {
  const lookup = mock.method(InterviewSession, 'findOne', async () => null);
  assert.equal((await invoke(getInterviewSessionById, request({}, 'bad-id'))).statusCode, 400);
  assert.equal(lookup.mock.callCount(), 0);
  assert.equal((await invoke(getInterviewSessionById, request())).statusCode, 404);
  assert.deepEqual(lookup.mock.calls[0].arguments[0], { _id: sessionId, user: userId });
});

test('history exposes the provider and only queries the authenticated user', async () => {
  let selected;
  let sorted;
  const records = [{ _id: sessionId, provider: 'gemini:test-model', status: 'completed' }];
  const lookup = mock.method(InterviewSession, 'find', () => ({
    select(fields) {
      selected = fields;
      return { sort: async order => { sorted = order; return records; } };
    }
  }));
  const res = await invoke(getInterviewHistory, request());
  assert.deepEqual(lookup.mock.calls[0].arguments[0], { user: userId });
  assert.match(selected, /provider/);
  assert.deepEqual(sorted, { createdAt: -1 });
  assert.deepEqual(res.body.data, records);
});

test('the model enforces question-count bounds and uses optimistic concurrency', async () => {
  assert.equal(InterviewSession.schema.get('optimisticConcurrency'), true);
  for (const totalQuestions of [0, 11, 2.5]) {
    const { session } = makeSession({ totalQuestions });
    await assert.rejects(session.validate(), error => Boolean(error.errors?.totalQuestions));
  }
});
