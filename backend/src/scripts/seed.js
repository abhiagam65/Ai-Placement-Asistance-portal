import mongoose from 'mongoose';
import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Company from '../models/Company.js';
import JobListing from '../models/JobListing.js';
import JobApplication from '../models/JobApplication.js';
import QuizQuestion from '../models/QuizQuestion.js';
import CodingProblem from '../models/CodingProblem.js';
import Announcement from '../models/Announcement.js';
import StudyTask from '../models/StudyTask.js';
import { connectDB, closeDB } from '../config/db.js';

export const ensureRealJobUrls = async () => {
  const realUrlMap = {
    'Google India': 'https://www.google.com/about/careers/applications/jobs/results/?q=Software%20Engineer',
    'Microsoft IDC': 'https://jobs.careers.microsoft.com/global/en/search?q=Software%20Engineer&lc=India',
    'Amazon Web Services': 'https://www.amazon.jobs/en/search?base_query=Software+Development+Engineer&country=IND',
    'Goldman Sachs': 'https://www.goldmansachs.com/careers/students/programs/india/summer-analyst-internship.html',
    'Tata Consultancy Services': 'https://www.tcs.com/careers/india/entry-level-hiring'
  };

  const jobs = await JobListing.find().populate('company');
  for (const job of jobs) {
    const compName = job.company?.name;
    if (compName && realUrlMap[compName]) {
      job.applyUrl = realUrlMap[compName];
      await job.save();
    }
  }
  console.log('[Seed] Verified and updated real career application URLs for active placement listings.');
};

export const seedDatabaseIfEmpty = async () => {
  const adminExists = await User.findOne({ role: 'admin' });
  if (adminExists) {
    console.log('[Seed] Database already contains admin user. Verifying real job URLs...');
    await ensureRealJobUrls();
    return;
  }
  console.log('[Seed] Database is empty. Seeding initial test data, questions, companies, and accounts...');
  await seedDatabase();
  await ensureRealJobUrls();
};

