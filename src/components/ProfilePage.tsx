import React from 'react';
import { Award, BookOpen, Clock3, ExternalLink, Flame, Github, GraduationCap, Mail, Save, Target, TrendingUp } from 'lucide-react';
import { LearnerProfile, Roadmap } from '../types';
import { getStudyRecords } from '../services/dbService';
import { calculateSkillGaps } from '../services/recommendationEngine';
import { TARGET_ROLES } from '../data/skillTaxonomy';

interface ProfilePageProps {
  profile: LearnerProfile;
  roadmap: Roadmap | null;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ profile, roadmap }) => {
  const role = TARGET_ROLES.find((item) => item.id === profile.targetRoleId) || TARGET_ROLES[0];
  const skillGaps = calculateSkillGaps(profile, role);
  const studyRecords = getStudyRecords();
  const completedTopics = roadmap?.phases.flatMap((phase) => phase.milestones).reduce(
    (total, milestone) => total + milestone.subtopics.filter((topic) => topic.completed).length,
    0
  ) || 0;
  const completedModules = roadmap?.phases.flatMap((phase) => phase.milestones).filter((milestone) => milestone.status === 'Completed').length || 0;
  const strongestSkills = Object.entries(profile.baselineScores || {})
    .filter(([, score]) => score > 0)
    .sort(([, firstScore], [, secondScore]) => secondScore - firstScore)
    .slice(0, 6);
  const interests = profile.interests || [];
  const [portfolioUrl, setPortfolioUrl] = React.useState(() => localStorage.getItem(`routemind-portfolio-${profile.id}`) || '');
  const [portfolioSaved, setPortfolioSaved] = React.useState(false);
  const savePortfolioUrl = () => {
    localStorage.setItem(`routemind-portfolio-${profile.id}`, portfolioUrl.trim());
    setPortfolioSaved(true);
  };

  return (
    <div className="flex flex-col gap-6 pb-16 pt-6">
      <section className="glass-panel rounded-3xl border border-outline-variant/40 p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-on-primary">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Learner profile</span>
              <h1 className="mt-1 text-2xl font-bold text-primary dark:text-on-primary-fixed">{profile.name}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-on-surface-variant"><Mail className="h-3.5 w-3.5" /> Personal learning workspace</p>
            </div>
          </div>
          <div className="rounded-2xl border border-secondary/30 bg-secondary-container/30 px-5 py-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-secondary">Target role</div>
            <div className="mt-1 text-sm font-bold text-primary dark:text-on-primary-fixed">{profile.targetRoleTitle || role.title}</div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Roadmap complete', value: `${roadmap?.overallCompletionPercentage || 0}%`, icon: <Target className="h-5 w-5" /> },
          { label: 'Topics completed', value: String(completedTopics), icon: <BookOpen className="h-5 w-5" /> },
          { label: 'Study streak', value: `${profile.studyStreakDays} days`, icon: <Flame className="h-5 w-5" /> },
          { label: 'Learning hours', value: `${profile.totalHoursLearned}`, icon: <Clock3 className="h-5 w-5" /> },
        ].map((metric) => (
          <div key={metric.label} className="glass-card flex items-center justify-between rounded-2xl border border-outline-variant/30 p-5">
            <div><div className="text-[11px] text-on-surface-variant">{metric.label}</div><div className="mt-1 text-xl font-bold text-primary dark:text-on-primary-fixed">{metric.value}</div></div>
            <div className="rounded-xl bg-secondary-container/40 p-3 text-secondary">{metric.icon}</div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card rounded-2xl border border-outline-variant/40 p-6">
          <div className="flex items-center gap-3"><GraduationCap className="h-5 w-5 text-secondary" /><div><h2 className="font-bold text-primary dark:text-on-primary-fixed">Registration details</h2><p className="text-xs text-on-surface-variant">The preferences collected when you created your account.</p></div></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-container-low p-3"><span className="text-[10px] text-on-surface-variant">Current level</span><strong className="mt-1 block text-sm text-primary dark:text-on-primary-fixed">{profile.currentSkillLevel}</strong></div>
            <div className="rounded-xl bg-surface-container-low p-3"><span className="text-[10px] text-on-surface-variant">Study capacity</span><strong className="mt-1 block text-sm text-primary dark:text-on-primary-fixed">{profile.hoursPerWeek} hours / week</strong></div>
            <div className="rounded-xl bg-surface-container-low p-3"><span className="text-[10px] text-on-surface-variant">Learning format</span><strong className="mt-1 block text-sm text-primary dark:text-on-primary-fixed">{profile.preferredFormat}</strong></div>
            <div className="rounded-xl bg-surface-container-low p-3"><span className="text-[10px] text-on-surface-variant">Timeline</span><strong className="mt-1 block text-sm text-primary dark:text-on-primary-fixed">{profile.targetTimelineMonths} months</strong></div>
          </div>
          <div className="mt-4"><span className="text-[10px] font-bold uppercase tracking-wider text-secondary">Skills and interests</span><div className="mt-2 flex flex-wrap gap-2">{interests.length ? interests.map((interest) => <span key={interest} className="rounded-full bg-secondary-container/40 px-2.5 py-1 text-xs font-semibold text-secondary">{interest}</span>) : <span className="text-xs text-on-surface-variant">No interests added yet.</span>}</div></div>
        </div>

        <div className="glass-card rounded-2xl border border-outline-variant/40 p-6">
          <div className="flex items-center gap-3"><TrendingUp className="h-5 w-5 text-secondary" /><div><h2 className="font-bold text-primary dark:text-on-primary-fixed">Mastery and skills</h2><p className="text-xs text-on-surface-variant">Current evidence from registration, study activity, and quizzes.</p></div></div>
          <div className="mt-5 space-y-3">{strongestSkills.length ? strongestSkills.map(([skill, score]) => <div key={skill}><div className="flex justify-between text-xs"><span className="font-semibold text-primary dark:text-on-primary-fixed">{skill}</span><span className="text-secondary">{score}%</span></div><div className="mt-1.5 h-2 rounded-full bg-surface-variant"><div className="h-full rounded-full bg-secondary" style={{ width: `${score}%` }} /></div></div>) : <p className="rounded-xl bg-surface-container-low p-4 text-xs text-on-surface-variant">Complete the signup skills field or diagnostic assessment to build your mastery profile.</p>}</div>
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-outline-variant/20 pt-4"><div><span className="text-[10px] text-on-surface-variant">Completed modules</span><strong className="mt-1 block text-lg text-primary dark:text-on-primary-fixed">{completedModules}</strong></div><div><span className="text-[10px] text-on-surface-variant">Recorded activities</span><strong className="mt-1 block text-lg text-primary dark:text-on-primary-fixed">{studyRecords.length}</strong></div></div>
        </div>
      </section>

      <section className="glass-card rounded-2xl border border-outline-variant/40 p-6">
        <div className="flex items-center gap-3"><Award className="h-5 w-5 text-secondary" /><div><h2 className="font-bold text-primary dark:text-on-primary-fixed">Priority skill gaps</h2><p className="text-xs text-on-surface-variant">Areas where your current mastery is furthest from the {role.title} benchmark.</p></div></div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">{[...skillGaps].sort((first, second) => second.gapScore - first.gapScore).slice(0, 6).map((gap) => <div key={gap.skillName} className="flex items-center justify-between rounded-xl border border-outline-variant/30 p-4"><div><div className="text-sm font-semibold text-primary dark:text-on-primary-fixed">{gap.skillName}</div><div className="mt-1 text-[11px] text-on-surface-variant">Current {gap.currentScore}% · Target {gap.targetScore}%</div></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${gap.status === 'Critical' ? 'bg-rose-500/10 text-rose-700' : 'bg-amber-500/10 text-amber-700'}`}>{gap.gapScore} gap</span></div>)}</div>
      </section>

      <section className="glass-card rounded-2xl border border-outline-variant/40 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3"><Github className="h-5 w-5 text-secondary" /><div><h2 className="font-bold text-primary dark:text-on-primary-fixed">Projects and portfolio</h2><p className="text-xs text-on-surface-variant">Your completed learning work, collected in one profile-ready showcase.</p></div></div>
          <div className="flex w-full gap-2 md:w-auto"><input value={portfolioUrl} onChange={(event) => { setPortfolioUrl(event.target.value); setPortfolioSaved(false); }} placeholder="GitHub or portfolio URL" className="min-w-0 flex-1 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3 text-xs md:w-64" /><button onClick={savePortfolioUrl} className="inline-flex items-center gap-1 rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-on-secondary"><Save className="h-3.5 w-3.5" /> {portfolioSaved ? 'Saved' : 'Save'}</button></div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {completedModules > 0 ? roadmap?.phases.flatMap((phase) => phase.milestones).filter((milestone) => milestone.status === 'Completed').map((milestone) => <article key={milestone.id} className="rounded-xl border border-outline-variant/30 p-4"><div className="flex items-center gap-2 text-xs font-semibold text-emerald-600"><Award className="h-4 w-4" /> Completed project</div><h3 className="mt-2 text-sm font-bold text-primary dark:text-on-primary-fixed">{milestone.capstoneProject?.title || milestone.title}</h3><p className="mt-2 text-xs text-on-surface-variant">{milestone.capstoneProject?.description || milestone.description}</p><div className="mt-3 flex flex-wrap gap-1.5">{milestone.skillsGained.map((skill) => <span key={skill} className="rounded-full bg-surface-container-low px-2 py-1 text-[10px]">{skill}</span>)}</div></article>) : <p className="rounded-xl bg-surface-container-low p-4 text-sm text-on-surface-variant">Complete roadmap modules to add projects to your portfolio.</p>}
        </div>
        {portfolioUrl && <a href={portfolioUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-secondary"><ExternalLink className="h-3.5 w-3.5" /> Open portfolio link</a>}
      </section>
    </div>
  );
};
