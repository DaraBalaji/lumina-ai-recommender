import React, { useState } from 'react';
import {
  CalendarDays, CheckCircle2, ClipboardList, Clock3, ExternalLink, FileText,
  FolderKanban, Gauge, Lightbulb, NotebookPen, Play, RotateCcw, Save,
  Target, Timer, Trophy, XCircle,
} from 'lucide-react';
import { LearnerProfile, Milestone, Roadmap } from '../types';
import { getMilestoneNote, saveMilestoneNote } from '../services/dbService';
import { calculateSkillGaps } from '../services/recommendationEngine';
import { TARGET_ROLES } from '../data/skillTaxonomy';

interface CareerToolkitProps { profile: LearnerProfile; roadmap: Roadmap | null; onAnswer: (correct: boolean, topic: string) => void; }
type ToolkitSection = 'projects' | 'revision' | 'exam' | 'planner' | 'gaps' | 'notes';
interface ExamQuestion { topic: string; prompt: string; options: string[]; answer: number; }

const examQuestion = (topic: string): ExamQuestion => {
  const name = topic.toLowerCase();
  if (name.includes('python')) return { topic, prompt: 'A generator processes records one at a time. What problem does this primarily solve?', options: ['Excessive memory use', 'Type checking', 'CSS specificity'], answer: 0 };
  if (name.includes('machine learning') || name.includes('scikit')) return { topic, prompt: 'A model has high training accuracy and low validation accuracy. What should you investigate first?', options: ['Overfitting and data leakage', 'Changing the page title', 'Adding more test labels'], answer: 0 };
  if (name.includes('transformer') || name.includes('attention')) return { topic, prompt: 'Why does causal masking matter during language generation?', options: ['It prevents looking at future tokens', 'It removes token embeddings', 'It makes every layer recurrent'], answer: 0 };
  if (name.includes('cloud') || name.includes('docker')) return { topic, prompt: 'Which deployment property makes rollback safer?', options: ['Versioned immutable artifacts', 'Shared mutable production files', 'Untracked manual edits'], answer: 0 };
  return { topic, prompt: `Which practice shows working knowledge of ${topic}?`, options: ['Explain a tradeoff and demonstrate it in a small project', 'Memorize a definition without testing it', 'Skip validation to move faster'], answer: 0 };
};

const dateAfter = (date: string, days: number) => { const result = new Date(date); result.setDate(result.getDate() + days); return result; };

