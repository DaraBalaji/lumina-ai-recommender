import {
  LearnerProfile,
  TargetRole,
  Course,
  Milestone,
  RoadmapPhase,
  Roadmap,
  SkillGap,
  CompetencyLevel,
} from '../types';
import { COURSE_CATALOG } from '../data/courseCatalog';
import { TARGET_ROLES } from '../data/skillTaxonomy';
import { getCustomCourses } from './dbService';

export const calculateSkillGaps = (
  profile: LearnerProfile,
  targetRole: TargetRole
): SkillGap[] => {
  const gaps: SkillGap[] = [];
  const benchmarks = targetRole.benchmarkScores;

  Object.entries(benchmarks).forEach(([skill, targetScore]) => {
    const currentScore = profile.baselineScores[skill] ?? 0;
    const gapScore = Math.max(0, targetScore - currentScore);

    let status: 'Critical' | 'Moderate' | 'Mastered' = 'Mastered';
    if (gapScore > 45) {
      status = 'Critical';
    } else if (gapScore > 15) {
      status = 'Moderate';
    }

    let competencyLevel: CompetencyLevel = 'Novice';
    if (currentScore >= 80) {
      competencyLevel = 'Expert';
    } else if (currentScore >= 60) {
      competencyLevel = 'Proficient';
    } else if (currentScore >= 35) {
      competencyLevel = 'Competent';
    }

    gaps.push({
      skillName: skill,
      currentScore,
      targetScore,
      gapScore,
      status,
      competencyLevel,
    });
  });

  return gaps.sort((a, b) => b.gapScore - a.gapScore);
};

export const scoreCourseRelevance = (
  course: Course,
  profile: LearnerProfile,
  skillGaps: SkillGap[]
): number => {
  return explainCourseScore(course, profile, skillGaps).totalScore;
};

export interface CourseScoreBreakdown {
  semanticScore: number;
  skillGapScore: number;
  prereqScore: number;
  formatScore: number;
  qualityScore: number;
  totalScore: number;
  weights: { w1: number; w2: number; w3: number; w4: number };
  matchedGaps: { skill: string; gapScore: number }[];
  missingPrereqs: string[];
  explanation: string;
}

export const explainCourseScore = (
  course: Course,
  profile: LearnerProfile,
  skillGaps: SkillGap[],
  // optional targetRole used for richer text
  targetRole?: TargetRole,
  weights?: { w1?: number; w2?: number; w3?: number; w4?: number }
): CourseScoreBreakdown => {
  const w1 = weights?.w1 ?? 0.45;
  const w2 = weights?.w2 ?? 0.25;
  const w3 = weights?.w3 ?? 0.15;
  const w4 = weights?.w4 ?? 0.15;

  const tokenize = (value: string) => new Set(value.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2));
  const learnerTokens = tokenize(`${profile.goalText || ''} ${(profile.interests || []).join(' ')}`);
  const courseTokens = tokenize(`${course.title} ${course.description} ${course.skillsCovered.join(' ')}`);
  const semanticMatches = [...courseTokens].filter((token) => learnerTokens.has(token)).length;
  const semanticScore = Math.min(100, semanticMatches * 20);

  // Skill gap relevance
  let gapRelevanceSum = 0;
  const matchedGaps: { skill: string; gapScore: number }[] = [];
  course.skillsCovered.forEach((skill) => {
    const gap = skillGaps.find((g) => g.skillName === skill);
    if (gap) {
      const completedTopics = Object.keys(profile.courseProgress?.[course.id] || {}).length;
      const momentumBonus = Math.min(20, (completedTopics / Math.max(1, course.skillsCovered.length)) * 20);
      gapRelevanceSum += gap.gapScore + (profile.interests?.includes(skill) ? 15 : 0) + momentumBonus;
      matchedGaps.push({ skill, gapScore: gap.gapScore });
    }
  });
  const skillGapScore = Math.min(100, gapRelevanceSum * 1.2);

  // Prerequisite fit
  let prereqScore = 100;
  const missingPrereqs: string[] = [];
  course.prerequisites.forEach((prereqIdOrSkill) => {
    const isCompleted = profile.completedCourseIds.includes(prereqIdOrSkill);
    const skillScore = profile.baselineScores[prereqIdOrSkill] || 0;
    if (!isCompleted && skillScore < 40) {
      prereqScore -= 30;
      missingPrereqs.push(prereqIdOrSkill);
    }
  });
  prereqScore = Math.max(0, prereqScore);

  // Format & pace match
  let formatScore = 70;
  if (
    (profile.preferredFormat === 'Project-first' && (course.type === 'Project' || !!course.projectMapping)) ||
    (profile.preferredFormat === 'Video' && course.type === 'Course') ||
    (profile.preferredFormat === 'Books' && course.type === 'Book')
  ) {
    formatScore = 100;
  }

  // Quality
  const qualityScore = (course.rating / 5) * 100;

  const totalScore = Math.round(
    0.25 * semanticScore + 0.35 * skillGapScore + 0.2 * prereqScore + 0.1 * formatScore + 0.1 * qualityScore
  );

  const explanationLines: string[] = [];
  explanationLines.push(`Matched skills: ${matchedGaps.map((m) => `${m.skill} (gap ${m.gapScore})`).join(', ') || 'None'}`);
  if (missingPrereqs.length) {
    explanationLines.push(`Missing prerequisites: ${missingPrereqs.join(', ')}`);
  } else {
    explanationLines.push('All prerequisites satisfied or low-risk.');
  }
  if (targetRole) {
    explanationLines.push(`Estimated impact toward ${targetRole.title}: ~${Math.min(99, Math.max(50, Math.round(totalScore * 0.35)))}%`);
  }
  explanationLines.push(`Breakdown -> skillGap:${skillGapScore}, prereq:${prereqScore}, format:${formatScore}, quality:${qualityScore}`);
  explanationLines.push(`Semantic goal match: ${semanticScore} (${semanticMatches} shared concepts)`);

  return {
    semanticScore: Math.round(semanticScore),
    skillGapScore: Math.round(skillGapScore),
    prereqScore: Math.round(prereqScore),
    formatScore: Math.round(formatScore),
    qualityScore: Math.round(qualityScore),
    totalScore,
    weights: { w1, w2, w3, w4 },
    matchedGaps,
    missingPrereqs,
    explanation: explanationLines.join(' | '),
  };
};

