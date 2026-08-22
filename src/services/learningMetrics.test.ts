import { describe, expect, it } from 'vitest';
import { calculateLearningMetrics } from './learningMetrics';
import { StudyRecord } from '../types';

const record = (date: string, hours: number, skills: string[]): StudyRecord => ({
  id: date,
  milestoneId: `milestone-${date}`,
  courseId: `course-${date}`,
  completedAt: `${date}T12:00:00.000Z`,
  hours,
  skills,
});

describe('calculateLearningMetrics', () => {
  it('calculates total and weekly hours from records', () => {
    const metrics = calculateLearningMetrics(
      [record('2026-08-21', 4, ['Python']), record('2026-08-01', 6, ['Python'])],
      ['Python'],
      new Date('2026-08-21T12:00:00.000Z'),
    );
    expect(metrics.totalHoursLearned).toBe(10);
    expect(metrics.weeklyVelocityHours).toBe(4);
  });

  it('calculates consecutive activity streaks', () => {
    const metrics = calculateLearningMetrics(
      [record('2026-08-19', 2, ['Python']), record('2026-08-20', 2, ['Python']), record('2026-08-21', 2, ['Python'])],
      ['Python'],
      new Date('2026-08-21T12:00:00.000Z'),
    );
    expect(metrics.studyStreakDays).toBe(3);
    expect(metrics.baselineScores.Python).toBe(30);
  });

  it('caps skill mastery at one hundred', () => {
    const records = Array.from({ length: 12 }, (_, index) => record(`2026-08-${String(index + 1).padStart(2, '0')}`, 1, ['Python']));
    expect(calculateLearningMetrics(records, ['Python']).baselineScores.Python).toBe(100);
  });
});