export const CareerToolkit: React.FC<CareerToolkitProps> = ({ profile, roadmap, onAnswer }) => {
  const [section, setSection] = useState<ToolkitSection>('projects');
  const [examIndex, setExamIndex] = useState(0);
  const [examScore, setExamScore] = useState(0);
  const [examAnswer, setExamAnswer] = useState<number | null>(null);
  const [examDone, setExamDone] = useState(false);
  const [savedNotes, setSavedNotes] = useState<Record<string, string>>({});
  const [projectStatus, setProjectStatus] = useState<Record<string, string>>({});
  const milestones = roadmap?.phases.flatMap((phase) => phase.milestones) || [];
  const completedTopics = milestones.flatMap((milestone) => milestone.subtopics.filter((topic) => topic.completed).map((topic) => ({ ...topic, milestone })));
  const topics = [...new Set(completedTopics.map((topic) => topic.skill))];
  const exam = topics.slice(0, 5).map(examQuestion);
  const currentExam = exam[examIndex];
  const role = TARGET_ROLES.find((item) => item.id === profile.targetRoleId) || TARGET_ROLES[0];
  const gaps = calculateSkillGaps(profile, role);

  const sections: { id: ToolkitSection; label: string; icon: React.ReactNode }[] = [
    { id: 'projects', label: 'Projects', icon: <FolderKanban className="h-4 w-4" /> },
    { id: 'revision', label: 'Revision', icon: <RotateCcw className="h-4 w-4" /> },
    { id: 'exam', label: 'Certification Exam', icon: <ClipboardList className="h-4 w-4" /> },
    { id: 'planner', label: 'Study Planner', icon: <CalendarDays className="h-4 w-4" /> },
    { id: 'gaps', label: 'Skill Gaps', icon: <Target className="h-4 w-4" /> },
    { id: 'notes', label: 'Notes', icon: <NotebookPen className="h-4 w-4" /> },
  ];

  const resetExam = () => { setExamIndex(0); setExamScore(0); setExamAnswer(null); setExamDone(false); };
  const answerExam = (index: number) => {
    if (examAnswer !== null || !currentExam) return;
    const correct = index === currentExam.answer;
    setExamAnswer(index); if (correct) setExamScore((value) => value + 1); onAnswer(correct, currentExam.topic);
  };
  const nextExam = () => { if (examIndex === exam.length - 1) setExamDone(true); else { setExamIndex((value) => value + 1); setExamAnswer(null); } };

  return <div className="flex flex-col gap-6 pb-16 pt-6">
    <section className="glass-panel rounded-3xl border border-outline-variant/40 p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><span className="inline-flex items-center gap-2 rounded-full bg-secondary-container/40 px-3 py-1 text-xs font-semibold text-secondary"><Gauge className="h-3.5 w-3.5" /> Career toolkit</span><h1 className="mt-3 text-2xl font-bold text-primary dark:text-on-primary-fixed">Turn learning into evidence</h1><p className="mt-2 max-w-2xl text-sm text-on-surface-variant dark:text-outline-variant">Build projects, revisit topics, prepare for certification exams, and close the skills that matter for {role.title}.</p></div>
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/70 px-4 py-3"><div className="text-[11px] text-on-surface-variant">Current target</div><div className="text-sm font-bold text-primary dark:text-on-primary-fixed">{role.title}</div></div>
      </div>
    </section>
    <div className="flex gap-2 overflow-x-auto pb-1">{sections.map((item) => <button key={item.id} onClick={() => setSection(item.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${section === item.id ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-variant'}`}>{item.icon}{item.label}</button>)}</div>

    {section === 'projects' && <section className="grid gap-4 md:grid-cols-2">{milestones.filter((milestone) => milestone.capstoneProject || milestone.course.projectMapping).map((milestone) => { const project = milestone.capstoneProject || milestone.course.projectMapping!; const status = projectStatus[milestone.id] || 'Not started'; return <article key={milestone.id} className="glass-card rounded-2xl border border-outline-variant/40 p-5"><div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-wider text-secondary">{milestone.course.provider}</span><h2 className="mt-1 font-bold text-primary dark:text-on-primary-fixed">{project.title}</h2></div><select value={status} onChange={(event) => setProjectStatus((current) => ({ ...current, [milestone.id]: event.target.value }))} className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-2 text-xs"><option>Not started</option><option>In progress</option><option>Complete</option></select></div><p className="mt-3 text-xs text-on-surface-variant">{project.description}</p><div className="mt-4 flex items-center justify-between border-t border-outline-variant/20 pt-3 text-xs"><span className="flex items-center gap-1 text-on-surface-variant"><Clock3 className="h-3.5 w-3.5" /> {milestone.course.durationHours} hours allocated</span><a href={milestone.course.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-secondary">Open course <ExternalLink className="h-3.5 w-3.5" /></a></div></article>; })}</section>}

    {section === 'revision' && <section className="glass-card rounded-2xl border border-outline-variant/40 p-6"><div className="flex items-center gap-3"><RotateCcw className="h-5 w-5 text-secondary" /><div><h2 className="font-bold text-primary dark:text-on-primary-fixed">Spaced revision queue</h2><p className="text-xs text-on-surface-variant">Review completed topics on a three-day cycle.</p></div></div><div className="mt-5 grid gap-3">{completedTopics.length ? completedTopics.map((item) => { const due = dateAfter(item.completedAt || new Date().toISOString(), 3); const isDue = due <= new Date(); return <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-outline-variant/30 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-semibold text-primary dark:text-on-primary-fixed">{item.skill}</div><div className="text-xs text-on-surface-variant">{item.milestone.title} · due {due.toLocaleDateString()}</div></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isDue ? 'bg-amber-500/10 text-amber-700' : 'bg-emerald-500/10 text-emerald-700'}`}>{isDue ? 'Review now' : 'Scheduled'}</span></div>; }) : <p className="rounded-xl bg-surface-container-low p-4 text-sm text-on-surface-variant">Complete checklist topics in your Learning Path to create revision cards.</p>}</div></section>}

    {section === 'exam' && <section className="glass-card rounded-2xl border border-outline-variant/40 p-6 md:p-8">{!exam.length ? <div className="py-8 text-center"><ClipboardList className="mx-auto h-8 w-8 text-secondary" /><h2 className="mt-3 font-bold text-primary dark:text-on-primary-fixed">Build your exam bank first</h2><p className="mt-2 text-sm text-on-surface-variant">Complete topics to generate a certification-style exam.</p></div> : examDone ? <div className="py-8 text-center"><Trophy className="mx-auto h-10 w-10 text-amber-500" /><h2 className="mt-3 text-xl font-bold text-primary dark:text-on-primary-fixed">Exam complete: {examScore}/{exam.length}</h2><p className="mt-2 text-sm text-on-surface-variant">Your responses were added to mastery evidence.</p><button onClick={resetExam} className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary"><RotateCcw className="h-4 w-4" /> Retake exam</button></div> : <><div className="flex items-center justify-between text-xs text-on-surface-variant"><span>Question {examIndex + 1} of {exam.length}</span><span className="font-semibold text-secondary">{currentExam.topic}</span></div><div className="mt-3 h-1.5 rounded-full bg-surface-variant"><div className="h-full rounded-full bg-secondary" style={{ width: `${((examIndex + 1) / exam.length) * 100}%` }} /></div><h2 className="mt-8 text-xl font-bold text-primary dark:text-on-primary-fixed">{currentExam.prompt}</h2><div className="mt-5 grid gap-3">{currentExam.options.map((option, index) => <button key={option} disabled={examAnswer !== null} onClick={() => answerExam(index)} className={`flex items-center justify-between rounded-xl border p-4 text-left text-sm font-medium ${examAnswer !== null && index === currentExam.answer ? 'border-emerald-500 bg-emerald-500/10' : examAnswer === index ? 'border-rose-500 bg-rose-500/10' : 'border-outline-variant/40 hover:border-secondary'}`}>{option}{examAnswer !== null && index === currentExam.answer && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}{examAnswer === index && index !== currentExam.answer && <XCircle className="h-4 w-4 text-rose-600" />}</button>)}</div>{examAnswer !== null && <button onClick={nextExam} className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary">{examIndex === exam.length - 1 ? 'See results' : 'Next question'} <Play className="h-3.5 w-3.5" /></button>}</>}</section>}

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
