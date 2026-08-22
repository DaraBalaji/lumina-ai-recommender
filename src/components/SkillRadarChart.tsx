import React from 'react';
import { Target } from 'lucide-react';
import { LearnerProfile, TargetRole, SkillGap } from '../types';
import { calculateSkillGaps } from '../services/recommendationEngine';
import { TARGET_ROLES } from '../data/skillTaxonomy';

interface SkillRadarChartProps {
  profile: LearnerProfile;
  targetRole?: TargetRole;
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({ profile, targetRole: propsRole }) => {
  const role = propsRole || TARGET_ROLES.find((r) => r.id === profile.targetRoleId) || TARGET_ROLES[0];
  const skillGaps = calculateSkillGaps(profile, role);

  // SVG Radar Chart Math Constants
  const size = 320;
  const center = size / 2;
  const radius = 110;
  const numSkills = skillGaps.length;

  const getCoordinates = (index: number, valueScore: number) => {
    const angle = (Math.PI * 2 / numSkills) * index - Math.PI / 2;
    const distance = (valueScore / 100) * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { x, y };
  };

  // Generate Polygon Path Points
  const baselinePoints = skillGaps
    .map((gap, i) => {
      const { x, y } = getCoordinates(i, gap.currentScore);
      return `${x},${y}`;
    })
    .join(' ');

  const benchmarkPoints = skillGaps
    .map((gap, i) => {
      const { x, y } = getCoordinates(i, gap.targetScore);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      {/* Left: SVG Radar Chart Canvas */}
      <div className="md:col-span-6 glass-panel p-6 rounded-3xl border border-outline-variant/40 flex flex-col items-center gap-4">
        <div className="flex items-center justify-between w-full pb-2 border-b border-outline-variant/20">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-secondary" />
            <span className="font-headline-md text-sm font-bold text-primary dark:text-on-primary-fixed">
              Competency Radar Matrix
            </span>
          </div>
          <span className="text-xs font-semibold text-secondary bg-secondary-container/40 px-2.5 py-0.5 rounded-full">
            {role.title}
          </span>
        </div>

        <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center my-2">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
            {/* Concentric Grid Circles */}
            {[0.25, 0.5, 0.75, 1.0].map((scale, idx) => (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius * scale}
                fill="none"
                stroke="currentColor"
                className="text-outline-variant/30 dark:text-outline/20"
                strokeDasharray={idx < 3 ? '3 3' : undefined}
              />
            ))}

            {/* Radar Spoke Lines */}
            {skillGaps.map((gap, i) => {
              const { x, y } = getCoordinates(i, 100);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="currentColor"
                  className="text-outline-variant/40 dark:text-outline/20"
                />
              );
            })}

            {/* Target Role Benchmark Polygon */}
            <polygon
              points={benchmarkPoints}
              fill="rgba(7, 2, 53, 0.08)"
              stroke="#070235"
              strokeWidth="2"
              strokeDasharray="4 4"
              className="dark:stroke-on-primary-fixed dark:fill-white/5"
            />

            {/* Learner Baseline Polygon */}
            <polygon
              points={baselinePoints}
              fill="rgba(0, 106, 97, 0.35)"
              stroke="#006a61"
              strokeWidth="2.5"
              className="transition-all duration-500"
            />

            {/* Baseline Skill Nodes */}
            {skillGaps.map((gap, i) => {
              const { x, y } = getCoordinates(i, gap.currentScore);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#86f2e4"
                  stroke="#006a61"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-xs pt-2 border-t border-outline-variant/20 w-full justify-center">
          <span className="flex items-center gap-2 font-medium text-secondary">
            <span className="w-3 h-3 rounded-full bg-secondary"></span> Current Baseline
          </span>
          <span className="flex items-center gap-2 font-medium text-primary dark:text-on-primary-fixed">
            <span className="w-3 h-3 rounded-full border-2 border-dashed border-primary dark:border-white"></span> Target Benchmark
          </span>
        </div>
      </div>

      {/* Right: Skill Gap Breakdown List */}
      <div className="md:col-span-6 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
          <h3 className="font-headline-md text-sm font-bold text-primary dark:text-on-primary-fixed">
            Skill Gap & Competency Breakdown
          </h3>
          <span className="text-xs text-on-surface-variant">
            {skillGaps.filter((g) => g.status === 'Critical').length} Critical Gaps
          </span>
        </div>

        <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
          {skillGaps.map((gap) => (
            <div
              key={gap.skillName}
              className="glass-card p-4 rounded-2xl border border-outline-variant/30 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-label-md text-xs font-bold text-primary dark:text-on-primary-fixed">
                  {gap.skillName}
                </span>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      gap.status === 'Critical'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : gap.status === 'Moderate'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {gap.status} ({gap.competencyLevel})
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-surface-variant/60 rounded-full overflow-hidden relative">
                  {/* Target benchmark line indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-primary dark:bg-white z-10 opacity-70"
                    style={{ left: `${gap.targetScore}%` }}
                    title={`Target: ${gap.targetScore}%`}
                  ></div>
                  {/* Current score fill */}
                  <div
                    className="h-full bg-gradient-to-r from-secondary to-secondary-container rounded-full transition-all duration-500"
                    style={{ width: `${gap.currentScore}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-primary dark:text-on-primary-fixed min-w-[50px] text-right">
                  {gap.currentScore} / {gap.targetScore}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
