import test from 'node:test';
import assert from 'node:assert/strict';
import { createResumeAIService } from '../services/resumeAIService.js';

const env = { GEMINI_API_KEY: 'test-server-key', GEMINI_MODEL: 'gemini-test' };
const resumeText = 'Alex Example\nEducation: B.Tech in Computer Engineering\nSkills: JavaScript, React, SQL\nProjects\nBuilt a React dashboard for 20 students.\nImplemented SQL queries for student records.';
const jobDescription = 'Frontend engineer with React, JavaScript, SQL, and TypeScript experience.';
const report = {
  summary: 'The resume demonstrates a relevant React project but needs clearer outcomes.',
  candidateSummary: { detectedTechnicalSkills: ['JavaScript', 'React', 'SQL'], detectedSoftSkills: [], sectionsPresent: { education: true, projects: true, experience: false, certifications: false } },
  scoring: { atsReadabilityScore: 80, skillsDepthScore: 60, impactMetricsScore: 40, completenessScore: 80, scoringRationale: 'Clear headings and a relevant project; the outcomes and contact information need more detail.' },
  strengths: ['The React project identifies a real user group.'],
  issues: [{ priority: 'high', section: 'Projects', issue: 'The result is not explained.', suggestion: 'Describe what the dashboard helped the students do.', evidence: 'Built a React dashboard for 20 students.' }],
  sectionFeedback: [{ section: 'Projects', status: 'needs_improvement', feedback: 'Add context about the problem and verified results.' }],
  bulletImprovements: [{ original: 'Built a React dashboard for 20 students.', improved: 'Developed a React dashboard serving 20 students.', reason: 'Uses a clear action verb while preserving the stated facts.' }],
  jdMatch: { hasTargetJd: true, matchPercentage: 75, matchingSkills: ['React', 'JavaScript', 'SQL'], missingSkills: ['TypeScript'], fitVerdict: 'Relevant frontend skills; TypeScript experience is not evidenced.', recommendations: ['Mention TypeScript only if you have genuine experience with it.'] },
  actionableSuggestions: ['Explain the dashboard outcomes and add contact information.']
};
const copy = () => structuredClone(report);
const response = output => ({ ok: true, json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(output) }] } }] }) });
const serviceFor = output => createResumeAIService({ env, fetchImpl: async () => response(output) });

test('resume analysis sends the complete resume and optional JD to Gemini with a structured report schema', async () => {
  const service = createResumeAIService({ env, fetchImpl: async (url, options) => {
    assert.equal(url.includes(env.GEMINI_API_KEY), false);
    assert.equal(options.headers['x-goog-api-key'], env.GEMINI_API_KEY);
    const payload = JSON.parse(options.body);
    assert.deepEqual(JSON.parse(payload.contents[0].parts[0].text), { resumeText, jobDescription });
    assert.ok(payload.generationConfig.responseFormat.text.schema.properties.issues);
    assert.match(payload.systemInstruction.parts[0].text, /Never invent achievements/);
    assert.match(payload.systemInstruction.parts[0].text, /untrusted resume analysis data/);
    return response(report);
  } });
  const analysis = await service.analyzeResume({ resumeText, jobDescription });
  assert.equal(analysis.provider, 'gemini:gemini-test');
  assert.equal(analysis.scoring.overallScore, 65);
  assert.equal(analysis.jdMatch.matchPercentage, 75);
  assert.equal(analysis.candidateSummary.sectionsPresent.experience, false);
});

test('no JD means no job match, invented skill gaps, or percentage even if the model supplies them', async () => {
  const analysis = await serviceFor(report).analyzeResume({ resumeText, jobDescription: '   ' });
  assert.deepEqual(analysis.jdMatch, { hasTargetJd: false, matchPercentage: null, matchingSkills: [], missingSkills: [], fitVerdict: '', recommendations: [] });
});

test('zero dimension and JD match scores remain zero and missing sections remain false', async () => {
  const result = copy();
  for (const field of ['atsReadabilityScore', 'skillsDepthScore', 'impactMetricsScore', 'completenessScore']) result.scoring[field] = 0;
  result.jdMatch.matchPercentage = 0;
  const analysis = await serviceFor(result).analyzeResume({ resumeText, jobDescription });
  assert.equal(analysis.scoring.overallScore, 0);
  assert.equal(analysis.scoring.atsReadabilityScore, 0);
  assert.equal(analysis.jdMatch.matchPercentage, 0);
  assert.equal(analysis.candidateSummary.sectionsPresent.certifications, false);
});

test('a report cannot be fabricated from malformed, missing, or out-of-range model fields', async () => {
  const invalid = [
    null, {}, { ...copy(), summary: '' }, { ...copy(), scoring: { ...report.scoring, atsReadabilityScore: 101 } },
    { ...copy(), scoring: { ...report.scoring, skillsDepthScore: '80' } },
    { ...copy(), candidateSummary: { ...report.candidateSummary, sectionsPresent: { education: true } } },
    { ...copy(), issues: [null] }, { ...copy(), sectionFeedback: [] },
    { ...copy(), bulletImprovements: [{ original: 'A', improved: '', reason: 'B' }] },
    { ...copy(), actionableSuggestions: [] }
  ];
  for (const result of invalid) await assert.rejects(serviceFor(result).analyzeResume({ resumeText, jobDescription }), { code: 'INVALID_AI_RESPONSE' });
});

test('JD results must contain valid scores and cannot list the same skill as matching and missing', async () => {
  for (const jdMatch of [
    null, { ...report.jdMatch, hasTargetJd: false }, { ...report.jdMatch, matchPercentage: null },
    { ...report.jdMatch, matchPercentage: -1 }, { ...report.jdMatch, missingSkills: ['react'] }
  ]) await assert.rejects(serviceFor({ ...copy(), jdMatch }).analyzeResume({ resumeText, jobDescription }), { code: 'INVALID_AI_RESPONSE' });
});

test('rewrites keep real source bullets and exclude invented metrics or unrelated source text', async () => {
  const result = copy();
  result.bulletImprovements.push(
    { original: report.bulletImprovements[0].original, improved: 'Served 20 students and improved performance by 80%.', reason: 'Unsupported invented outcome.' },
    { original: 'Managed a team of engineers.', improved: 'Led a team of engineers.', reason: 'This experience is not in the resume.' }
  );
  const analysis = await serviceFor(result).analyzeResume({ resumeText });
  assert.deepEqual(analysis.bulletImprovements, report.bulletImprovements);
});

test('unsupported purported evidence is not displayed as a quotation from the resume', async () => {
  const result = copy();
  result.issues[0].evidence = 'The candidate has no engineering ability.';
  const analysis = await serviceFor(result).analyzeResume({ resumeText });
  assert.equal(analysis.issues[0].evidence, '');
  assert.equal(analysis.issues[0].suggestion, report.issues[0].suggestion);
});

test('an unconfigured provider or a provider failure returns an error rather than a canned report', async () => {
  const unconfigured = createResumeAIService({ env: {}, fetchImpl: async () => assert.fail('Unexpected network request') });
  await assert.rejects(unconfigured.analyzeResume({ resumeText }), { code: 'AI_NOT_CONFIGURED', statusCode: 503 });
  const unavailable = createResumeAIService({ env, fetchImpl: async () => ({ ok: false, status: 429 }) });
  await assert.rejects(unavailable.analyzeResume({ resumeText }), { code: 'AI_QUOTA_EXCEEDED', statusCode: 503 });
});