export const getTopCourses = (
  profile: LearnerProfile,
  targetRoleId?: string,
  topN = 10
): { course: Course; score: number; breakdown: CourseScoreBreakdown }[] => {
  const roleId = targetRoleId || profile.targetRoleId;
  const targetRole = TARGET_ROLES.find((r) => r.id === roleId) || TARGET_ROLES[0];
  const customCourses = getCustomCourses();
  const fullCatalog = [...COURSE_CATALOG, ...customCourses];
  const skillGaps = calculateSkillGaps(profile, targetRole);

  const scored = fullCatalog
    .map((c) => {
      const breakdown = explainCourseScore(c, profile, skillGaps, targetRole);
      return { course: c, score: breakdown.totalScore, breakdown };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return scored;
};

export const generatePersonalizedRoadmap = (
  profile: LearnerProfile,
  targetRoleId?: string
): Roadmap => {
  const roleId = targetRoleId || profile.targetRoleId;
  const targetRole =
    TARGET_ROLES.find((r) => r.id === roleId) || TARGET_ROLES[0];

  const customCourses = getCustomCourses();
  const fullCatalog = [...COURSE_CATALOG, ...customCourses];
  const skillGaps = calculateSkillGaps(profile, targetRole);

  // Rank courses
  const scoredCourses = fullCatalog
    .map((c) => ({
      course: c,
      score: scoreCourseRelevance(c, profile, skillGaps),
    }))
    .sort((a, b) => b.score - a.score);

  // Categorize by difficulty & phase
  const beginnerCourses = scoredCourses
    .filter((sc) => sc.course.difficulty === 'Beginner')
    .slice(0, 3);

  const intermediateCourses = scoredCourses
    .filter((sc) => sc.course.difficulty === 'Intermediate')
    .slice(0, 3);

  const advancedCourses = scoredCourses
    .filter((sc) => sc.course.difficulty === 'Advanced')
    .slice(0, 3);

  const projectCourses = scoredCourses
    .filter((sc) => sc.course.type === 'Project' || sc.course.projectMapping)
    .slice(0, 2);

  // Build Milestone items for each Phase
  let globalMilestoneCount = 1;

  const buildMilestones = (
    items: { course: Course; score: number }[],
    phaseId: string,
    phaseName: string
  ): Milestone[] => {
    return items.map(({ course, score }) => {
      const breakdown = explainCourseScore(course, profile, skillGaps, targetRole);
      const msId = `ms-${roleId}-${globalMilestoneCount++}`;
      const isAlreadyCompleted = profile.completedCourseIds.includes(course.id);
      const isAvailable =
        isAlreadyCompleted ||
        course.prerequisites.length === 0 ||
        course.prerequisites.every((pr) =>
          profile.completedCourseIds.includes(pr)
        );

      const status = isAlreadyCompleted
        ? 'Completed'
        : profile.inProgressMilestoneIds.includes(msId)
        ? 'In-Progress'
        : isAvailable
        ? 'Available'
        : 'Locked';

      const primarySkill = course.skillsCovered[0] || 'Core Domain Skills';
      const completedSubtopics = profile.courseProgress?.[course.id] || [];
      const subtopics = course.skillsCovered.map((skill, index) => ({
        id: `${course.id}-topic-${index + 1}`,
        title: `${skill}: learn, practice, and checkpoint`,
        skill,
        completed: isAlreadyCompleted || Boolean(completedSubtopics[`${course.id}-topic-${index + 1}`]),
        completedAt: completedSubtopics[`${course.id}-topic-${index + 1}`],
      }));

      return {
        id: msId,
        phaseId,
        phaseName,
        title: course.title,
        description: course.description,
        course,
        status,
        prerequisiteMilestoneIds: [], // Set during DAG link pass
        estimatedWeeks: Math.max(1, Math.ceil(course.durationHours / Math.max(3, profile.hoursPerWeek))),
        skillsGained: course.skillsCovered,
        subtopics,
        rationales: {
          skillGapAddressed: breakdown.matchedGaps.length
            ? `Targets gaps in ${breakdown.matchedGaps.map((m) => `${m.skill} (${m.gapScore})`).join(', ')}.`
            : `Supports ${primarySkill} consolidation and broader domain fluency.`,
          prerequisiteCoverage: breakdown.missingPrereqs.length > 0
            ? `Learner is missing prerequisites: ${breakdown.missingPrereqs.join(', ')}.`
            : 'Prerequisites satisfied or low-risk for immediate start.',
          careerImpact: `Estimated career impact: ${breakdown.explanation}`,
          recommendationEvidence: `Goal match ${breakdown.semanticScore}/100, skill-gap fit ${Math.round(breakdown.skillGapScore)}/100, prerequisite readiness ${Math.round(breakdown.prereqScore)}/100.`,
          careerImpactScore: Math.min(99, Math.max(0, breakdown.totalScore)),
        },
        capstoneProject: course.projectMapping
          ? {
              title: course.projectMapping.title,
              description: course.projectMapping.description,
              deliverables: [
                'Production GitHub repository with README & setup guide',
                'Interactive demo or API endpoint deployed to cloud',
                'Comprehensive test suite & benchmarks',
              ],
            }
          : undefined,
      };
    });
  };

  const phase1Milestones = buildMilestones(beginnerCourses, 'phase-1', 'Phase 1: Foundations & Core Baseline');
  const phase2Milestones = buildMilestones(intermediateCourses, 'phase-2', 'Phase 2: Core Competencies & Applied Architecture');
  const phase3Milestones = buildMilestones(advancedCourses, 'phase-3', 'Phase 3: Advanced Specialization & Deep Tech');
  const phase4Milestones = buildMilestones(projectCourses, 'phase-4', 'Phase 4: Industry Capstones & Interview Readiness');

  // Establish DAG prerequisite links between milestones
  const allMilestones = [
    ...phase1Milestones,
    ...phase2Milestones,
    ...phase3Milestones,
    ...phase4Milestones,
  ];

  // Wire dependencies
  phase2Milestones.forEach((m, idx) => {
    if (phase1Milestones[idx % phase1Milestones.length]) {
      m.prerequisiteMilestoneIds.push(phase1Milestones[idx % phase1Milestones.length].id);
    }
  });

  phase3Milestones.forEach((m, idx) => {
    if (phase2Milestones[idx % phase2Milestones.length]) {
      m.prerequisiteMilestoneIds.push(phase2Milestones[idx % phase2Milestones.length].id);
    }
  });

  phase4Milestones.forEach((m) => {
    if (phase3Milestones.length > 0) {
      m.prerequisiteMilestoneIds.push(phase3Milestones[phase3Milestones.length - 1].id);
    }
  });

  const phases: RoadmapPhase[] = [
    {
      id: 'phase-1',
      phaseNumber: 1,
      title: 'Foundations & Baseline Building',
      description: 'Establish essential theoretical principles and language mechanics.',
      milestones: phase1Milestones,
    },
    {
      id: 'phase-2',
      phaseNumber: 2,
      title: 'Core Competencies & Applied Systems',
      description: 'Master core frameworks, tools, and real-world architectures.',
      milestones: phase2Milestones,
    },
    {
      id: 'phase-3',
      phaseNumber: 3,
      title: 'Advanced Specialization & Deep Engineering',
      description: 'Dive deep into high-throughput, fine-tuning, or cluster orchestration.',
      milestones: phase3Milestones,
    },
    {
      id: 'phase-4',
      phaseNumber: 4,
      title: 'Industry Capstones & Career Certifications',
      description: 'Validate expertise with production capstones and interview preparation.',
      milestones: phase4Milestones,
    },
  ];

  const totalHours = allMilestones.reduce((acc, m) => acc + m.course.durationHours, 0);
  const totalWeeks = Math.ceil(totalHours / Math.max(3, profile.hoursPerWeek));
  const completedCount = allMilestones.filter((m) => m.status === 'Completed').length;
  const overallCompletionPercentage = Math.round(
    (completedCount / Math.max(1, allMilestones.length)) * 100
  );

  return {
    id: `roadmap-${profile.id}-${roleId}`,
    learnerProfileId: profile.id,
    targetRoleId: roleId,
    targetRoleTitle: targetRole.title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    phases,
    totalHours,
    estimatedWeeks: totalWeeks,
    overallCompletionPercentage,
  };
};
