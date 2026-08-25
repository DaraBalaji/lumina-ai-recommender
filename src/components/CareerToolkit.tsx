import React, { useState } from 'react';
import {
  CalendarDays, CheckCircle2, Clock3, ExternalLink, FileText, FolderKanban,
  Gauge, Lightbulb, NotebookPen, Save, Target, Timer,
} from 'lucide-react';
import { LearnerProfile, Milestone, Roadmap } from '../types';
import { getMilestoneNote, saveMilestoneNote } from '../services/dbService';
import { calculateSkillGaps } from '../services/recommendationEngine';
import { TARGET_ROLES } from '../data/skillTaxonomy';

interface CareerToolkitProps { profile: LearnerProfile; roadmap: Roadmap | null; }
type ToolkitSection = 'projects' | 'planner' | 'gaps' | 'notes';

export const CareerToolkit: React.FC<CareerToolkitProps> = ({ profile, roadmap }) => {
  const [section, setSection] = useState<ToolkitSection>('projects');
  const [savedNotes, setSavedNotes] = useState<Record<string, string>>({});
  const [projectStatus, setProjectStatus] = useState<Record<string, string>>({});
  const milestones = roadmap?.phases.flatMap((phase) => phase.milestones) || [];
  const role = TARGET_ROLES.find((item) => item.id === profile.targetRoleId) || TARGET_ROLES[0];
  const gaps = calculateSkillGaps(profile, role);

  const sections: { id: ToolkitSection; label: string; icon: React.ReactNode }[] = [
    { id: 'projects', label: 'Projects', icon: <FolderKanban className="h-4 w-4" /> },
    { id: 'planner', label: 'Study Planner', icon: <CalendarDays className="h-4 w-4" /> },
    { id: 'gaps', label: 'Skill Gaps', icon: <Target className="h-4 w-4" /> },
    { id: 'notes', label: 'Notes', icon: <NotebookPen className="h-4 w-4" /> },
  ];

  return <div className="flex flex-col gap-6 pb-16 pt-6">
    <section className="glass-panel rounded-3xl border border-outline-variant/40 p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><span className="inline-flex items-center gap-2 rounded-full bg-secondary-container/40 px-3 py-1 text-xs font-semibold text-secondary"><Gauge className="h-3.5 w-3.5" /> Career toolkit</span><h1 className="mt-3 text-2xl font-bold text-primary dark:text-on-primary-fixed">Turn learning into evidence</h1><p className="mt-2 max-w-2xl text-sm text-on-surface-variant dark:text-outline-variant">Organize projects, plan study time, close skill gaps, and keep useful notes for {role.title}.</p></div>
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/70 px-4 py-3"><div className="text-[11px] text-on-surface-variant">Current target</div><div className="text-sm font-bold text-primary dark:text-on-primary-fixed">{role.title}</div></div>
      </div>
    </section>
    <div className="flex gap-2 overflow-x-auto pb-1">{sections.map((item) => <button key={item.id} onClick={() => setSection(item.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${section === item.id ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-variant'}`}>{item.icon}{item.label}</button>)}</div>

    {section === 'projects' && <section className="grid gap-4 md:grid-cols-2">{milestones.filter((milestone) => milestone.capstoneProject || milestone.course.projectMapping).map((milestone) => { const project = milestone.capstoneProject || milestone.course.projectMapping!; const status = projectStatus[milestone.id] || 'Not started'; return <article key={milestone.id} className="glass-card rounded-2xl border border-outline-variant/40 p-5"><div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-wider text-secondary">{milestone.course.provider}</span><h2 className="mt-1 font-bold text-primary dark:text-on-primary-fixed">{project.title}</h2></div><select value={status} onChange={(event) => setProjectStatus((current) => ({ ...current, [milestone.id]: event.target.value }))} className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-2 text-xs"><option>Not started</option><option>In progress</option><option>Complete</option></select></div><p className="mt-3 text-xs text-on-surface-variant">{project.description}</p><div className="mt-4 flex items-center justify-between border-t border-outline-variant/20 pt-3 text-xs"><span className="flex items-center gap-1 text-on-surface-variant"><Clock3 className="h-3.5 w-3.5" /> {milestone.course.durationHours} hours allocated</span><a href={milestone.course.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-secondary">Open course <ExternalLink className="h-3.5 w-3.5" /></a></div></article>; })}</section>}

    {section === 'planner' && <section className="glass-card rounded-2xl border border-outline-variant/40 p-6"><div className="flex items-center gap-3"><CalendarDays className="h-5 w-5 text-secondary" /><div><h2 className="font-bold text-primary dark:text-on-primary-fixed">Weekly study planner</h2><p className="text-xs text-on-surface-variant">A lightweight plan based on your {profile.hoursPerWeek} available hours.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'].map((day, index) => { const milestone = milestones.filter((item) => item.status !== 'Completed')[index % Math.max(1, milestones.filter((item) => item.status !== 'Completed').length)]; return <div key={day} className="rounded-xl border border-outline-variant/30 p-4"><div className="flex items-center justify-between text-[11px] font-bold text-secondary"><span>{day}</span><Timer className="h-3.5 w-3.5" /></div><p className="mt-3 text-sm font-semibold text-primary dark:text-on-primary-fixed">{milestone?.title || 'Revision and reflection'}</p><p className="mt-2 text-xs text-on-surface-variant">{Math.max(1, Math.round(profile.hoursPerWeek / 7))} hour focus block</p></div>; })}</div></section>}

    {section === 'gaps' && <section className="glass-card rounded-2xl border border-outline-variant/40 p-6"><div className="flex items-center gap-3"><Lightbulb className="h-5 w-5 text-secondary" /><div><h2 className="font-bold text-primary dark:text-on-primary-fixed">AI skill-gap analysis</h2><p className="text-xs text-on-surface-variant">Priorities are calculated from your current evidence against the target role benchmark.</p></div></div><div className="mt-5 grid gap-3">{[...gaps].sort((a, b) => b.gapScore - a.gapScore).map((gap) => <div key={gap.skillName} className="rounded-xl border border-outline-variant/30 p-4"><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-primary dark:text-on-primary-fixed">{gap.skillName}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${gap.status === 'Critical' ? 'bg-rose-500/10 text-rose-700' : gap.status === 'Moderate' ? 'bg-amber-500/10 text-amber-700' : 'bg-emerald-500/10 text-emerald-700'}`}>{gap.status}</span></div><div className="mt-3 h-2 rounded-full bg-surface-variant"><div className="h-full rounded-full bg-secondary" style={{ width: `${gap.currentScore}%` }} /></div><div className="mt-2 flex justify-between text-[11px] text-on-surface-variant"><span>Current {gap.currentScore}%</span><span>Target {gap.targetScore}% · gap {gap.gapScore}</span></div></div>)}</div></section>}

    {section === 'notes' && <section className="grid gap-4 md:grid-cols-2">{milestones.map((milestone) => <NoteCard key={milestone.id} milestone={milestone} savedNotes={savedNotes} setSavedNotes={setSavedNotes} />)}</section>}
  </div>;
};

const NoteCard: React.FC<{ milestone: Milestone; savedNotes: Record<string, string>; setSavedNotes: React.Dispatch<React.SetStateAction<Record<string, string>>> }> = ({ milestone, savedNotes, setSavedNotes }) => {
  const [note, setNote] = useState(() => getMilestoneNote(milestone.id));
  const save = () => { saveMilestoneNote(milestone.id, note); setSavedNotes((current) => ({ ...current, [milestone.id]: note })); };
  return <article className="glass-card rounded-2xl border border-outline-variant/40 p-5"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-secondary" /><h2 className="text-sm font-bold text-primary dark:text-on-primary-fixed">{milestone.title}</h2></div><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Capture a takeaway, question, or implementation detail..." className="mt-4 min-h-28 w-full resize-y rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 text-xs text-on-surface outline-none focus:border-secondary" /><button onClick={save} className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-on-primary"><Save className="h-3.5 w-3.5" /> {savedNotes[milestone.id] !== undefined ? 'Saved' : 'Save note'}</button></article>;
};