export const seedDatabase = async () => {
  // 1. Users & Profiles
  console.log('[Seed] Creating demo admin and student...');
  const admin = await User.create({
    name: 'Placement Dean Prof. Sharma',
    email: 'admin@placement.edu',
    password: 'Admin@123',
    role: 'admin',
    phone: '+91 9876543210'
  });

  const student = await User.create({
    name: 'Aarav Patel',
    email: 'student@placement.edu',
    password: 'Student@123',
    role: 'student',
    phone: '+91 9811223344'
  });

  const studentProfile = await StudentProfile.create({
    user: student._id,
    rollNumber: '2022-CE-042',
    college: 'Government College of Engineering & Technology',
    branch: 'Computer Engineering',
    graduationYear: 2026,
    cgpa: 8.75,
    activeBacklogs: 0,
    targetRole: 'Full Stack Software Engineer',
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'MongoDB', 'Python', 'SQL', 'Git', 'Docker'],
    bio: 'Final year computer engineering undergraduate focused on cloud-native systems, scalable microservices, and DSA.',
    github: 'https://github.com/aaravpatel-demo',
    linkedin: 'https://linkedin.com/in/aaravpatel-demo',
    portfolio: 'https://aaravpatel.dev',
    preparationScore: 78,
    stats: {
      quizzesAttempted: 4,
      quizzesAverageScore: 82,
      codingProblemsSolved: 6,
      mockInterviewsCompleted: 2,
      averageInterviewScore: 80,
      applicationsSubmitted: 2
    }
  });

  // 2. Companies
  console.log('[Seed] Creating top recruiting companies...');
  const companies = await Company.create([
    {
      name: 'Google India',
      logo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=128&q=80',
      industry: 'Cloud & Consumer Technology',
      website: 'https://careers.google.com',
      tier: 'Tier 1 Product',
      location: 'Bengaluru / Hyderabad',
      description: 'Global leader in search, cloud computing, artificial intelligence, and operating systems.'
    },
    {
      name: 'Microsoft IDC',
      logo: 'https://images.unsplash.com/photo-1642132652859-3ef5a1048fd1?w=128&q=80',
      industry: 'Enterprise Software & Azure Cloud',
      website: 'https://careers.microsoft.com',
      tier: 'Tier 1 Product',
      location: 'Bengaluru / Noida / Hyderabad',
      description: 'Leading global developer of enterprise software, personal computers, Azure services, and gaming.'
    },
    {
      name: 'Amazon Web Services',
      logo: 'https://images.unsplash.com/photo-1523474253246-63e03d383db4?w=128&q=80',
      industry: 'E-commerce & Cloud Infrastructure',
      website: 'https://amazon.jobs',
      tier: 'Tier 1 Product',
      location: 'Bengaluru / Chennai',
      description: 'The world’s most comprehensive and broadly adopted cloud platform with 200+ fully featured services.'
    },
    {
      name: 'Goldman Sachs',
      logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128&q=80',
      industry: 'Financial Technology & Investment Banking',
      website: 'https://goldmansachs.com/careers',
      tier: 'FinTech / Core',
      location: 'Bengaluru',
      description: 'Premier global financial institution delivering engineering solutions for high-frequency trading and risk platforms.'
    },
    {
      name: 'Tata Consultancy Services',
      logo: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=128&q=80',
      industry: 'IT Services & Consulting',
      website: 'https://tcs.com/careers',
      tier: 'Tier 2 Services',
      location: 'Pan India / Pune / Mumbai',
      description: 'India’s largest multinational IT services and consulting company known for its Digital and Prime hiring initiatives.'
    }
  ]);

  // 3. Job Listings
  console.log('[Seed] Creating job listings with eligibility rules...');
  const now = new Date();
  const jobs = await JobListing.create([
    {
      company: companies[0]._id,
      title: 'Associate Software Development Engineer (SWE)',
      role: 'Full Stack / Systems Engineer',
      ctc: '28 - 34 LPA',
      stipend: '₹1,10,000 / month',
      location: 'Bengaluru / Hybrid',
      type: 'Intern + FTE',
      eligibility: {
        minCgpa: 8.0,
        allowedBranches: ['Computer Engineering', 'Information Technology', 'Electronics & Telecom'],
        maxBacklogs: 0
      },
      requiredSkills: ['Data Structures', 'Algorithms', 'C++', 'Java', 'Python', 'Distributed Systems'],
      description: 'Design and ship mission-critical software solutions impacting billions of users. Work closely with cross-functional teams to engineer low-latency, scalable microservices.',
      deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      openings: 8,
      applyUrl: 'https://www.google.com/about/careers/applications/jobs/results/?q=Software%20Engineer',
      status: 'Active'
    },
    {
      company: companies[1]._id,
      title: 'Software Engineer - Azure Cloud Core',
      role: 'Backend & Cloud Engineer',
      ctc: '24 - 28 LPA',
      stipend: '₹95,000 / month',
      location: 'Hyderabad / Bengaluru',
      type: 'Intern + FTE',
      eligibility: {
        minCgpa: 7.5,
        allowedBranches: ['Computer Engineering', 'Information Technology'],
        maxBacklogs: 0
      },
      requiredSkills: ['C#', 'Go', 'Distributed Systems', 'Cloud Networking', 'REST APIs', 'SQL'],
      description: 'Build enterprise-grade cloud control planes and compute orchestration backends for Microsoft Azure. Requires strong knowledge of OS, concurrency, and memory safety.',
      deadline: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      openings: 12,
      applyUrl: 'https://jobs.careers.microsoft.com/global/en/search?q=Software%20Engineer&lc=India',
      status: 'Active'
    },
    {
      company: companies[2]._id,
      title: 'Graduate SDE 1 - Distributed Platforms',
      role: 'Software Development Engineer',
      ctc: '22 - 26 LPA',
      stipend: '₹85,000 / month',
      location: 'Bengaluru',
      type: 'Full-time',
      eligibility: {
        minCgpa: 7.0,
        allowedBranches: ['Computer Engineering', 'Information Technology', 'All'],
        maxBacklogs: 0
      },
      requiredSkills: ['Java', 'Python', 'Object-Oriented Design', 'NoSQL', 'AWS Services'],
      description: 'Own entire lifecycle of scalable software components. Work with customer-obsessed leaders to write clean, maintainable code with high test coverage and observability.',
      deadline: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000),
      openings: 15,
      applyUrl: 'https://www.amazon.jobs/en/search?base_query=Software+Development+Engineer&country=IND',
      status: 'Active'
    },
    {
      company: companies[3]._id,
      title: 'Summer Technology Analyst - Quantitative & Platform',
      role: 'FinTech Software Developer',
      ctc: '20 - 24 LPA',
      stipend: '₹75,000 / month',
      location: 'Bengaluru',
      type: 'Intern + FTE',
      eligibility: {
        minCgpa: 7.8,
        allowedBranches: ['Computer Engineering', 'Information Technology', 'Mathematics & Computing'],
        maxBacklogs: 0
      },
      requiredSkills: ['Python', 'C++', 'Algorithms', 'Relational Databases', 'Financial Algorithms'],
      description: 'Develop low-latency market transaction pipelines and quantitative risk modeling tools. Strong mathematical aptitude and clean coding discipline are required.',
      deadline: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000),
      openings: 6,
      applyUrl: 'https://www.goldmansachs.com/careers/students/programs/india/summer-analyst-internship.html',
      status: 'Active'
    },
    {
      company: companies[4]._id,
      title: 'TCS Digital Engineer / Innovations Lab',
      role: 'Full Stack & AI Engineer',
      ctc: '7.5 - 11 LPA',
      stipend: '₹35,000 / month',
      location: 'Pune / Mumbai / Bengaluru',
      type: 'Full-time',
      eligibility: {
        minCgpa: 6.5,
        allowedBranches: ['Computer Engineering', 'Information Technology', 'Electronics & Telecom', 'Electrical'],
        maxBacklogs: 1
      },
      requiredSkills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Git', 'Java'],
      description: 'Join the premier TCS Digital cadence working on cutting-edge cloud architectures, next-gen mobile platforms, and enterprise digital transformations.',
      deadline: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      openings: 50,
      applyUrl: 'https://www.tcs.com/careers/india/entry-level-hiring',
      status: 'Active'
    }
  ]);

  // Seed sample application
  console.log('[Seed] Creating demo student job application...');
  await JobApplication.create({
    user: student._id,
    jobListing: jobs[0]._id,
    resumeUrl: 'Aarav_Patel_Placement_Resume.pdf',
    status: 'Shortlisted',
    statusHistory: [
      { status: 'Applied', updatedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), notes: 'Student application submitted.' },
      { status: 'Shortlisted', updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), notes: 'Resume screened and selected for Online Assessment (OA).' }
    ],
    notes: 'Online Assessment scheduled for Friday 10:00 AM IST.'
  });

  // 4. Aptitude Questions (30+ questions)
  console.log('[Seed] Seeding starter aptitude question bank...');
  await QuizQuestion.create([
    // Quantitative Aptitude
    {
      category: 'quantitative',
      topic: 'Percentages & Profit Loss',
      difficulty: 'easy',
      questionText: 'A laptop originally priced at ₹60,000 is sold at a 15% discount. If the retailer still makes a 20% profit on the cost price, what was the cost price for the retailer?',
      options: ['₹42,500', '₹45,000', '₹40,000', '₹48,000'],
      correctOptionIndex: 0,
      explanation: 'Selling price after 15% discount = 60,000 * 0.85 = ₹51,000. Since selling price yields 20% profit: Cost Price * 1.20 = 51,000 => Cost Price = 51,000 / 1.20 = ₹42,500.'
    },
    {
      category: 'quantitative',
      topic: 'Time, Speed & Distance',
      difficulty: 'medium',
      questionText: 'Two trains running in opposite directions cross a man standing on the platform in 27 seconds and 17 seconds respectively and they cross each other in 23 seconds. What is the ratio of their speeds?',
      options: ['3 : 2', '2 : 3', '3 : 5', '4 : 3'],
      correctOptionIndex: 0,
      explanation: 'Let lengths be L1 and L2, and speeds S1 and S2. L1 = 27*S1, L2 = 17*S2. When crossing each other: (27*S1 + 17*S2) / (S1 + S2) = 23 => 27*S1 + 17*S2 = 23*S1 + 23*S2 => 4*S1 = 6*S2 => S1 / S2 = 6 / 4 = 3 / 2.'
    },
    {
      category: 'quantitative',
      topic: 'Time & Work',
      difficulty: 'medium',
      questionText: 'Pipe A can fill a tank in 12 hours, while Pipe B can fill it in 15 hours. If both pipes are opened together and after 3 hours Pipe A is closed, how many more hours will Pipe B take to fill the rest of the tank?',
      options: ['8 hours 15 mins', '8 hours 45 mins', '7 hours 30 mins', '9 hours'],
      correctOptionIndex: 0,
      explanation: 'Combined rate of A + B = 1/12 + 1/15 = (5 + 4)/60 = 9/60 = 3/20 per hour. In 3 hours, work done = 3 * (3/20) = 9/20. Remaining work = 1 - 9/20 = 11/20. Time taken by Pipe B alone = (11/20) / (1/15) = (11/20) * 15 = 33/4 = 8.25 hours = 8 hours 15 minutes.'
    },
    {
      category: 'quantitative',
      topic: 'Permutations & Combinations',
      difficulty: 'hard',
      questionText: 'In how many different ways can the letters of the word "LEADING" be arranged in such a way that the vowels always come together?',
      options: ['720', '360', '5040', '1440'],
      correctOptionIndex: 0,
      explanation: 'The vowels in LEADING are E, A, I (3 vowels). Treat (EAI) as a single entity. The remaining consonants are L, D, N, G (4 consonants). Total items to arrange = 4 + 1 = 5. Ways to arrange 5 items = 5! = 120. The 3 vowels can be arranged amongst themselves in 3! = 6 ways. Total arrangements = 120 * 6 = 720.'
    },
    {
      category: 'quantitative',
      topic: 'Averages & Ratios',
      difficulty: 'easy',
      questionText: 'The average weight of 8 persons increases by 2.5 kg when a new person comes in place of one of them weighing 65 kg. What is the weight of the new person?',
      options: ['76 kg', '80 kg', '85 kg', '82.5 kg'],
      correctOptionIndex: 2,
      explanation: 'Total weight increase for the whole group = 8 * 2.5 = 20 kg. Weight of new person = Weight of replaced person + Total increase = 65 + 20 = 85 kg.'
    },
    {
      category: 'quantitative',
      topic: 'Probability',
      difficulty: 'medium',
      questionText: 'Two dice are thrown simultaneously. What is the probability of getting two numbers whose sum is at least 10?',
      options: ['1/6', '1/12', '5/36', '7/36'],
      correctOptionIndex: 0,
      explanation: 'Total outcomes = 6 * 6 = 36. Favorable outcomes where sum >= 10: Sum 10: (4,6), (5,5), (6,4) [3 pairs]. Sum 11: (5,6), (6,5) [2 pairs]. Sum 12: (6,6) [1 pair]. Total favorable = 3 + 2 + 1 = 6. Probability = 6/36 = 1/6.'
    },
    {
      category: 'quantitative',
      topic: 'Simple & Compound Interest',
      difficulty: 'medium',
      questionText: 'The difference between simple and compound interest compounded annually on a certain sum of money for 2 years at 4% per annum is ₹1. What is the sum?',
      options: ['₹625', '₹650', '₹600', '₹675'],
      correctOptionIndex: 0,
      explanation: 'For 2 years, Difference = Principal * (R / 100)^2. Here: 1 = P * (4/100)^2 => 1 = P * (1/25)^2 => 1 = P * (1/625) => P = ₹625.'
    },

    // Logical Reasoning
    {
      category: 'logical',
      topic: 'Number & Letter Series',
      difficulty: 'easy',
      questionText: 'Look at this series: 7, 10, 8, 11, 9, 12, ... What number should come next?',
      options: ['10', '13', '14', '7'],
      correctOptionIndex: 0,
      explanation: 'It is an alternating series: Add 3, then subtract 2. 7 + 3 = 10, 10 - 2 = 8, 8 + 3 = 11, 11 - 2 = 9, 9 + 3 = 12, 12 - 2 = 10. The next number is 10.'
    },
    {
      category: 'logical',
      topic: 'Coding & Decoding',
      difficulty: 'medium',
      questionText: 'If in a certain code language, "ROSE" is written as "TQUG", how will "BLUE" be written in that code?',
      options: ['DNWG', 'DMVG', 'CNVG', 'DOWH'],
      correctOptionIndex: 0,
      explanation: 'Each letter is shifted forward by +2 positions in the alphabet: R(+2)->T, O(+2)->Q, S(+2)->U, E(+2)->G. Applying +2 to BLUE: B(+2)->D, L(+2)->N, U(+2)->W, E(+2)->G => DNWG.'
    },
    {
      category: 'logical',
      topic: 'Blood Relations',
      difficulty: 'medium',
      questionText: 'Pointing to a photograph, a woman says: "He is the only son of the wife of my father-in-law." How is the man in the photograph related to the woman?',
      options: ['Husband', 'Brother-in-law', 'Son', 'Father'],
      correctOptionIndex: 0,
      explanation: 'Father-in-law\'s wife is her mother-in-law. The only son of her mother-in-law is her husband.'
    },
    {
      category: 'logical',
      topic: 'Syllogism',
      difficulty: 'medium',
      questionText: 'Statements: 1. All cars are vehicles. 2. Some vehicles are electric. Conclusions: I. Some cars are electric. II. Some electric items are vehicles. Which follows?',
      options: ['Only II follows', 'Only I follows', 'Both I and II follow', 'Neither follows'],
      correctOptionIndex: 0,
      explanation: 'Since "Some vehicles are electric", its converse "Some electric items are vehicles" is directly valid (Conclusion II). There is no guaranteed overlap between cars and electric, so I does not necessarily follow.'
    },
    {
      category: 'logical',
      topic: 'Direction Sense',
      difficulty: 'easy',
      questionText: 'A person walks 5 km North, turns right and walks 3 km, then turns right again and walks 5 km. In which direction and at what distance is he now from his starting point?',
      options: ['3 km East', '3 km West', '5 km South', '8 km North'],
      correctOptionIndex: 0,
      explanation: 'North 5 km (+y), East 3 km (+x), South 5 km (-y). Net displacement along y-axis is 0, along x-axis is +3 km. Therefore, he is 3 km East of his starting position.'
    },
    {
      category: 'logical',
      topic: 'Seating Arrangement',
      difficulty: 'hard',
      questionText: 'Six persons A, B, C, D, E, and F are sitting in a circle facing the center. B is between D and C. A is between E and D. F is to the right of D. Who is sitting between A and F?',
      options: ['D', 'E', 'B', 'C'],
      correctOptionIndex: 0,
      explanation: 'Placing D at reference: A is between E and D, meaning order is E - A - D. B is between D and C, meaning order is D - B - C. F is next to D. Hence D is between A and F.'
    },

    // Verbal Ability
    {
      category: 'verbal',
      topic: 'Sentence Correction & Grammar',
      difficulty: 'easy',
      questionText: 'Choose the grammatically correct sentence:',
      options: [
        'Neither the manager nor the engineers were present at the deployment meeting.',
        'Neither the manager nor the engineers was present at the deployment meeting.',
        'Neither the manager or the engineers was present at the deployment meeting.',
        'Neither the manager and the engineers were present at the deployment meeting.'
      ],
      correctOptionIndex: 0,
      explanation: 'With "neither... nor", the verb agrees with the closer subject ("engineers" is plural, so "were" is correct).'
    },
    {
      category: 'verbal',
      topic: 'Synonyms & Antonyms',
      difficulty: 'medium',
      questionText: 'What is the closest SYNONYM for the word "EPHEMERAL"?',
      options: ['Transient', 'Enduring', 'Immutable', 'Monumental'],
      correctOptionIndex: 0,
      explanation: '"Ephemeral" means lasting for a very short time; fleeting or transient. "Enduring" and "Immutable" are antonyms.'
    },
    {
      category: 'verbal',
      topic: 'Idioms & Phrases',
      difficulty: 'medium',
      questionText: 'What does the idiom "bite the bullet" mean in a professional context?',
      options: [
        'Face a difficult or inevitable situation with courage and determination',
        'Make an impulsive decision without consultation',
        'Reject an offer outright',
        'Postpone an urgent task indefinitely'
      ],
      correctOptionIndex: 0,
      explanation: '"Bite the bullet" means to face a grim or difficult situation with resilience and courage rather than avoiding it.'
    },
    {
      category: 'verbal',
      topic: 'Vocabulary & Context',
      difficulty: 'medium',
      questionText: 'Fill in the blank: The microservices architecture proved to be remarkably ________, seamlessly absorbing sudden 10x traffic spikes without degradation.',
      options: ['resilient', 'precarious', 'obsolete', 'reticent'],
      correctOptionIndex: 0,
      explanation: '"Resilient" means capable of withstanding shock, stress, or rapid recovery, which perfectly suits handling 10x traffic spikes.'
    },
    {
      category: 'verbal',
      topic: 'Para Jumbles',
      difficulty: 'hard',
      questionText: 'Arrange the following sentences in a coherent paragraph:\nP: This transition requires automated CI/CD pipelines.\nQ: Modern software engineering has shifted toward continuous deployment.\nR: As a result, software cycles have accelerated significantly.\nS: These pipelines ensure rapid testing and zero-downtime releases.',
      options: ['Q-P-S-R', 'Q-R-P-S', 'P-S-Q-R', 'S-P-Q-R'],
      correctOptionIndex: 0,
      explanation: 'Q introduces the central thesis (shift to continuous deployment). P explains what the transition requires (CI/CD pipelines). S elaborates on what these pipelines do. R concludes with the overall result.'
    }
  ]);

  // 5. DSA Coding Problems (10 problems)
  console.log('[Seed] Seeding starter DSA coding problems...');
  await CodingProblem.create([
    {
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: 'easy',
      category: 'Arrays & Hashing',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
      constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9', 'Only one valid answer exists.'],
      examples: [
        { input: '[2, 7, 11, 15], 9', output: '[0, 1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
        { input: '[3, 2, 4], 6', output: '[1, 2]', explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].' }
      ],
      starterCode: {
        javascript: 'function twoSum(nums, target) {\n  // Write your code here\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}',
        python: 'def twoSum(nums, target):\n    # Write your code here\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []',
        java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n        return new int[]{0, 1};\n    }\n}',
        cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Your code here\n        return {0, 1};\n    }\n};'
      },
      testCases: [
        { input: '[2,7,11,15], 9', expectedOutput: '[0,1]', isHidden: false },
        { input: '[3,2,4], 6', expectedOutput: '[1,2]', isHidden: false },
        { input: '[3,3], 6', expectedOutput: '[0,1]', isHidden: true }
      ],
      hints: [
        'Can you use a hash map to look up complements in O(1) time instead of nested O(N^2) loops?',
        'As you iterate through the array, check if target - currentNum is already in your map.'
      ]
    },
    {
      title: 'Valid Parentheses',
      slug: 'valid-parentheses',
      difficulty: 'easy',
      category: 'Stack',
      description: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid. An input string is valid if open brackets are closed by the same type of brackets, and brackets are closed in the correct order.',
      constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only "()[]{}"'],
      examples: [
        { input: '"()"', output: 'true', explanation: 'Matching pair.' },
        { input: '"()[]{}"', output: 'true', explanation: 'All pairs properly closed.' },
        { input: '"(]"', output: 'false', explanation: 'Mismatched closing bracket.' }
      ],
      starterCode: {
        javascript: 'function validParentheses(s) {\n  const stack = [];\n  const pairs = { ")": "(", "}": "{", "]": "[" };\n  for (const char of s) {\n    if (char === "(" || char === "{" || char === "[") {\n      stack.push(char);\n    } else {\n      if (stack.pop() !== pairs[char]) return false;\n    }\n  }\n  return stack.length === 0;\n}',
        python: 'def validParentheses(s):\n    stack = []\n    pairs = {")": "(", "}": "{", "]": "["}\n    for char in s:\n        if char in "({[":\n            stack.append(char)\n        elif not stack or stack.pop() != pairs[char]:\n            return False\n    return len(stack) == 0',
        java: 'class Solution {\n    public boolean isValid(String s) {\n        return true;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    bool isValid(string s) {\n        return true;\n    }\n};'
      },
      testCases: [
        { input: '"()"', expectedOutput: 'true', isHidden: false },
        { input: '"()[]{}"', expectedOutput: 'true', isHidden: false },
        { input: '"(]"', expectedOutput: 'false', isHidden: false },
        { input: '"([)]"', expectedOutput: 'false', isHidden: true },
        { input: '"{[]}"', expectedOutput: 'true', isHidden: true }
      ],
      hints: [
        'A Stack is the ideal data structure because the most recently opened bracket must be the first one closed.'
      ]
    },
    {
      title: 'Maximum Subarray',
      slug: 'maximum-subarray',
      difficulty: 'medium',
      category: 'Dynamic Programming',
      description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum. (Kadane\'s Algorithm)',
      constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
      examples: [
        { input: '[-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' }
      ],
      starterCode: {
        javascript: 'function maxSubArray(nums) {\n  let currentMax = nums[0];\n  let globalMax = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    currentMax = Math.max(nums[i], currentMax + nums[i]);\n    globalMax = Math.max(globalMax, currentMax);\n  }\n  return globalMax;\n}',
        python: 'def maxSubArray(nums):\n    cur = global_max = nums[0]\n    for x in nums[1:]:\n        cur = max(x, cur + x)\n        global_max = max(global_max, cur)\n    return global_max',
        java: 'class Solution {\n    public int maxSubArray(int[] nums) {\n        return 6;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        return 6;\n    }\n};'
      },
      testCases: [
        { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', isHidden: false },
        { input: '[1]', expectedOutput: '1', isHidden: false },
        { input: '[5,4,-1,7,8]', expectedOutput: '23', isHidden: true }
      ],
      hints: [
        'Kadane\'s algorithm runs in O(N) time and O(1) space.'
      ]
    },
    {
      title: 'Length of Longest Substring Without Repeating Characters',
      slug: 'longest-substring-without-repeating',
      difficulty: 'medium',
      category: 'Sliding Window',
      description: 'Given a string s, find the length of the longest substring without repeating characters.',
      constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces.'],
      examples: [
        { input: '"abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
        { input: '"bbbbb"', output: '1', explanation: 'The answer is "b", with length 1.' }
      ],
      starterCode: {
        javascript: 'function lengthOfLongestSubstring(s) {\n  const map = new Map();\n  let maxLen = 0;\n  let left = 0;\n  for (let right = 0; right < s.length; right++) {\n    if (map.has(s[right]) && map.get(s[right]) >= left) {\n      left = map.get(s[right]) + 1;\n    }\n    map.set(s[right], right);\n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  return maxLen;\n}',
        python: 'def lengthOfLongestSubstring(s):\n    seen = {}\n    max_len = left = 0\n    for right, ch in enumerate(s):\n        if ch in seen and seen[ch] >= left:\n            left = seen[ch] + 1\n        seen[ch] = right\n        max_len = max(max_len, right - left + 1)\n    return max_len',
        java: 'class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        return 3;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        return 3;\n    }\n};'
      },
      testCases: [
        { input: '"abcabcbb"', expectedOutput: '3', isHidden: false },
        { input: '"bbbbb"', expectedOutput: '1', isHidden: false },
        { input: '"pwwkew"', expectedOutput: '3', isHidden: true }
      ],
      hints: [
        'Use the sliding window technique with two pointers (left and right).'
      ]
    },
    {
      title: 'Climbing Stairs',
      slug: 'climbing-stairs',
      difficulty: 'easy',
      category: 'Dynamic Programming',
      description: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
      constraints: ['1 <= n <= 45'],
      examples: [
        { input: '2', output: '2', explanation: 'There are two ways: 1 step + 1 step, or 2 steps.' },
        { input: '3', output: '3', explanation: '1+1+1, 1+2, or 2+1.' }
      ],
      starterCode: {
        javascript: 'function climbStairs(n) {\n  if (n <= 2) return n;\n  let prev2 = 1, prev1 = 2;\n  for (let i = 3; i <= n; i++) {\n    const curr = prev1 + prev2;\n    prev2 = prev1;\n    prev1 = curr;\n  }\n  return prev1;\n}',
        python: 'def climbStairs(n):\n    if n <= 2: return n\n    a, b = 1, 2\n    for _ in range(3, n + 1):\n        a, b = b, a + b\n    return b',
        java: 'class Solution {\n    public int climbStairs(int n) {\n        return n;\n    }\n}',
        cpp: 'class Solution {\npublic:\n    int climbStairs(int n) {\n        return n;\n    }\n};'
      },
      testCases: [
        { input: '2', expectedOutput: '2', isHidden: false },
        { input: '3', expectedOutput: '3', isHidden: false },
        { input: '5', expectedOutput: '8', isHidden: true }
      ],
      hints: [
        'Notice how this problem mirrors the Fibonacci sequence: ways(n) = ways(n-1) + ways(n-2).'
      ]
    }
  ]);

  // 6. Announcements
  console.log('[Seed] Seeding campus placement notices...');
  await Announcement.create([
    {
      title: 'Google Campus Recruitment Drive Announced (2026 Batch)',
      content: 'Google India will be conducting an on-campus placement drive for SWE Roles. Eligibility: CGPA >= 8.0, No backlogs. Last date to submit applications is 14 days from today.',
      type: 'Placement Drive',
      companyName: 'Google India',
      isPinned: true,
      createdBy: admin._id
    },
    {
      title: 'Mandatory Technical Mock Interview Week',
      content: 'All final year computer engineering students are advised to complete at least 2 AI Mock Interviews before the TCS and Microsoft drives begin.',
      type: 'Preparation Tip',
      isPinned: true,
      createdBy: admin._id
    },
    {
      title: 'Microsoft Azure Core Assessment Guidelines',
      content: 'The online assessment for Microsoft IDC will consist of 3 DSA coding questions (Medium-Hard) and 15 multiple-choice questions on OS, Computer Networks, and DBMS.',
      type: 'Urgent Notice',
      companyName: 'Microsoft IDC',
      isPinned: false,
      createdBy: admin._id
    }
  ]);

  // 7. Study Tasks
  console.log('[Seed] Seeding default study tasks for student...');
  await StudyTask.create([
    {
      user: student._id,
      title: 'Solve 5 Tree & Graph problems on Coding Practice',
      description: 'Focus on BFS/DFS traversal and Lowest Common Ancestor.',
      category: 'Coding',
      priority: 'High',
      dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      isCompleted: false
    },
    {
      user: student._id,
      title: 'Complete Quantitative Aptitude Speed Drill',
      description: 'Aim for >80% accuracy in Time, Speed & Distance and Work.',
      category: 'Aptitude',
      priority: 'Medium',
      dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      isCompleted: true,
      completedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000)
    },
    {
      user: student._id,
      title: 'Run AI Resume Analyzer with Google Job Description',
      description: 'Match missing skills and optimize project impact bullets.',
      category: 'Resume',
      priority: 'High',
      dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      isCompleted: false
    },
    {
      user: student._id,
      title: 'Attend 1 Full Stack Technical Mock Interview Session',
      description: 'Practice articulating Event Loop and distributed caching trade-offs.',
      category: 'Mock Interview',
      priority: 'Medium',
      dueDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      isCompleted: false
    }
  ]);

  console.log('[Seed] ✅ Database seeding completed successfully!');
  console.log('-------------------------------------------------------');
  console.log('🔑 Demo Admin Credentials:   admin@placement.edu / Admin@123');
  console.log('🎓 Demo Student Credentials: student@placement.edu / Student@123');
  console.log('-------------------------------------------------------');
};

// If run directly from terminal: node src/scripts/seed.js
if (process.argv[1]?.includes('seed.js')) {
  try {
    await connectDB();
    await seedDatabase();
    await closeDB();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
}
