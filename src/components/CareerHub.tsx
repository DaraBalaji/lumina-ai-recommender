import React, { useEffect, useState } from 'react';
import { Bookmark, BriefcaseBusiness, CheckCircle2, ClipboardCheck, MessageSquare, Play, Send, Star, Users, XCircle } from 'lucide-react';
import { Course, LearnerProfile, Roadmap } from '../types';
import { getCustomCourses } from '../services/dbService';
import { COURSE_CATALOG } from '../data/courseCatalog';
import { CareerToolkit } from './CareerToolkit';
import { AssessmentPage } from './AssessmentPage';
import { fetchLiveJobs, JobListing } from '../services/jobService';
import { createStudyRoom, getStudyRooms, inviteToStudyRoom, postStudyRoomMessage, respondToStudyRoom, StudyRoom } from '../services/studyRoomService';

interface CareerHubProps { profile: LearnerProfile; roadmap: Roadmap | null; onAnswer: (correct: boolean, topic: string) => void; }
type HubTab = 'learning' | 'assessment' | 'interview' | 'rooms' | 'jobs' | 'bookmarks';
interface InterviewQuestion { prompt: string; topic: string; ideal: string; }

const interviewQuestions: InterviewQuestion[] = [
  { prompt: 'Explain a difficult technical decision you made, the alternatives you considered, and how you measured the result.', topic: 'System design', ideal: 'Context, tradeoffs, decision, measurable outcome' },
  { prompt: 'A machine-learning model is accurate in development but fails in production. How would you investigate?', topic: 'Machine learning', ideal: 'Check drift, leakage, data quality, monitoring, and reproducibility' },
  { prompt: 'How would you design an API that remains reliable when a downstream service is slow?', topic: 'Backend engineering', ideal: 'Timeouts, retries, circuit breakers, queues, and observability' },
];

const fallbackJobs: JobListing[] = [
  { id: 'fallback-ai', title: 'Junior AI Engineer', company: 'Northstar Labs', location: 'Remote', remote: true, description: 'Build practical AI features and production-ready model integrations.', url: 'https://www.linkedin.com/jobs/search/?keywords=junior%20ai%20engineer', tags: ['Python', 'PyTorch', 'Transformers'] },
  { id: 'fallback-fullstack', title: 'Full Stack Developer', company: 'Orbit Systems', location: 'Remote', remote: true, description: 'Deliver reliable web products across frontend, backend, and cloud infrastructure.', url: 'https://www.linkedin.com/jobs/search/?keywords=full%20stack%20developer', tags: ['JavaScript', 'React', 'Cloud'] },
  { id: 'fallback-ml', title: 'Machine Learning Analyst', company: 'Signal Works', location: 'Hybrid', remote: false, description: 'Analyze datasets, evaluate models, and communicate evidence-based recommendations.', url: 'https://www.linkedin.com/jobs/search/?keywords=machine%20learning%20analyst', tags: ['Machine Learning', 'Statistics', 'Python'] },
  { id: 'fallback-cloud', title: 'Cloud Platform Associate', company: 'Vertex Cloud', location: 'Remote', remote: true, description: 'Support scalable deployments, observability, and secure cloud operations.', url: 'https://www.linkedin.com/jobs/search/?keywords=cloud%20engineer', tags: ['Cloud', 'Docker', 'Linux'] },
  { id: 'fallback-data', title: 'Data Engineer', company: 'Cedar Analytics', location: 'New York, NY', remote: false, description: 'Design data pipelines and models that make analytics dependable and discoverable.', url: 'https://www.linkedin.com/jobs/search/?keywords=data%20engineer', tags: ['Python', 'SQL', 'Data Modeling'] },
  { id: 'fallback-product', title: 'AI Product Developer', company: 'Helix Studio', location: 'Remote', remote: true, description: 'Turn language-model capabilities into useful, measurable product experiences.', url: 'https://www.linkedin.com/jobs/search/?keywords=ai%20product%20developer', tags: ['Prompt Engineering', 'RAG', 'TypeScript'] },
];

