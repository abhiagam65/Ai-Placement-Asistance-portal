import StudentProfile from '../models/StudentProfile.js';
import { aiProxyService } from '../services/aiProxyService.js';

export const getCareerGuidance = async (req, res, next) => {
  try {
    const { targetRole: customRole } = req.query;

    let profile = await StudentProfile.findOne({ user: req.user._id });
    if (!profile) {
      profile = {
        branch: 'Computer Engineering',
        targetRole: 'Full Stack Software Engineer',
        skills: ['JavaScript', 'React', 'Node.js', 'SQL'],
        cgpa: 8.2
      };
    }

    const effectiveRole = customRole || profile.targetRole || 'Full Stack Software Engineer';

    const guidance = await aiProxyService.generateCareerRoadmap(
      profile.skills || [],
      effectiveRole,
      profile.branch || 'Computer Engineering'
    );

    res.json({
      success: true,
      data: {
        studentContext: {
          branch: profile.branch,
          cgpa: profile.cgpa,
          targetRole: effectiveRole,
          currentSkills: profile.skills
        },
        guidance
      }
    });
  } catch (error) {
    next(error);
  }
};
