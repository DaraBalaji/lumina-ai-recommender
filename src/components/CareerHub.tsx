import React, { useState } from 'react';
import { Bookmark, BriefcaseBusiness, CheckCircle2, ClipboardCheck, MessageSquare, Play, Send, Star, Users, XCircle } from 'lucide-react';
import { Course, LearnerProfile, Roadmap } from '../types';
import { getCustomCourses } from '../services/dbService';
import { COURSE_CATALOG } from '../data/courseCatalog';
import { CareerToolkit } from './CareerToolkit';
import { AssessmentPage } from './AssessmentPage';

interface CareerHubProps { profile: LearnerProfile; roadmap: Roadmap | null; onAnswer: (correct: boolean, topic: string) => void; }
type HubTab = 'learning' | 'assessment' | 'interview' | 'rooms' | 'jobs' | 'bookmarks';
interface InterviewQuestion { prompt: string; topic: string; ideal: string; }

const interviewQuestions: InterviewQuestion[] = [
  { prompt: 'Explain a difficult technical decision you made, the alternatives you considered, and how you measured the result.', topic: 'System design', ideal: 'Context, tradeoffs, decision, measurable outcome' },
  { prompt: 'A machine-learning model is accurate in development but fails in production. How would you investigate?', topic: 'Machine learning', ideal: 'Check drift, leakage, data quality, monitoring, and reproducibility' },
  { prompt: 'How would you design an API that remains reliable when a downstream service is slow?', topic: 'Backend engineering', ideal: 'Timeouts, retries, circuit breakers, queues, and observability' },
];

const jobTemplates = [
  { title: 'Junior AI Engineer', company: 'Northstar Labs', skills: ['Python Programming', 'PyTorch & Deep Learning', 'Transformers & Attention'] },
  { title: 'Full Stack Developer', company: 'Orbit Systems', skills: ['JavaScript & TypeScript', 'React', 'Cloud Platforms (GCP/AWS)'] },
  { title: 'Machine Learning Analyst', company: 'Signal Works', skills: ['Applied Statistics & Hypothesis Testing', 'Scikit-Learn Machine Learning', 'Feature Engineering'] },
  { title: 'Cloud Platform Associate', company: 'Vertex Cloud', skills: ['Cloud Platforms (GCP/AWS)', 'Docker & Containerization', 'Linux & Command Line'] },
  { title: 'Data Engineer', company: 'Cedar Analytics', skills: ['Python Programming', 'SQL & Databases', 'Data Modeling'] },
  { title: 'AI Product Developer', company: 'Helix Studio', skills: ['Prompt Engineering', 'Retrieval-Augmented Generation', 'JavaScript & TypeScript'] },
];

