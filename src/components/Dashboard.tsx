import React from 'react';
import {
  TrendingUp,
  Flame,
  Clock,
  CheckCircle2,
  Award,
  Sparkles,
  ArrowRight,
  Download,
} from 'lucide-react';
import { LearnerProfile, Roadmap, Milestone } from '../types';
import { SkillRadarChart } from './SkillRadarChart';
import { getStudyRecords } from '../services/dbService';
import { calculateSkillGaps } from '../services/recommendationEngine';
import { TARGET_ROLES } from '../data/skillTaxonomy';

interface DashboardProps {
  profile: LearnerProfile;
  roadmap: Roadmap | null;
  onOpenExportModal: () => void;
  onLaunchNextBestAction: (milestone: Milestone) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  roadmap,
  onOpenExportModal,
  onLaunchNextBestAction,
}) => {
  const allMilestones = roadmap ? roadmap.phases.flatMap((p) => p.milestones) : [];
  const completedMilestones = allMilestones.filter((m) => m.status === 'Completed');
  const inProgressMilestone =
    allMilestones.find((m) => m.status === 'In-Progress') ||
    allMilestones.find((m) => m.status === 'Available') ||
    allMilestones[0];
  const studyRecords = getStudyRecords();
  const today = new Date();
  const activityDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      records: studyRecords.filter((record) => record.completedAt.slice(0, 10) === key),
    };
  });
  const completedSubtopics = allMilestones.reduce((total, milestone) => total + milestone.subtopics.filter((subtopic) => subtopic.completed).length, 0);
  const totalSubtopics = allMilestones.reduce((total, milestone) => total + milestone.subtopics.length, 0);
  const role = TARGET_ROLES.find((item) => item.id === profile.targetRoleId) || TARGET_ROLES[0];
  const skillGaps = calculateSkillGaps(profile, role);
  const strongestSkills = [...skillGaps].sort((a, b) => b.currentScore - a.currentScore).slice(0, 3);
  const priorityGaps = [...skillGaps].sort((a, b) => b.gapScore - a.gapScore).slice(0, 3);
  const quizActivities = studyRecords.filter((record) => record.activityType === 'quiz');
  const correctQuizActivities = quizActivities.filter((record) => (record.masteryPoints || 0) > 0);
  const evidenceScore = Math.min(100, (profile.assessmentCompletedAt ? 25 : 0) + Math.min(35, completedSubtopics * 5) + Math.min(40, quizActivities.length * 8));

  return (
    <div className="flex flex-col gap-10 pb-16">
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-outline-variant/40 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-container/40 text-secondary rounded-full text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mastery Dashboard</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary dark:text-on-primary-fixed mb-2">
            Welcome Back, {profile.name}!
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant dark:text-outline-variant max-w-xl">
            Track your real-time skill velocity, active recall mastery, competency upgrades, and next recommended learning actions.
          </p>
        </div>

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-on-primary rounded-full font-label-md text-xs font-semibold hover:bg-primary-container transition-all shadow-md"
        >
          <Download className="w-4 h-4 text-secondary-container" />
          <span>Export Plan / Sync Calendar</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Overall Completion */}
        <div className="glass-card p-6 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-on-surface-variant block mb-1">Overall Roadmap</span>
            <span className="text-2xl font-extrabold text-primary dark:text-on-primary-fixed">
              {roadmap ? roadmap.overallCompletionPercentage : 0}%
            </span>
            <span className="text-[11px] text-secondary font-medium block mt-1">
              {completedMilestones.length} of {allMilestones.length} Modules Done
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-secondary-container/50 text-secondary flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Velocity */}
        <div className="glass-card p-6 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-on-surface-variant block mb-1">Weekly Velocity</span>
            <span className="text-2xl font-extrabold text-primary dark:text-on-primary-fixed">
              {profile.weeklyVelocityHours} hrs
            </span>
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> {Number(profile.weeklyVelocityHours || 0) > 0 ? 'Based on recorded study' : 'No study data yet'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-fixed flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Streak */}
        <div className="glass-card p-6 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-on-surface-variant block mb-1">Study Streak</span>
            <span className="text-2xl font-extrabold text-primary dark:text-on-primary-fixed">
              {profile.studyStreakDays} Days
            </span>
            <span className="text-[11px] text-amber-600 font-medium block mt-1">
              {profile.studyStreakDays > 0 ? '🔥 Keep the momentum going!' : 'No active streak yet'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Total Hours */}
        <div className="glass-card p-6 rounded-2xl border border-outline-variant/30 flex items-center justify-between">
          <div>
            <span className="text-xs text-on-surface-variant block mb-1">Total Learned</span>
            <span className="text-2xl font-extrabold text-primary dark:text-on-primary-fixed">
              {profile.totalHoursLearned} hrs
            </span>
            <span className="text-[11px] text-secondary font-medium block mt-1">
              Deep Work Hours Recorded
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-tertiary-container/30 text-tertiary dark:text-tertiary-fixed flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* "Next Best Action" Smart Widget */}
      {inProgressMilestone && (
        <div className="glass-panel p-6 rounded-3xl border-2 border-secondary/30 bg-gradient-to-r from-secondary-container/20 to-surface-container-low flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary text-on-secondary flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider bg-secondary-container px-2 py-0.5 rounded-full">
                  Next Best Action Widget
                </span>
                <span className="text-xs text-on-surface-variant">
                  {inProgressMilestone.course.provider}
                </span>
              </div>
              <h3 className="font-headline-md text-base font-bold text-primary dark:text-on-primary-fixed">
                {inProgressMilestone.title}
              </h3>
              <p className="text-xs text-on-surface-variant dark:text-outline-variant mt-1 line-clamp-1">
                {inProgressMilestone.rationales.skillGapAddressed}
              </p>
            </div>
          </div>

          <button
            onClick={() => onLaunchNextBestAction(inProgressMilestone)}
            className="w-full md:w-auto px-6 py-3 bg-secondary text-on-secondary rounded-full font-label-md text-xs font-semibold hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-md shrink-0"
          >
            <span>1-Click Launch Module</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-outline-variant/30">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-headline-md text-base font-bold text-primary dark:text-on-primary-fixed">Learning activity</h2>
              <p className="text-xs text-on-surface-variant mt-1">Every bar represents recorded checklist work.</p>
            </div>
            <span className="text-xs font-semibold text-secondary">{studyRecords.length} activities</span>
          </div>
          <div className="flex items-end justify-between gap-2 h-28">
            {activityDays.map((day) => {
              const hours = day.records.reduce((total, record) => total + record.hours, 0);
              const height = hours > 0 ? Math.max(16, Math.min(100, hours * 12)) : 4;
              return (
                <div key={day.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[10px] text-on-surface-variant">{hours > 0 ? `${hours.toFixed(1)}h` : ''}</span>
                  <div className={`w-full max-w-7 rounded-t-lg ${hours > 0 ? 'bg-secondary' : 'bg-surface-variant/50'}`} style={{ height: `${height}%` }} title={`${day.key}: ${hours.toFixed(1)} recorded hours`} />
                  <span className="text-[10px] text-on-surface-variant">{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-outline-variant/30">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-headline-md text-base font-bold text-primary dark:text-on-primary-fixed">Course checklist progress</h2>
              <p className="text-xs text-on-surface-variant mt-1">Finish topics to unlock full course credit.</p>
            </div>
            <span className="text-lg font-bold text-secondary">{completedSubtopics}/{totalSubtopics}</span>
          </div>
          <div className="h-3 rounded-full bg-surface-variant/60 overflow-hidden mb-4">
            <div className="h-full rounded-full bg-secondary transition-all" style={{ width: `${totalSubtopics ? (completedSubtopics / totalSubtopics) * 100 : 0}%` }} />
          </div>
          <p className="text-xs text-on-surface-variant">{completedSubtopics ? `${completedSubtopics} subtopic${completedSubtopics === 1 ? '' : 's'} completed from your real activity.` : 'Check your first subtopic to begin recording activity.'}</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-outline-variant/30">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Learner analysis</span>
            <h2 className="font-headline-md text-xl font-bold text-primary dark:text-on-primary-fixed mt-1">{profile.name}'s learning profile</h2>
            <p className="text-xs text-on-surface-variant mt-1">A transparent view built from your goal, assessment, checklist activity, and quiz evidence.</p>
          </div>
          <div className="rounded-2xl bg-secondary-container/30 px-4 py-3 text-right">
            <span className="block text-[10px] uppercase tracking-wider text-secondary">Evidence confidence</span>
            <strong className="text-2xl text-primary dark:text-on-primary-fixed">{evidenceScore}%</strong>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="rounded-2xl border border-outline-variant/30 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Target</span>
            <p className="text-sm font-bold text-primary dark:text-on-primary-fixed mt-1">{role.title}</p>
            <p className="text-xs text-on-surface-variant mt-1">{profile.hoursPerWeek} hrs/week · {profile.preferredFormat}</p>
          </div>
          <div className="rounded-2xl border border-outline-variant/30 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Evidence collected</span>
            <p className="text-sm font-bold text-primary dark:text-on-primary-fixed mt-1">{completedSubtopics} topics · {quizActivities.length} quizzes</p>
            <p className="text-xs text-on-surface-variant mt-1">{correctQuizActivities.length} correct quiz responses</p>
          </div>
          <div className="rounded-2xl border border-outline-variant/30 p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Interests</span>
            <p className="text-sm font-bold text-primary dark:text-on-primary-fixed mt-1">{profile.interests.length ? profile.interests.slice(0, 2).join(' · ') : 'Not specified'}</p>
            <p className="text-xs text-on-surface-variant mt-1">Used to personalize course ranking</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <h3 className="text-xs font-bold text-primary dark:text-on-primary-fixed mb-2">Current strengths</h3>
            <div className="flex flex-col gap-2">{strongestSkills.map((skill) => <div key={skill.skillName} className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-2 text-xs"><span>{skill.skillName}</span><strong>{skill.currentScore}%</strong></div>)}</div>
          </div>
          <div>
            <h3 className="text-xs font-bold text-primary dark:text-on-primary-fixed mb-2">Recommended focus</h3>
            <div className="flex flex-col gap-2">{priorityGaps.map((skill) => <div key={skill.skillName} className="flex items-center justify-between rounded-xl bg-amber-500/10 px-3 py-2 text-xs"><span>{skill.skillName}</span><strong>{skill.gapScore} point gap</strong></div>)}</div>
          </div>
        </div>
        <p className="mt-5 border-t border-outline-variant/20 pt-4 text-[11px] text-on-surface-variant">Score method: assessment evidence contributes up to 25 points, completed topics up to 35 points, and quiz evidence up to 40 points. Mastery scores use assessment and recorded activity, never random values.</p>
      </div>

      {/* Embedded Skill Radar & Competency Matrix */}
      <div className="mt-4">
        <SkillRadarChart profile={profile} />
      </div>
    </div>
  );
};