export const CareerHub: React.FC<CareerHubProps> = ({ profile, roadmap, onAnswer }) => {
  const [tab, setTab] = useState<HubTab>('interview');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [bookmarks, setBookmarks] = useState<string[]>(() => JSON.parse(localStorage.getItem(`routemind-bookmarks-${profile.id}`) || '[]'));
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [roomMessage, setRoomMessage] = useState('');
  const [roomError, setRoomError] = useState('');
  const [roomLoading, setRoomLoading] = useState(false);
  const [jobSearch, setJobSearch] = useState('');
  const [jobs, setJobs] = useState<JobListing[]>(fallbackJobs);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState('');
  const [jobsUpdatedAt, setJobsUpdatedAt] = useState<string | null>(null);
  const milestones = roadmap?.phases.flatMap((phase) => phase.milestones) || [];
  const courses: Course[] = [...COURSE_CATALOG, ...getCustomCourses()];
  const skillSet = new Set(Object.keys(profile.baselineScores || {}).filter((skill) => (profile.baselineScores[skill] || 0) > 0));
  const currentQuestion = interviewQuestions[questionIndex];
  const activeRoom = rooms.find((room) => room.id === activeRoomId) || rooms[0];
  const pendingRequests = rooms.flatMap((room) => room.requests.filter((request) => request.userId === localStorage.getItem('lumina_account_id')).map((request) => ({ ...request, room })));

  const loadRooms = async () => {
    const userId = localStorage.getItem('lumina_account_id');
    if (!userId) return;
    try {
      const nextRooms = await getStudyRooms(userId);
      setRooms(nextRooms);
      setActiveRoomId((currentId) => nextRooms.some((room) => room.id === currentId) ? currentId : nextRooms[0]?.id || '');
    } catch (error) {
      setRoomError(error instanceof Error ? error.message : 'Could not load study rooms.');
    }
  };

  useEffect(() => {
    if (tab !== 'rooms') return;
    void loadRooms();
    const interval = window.setInterval(() => void loadRooms(), 5000);
    return () => window.clearInterval(interval);
  }, [tab, profile.id]);

  const createRoom = async () => {
    const userId = localStorage.getItem('lumina_account_id');
    if (!userId || !newRoomName.trim()) return;
    setRoomLoading(true); setRoomError('');
    try { const room = await createStudyRoom(userId, newRoomName.trim()); setNewRoomName(''); setRooms((current) => [...current, room]); setActiveRoomId(room.id); } catch (error) { setRoomError(error instanceof Error ? error.message : 'Could not create room.'); } finally { setRoomLoading(false); }
  };

  const inviteFriend = async () => {
    const userId = localStorage.getItem('lumina_account_id');
    if (!userId || !activeRoom || !inviteEmail.trim()) return;
    setRoomLoading(true); setRoomError('');
    try { await inviteToStudyRoom(userId, activeRoom.id, inviteEmail.trim()); setInviteEmail(''); await loadRooms(); } catch (error) { setRoomError(error instanceof Error ? error.message : 'Could not send invitation.'); } finally { setRoomLoading(false); }
  };

  const respondToInvite = async (roomId: string, status: 'accepted' | 'rejected') => {
    const userId = localStorage.getItem('lumina_account_id');
    if (!userId) return;
    setRoomLoading(true); setRoomError('');
    try { await respondToStudyRoom(userId, roomId, status); await loadRooms(); } catch (error) { setRoomError(error instanceof Error ? error.message : 'Could not update invitation.'); } finally { setRoomLoading(false); }
  };

  const sendRoomMessage = async () => {
    const userId = localStorage.getItem('lumina_account_id');
    if (!userId || !activeRoom || !roomMessage.trim()) return;
    setRoomLoading(true); setRoomError('');
    try { await postStudyRoomMessage(userId, activeRoom.id, roomMessage.trim()); setRoomMessage(''); await loadRooms(); } catch (error) { setRoomError(error instanceof Error ? error.message : 'Could not send message.'); } finally { setRoomLoading(false); }
  };
  const loadJobs = async (query = jobSearch) => {
    setJobsLoading(true);
    setJobsError('');
    try {
      const liveJobs = await fetchLiveJobs(query);
      setJobs(liveJobs.length ? liveJobs : fallbackJobs);
      setJobsUpdatedAt(new Date().toISOString());
    } catch {
      setJobs(fallbackJobs);
      setJobsError('Live feed unavailable. Showing curated sample roles.');
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'jobs') void loadJobs();
  }, [tab]);

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

    {tab === 'rooms' && <section className="glass-card rounded-2xl border border-outline-variant/40 p-6"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-secondary" /><div><h2 className="font-bold text-primary dark:text-on-primary-fixed">Peer study rooms</h2><p className="text-xs text-on-surface-variant">Create private rooms and invite learners who already have a RouteMind account.</p></div></div><div className="mt-5 flex gap-2"><input value={newRoomName} onChange={(event) => setNewRoomName(event.target.value)} placeholder="New room name" className="min-w-0 flex-1 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 text-xs" /><button onClick={() => void createRoom()} disabled={roomLoading || !newRoomName.trim()} className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-on-primary">Create room</button></div>{roomError && <p className="mt-3 rounded-xl bg-rose-500/10 p-3 text-xs text-rose-700">{roomError}</p>}<div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr]">{rooms.length ? <div className="space-y-2">{rooms.map((room) => <button key={room.id} onClick={() => setActiveRoomId(room.id)} className={`w-full rounded-xl border p-3 text-left ${activeRoom?.id === room.id ? 'border-secondary bg-secondary-container/20' : 'border-outline-variant/30'}`}><div className="text-sm font-semibold text-primary dark:text-on-primary-fixed">{room.name}</div><div className="mt-1 text-[11px] text-on-surface-variant">{room.members.length} member{room.members.length === 1 ? '' : 's'}</div></button>)}</div> : <p className="rounded-xl bg-surface-container-low p-4 text-sm text-on-surface-variant">Create your first study room to invite a friend.</p>}{activeRoom && <div className="rounded-xl border border-outline-variant/30 p-4"><div className="flex flex-col gap-3 border-b border-outline-variant/20 pb-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-sm font-bold text-primary dark:text-on-primary-fixed">{activeRoom.name}</div><div className="mt-1 text-[11px] text-on-surface-variant">{activeRoom.members.map((member) => member.name).join(', ')}</div></div><div className="flex gap-2"><input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="Friend's registered email" className="min-w-0 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-2 text-xs" /><button onClick={() => void inviteFriend()} disabled={roomLoading || !inviteEmail.trim()} className="rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-on-secondary">Invite</button></div></div><div className="mt-4 space-y-2">{activeRoom.messages.map((message) => <div key={message.id} className="rounded-lg bg-surface-container-low p-3 text-xs"><strong>{message.name}:</strong> {message.text}</div>)}{!activeRoom.messages.length && <p className="text-xs text-on-surface-variant">No messages yet. Start the discussion.</p>}</div><div className="mt-4 flex gap-2"><input value={roomMessage} onChange={(event) => setRoomMessage(event.target.value)} placeholder="Share a question or insight..." className="min-w-0 flex-1 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 text-xs" /><button onClick={() => void sendRoomMessage()} disabled={roomLoading || !roomMessage.trim()} className="rounded-xl bg-secondary px-3 text-on-secondary"><Send className="h-4 w-4" /></button></div></div>}</div>{pendingRequests.length > 0 && <div className="mt-5 border-t border-outline-variant/20 pt-5"><h3 className="text-sm font-bold text-primary dark:text-on-primary-fixed">Pending invitations</h3><div className="mt-3 space-y-2">{pendingRequests.map((item) => <div key={item.room.id} className="flex flex-col gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 sm:flex-row sm:items-center sm:justify-between"><div className="text-xs"><strong>{item.room.name}</strong><span className="ml-2 text-on-surface-variant">from {item.name}</span></div><div className="flex gap-2"><button onClick={() => void respondToInvite(item.room.id, 'accepted')} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white">Accept</button><button onClick={() => void respondToInvite(item.room.id, 'rejected')} className="rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-semibold text-white">Reject</button></div></div>)}</div></div>}</section>}


    {tab === 'jobs' && <section className="glass-card rounded-2xl border border-outline-variant/40 p-6"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h2 className="font-bold text-primary dark:text-on-primary-fixed">Live job matches</h2><p className="text-xs text-on-surface-variant">Fresh roles matched against your profile skills and interests.</p></div><div className="flex gap-2"><input value={jobSearch} onChange={(event) => setJobSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void loadJobs(); }} placeholder="Search title, skill, or location" className="min-w-0 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 text-xs" /><button onClick={() => void loadJobs()} disabled={jobsLoading} className="rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-on-secondary">{jobsLoading ? 'Loading...' : 'Search'}</button></div></div>{jobsError && <p className="mt-4 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700">{jobsError}</p>}<div className="mt-5 grid gap-4 md:grid-cols-2">{jobs.map((job) => { const searchable = `${job.title} ${job.description} ${job.tags.join(' ')}`.toLowerCase(); const matched = [...skillSet].filter((skill) => searchable.includes(skill.toLowerCase())).length; const match = Math.min(99, Math.round((matched / Math.max(1, skillSet.size || 3)) * 100)); return <article key={job.id} className="rounded-2xl border border-outline-variant/30 p-5"><div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-bold uppercase tracking-wider text-secondary">{job.company}</span><h3 className="mt-1 font-bold text-primary dark:text-on-primary-fixed">{job.title}</h3><p className="mt-1 text-[11px] text-on-surface-variant">{job.location}{job.remote ? ' · Remote' : ''}</p></div><span className="rounded-full bg-secondary-container/40 px-2.5 py-1 text-xs font-bold text-secondary">{match}% match</span></div><p className="mt-4 line-clamp-3 text-xs text-on-surface-variant">{job.description}</p><div className="mt-3 flex flex-wrap gap-1.5">{job.tags.slice(0, 5).map((tag) => <span key={tag} className="rounded-full bg-surface-container-low px-2 py-1 text-[10px]">{tag}</span>)}</div><div className="mt-4 flex items-center justify-between border-t border-outline-variant/20 pt-3"><span className="text-[10px] text-on-surface-variant">{job.postedAt ? `Posted ${new Date(job.postedAt).toLocaleDateString()}` : 'Role listing'}</span><a href={job.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-secondary">View role</a></div></article>; })}</div>{jobsUpdatedAt && <p className="mt-4 text-[10px] text-on-surface-variant">Last refreshed {new Date(jobsUpdatedAt).toLocaleTimeString()}</p>}</section>}

    {tab === 'bookmarks' && <section className="glass-card rounded-2xl border border-outline-variant/40 p-6"><div className="flex items-center gap-3"><Bookmark className="h-5 w-5 text-secondary" /><div><h2 className="font-bold text-primary dark:text-on-primary-fixed">Saved resources</h2><p className="text-xs text-on-surface-variant">Keep useful courses close while you prepare for your next role.</p></div></div><div className="mt-5 grid gap-3">{courses.filter((course) => bookmarks.includes(course.id)).map((course) => <div key={course.id} className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/30 p-4"><div><div className="text-sm font-semibold text-primary dark:text-on-primary-fixed">{course.title}</div><div className="text-xs text-on-surface-variant">{course.provider} · {course.skillsCovered.join(', ')}</div></div><button onClick={() => toggleBookmark(course.id)} className="text-xs font-semibold text-rose-600">Remove</button></div>)}{!bookmarks.length && <p className="text-sm text-on-surface-variant">No bookmarks yet. Choose a resource below.</p>}</div><h3 className="mt-6 border-t border-outline-variant/20 pt-5 text-sm font-bold text-primary dark:text-on-primary-fixed">Browse resources</h3><div className="mt-3 grid gap-2">{courses.slice(0, 8).map((course) => <div key={course.id} className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/30 p-3"><div><div className="text-xs font-semibold text-primary dark:text-on-primary-fixed">{course.title}</div><div className="text-[11px] text-on-surface-variant">{course.provider} · {course.difficulty}</div></div><button onClick={() => toggleBookmark(course.id)} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold text-on-secondary">{bookmarks.includes(course.id) ? 'Saved' : 'Save'} <Bookmark className="h-3 w-3" /></button></div>)}</div></section>}
  </div>;
};