export const CareerHub: React.FC<CareerHubProps> = ({ profile, roadmap, onAnswer }) => {
  const [tab, setTab] = useState<HubTab>('interview');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [bookmarks, setBookmarks] = useState<string[]>(() => JSON.parse(localStorage.getItem(`routemind-bookmarks-${profile.id}`) || '[]'));
  const [roomMessage, setRoomMessage] = useState('');
  const [sentMessages, setSentMessages] = useState<string[]>([]);
  const milestones = roadmap?.phases.flatMap((phase) => phase.milestones) || [];
  const courses: Course[] = [...COURSE_CATALOG, ...getCustomCourses()];
  const skillSet = new Set(Object.keys(profile.baselineScores || {}).filter((skill) => (profile.baselineScores[skill] || 0) > 0));
  const currentQuestion = interviewQuestions[questionIndex];

  const toggleBookmark = (courseId: string) => {
    const next = bookmarks.includes(courseId) ? bookmarks.filter((id) => id !== courseId) : [...bookmarks, courseId];
    setBookmarks(next); localStorage.setItem(`routemind-bookmarks-${profile.id}`, JSON.stringify(next));
  };
  const submitInterview = () => {
    if (!answer.trim()) return;
    const quality = answer.trim().length > 100;
    setFeedback(quality ? `Strong answer. You addressed the prompt with enough detail. Compare it with this structure: ${currentQuestion.ideal}.` : `Add more detail using this structure: ${currentQuestion.ideal}. Include a specific outcome.`);
    onAnswer(quality, currentQuestion.topic); setAnswer('');
  };
  const nextInterview = () => { setQuestionIndex((index) => (index + 1) % interviewQuestions.length); setFeedback(''); };
  const tabs: { id: HubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'learning', label: 'Learning Tools', icon: <Play className="h-4 w-4" /> }, { id: 'assessment', label: 'Assessment', icon: <ClipboardCheck className="h-4 w-4" /> }, { id: 'interview', label: 'Mock Interview', icon: <MessageSquare className="h-4 w-4" /> }, { id: 'rooms', label: 'Study Rooms', icon: <Users className="h-4 w-4" /> }, { id: 'jobs', label: 'Jobs', icon: <BriefcaseBusiness className="h-4 w-4" /> }, { id: 'bookmarks', label: 'Bookmarks', icon: <Bookmark className="h-4 w-4" /> },
  ];

  return <div className="flex flex-col gap-6 pb-16 pt-6">
    <section className="glass-panel rounded-3xl border border-outline-variant/40 p-6 md:p-8"><div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><span className="inline-flex items-center gap-2 rounded-full bg-secondary-container/40 px-3 py-1 text-xs font-semibold text-secondary"><BriefcaseBusiness className="h-3.5 w-3.5" /> Career readiness</span><h1 className="mt-3 text-2xl font-bold text-primary dark:text-on-primary-fixed">From learning to landing the role</h1><p className="mt-2 max-w-2xl text-sm text-on-surface-variant">Practice interviews, join focused study rooms, and discover roles matched to your real skills.</p></div><div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/70 px-4 py-3"><div className="text-[11px] text-on-surface-variant">Career evidence</div><div className="text-lg font-bold text-primary dark:text-on-primary-fixed">{profile.totalHoursLearned}h recorded</div></div></div></section>
    <div className="flex gap-2 overflow-x-auto pb-1">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${tab === item.id ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-variant'}`}>{item.icon}{item.label}</button>)}</div>

    {tab === 'learning' && <CareerToolkit profile={profile} roadmap={roadmap} />}

    {tab === 'assessment' && <AssessmentPage roadmap={roadmap} onAnswer={onAnswer} />}

    {tab === 'interview' && <section className="glass-card rounded-2xl border border-outline-variant/40 p-6 md:p-8"><div className="flex items-center justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Question {questionIndex + 1} of {interviewQuestions.length}</span><h2 className="mt-2 text-xl font-bold text-primary dark:text-on-primary-fixed">{currentQuestion.prompt}</h2></div><Star className="h-6 w-6 text-amber-500" /></div><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Write your answer as if you were speaking to an interviewer..." className="mt-6 min-h-36 w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 text-sm outline-none focus:border-secondary" /><div className="mt-4 flex flex-wrap gap-3"><button onClick={submitInterview} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary"><Send className="h-4 w-4" /> Submit answer</button><button onClick={nextInterview} className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 px-4 py-2 text-xs font-semibold text-on-surface-variant"><Play className="h-4 w-4" /> Next question</button></div>{feedback && <div className="mt-5 rounded-xl bg-secondary-container/30 p-4 text-sm text-on-surface"><strong>AI feedback:</strong> {feedback}</div>}</section>}

    {tab === 'rooms' && <section className="glass-card rounded-2xl border border-outline-variant/40 p-6"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-secondary" /><div><h2 className="font-bold text-primary dark:text-on-primary-fixed">Peer study rooms</h2><p className="text-xs text-on-surface-variant">Share questions and useful resources with learners targeting the same role.</p></div></div><div className="mt-5 rounded-xl border border-outline-variant/30 p-4"><div className="text-xs font-bold text-secondary">{profile.targetRoleTitle} room</div><p className="mt-2 text-sm text-on-surface-variant">Welcome to the room. Start a focused discussion about your current learning path.</p>{sentMessages.map((message, index) => <div key={`${message}-${index}`} className="mt-3 rounded-lg bg-surface-container-low p-3 text-xs">{message}</div>)}<div className="mt-4 flex gap-2"><input value={roomMessage} onChange={(event) => setRoomMessage(event.target.value)} placeholder="Share a question or insight..." className="min-w-0 flex-1 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 text-xs" /><button onClick={() => { if (roomMessage.trim()) { setSentMessages((messages) => [...messages, roomMessage.trim()]); setRoomMessage(''); } }} className="rounded-xl bg-secondary px-3 text-on-secondary"><Send className="h-4 w-4" /></button></div></div></section>}


    {tab === 'jobs' && <section className="grid gap-4 md:grid-cols-2">{jobTemplates.map((job) => { const matched = job.skills.filter((skill) => skillSet.has(skill)).length; const match = Math.round((matched / job.skills.length) * 100); return <article key={job.title} className="glass-card rounded-2xl border border-outline-variant/40 p-5"><div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-wider text-secondary">{job.company}</span><h2 className="mt-1 font-bold text-primary dark:text-on-primary-fixed">{job.title}</h2></div><span className="rounded-full bg-secondary-container/40 px-2.5 py-1 text-xs font-bold text-secondary">{match}% match</span></div><div className="mt-4 space-y-2">{job.skills.map((skill) => <div key={skill} className="flex items-center gap-2 text-xs text-on-surface-variant">{skillSet.has(skill) ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-rose-500" />}{skill}</div>)}</div><button onClick={() => setTab('interview')} className="mt-4 text-xs font-semibold text-secondary">Practice for this role</button></article>; })}</section>}

    {tab === 'bookmarks' && <section className="glass-card rounded-2xl border border-outline-variant/40 p-6"><div className="flex items-center gap-3"><Bookmark className="h-5 w-5 text-secondary" /><div><h2 className="font-bold text-primary dark:text-on-primary-fixed">Saved resources</h2><p className="text-xs text-on-surface-variant">Keep useful courses close while you prepare for your next role.</p></div></div><div className="mt-5 grid gap-3">{courses.filter((course) => bookmarks.includes(course.id)).map((course) => <div key={course.id} className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/30 p-4"><div><div className="text-sm font-semibold text-primary dark:text-on-primary-fixed">{course.title}</div><div className="text-xs text-on-surface-variant">{course.provider} · {course.skillsCovered.join(', ')}</div></div><button onClick={() => toggleBookmark(course.id)} className="text-xs font-semibold text-rose-600">Remove</button></div>)}{!bookmarks.length && <p className="text-sm text-on-surface-variant">No bookmarks yet. Choose a resource below.</p>}</div><h3 className="mt-6 border-t border-outline-variant/20 pt-5 text-sm font-bold text-primary dark:text-on-primary-fixed">Browse resources</h3><div className="mt-3 grid gap-2">{courses.slice(0, 8).map((course) => <div key={course.id} className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/30 p-3"><div><div className="text-xs font-semibold text-primary dark:text-on-primary-fixed">{course.title}</div><div className="text-[11px] text-on-surface-variant">{course.provider} · {course.difficulty}</div></div><button onClick={() => toggleBookmark(course.id)} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold text-on-secondary">{bookmarks.includes(course.id) ? 'Saved' : 'Save'} <Bookmark className="h-3 w-3" /></button></div>)}</div></section>}
  </div>;
};
