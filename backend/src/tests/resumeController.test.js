import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import pdfParse from 'pdf-parse';
import { Readable } from 'node:stream';
import { afterEach, mock, test } from 'node:test';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import StudentProfile from '../models/StudentProfile.js';
import { createResumeController, RESUME_MAX_BYTES } from '../controllers/resumeController.js';
import { uploadResume } from '../routes/resumeRoutes.js';

const userId = '507f1f77bcf86cd799439011';
const analysisId = '507f1f77bcf86cd799439013';
const resumeText = 'JANE DOE\nBackend engineer\nSkills: JavaScript, Node.js and SQL.\nExperience: Built a booking API and wrote integration tests for its authentication routes.';
const report = {
  summary: 'The resume identifies relevant backend skills but gives little evidence about outcomes.',
  candidateSummary: {
    detectedTechnicalSkills: ['JavaScript', 'Node.js', 'SQL'],
    detectedSoftSkills: [],
    sectionsPresent: { education: false, projects: false, experience: true, certifications: false }
  },
  scoring: {
    overallScore: 0, atsReadabilityScore: 0, skillsDepthScore: 0, impactMetricsScore: 0,
    completenessScore: 0, scoringRationale: 'The scores reflect the submitted evidence.'
  },
  jdMatch: { hasTargetJd: false, matchPercentage: null, matchingSkills: [], missingSkills: [], fitVerdict: 'No target job description supplied.', recommendations: [] },
  strengths: ['The stated backend stack is clear.'],
  issues: [{ priority: 'high', section: 'Experience', issue: 'Impact is not demonstrated.', suggestion: 'Add a measured outcome only if supported by your records.', evidence: 'Built a booking API' }],
  sectionFeedback: [{ section: 'Education', status: 'missing', feedback: 'Add relevant education details.' }],
  bulletImprovements: [{ original: 'Built a booking API', improved: 'Built a booking API with integration tests for authentication routes.', reason: 'Combine the concrete implementation and testing evidence.' }],
  actionableSuggestions: ['Explain the API responsibilities and your individual contribution.'],
  disclaimer: 'These are AI-assisted resume suggestions; an ATS or interview outcome cannot be guaranteed.',
  provider: 'gemini:test-model'
};

afterEach(() => mock.restoreAll());

function request(body = {}, file) {
  return { body, file, params: { id: analysisId }, user: { _id: userId } };
}

