export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type LearningFormat = 'Video' | 'Project-first' | 'Theoretical' | 'Books';
export type ResourceType = 'Course' | 'Project' | 'Certification' | 'Book' | 'Repository';
export type ResourceCost = 'Free' | 'Paid' | 'Freemium';
export type MilestoneStatus = 'Locked' | 'Available' | 'In-Progress' | 'Completed';
export type CompetencyLevel = 'Novice' | 'Competent' | 'Proficient' | 'Expert';

export interface LearnerProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  targetRoleId: string;
  targetRoleTitle: string;
  currentSkillLevel: SkillLevel;
  hoursPerWeek: number;
  preferredFormat: LearningFormat;
  interests: string[];
  goalText?: string;
  assessmentCompletedAt?: string;
  budget: ResourceCost | 'Any';
  targetTimelineMonths: number;
  baselineScores: Record<string, number>; // Skill -> Score 0-100
  completedCourseIds: string[];
  courseProgress: Record<string, Record<string, string>>;
  inProgressMilestoneIds: string[];
  studyStreakDays: number;
  weeklyVelocityHours: number;
  totalHoursLearned: number;
  lastActiveDate: string;
}

export interface TargetRole {
  id: string;
  title: string;
  domain: string;
  description: string;
  benchmarkScores: Record<string, number>; // Skill -> Score 0-100
  requiredCapabilities: string[];
  recommendedTimelineMonths: number;
  icon: string;
}

export interface Course {
  id: string;
  title: string;
  provider: string;
  description: string;
  durationHours: number;
  difficulty: SkillLevel;
  rating: number;
  reviewCount?: number;
  cost: ResourceCost;
  url: string;
  skillsCovered: string[];
  prerequisites: string[]; // Skill names or Course IDs
  type: ResourceType;
  projectMapping?: {
    title: string;
    description: string;
  };
}

export interface Milestone {
  id: string;
  phaseId: string;
  phaseName: string;
  title: string;
  description: string;
  course: Course;
  status: MilestoneStatus;
  prerequisiteMilestoneIds: string[];
  estimatedWeeks: number;
  skillsGained: string[];
  subtopics: Subtopic[];
  rationales: {
    skillGapAddressed: string;
    prerequisiteCoverage: string;
    careerImpact: string;
    recommendationEvidence: string;
    careerImpactScore: number; // 0-100
  };
  capstoneProject?: {
    title: string;
    description: string;
    deliverables: string[];
  };
}

export interface Subtopic {
  id: string;
  title: string;
  skill: string;
  completed: boolean;
  completedAt?: string;
}

export interface RoadmapPhase {
  id: string;
  phaseNumber: number;
  title: string;
  description: string;
  milestones: Milestone[];
}

export interface Roadmap {
  id: string;
  learnerProfileId: string;
  targetRoleId: string;
  targetRoleTitle: string;
  createdAt: string;
  updatedAt: string;
  phases: RoadmapPhase[];
  totalHours: number;
  estimatedWeeks: number;
  overallCompletionPercentage: number;
}

export interface SkillGap {
  skillName: string;
  currentScore: number;
  targetScore: number;
  gapScore: number; // targetScore - currentScore
  status: 'Critical' | 'Moderate' | 'Mastered';
  competencyLevel: CompetencyLevel;
}

export interface PracticeQuiz {
  id: string;
  topic: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  userSelectedIndex?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestions?: string[];
  quiz?: PracticeQuiz;
  roadmapAdaptation?: {
    action: 'compress' | 'inject_prereq' | 'reorder';
    reason: string;
    injectedCourseTitle?: string;
  };
}

export interface StudyRecord {
  id: string;
  milestoneId: string;
  courseId: string;
  completedAt: string;
  hours: number;
  skills: string[];
  subtopicId?: string;
  activityType?: 'subtopic' | 'quiz';
  masteryPoints?: number;
}

export interface LocalDBSchema {
  profiles: LearnerProfile[];
  activeProfileId: string;
  roadmaps: Record<string, Roadmap>; // ProfileId -> Roadmap
  customCourses: Course[];
  chatHistory: Record<string, ChatMessage[]>; // ProfileId -> Messages
  notes: Record<string, string>; // MilestoneId -> Note text
  studyRecords: Record<string, StudyRecord[]>; // ProfileId -> completed study records
  theme: 'light' | 'dark';
}
