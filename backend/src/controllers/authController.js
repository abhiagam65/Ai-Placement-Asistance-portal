import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import { generateToken } from '../config/jwt.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, rollNumber, college, branch, graduationYear, cgpa, targetRole, skills, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'student',
      phone: phone || ''
    });

    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.create({
        user: user._id,
        rollNumber: rollNumber || '',
        college: college || 'Government College of Engineering & Technology',
        branch: branch || 'Computer Engineering',
        graduationYear: graduationYear || 2026,
        cgpa: cgpa ? Number(cgpa) : 8.2,
        targetRole: targetRole || 'Full Stack Software Engineer',
        skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : ['JavaScript', 'React', 'Node.js', 'Data Structures']),
        preparationScore: 68
      });
    }

    const token = generateToken({ id: user._id, role: user.role });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      profile
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
    }

    const token = generateToken({ id: user._id, role: user.role });
    const profile = user.role === 'student' ? await StudentProfile.findOne({ user: user._id }) : null;

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      profile
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const profile = user.role === 'student' ? await StudentProfile.findOne({ user: user._id }) : null;

    res.json({
      success: true,
      user,
      profile
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar, rollNumber, college, branch, graduationYear, cgpa, targetRole, skills, bio, github, linkedin, portfolio } = req.body;

    // Update user base
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;
    await user.save();

    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ user: user._id });
      if (!profile) {
        profile = new StudentProfile({ user: user._id });
      }

      if (rollNumber !== undefined) profile.rollNumber = rollNumber;
      if (college !== undefined) profile.college = college;
      if (branch !== undefined) profile.branch = branch;
      if (graduationYear !== undefined) profile.graduationYear = Number(graduationYear);
      if (cgpa !== undefined) profile.cgpa = Number(cgpa);
      if (targetRole !== undefined) profile.targetRole = targetRole;
      if (bio !== undefined) profile.bio = bio;
      if (github !== undefined) profile.github = github;
      if (linkedin !== undefined) profile.linkedin = linkedin;
      if (portfolio !== undefined) profile.portfolio = portfolio;

      if (skills !== undefined) {
        profile.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
      }

      // Recalculate preparation score dynamically
      let score = 50;
      if (profile.cgpa >= 8.5) score += 12;
      else if (profile.cgpa >= 7.5) score += 8;
      if (profile.skills.length >= 6) score += 15;
      else if (profile.skills.length >= 3) score += 8;
      if (profile.github) score += 5;
      if (profile.linkedin) score += 5;
      if (profile.stats.quizzesAttempted >= 3) score += 6;
      if (profile.stats.codingProblemsSolved >= 5) score += 7;
      profile.preparationScore = Math.min(98, score);

      await profile.save();
    }

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone
      },
      profile
    });
  } catch (error) {
    next(error);
  }
};