function response() {
  return {
    statusCode: 200, body: null,
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

function setup(overrides = {}) {
  const aiService = { analyzeResume: mock.fn(async () => structuredClone(report)) };
  const parsePDF = mock.fn(async () => ({ text: resumeText }));
  const controller = createResumeController({ aiService, parsePDF, ...overrides });
  let stored;
  const create = mock.method(ResumeAnalysis, 'create', async data => {
    stored = new ResumeAnalysis({ _id: analysisId, ...data });
    return stored;
  });
  return { ...controller, aiService, parsePDF, create, getStored: () => stored };
}

function file(name = 'resume.txt', mime = 'text/plain', buffer = Buffer.from(resumeText)) {
  return { originalname: name, mimetype: mime, buffer, size: buffer.length };
}

test('manual analysis sends the actual text and JD, persists the complete report, and preserves zero scores', async () => {
  const aiService = { analyzeResume: mock.fn(async () => ({
    ...structuredClone(report),
    jdMatch: { ...report.jdMatch, hasTargetJd: true, matchPercentage: 0, fitVerdict: 'The required Java skill is not evidenced.', missingSkills: ['Java'], recommendations: ['Describe Java experience only if you have it.'] }
  })) };
  const state = setup({ aiService });
  const profile = mock.method(StudentProfile, 'findOne', async () => { throw new Error('Unexpected profile update'); });
  const res = await invoke(state.analyzeResume, request({ resumeText: `  ${resumeText}  `, jobDescription: '  Java backend engineer  ' }));
  assert.equal(res.statusCode, 201);
  assert.equal(aiService.analyzeResume.mock.callCount(), 1);
  assert.deepEqual(aiService.analyzeResume.mock.calls[0].arguments[0], { resumeText, jobDescription: 'Java backend engineer' });
  const stored = state.getStored();
  assert.equal(stored.rawText, resumeText);
  assert.equal(stored.targetJobDescription, 'Java backend engineer');
  assert.equal(String(stored.user), userId);
  assert.equal(stored.scoring.overallScore, 0);
  assert.equal(stored.scoring.atsReadabilityScore, 0);
  assert.equal(stored.scoring.completenessScore, 0);
  assert.equal(stored.jdMatch.matchPercentage, 0);
  assert.equal(stored.issues[0].evidence, report.issues[0].evidence);
  assert.equal(stored.sectionFeedback[0].status, 'missing');
  assert.equal(stored.bulletImprovements[0].improved, report.bulletImprovements[0].improved);
  assert.equal(res.body.data.rawText, undefined);
  assert.equal(profile.mock.callCount(), 0);
});

test('a whitespace-only JD is absent and produces a null match instead of a fabricated percentage', async () => {
  const state = setup();
  const res = await invoke(state.analyzeResume, request({ resumeText, jobDescription: ' \n\t ' }));
  assert.equal(res.statusCode, 201);
  assert.equal(state.aiService.analyzeResume.mock.calls[0].arguments[0].jobDescription, '');
  assert.equal(res.body.data.jdMatch.hasTargetJd, false);
  assert.equal(res.body.data.jdMatch.matchPercentage, null);
});

test('invalid field types, unknown fields, short/oversized text, and oversized JDs fail before AI or database calls', async () => {
  const state = setup();
  const invalid = [
    { resumeText: 123 }, { resumeText: [resumeText] }, { resumeText, jobDescription: false },
    { resumeText, jobDescription: ['a', 'b'] }, { resumeText, extra: 'unknown' },
    { resumeText: 'too short' }, { resumeText: 'x'.repeat(30001) },
    { resumeText, jobDescription: 'x'.repeat(15001) }
  ];
  for (const body of invalid) {
    assert.equal((await invoke(state.analyzeResume, request(body))).statusCode, 400);
  }
  assert.equal(state.aiService.analyzeResume.mock.callCount(), 0);
  assert.equal(state.create.mock.callCount(), 0);
});

test('a valid UTF-8 TXT upload retains Unicode and uses the actual file contents', async () => {
  const state = setup();
  const text = resumeText.replace('JANE DOE', 'JOSÉ PATEL');
  const uploaded = file('Résumé.TXT', 'application/octet-stream', Buffer.from(text, 'utf8'));
  const res = await invoke(state.analyzeResume, request({}, uploaded));
  assert.equal(res.statusCode, 201);
  assert.equal(state.aiService.analyzeResume.mock.calls[0].arguments[0].resumeText, text);
  assert.equal(state.getStored().fileName, 'Résumé.TXT');
  assert.equal(state.getStored().fileType, 'text/plain');
  assert.equal(state.getStored().fileSize, Buffer.byteLength(text));
  assert.equal(state.parsePDF.mock.callCount(), 0);
});

test('PDF uploads are parsed and only extracted text is sent for AI analysis', async () => {
  const state = setup();
  const uploaded = file('resume.pdf', 'application/pdf', Buffer.from('%PDF-1.7\nunit test PDF data'));
  const res = await invoke(state.analyzeResume, request({}, uploaded));
  assert.equal(res.statusCode, 201);
  assert.equal(state.parsePDF.mock.callCount(), 1);
  assert.deepEqual(Array.from(state.parsePDF.mock.calls[0].arguments[0]), Array.from(uploaded.buffer));
  assert.equal(state.aiService.analyzeResume.mock.calls[0].arguments[0].resumeText, resumeText);
  assert.equal(state.getStored().fileType, 'application/pdf');
});

test('a real text PDF is extracted by PDF.js in the current Node runtime', async () => {
  const state = setup({ parsePDF: pdfParse });
  const bytes = readFileSync(new URL('./fixtures/resume.pdf', import.meta.url));
  const res = await invoke(state.analyzeResume, request({}, file('resume.pdf', 'application/pdf', bytes)));
  assert.equal(res.statusCode, 201, res.body.message);
  const sent = state.aiService.analyzeResume.mock.calls[0].arguments[0];
  assert.match(sent.resumeText, /Student Progress Dashboard/);
  assert.match(sent.resumeText, /40 students/);
  assert.equal(state.getStored().fileSize, bytes.length);
});

test('unsupported files, MIME/extension mismatches, fake PDFs, and PDFs disguised as TXT are rejected', async () => {
  const state = setup();
  const invalid = [
    file('resume.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
    file('resume.pdf', 'text/plain'), file('resume.txt', 'application/pdf'),
    file('resume.pdf', 'application/pdf', Buffer.from(resumeText)),
    file('resume.txt', 'text/plain', Buffer.from('%PDF-1.7\n' + resumeText))
  ];
  for (const uploaded of invalid) {
    assert.equal((await invoke(state.analyzeResume, request({}, uploaded))).statusCode, 400);
  }
  assert.equal(state.parsePDF.mock.callCount(), 0);
  assert.equal(state.aiService.analyzeResume.mock.callCount(), 0);
  assert.equal(state.create.mock.callCount(), 0);
});

test('binary, UTF-16, and invalid UTF-8 TXT data cannot become a resume', async () => {
  const state = setup();
  for (const buffer of [Buffer.from([0xff, 0xfe, 0x61]), Buffer.from(resumeText, 'utf16le'), Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from(resumeText)])]) {
    assert.equal((await invoke(state.analyzeResume, request({}, file('resume.txt', 'text/plain', buffer)))).statusCode, 400);
  }
  assert.equal(state.aiService.analyzeResume.mock.callCount(), 0);
  assert.equal(state.create.mock.callCount(), 0);
});

test('PDF parsing failures return a safe message without parser diagnostics or partial analyses', async () => {
  const parsePDF = mock.fn(async () => { throw new Error('Internal parser diagnostic with a private path'); });
  const state = setup({ parsePDF });
  const res = await invoke(state.analyzeResume, request({}, file('resume.pdf', 'application/pdf', Buffer.from('%PDF-1.7\ninvalid'))));
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /valid, unlocked PDF/);
  assert.equal(res.body.message.includes('Internal parser'), false);
  assert.equal(state.aiService.analyzeResume.mock.callCount(), 0);
  assert.equal(state.create.mock.callCount(), 0);
});

