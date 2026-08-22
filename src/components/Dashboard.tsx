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

      {/* Embedded Skill Radar & Competency Matrix */}
      <div className="mt-4">
        <SkillRadarChart profile={profile} />
      </div>
    </div>
  );
};
