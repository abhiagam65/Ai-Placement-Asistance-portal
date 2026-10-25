import { basename, extname } from 'node:path';
import { TextDecoder } from 'node:util';
import mongoose from 'mongoose';
import pdfParse from 'pdf-parse';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import { resumeAIService } from '../services/resumeAIService.js';

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
const PDF_HEADER = Buffer.from('%PDF-');
const binaryControls = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const readableTextMessage = 'Could not extract enough readable resume text. For scanned or image-only PDFs, run OCR first or paste the readable resume text (at least 50 characters).';

export function supportedResumeType(file) {
  if (typeof file?.originalname !== 'string' || typeof file?.mimetype !== 'string') return null;
  const name = basename(file.originalname.replaceAll('\\', '/'));
  if (!name || name.length > 255 || name.includes('\0')) return null;
  const extension = extname(name).toLowerCase();
  const mime = file.mimetype.split(';')[0].trim().toLowerCase();
  if (extension === '.pdf' && ['application/pdf', 'application/octet-stream'].includes(mime)) return 'application/pdf';
  if (extension === '.txt' && ['text/plain', 'application/octet-stream'].includes(mime)) return 'text/plain';
  return null;
}

const inputError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const normalizeText = text => text.replace(/\r\n?/g, '\n').replace(/\f/g, '\n').trim();
const publicAnalysis = analysis => {
  const data = typeof analysis.toObject === 'function' ? analysis.toObject() : { ...analysis };
  delete data.rawText;
  return data;
};

const handleResumeError = (error, res, next) => {
  if (Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode <= 599) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.code && { code: error.code })
    });
  }
  return next(error);
};

export function createResumeController({ parsePDF = pdfParse, aiService = resumeAIService } = {}) {
  return {
    async analyzeResume(req, res, next) {
      try {
        const body = req.body || {};
        const { jobDescription = '', resumeText = '' } = body;
        if (typeof jobDescription !== 'string' || typeof resumeText !== 'string') {
          throw inputError('Resume text and job description must be text fields.');
        }
        if (Object.keys(body).some(field => !['resumeText', 'jobDescription'].includes(field))) {
          throw inputError('Accepted text fields are resumeText and jobDescription.');
        }
        if (jobDescription.length > 15000) {
          throw inputError('Job description must contain at most 15,000 characters.');
        }
        const targetJobDescription = jobDescription.trim();
        let text = resumeText;
        let fileName = 'Pasted_resume.txt';
        let fileType = 'text/plain';
        let fileSize = Buffer.byteLength(resumeText, 'utf8');

        if (req.file) {
          if (resumeText.trim()) throw inputError('Choose one resume source: an uploaded file or pasted text.');
          const file = req.file;
          fileType = supportedResumeType(file);
          if (!fileType) throw inputError('Unsupported resume format. Upload a PDF or UTF-8 TXT file.');
          if (!Buffer.isBuffer(file.buffer)) throw inputError('The uploaded resume could not be read. Please upload it again.');
          if (file.buffer.length > RESUME_MAX_BYTES || file.size > RESUME_MAX_BYTES) {
            throw inputError('Resume file exceeds the 5 MB limit.', 413);
          }
          fileName = basename(file.originalname.replaceAll('\\', '/'));
          fileSize = file.buffer.length;
          const hasPDFHeader = file.buffer.subarray(0, PDF_HEADER.length).equals(PDF_HEADER);

          if (fileType === 'application/pdf') {
            if (!hasPDFHeader) throw inputError('This file does not contain a valid PDF header. Upload a readable PDF or paste the resume text.');
            try {
              // PDF.js treats Buffer.slice differently from Uint8Array.slice on
              // recent Node versions; copy the bytes before parsing.
              const parsed = await parsePDF(Uint8Array.from(file.buffer));
              text = typeof parsed?.text === 'string' ? parsed.text : '';
            } catch {
              throw inputError('The PDF could not be read. Check that it is a valid, unlocked PDF, or paste the resume text.');
            }
          } else {
            if (hasPDFHeader) throw inputError('The uploaded file contains PDF data. Upload it with a .pdf filename.');
            try {
              text = new TextDecoder('utf-8', { fatal: true }).decode(file.buffer);
            } catch {
              throw inputError('The TXT file must contain readable UTF-8 text. Save it as UTF-8 or paste the resume text.');
            }
          }
        }

        text = normalizeText(text);
        if (text.length < 50 || binaryControls.test(text)) throw inputError(readableTextMessage);
        if (text.length > 30000) throw inputError('Resume text must contain at most 30,000 characters. Upload a shorter resume or paste a focused version.');

        const analysis = await aiService.analyzeResume({ resumeText: text, jobDescription: targetJobDescription });
        const saved = await ResumeAnalysis.create({
          ...analysis,
          user: req.user._id,
          fileName,
          fileSize,
          fileType,
          rawText: text,
          targetJobDescription,
          jdMatch: {
            ...analysis.jdMatch,
            hasTargetJd: Boolean(targetJobDescription),
            matchPercentage: targetJobDescription ? analysis.jdMatch.matchPercentage : null
          }
        });

        return res.status(201).json({
          success: true,
          message: 'Resume analyzed successfully.',
          data: publicAnalysis(saved)
        });
      } catch (error) {
        return handleResumeError(error, res, next);
      }
    },

    async getResumeHistory(req, res, next) {
      try {
        const history = await ResumeAnalysis.find({ user: req.user._id }).select('-rawText').sort({ createdAt: -1 });
        return res.json({ success: true, data: history.map(publicAnalysis) });
      } catch (error) {
        return handleResumeError(error, res, next);
      }
    },

    async getResumeById(req, res, next) {
      try {
        if (!mongoose.isObjectIdOrHexString(req.params.id)) {
          throw inputError('Invalid resume analysis ID.');
        }
        const analysis = await ResumeAnalysis.findOne({ _id: req.params.id, user: req.user._id });
        if (!analysis) return res.status(404).json({ success: false, message: 'Resume analysis record not found.' });
        return res.json({ success: true, data: publicAnalysis(analysis) });
      } catch (error) {
        return handleResumeError(error, res, next);
      }
    }
  };
}

export const { analyzeResume, getResumeHistory, getResumeById } = createResumeController();