test('scanned, unreadable, and overlong PDFs produce useful extraction errors before AI calls', async () => {
  for (const text of ['', 'Scanned image', 'x'.repeat(30001)]) {
    const parsePDF = mock.fn(async () => ({ text }));
    const state = setup({ parsePDF });
    const res = await invoke(state.analyzeResume, request({}, file('resume.pdf', 'application/pdf', Buffer.from('%PDF-1.7\nplaceholder'))));
    assert.equal(res.statusCode, 400);
    if (text.length < 50) assert.match(res.body.message, /OCR.*paste/);
    assert.equal(state.aiService.analyzeResume.mock.callCount(), 0);
    assert.equal(state.create.mock.callCount(), 0);
    mock.restoreAll();
  }
});

test('oversized files return 413 and ambiguous text plus file input is rejected', async () => {
  const state = setup();
  const uploaded = file();
  uploaded.size = RESUME_MAX_BYTES + 1;
  assert.equal((await invoke(state.analyzeResume, request({}, uploaded))).statusCode, 413);
  assert.equal((await invoke(state.analyzeResume, request({ resumeText }, file()))).statusCode, 400);
  assert.equal(state.aiService.analyzeResume.mock.callCount(), 0);
  assert.equal(state.create.mock.callCount(), 0);
});

test('AI provider failure produces no saved analysis or user profile mutation', async () => {
  const aiService = { analyzeResume: mock.fn(async () => {
    throw Object.assign(new Error('AI quota unavailable. Please retry.'), { statusCode: 503, code: 'AI_QUOTA_EXCEEDED' });
  }) };
  const state = setup({ aiService });
  const profile = mock.method(StudentProfile, 'findOne', async () => { throw new Error('Unexpected profile query'); });
  const res = await invoke(state.analyzeResume, request({ resumeText }));
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.code, 'AI_QUOTA_EXCEEDED');
  assert.equal(state.create.mock.callCount(), 0);
  assert.equal(profile.mock.callCount(), 0);
});

test('history is scoped to the current user and redacts source text', async () => {
  const state = setup();
  let selected;
  let sorted;
  const lookup = mock.method(ResumeAnalysis, 'find', () => ({ select: fields => {
    selected = fields;
    return { sort: async order => {
      sorted = order;
      return [{ _id: analysisId, rawText: resumeText, ...report }];
    } };
  } }));
  const res = await invoke(state.getResumeHistory, request());
  assert.equal(res.statusCode, 200);
  assert.deepEqual(lookup.mock.calls[0].arguments[0], { user: userId });
  assert.equal(selected, '-rawText');
  assert.deepEqual(sorted, { createdAt: -1 });
  assert.equal(res.body.data[0].rawText, undefined);
  assert.equal(res.body.data[0].summary, report.summary);
});

test('analysis retrieval validates IDs, checks ownership, and redacts raw resume text', async () => {
  const state = setup();
  const lookup = mock.method(ResumeAnalysis, 'findOne', async () => null);
  const bad = request();
  bad.params.id = 'invalid-id';
  assert.equal((await invoke(state.getResumeById, bad)).statusCode, 400);
  assert.equal(lookup.mock.callCount(), 0);
  assert.equal((await invoke(state.getResumeById, request())).statusCode, 404);
  assert.deepEqual(lookup.mock.calls[0].arguments[0], { _id: analysisId, user: userId });
  mock.method(ResumeAnalysis, 'findOne', async () => ({ _id: analysisId, rawText: resumeText, ...report }));
  const res = await invoke(state.getResumeById, request());
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.rawText, undefined);
  assert.equal(res.body.data.issues[0].evidence, report.issues[0].evidence);
});

