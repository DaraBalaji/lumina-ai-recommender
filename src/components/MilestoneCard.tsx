import React, { useState } from 'react';
import {
  CheckCircle2,
  Lock,
  Clock,
  Award,
  ExternalLink,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Milestone, MilestoneStatus } from '../types';

interface MilestoneCardProps {
  milestone: Milestone;
  onToggleStatus: (milestoneId: string, newStatus: MilestoneStatus) => void;
  onSelectForDetails?: (milestone: Milestone) => void;
}

export const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  onToggleStatus,
  onSelectForDetails,
}) => {
  const [showXaiDrawer, setShowXaiDrawer] = useState(false);

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (milestone.status === 'Locked') return;

    if (milestone.status === 'Completed') {
      onToggleStatus(milestone.id, 'Available');
    } else {
      // Trigger Confetti for completion!
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#006a61', '#86f2e4', '#070235', '#3b82f6'],
      });
      onToggleStatus(milestone.id, 'Completed');
    }
  };

  const getStatusBadge = () => {
    switch (milestone.status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-label-sm text-xs border border-emerald-500/20 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'In-Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-label-sm text-xs border border-amber-500/20 font-semibold animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            In-Progress
          </span>
        );
      case 'Available':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/40 text-secondary font-label-sm text-xs border border-secondary-container font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Unlocked
          </span>
        );
      case 'Locked':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-outline-variant/30 text-outline font-label-sm text-xs border border-outline-variant/40">
            <Lock className="w-3.5 h-3.5" />
            Locked
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => onSelectForDetails?.(milestone)}
      className={`glass-card p-6 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
        milestone.status === 'Completed'
          ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
          : milestone.status === 'In-Progress'
          ? 'border-secondary shadow-md'
          : milestone.status === 'Locked'
          ? 'opacity-65 border-outline-variant/30 grayscale-[30%]'
          : 'border-outline-variant/40 hover:border-secondary hover:shadow-lg'
      }`}
    >
      <div>
        {/* Top Header: Phase Badge & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-on-surface-variant dark:text-outline-variant">
            {milestone.phaseName.split(':')[0]}
          </span>
          {getStatusBadge()}
        </div>

        {/* Title */}
        <h3 className="font-headline-md text-base font-bold text-primary dark:text-on-primary-fixed mb-2 line-clamp-2">
          {milestone.title}
        </h3>

        {/* Provider & Difficulty */}
        <div className="flex items-center gap-2 text-xs text-on-surface-variant dark:text-outline-variant mb-4">
          <span className="font-semibold text-secondary">{milestone.course.provider}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-outline" />
            {milestone.course.durationHours} hrs ({milestone.estimatedWeeks}wks)
          </span>
          <span>•</span>
          <span className="px-2 py-0.5 rounded-full bg-surface-variant/40 text-xs">
            {milestone.course.difficulty}
          </span>
        </div>

        {/* Description */}
        <p className="font-body-md text-xs text-on-surface-variant dark:text-outline-variant line-clamp-2 mb-4">
          {milestone.description}
        </p>

        {/* Skills Gained Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {milestone.skillsGained.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-0.5 rounded-full bg-surface-container/60 dark:bg-surface-container/30 text-on-surface text-[11px] font-medium"
            >
              {skill}
            </span>
          ))}
          {milestone.skillsGained.length > 3 && (
            <span className="px-2 py-0.5 rounded-full bg-surface-variant/40 text-[10px] text-outline">
              +{milestone.skillsGained.length - 3} more
            </span>
          )}
        </div>

        {/* Capstone Project Banner if exists */}
        {milestone.capstoneProject && (
          <div className="p-3.5 rounded-xl bg-tertiary-container/10 border border-tertiary-container/20 mb-4 text-xs text-tertiary dark:text-tertiary-fixed">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <Award className="w-4 h-4 text-secondary" />
              <span>Capstone: {milestone.capstoneProject.title}</span>
            </div>
            <p className="text-[11px] opacity-90 line-clamp-2">
              {milestone.capstoneProject.description}
            </p>
          </div>
        )}
      </div>

      {/* Footer Controls: XAI Drawer Toggle & Direct Link */}
      <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-between gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowXaiDrawer(!showXaiDrawer);
          }}
          className="inline-flex items-center gap-1 text-xs text-secondary hover:underline font-semibold"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Why Recommended?</span>
          {showXaiDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <div className="flex items-center gap-2">
          <a
            href={milestone.course.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-full text-on-surface-variant hover:text-secondary hover:bg-surface-variant/50 transition-colors"
            title="Open Resource"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={handleStatusClick}
            disabled={milestone.status === 'Locked'}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              milestone.status === 'Completed'
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : milestone.status === 'Locked'
                ? 'bg-outline-variant/30 text-outline cursor-not-allowed'
                : 'bg-primary text-on-primary hover:bg-primary-container'
            }`}
          >
            {milestone.status === 'Completed'
              ? 'Mark Incomplete'
              : milestone.status === 'In-Progress'
              ? 'Mark Done'
              : 'Start Module'}
          </button>
        </div>
      </div>

      {/* Explainable AI (XAI) Drawer */}
      {showXaiDrawer && (
        <div className="mt-4 p-4 rounded-xl bg-surface-container-low dark:bg-surface-container/30 border border-outline-variant/40 text-xs flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between font-bold text-primary dark:text-on-primary-fixed">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-secondary" />
              Explainable AI (XAI) Rationale
            </span>
            <span className="px-2 py-0.5 rounded-full bg-secondary-container/40 text-secondary font-bold">
              Impact Score: {milestone.rationales.careerImpactScore}/100
            </span>
          </div>

          <div>
            <span className="font-semibold block text-primary dark:text-white">Skill Gap Addressed:</span>
            <p className="text-on-surface-variant dark:text-outline-variant">{milestone.rationales.skillGapAddressed}</p>
          </div>

          <div>
            <span className="font-semibold block text-primary dark:text-white">Prerequisite Coverage:</span>
            <p className="text-on-surface-variant dark:text-outline-variant">{milestone.rationales.prerequisiteCoverage}</p>
          </div>

          <div>
            <span className="font-semibold block text-primary dark:text-white">Career Impact:</span>
            <p className="text-on-surface-variant dark:text-outline-variant">{milestone.rationales.careerImpact}</p>
          </div>
        </div>
      )}
    </div>
  );
};
