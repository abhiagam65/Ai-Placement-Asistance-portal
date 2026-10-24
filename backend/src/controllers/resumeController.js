import pdfParse from 'pdf-parse';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import StudentProfile from '../models/StudentProfile.js';
import { aiProxyService } from '../services/aiProxyService.js';

export const analyzeResume = async (req, res, next) => {
  try {
    const file = req.file;
    const { jobDescription = '', resumeText: manualText = '' } = req.body;

    let textToAnalyze = manualText.trim();
    let fileName = 'Manual_Input.txt';
    let fileSize = textToAnalyze.length;
    let fileType = 'text/plain';

    if (file) {
      fileName = file.originalname;
      fileSize = file.size;
      fileType = file.mimetype;

      if (file.mimetype === 'application/pdf') {
        try {
          const pdfData = await pdfParse(file.buffer);
          textToAnalyze = pdfData.text;
        } catch (pdfErr) {
          return res.status(400).json({
            success: false,
            message: `Failed to extract text from PDF: ${pdfErr.message}. Ensure the file is not corrupted or password-protected.`
          });
        }
      } else if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
        textToAnalyze = file.buffer.toString('utf-8');
      } else {
        // Fallback for docx/other formats
        textToAnalyze = file.buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      }
    }

    if (!textToAnalyze || textToAnalyze.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract sufficient text from the resume. Please ensure the document contains readable text or paste your resume text directly.'
      });
    }

    // Call AI Proxy service (delegates to Python AI microservice or uses local resilient deterministic engine)
    const analysis = await aiProxyService.analyzeResume(textToAnalyze, jobDescription);

    // Save to Database
    const savedAnalysis = await ResumeAnalysis.create({
      user: req.user._id,
      fileName,
      fileSize,
      fileType,
      rawText: textToAnalyze.slice(0, 10000),
      candidateSummary: {
        detectedTechnicalSkills: analysis.candidate_summary?.detected_technical_skills || [],
        detectedSoftSkills: analysis.candidate_summary?.detected_soft_skills || [],
        sectionsPresent: analysis.candidate_summary?.sections_present || {
          education: true,
          projects: true,
          experience: true,
          certifications: false
        }
      },
      scoring: {
        overallScore: analysis.scoring?.overall_score || 72,
        atsReadabilityScore: analysis.scoring?.ats_readability_score || 75,
        skillsDepthScore: analysis.scoring?.skills_depth_score || 70,
        impactMetricsScore: analysis.scoring?.impact_metrics_score || 65,
        completenessScore: analysis.scoring?.completeness_score || 80,
        scoringRationale: analysis.scoring?.scoring_rationale || ''
      },
      targetJobDescription: jobDescription,
      jdMatch: {
        hasTargetJd: Boolean(jobDescription),
        matchPercentage: analysis.jd_match?.match_percentage || 74,
        matchingSkills: analysis.jd_match?.matching_skills || [],
        missingSkills: analysis.jd_match?.missing_skills || [],
        fitVerdict: analysis.jd_match?.fit_verdict || 'Moderate Fit'
      },
      actionableSuggestions: analysis.actionable_suggestions || [],
      disclaimer: analysis.disclaimer || 'This analysis provides structural and keyword guidance based on modern recruitment heuristics. No automated tool can guarantee bypassing ATS or securing interview invitations.',
      provider: analysis.provider || 'deterministic-engine'
    });

    // Automatically update student profile skills with newly detected skills
    const profile = await StudentProfile.findOne({ user: req.user._id });
    if (profile && analysis.candidate_summary?.detected_technical_skills) {
      const combinedSkills = Array.from(new Set([
        ...profile.skills,
        ...analysis.candidate_summary.detected_technical_skills.map(s => s.trim())
      ]));
      profile.skills = combinedSkills;
      await profile.save();
    }

    res.status(201).json({
      success: true,
      message: 'Resume analyzed successfully.',
      data: savedAnalysis
    });
  } catch (error) {
    next(error);
  }
};

export const getResumeHistory = async (req, res, next) => {
  try {
    const history = await ResumeAnalysis.find({ user: req.user._id })
      .select('-rawText')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

export const getResumeById = async (req, res, next) => {
  try {
    const analysis = await ResumeAnalysis.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!analysis) {
      return res.status(404).json({ success: false, message: 'Resume analysis record not found.' });
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};