function multipart(parts) {
  const boundary = 'CodexResumeUnitTestBoundary';
  const chunks = [];
  for (const part of parts) {
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${part.name}"${part.filename ? `; filename="${part.filename}"` : ''}\r\n${part.filename ? `Content-Type: ${part.type || 'text/plain'}\r\n` : ''}\r\n`));
    chunks.push(Buffer.isBuffer(part.content) ? part.content : Buffer.from(part.content));
    chunks.push(Buffer.from('\r\n'));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return { buffer: Buffer.concat(chunks), contentType: `multipart/form-data; boundary=${boundary}` };
}

async function invokeUpload(parts) {
  const { buffer, contentType } = multipart(parts);
  const req = Readable.from([buffer]);
  req.headers = { 'content-type': contentType, 'content-length': String(buffer.length) };
  req.method = 'POST';
  return new Promise((resolve, reject) => {
    const res = response();
    const json = res.json;
    res.json = function (body) {
      json.call(this, body);
      resolve({ req, res, nextCalled: false });
      return this;
    };
    req.on('error', reject);
    uploadResume(req, res, error => error ? reject(error) : resolve({ req, res, nextCalled: true }));
  });
}

test('multipart upload accepts one supported file with the optional JD and passes its real bytes', { timeout: 5000 }, async () => {
  const result = await invokeUpload([
    { name: 'resume', filename: 'resume.txt', content: resumeText },
    { name: 'jobDescription', content: 'Backend engineer' }
  ]);
  assert.equal(result.nextCalled, true);
  assert.equal(result.req.file.originalname, 'resume.txt');
  assert.equal(result.req.file.buffer.toString('utf8'), resumeText);
  assert.equal(result.req.body.jobDescription, 'Backend engineer');
});

test('multipart unsupported formats and files above 5 MB receive local 400/413 responses', { timeout: 5000 }, async () => {
  const unsupported = await invokeUpload([{ name: 'resume', filename: 'resume.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', content: 'binary placeholder' }]);
  assert.equal(unsupported.res.statusCode, 400);
  assert.equal(unsupported.nextCalled, false);
  const oversized = await invokeUpload([{ name: 'resume', filename: 'resume.txt', content: Buffer.alloc(RESUME_MAX_BYTES + 1, 'a') }]);
  assert.equal(oversized.res.statusCode, 413);
  assert.equal(oversized.nextCalled, false);
});

test('multipart repeated files, wrong file field names, and oversized fields return safe upload errors', { timeout: 5000 }, async () => {
  const repeated = await invokeUpload([
    { name: 'resume', filename: 'one.txt', content: resumeText },
    { name: 'resume', filename: 'two.txt', content: resumeText }
  ]);
  assert.equal(repeated.res.statusCode, 400);
  const wrongField = await invokeUpload([{ name: 'otherFile', filename: 'resume.txt', content: resumeText }]);
  assert.equal(wrongField.res.statusCode, 400);
  const longField = await invokeUpload([{ name: 'resumeText', content: 'a'.repeat(120001) }]);
  assert.equal(longField.res.statusCode, 413);
});

test('repeated multipart text fields are rejected as invalid strings before AI analysis', { timeout: 5000 }, async () => {
  const uploaded = await invokeUpload([
    { name: 'resumeText', content: resumeText },
    { name: 'resumeText', content: resumeText }
  ]);
  assert.equal(uploaded.nextCalled, true);
  const state = setup();
  uploaded.req.user = { _id: userId };
  uploaded.req.params = { id: analysisId };
  const res = await invoke(state.analyzeResume, uploaded.req);
  assert.equal(res.statusCode, 400);
  assert.equal(state.aiService.analyzeResume.mock.callCount(), 0);
});

test('resume schema preserves null JD matches, validates bounds, and omits raw text from normal queries', async () => {
  const valid = new ResumeAnalysis({ user: userId, fileName: 'resume.txt', fileSize: Buffer.byteLength(resumeText), fileType: 'text/plain', rawText: resumeText, ...structuredClone(report) });
  await valid.validate();
  assert.equal(valid.jdMatch.matchPercentage, null);
  assert.equal(ResumeAnalysis.schema.path('rawText').options.select, false);
  valid.scoring.overallScore = 101;
  await assert.rejects(valid.validate(), error => Boolean(error.errors?.['scoring.overallScore']));
  valid.scoring.overallScore = 0;
  valid.jdMatch.matchPercentage = -1;
  await assert.rejects(valid.validate(), error => Boolean(error.errors?.['jdMatch.matchPercentage']));
});
