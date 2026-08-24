import { StudyRecord } from '../types';

export interface LearningMetrics {
  totalHoursLearned: number;
  weeklyVelocityHours: number;
  studyStreakDays: number;
  baselineScores: Record<string, number>;
}

export const calculateLearningMetrics = (
  records: StudyRecord[],
  knownSkills: string[],
  now = new Date()
): LearningMetrics => {
  const totalHoursLearned = records.reduce((total, record) => total + record.hours, 0);
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const weeklyVelocityHours = records
    .filter((record) => new Date(record.completedAt).getTime() >= weekAgo)
    .reduce((total, record) => total + record.hours, 0);
  const activeDates = new Set(records.map((record) => record.completedAt.slice(0, 10)));
  let studyStreakDays = 0;
  const cursor = new Date(now);
  while (activeDates.has(cursor.toISOString().slice(0, 10))) {
    studyStreakDays += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  const baselineScores = Object.fromEntries(knownSkills.map((skill) => [skill, 0]));
  records.forEach((record) => record.skills.forEach((skill) => {
    baselineScores[skill] = Math.min(100, (baselineScores[skill] || 0) + (record.masteryPoints ?? 10));
  }));
  return { totalHoursLearned, weeklyVelocityHours, studyStreakDays, baselineScores };
};