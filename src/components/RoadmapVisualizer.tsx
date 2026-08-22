import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Lock,
  CheckCircle2,
  Clock,
  Zap,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { Roadmap, Milestone, MilestoneStatus } from '../types';
import { MilestoneCard } from './MilestoneCard';

interface RoadmapVisualizerProps {
  roadmap: Roadmap;
  onToggleMilestoneStatus: (milestoneId: string, newStatus: MilestoneStatus) => void;
  onOpenAddCustomCourse: () => void;
  onSelectMilestoneDetails: (milestone: Milestone) => void;
}

export const RoadmapVisualizer: React.FC<RoadmapVisualizerProps> = ({
  roadmap,
  onToggleMilestoneStatus,
  onOpenAddCustomCourse,
  onSelectMilestoneDetails,
}) => {
  const [activePhaseId, setActivePhaseId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'graph' | 'cards'>('graph');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unlocked' | 'completed'>('all');

  const allMilestones = roadmap.phases.flatMap((p) => p.milestones);

  const filteredMilestones = allMilestones.filter((m) => {
    if (activePhaseId !== 'all' && m.phaseId !== activePhaseId) return false;
    if (filterStatus === 'unlocked' && m.status === 'Locked') return false;
    if (filterStatus === 'completed' && m.status !== 'Completed') return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-outline-variant/40 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-container/40 text-secondary rounded-full text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Target Goal: {roadmap.targetRoleTitle}</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary dark:text-on-primary-fixed mb-2">
            Interactive Dependency Roadmap
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant dark:text-outline-variant max-w-2xl">
            Multi-phase structured curriculum with unlockable prerequisite DAG graph nodes, estimated completion time, and Explainable AI rationales.
          </p>
        </div>

        {/* Stats Summary Pills */}
        <div className="flex items-center gap-4 bg-surface-container-lowest dark:bg-inverse-surface p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
          <div className="text-center px-3 border-r border-outline-variant/20">
            <div className="text-xs text-on-surface-variant">Completion</div>
            <div className="text-lg font-bold text-secondary">
              {roadmap.overallCompletionPercentage}%
            </div>
          </div>
          <div className="text-center px-3 border-r border-outline-variant/20">
            <div className="text-xs text-on-surface-variant">Est. Duration</div>
            <div className="text-lg font-bold text-primary dark:text-on-primary-fixed">
              {roadmap.estimatedWeeks} wks
            </div>
          </div>
          <div className="text-center px-3">
            <div className="text-xs text-on-surface-variant">Total Effort</div>
            <div className="text-lg font-bold text-primary dark:text-on-primary-fixed">
              {roadmap.totalHours} hrs
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Phase Tabs, View Switcher & Custom Course Button */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Phase Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActivePhaseId('all')}
            className={`px-4 py-2 rounded-full font-label-md text-xs font-semibold whitespace-nowrap transition-all ${
              activePhaseId === 'all'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            All Phases ({allMilestones.length})
          </button>
          {roadmap.phases.map((phase) => (
            <button
              key={phase.id}
              onClick={() => setActivePhaseId(phase.id)}
              className={`px-4 py-2 rounded-full font-label-md text-xs font-semibold whitespace-nowrap transition-all ${
                activePhaseId === phase.id
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              Phase {phase.phaseNumber}: {phase.title.split(' ')[0]} ({phase.milestones.length})
            </button>
          ))}
        </div>

        {/* View Mode & Actions */}
        <div className="flex items-center gap-3 justify-between md:justify-end">
          <div className="flex p-1 bg-surface-container-low dark:bg-surface-container/30 rounded-full border border-outline-variant/30 text-xs">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
                viewMode === 'graph'
                  ? 'bg-secondary text-on-secondary shadow-sm'
                  : 'text-on-surface-variant'
              }`}
            >
              DAG Graph Visualizer
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-secondary text-on-secondary shadow-sm'
                  : 'text-on-surface-variant'
              }`}
            >
              Milestone Cards
            </button>
          </div>

          <button
            onClick={onOpenAddCustomCourse}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant text-primary dark:text-on-primary-fixed rounded-full text-xs font-semibold hover:bg-surface-variant transition-colors"
          >
            <Plus className="w-4 h-4 text-secondary" />
            <span>Add Custom Module</span>
          </button>
        </div>
      </div>

      {/* View Mode 1: Interactive SVG DAG Graph Visualizer */}
      {viewMode === 'graph' && (
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-outline-variant/40 relative overflow-hidden flex flex-col gap-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-secondary" />
              <span className="font-headline-md text-sm font-bold text-primary dark:text-on-primary-fixed">
                Directed Acyclic Graph (DAG) Prerequisite Unlock Sequence
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Completed
              </span>
              <span className="flex items-center gap-1.5 text-secondary font-medium">
                <span className="w-3 h-3 rounded-full bg-secondary-container border border-secondary inline-block"></span> Unlocked / Available
              </span>
              <span className="flex items-center gap-1.5 text-outline font-medium">
                <span className="w-3 h-3 rounded-full bg-outline-variant inline-block"></span> Locked
              </span>
            </div>
          </div>

          {/* Phase Columns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {roadmap.phases.map((phase, pIdx) => (
              <div key={phase.id} className="flex flex-col gap-4 relative">
                {/* Phase Column Header */}
                <div className="p-4 rounded-2xl bg-surface-container-low dark:bg-surface-container/30 border border-outline-variant/30 text-center">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">
                    Phase {phase.phaseNumber}
                  </span>
                  <h3 className="font-headline-md text-xs font-bold text-primary dark:text-on-primary-fixed truncate">
                    {phase.title}
                  </h3>
                </div>

                {/* Milestone Node List */}
                <div className="flex flex-col gap-4">
                  {phase.milestones.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => onSelectMilestoneDetails(m)}
                      className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative ${
                        m.status === 'Completed'
                          ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                          : m.status === 'In-Progress'
                          ? 'bg-secondary-container/20 border-secondary shadow-md'
                          : m.status === 'Available'
                          ? 'bg-surface-container-lowest dark:bg-inverse-surface border-secondary-container hover:border-secondary shadow-sm'
                          : 'bg-surface-container-lowest/40 dark:bg-inverse-surface/30 border-outline-variant/20 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-semibold text-on-surface-variant truncate">
                          {m.course.provider}
                        </span>
                        {m.status === 'Completed' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                        {m.status === 'In-Progress' && (
                          <Clock className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                        )}
                        {m.status === 'Available' && (
                          <Zap className="w-4 h-4 text-secondary shrink-0" />
                        )}
                        {m.status === 'Locked' && (
                          <Lock className="w-4 h-4 text-outline shrink-0" />
                        )}
                      </div>

                      <h4 className="font-headline-md text-xs font-bold text-primary dark:text-on-primary-fixed line-clamp-2 mb-2">
                        {m.title}
                      </h4>

                      <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-2 border-t border-outline-variant/20">
                        <span>~{m.course.durationHours} hrs</span>
                        <span className="font-bold text-secondary">⭐ {m.course.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Arrow connector between columns (desktop) */}
                {pIdx < roadmap.phases.length - 1 && (
                  <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 text-secondary">
                    <ArrowRight className="w-5 h-5 opacity-60" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Mode 2: Card Grid View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMilestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              onToggleStatus={onToggleMilestoneStatus}
              onSelectForDetails={onSelectMilestoneDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};
