import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Compass,
  BookOpen,
  BarChart3,
  User,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  LearnerProfile,
  Roadmap,
  Milestone,
  MilestoneStatus,
  Course,
  StudyRecord,
} from './types';
import {
  subscribeDB,
  getActiveProfile,
  getActiveRoadmap,
  saveActiveRoadmap,
  updateActiveProfile,
  getTheme,
  saveTheme,
  addCustomCourseToCatalog,
  getStudyRecords,
  saveStudyRecords,
  saveChatHistory,
  loadRemoteWorkspace,
} from './services/dbService';
import { generatePersonalizedRoadmap } from './services/recommendationEngine';
import { Navbar } from './components/Navbar';
import { HeroLanding } from './components/HeroLanding';
import { OnboardingModal } from './components/OnboardingModal';
import { RoadmapVisualizer } from './components/RoadmapVisualizer';
import { Dashboard } from './components/Dashboard';
import { LuminaAssistant } from './components/LuminaAssistant';
import { CourseCatalogView } from './components/CourseCatalogView';
import { ExportModal } from './components/ExportModal';
import { AddCustomCourseModal } from './components/AddCustomCourseModal';
import { LoginPage } from './components/LoginPage';
import { calculateLearningMetrics } from './services/learningMetrics';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('lumina_authenticated') === 'true');
  const [isAuthPageOpen, setIsAuthPageOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'landing' | 'roadmap' | 'dashboard' | 'catalog'>('landing');
  const [profile, setProfile] = useState<LearnerProfile>(getActiveProfile);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(getActiveRoadmap);
  const [theme, setTheme] = useState<'light' | 'dark'>(getTheme);

  // Modals
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAddCustomOpen, setIsAddCustomOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantSessionKey, setAssistantSessionKey] = useState(0);

  // Subscribe to real-time DB changes
  useEffect(() => {
    const unsubscribe = subscribeDB(() => {
      setProfile(getActiveProfile());
      setRoadmap(getActiveRoadmap());
      setTheme(getTheme());
    });
    return unsubscribe;
  }, []);


  // Ensure theme class on HTML element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Initial roadmap generation if none exists
  useEffect(() => {
    if (!roadmap && profile) {
      const generated = generatePersonalizedRoadmap(profile);
      saveActiveRoadmap(generated);
      setRoadmap(generated);
    }
  }, [profile, roadmap]);

  // Toggle Theme
  const handleToggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    saveTheme(nextTheme);
    setTheme(nextTheme);
  };

  // Profile / Persona Update Handler
  const handleSaveProfile = (
    updatedProfile: Partial<LearnerProfile>,
    parsedGoal?: string
  ) => {
    const newProfile = updateActiveProfile({ ...updatedProfile, ...(parsedGoal ? { goalText: parsedGoal } : {}) });
    setProfile(newProfile);
    const newRoadmap = generatePersonalizedRoadmap(newProfile, updatedProfile.targetRoleId);
    saveActiveRoadmap(newRoadmap);
    setRoadmap(newRoadmap);
    setActiveTab('roadmap');
  };

  const handleLogin = async (name: string, email: string, password: string, mode: 'signin' | 'signup') => {
    const response = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Authentication failed.');
    localStorage.setItem('lumina_authenticated', 'true');
    localStorage.setItem('lumina_account_id', result.user.id);
    localStorage.setItem('lumina_account_email', result.user.email);
    await loadRemoteWorkspace(result.user.id);
    saveChatHistory([]);
    setAssistantSessionKey((currentKey) => currentKey + 1);
    updateActiveProfile({ name: result.user.name });
    setProfile(getActiveProfile());
    setRoadmap(getActiveRoadmap());
    setIsAuthenticated(true);
    setIsAuthPageOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('lumina_authenticated');
    localStorage.removeItem('lumina_account_id');
    setIsAuthenticated(false);
    setIsAuthPageOpen(false);
  };

  // Toggle Milestone Status (Completed / In-Progress / Available)
  const handleToggleMilestoneStatus = (milestoneId: string, newStatus: MilestoneStatus) => {
    if (!roadmap) return;

    const updatedPhases = roadmap.phases.map((phase) => ({
      ...phase,
      milestones: phase.milestones.map((m) => {
        if (m.id === milestoneId) {
          return { ...m, status: newStatus };
        }
        return m;
      }),
    }));

    const allMilestones = updatedPhases.flatMap((p) => p.milestones);
    const completedCount = allMilestones.filter((m) => m.status === 'Completed').length;
    const overallCompletionPercentage = Math.round(
      (completedCount / Math.max(1, allMilestones.length)) * 100
    );

    const updatedRoadmap: Roadmap = {
      ...roadmap,
      phases: updatedPhases,
      overallCompletionPercentage,
      updatedAt: new Date().toISOString(),
    };

    const existingRecords = getStudyRecords();
    const wasCompleted = roadmap.phases.flatMap((phase) => phase.milestones).find((m) => m.id === milestoneId)?.status === 'Completed';
    let studyRecords = existingRecords;
    if (newStatus === 'Completed' && !wasCompleted) {
      const completedMilestone = allMilestones.find((milestone) => milestone.id === milestoneId);
      if (completedMilestone) {
        const record: StudyRecord = {
          id: `study-${milestoneId}-${Date.now()}`,
          milestoneId,
          courseId: completedMilestone.course.id,
          completedAt: new Date().toISOString(),
          hours: completedMilestone.course.durationHours,
          skills: completedMilestone.skillsGained,
        };
        studyRecords = [...existingRecords, record];
      }
    } else if (newStatus !== 'Completed' && wasCompleted) {
      studyRecords = existingRecords.filter((record) => record.milestoneId !== milestoneId);
    }
    saveStudyRecords(studyRecords);

    // Profile metrics are derived from dated study records, never invented.
    const completedCourseIds = allMilestones
      .filter((m) => m.status === 'Completed')
      .map((m) => m.course.id);
    const metrics = calculateLearningMetrics(
      studyRecords,
      Object.keys(profile.baselineScores || {}),
    );

    updateActiveProfile({
      completedCourseIds,
      ...metrics,
    });

    saveActiveRoadmap(updatedRoadmap);
    setRoadmap(updatedRoadmap);
  };

  const handleToggleSubtopic = (milestoneId: string, subtopicId: string) => {
    if (!roadmap) return;
    const currentMilestone = roadmap.phases
      .flatMap((phase) => phase.milestones)
      .find((milestone) => milestone.id === milestoneId);
    if (!currentMilestone || currentMilestone.status === 'Locked') return;

    const updatedPhases = roadmap.phases.map((phase) => ({
      ...phase,
      milestones: phase.milestones.map((milestone) => {
        if (milestone.id !== milestoneId) return milestone;
        const subtopics = milestone.subtopics.map((subtopic) =>
          subtopic.id === subtopicId
            ? { ...subtopic, completed: !subtopic.completed, completedAt: !subtopic.completed ? new Date().toISOString() : undefined }
            : subtopic
        );
        const allComplete = subtopics.length > 0 && subtopics.every((subtopic) => subtopic.completed);
        return {
          ...milestone,
          subtopics,
          status: allComplete
            ? ('Completed' as MilestoneStatus)
            : subtopics.some((subtopic) => subtopic.completed)
            ? ('In-Progress' as MilestoneStatus)
            : ('Available' as MilestoneStatus),
        };
      }),
    }));
    const allMilestones = updatedPhases.flatMap((phase) => phase.milestones);
    const updatedRoadmap: Roadmap = {
      ...roadmap,
      phases: updatedPhases,
      updatedAt: new Date().toISOString(),
      overallCompletionPercentage: Math.round(
        (allMilestones.filter((milestone) => milestone.status === 'Completed').length /
          Math.max(1, allMilestones.length)) *
          100
      ),
    };
    const milestone = allMilestones.find((item) => item.id === milestoneId);
    if (!milestone) return;

    const existingRecords = getStudyRecords();
    const changedSubtopic = milestone.subtopics.find((subtopic) => subtopic.id === subtopicId);
    if (!changedSubtopic) return;
    let studyRecords = existingRecords.filter((record) => record.subtopicId !== subtopicId);
    if (changedSubtopic.completed && changedSubtopic.completedAt) {
      studyRecords = [...studyRecords, {
        id: `study-${subtopicId}`,
        milestoneId,
        courseId: milestone.course.id,
        subtopicId,
        completedAt: changedSubtopic.completedAt,
        hours: milestone.course.durationHours / Math.max(1, milestone.subtopics.length),
        skills: [changedSubtopic.skill],
      }];
    }
    saveStudyRecords(studyRecords);

    const progress = { ...(profile.courseProgress || {}) };
    progress[milestone.course.id] = Object.fromEntries(
      milestone.subtopics.filter((subtopic) => subtopic.completed && subtopic.completedAt).map((subtopic) => [subtopic.id, subtopic.completedAt as string])
    );
    const completedCourseIds = allMilestones
      .filter((item) => item.status === 'Completed')
      .map((item) => item.course.id);
    const metrics = calculateLearningMetrics(
      studyRecords,
      Object.keys(profile.baselineScores || {})
    );
    updateActiveProfile({ courseProgress: progress, completedCourseIds, ...metrics });
    saveActiveRoadmap(updatedRoadmap);
    setRoadmap(updatedRoadmap);
  };

  const handleQuizCompleted = (correct: boolean, topic: string) => {
    const skill = selectedMilestone?.skillsGained[0] || topic;
    const record: StudyRecord = {
      id: `quiz-${Date.now()}`,
      milestoneId: selectedMilestone?.id || 'general-quiz',
      courseId: selectedMilestone?.course.id || 'general-quiz',
      completedAt: new Date().toISOString(),
      hours: 0.25,
      skills: [skill],
      activityType: 'quiz',
      masteryPoints: correct ? 5 : 0,
    };
    const studyRecords = [...getStudyRecords(), record];
    saveStudyRecords(studyRecords);
    const metrics = calculateLearningMetrics(studyRecords, Object.keys(profile.baselineScores || {}));
    updateActiveProfile({ ...metrics });
  };

  // Add Custom Course
  const handleAddCustomCourse = (course: Course) => {
    addCustomCourseToCatalog(course);
    if (roadmap) {
      const updated = generatePersonalizedRoadmap(profile, roadmap.targetRoleId);
      saveActiveRoadmap(updated);
      setRoadmap(updated);
    }
  };

  // Apply Adaptive Roadmap Command from Lumina Mentor Chatbot
  const handleApplyRoadmapAdaptation = (action: 'compress' | 'inject_prereq' | 'reorder') => {
    if (!roadmap) return;
    if (action === 'compress') {
      const firstPhase = roadmap.phases[0];
      if (firstPhase && firstPhase.milestones.length > 0) {
        handleToggleMilestoneStatus(firstPhase.milestones[0].id, 'In-Progress');
      }
      return;
    }
    const adaptedPhases = roadmap.phases.map((phase) => {
      if (action === 'inject_prereq') {
        const firstLocked = phase.milestones.findIndex((milestone) => milestone.status === 'Locked');
        if (firstLocked >= 0) {
          return { ...phase, milestones: phase.milestones.map((milestone, index) => index === firstLocked ? { ...milestone, status: 'Available' as const } : milestone) };
        }
      }
      if (action === 'reorder') {
        return { ...phase, milestones: [...phase.milestones].reverse() };
      }
      return phase;
    });
    const adaptedRoadmap = { ...roadmap, phases: adaptedPhases, updatedAt: new Date().toISOString() };
    saveActiveRoadmap(adaptedRoadmap);
    setRoadmap(adaptedRoadmap);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background transition-colors duration-300">
      {/* Navbar Header */}
      {!isAuthenticated ? (
        isAuthPageOpen ? (
          <LoginPage onLogin={handleLogin} onBackToHome={() => setIsAuthPageOpen(false)} />
        ) : (
          <HeroLanding
            onStartOnboarding={() => setIsAuthPageOpen(true)}
            onExploreCurriculum={() => setIsAuthPageOpen(true)}
            onOpenAuth={() => setIsAuthPageOpen(true)}
          />
        )
      ) : <>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeProfile={profile}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Container View Switcher */}
      <main className="flex-1 pt-16 max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop">
        {activeTab === 'landing' && (
          <HeroLanding
            onStartOnboarding={() => setIsOnboardingOpen(true)}
            onExploreCurriculum={() => setActiveTab('catalog')}
          />
        )}

        {activeTab === 'roadmap' && roadmap && (
          <div className="pt-6">
            <RoadmapVisualizer
              roadmap={roadmap}
              onToggleMilestoneStatus={handleToggleMilestoneStatus}
              onToggleSubtopic={handleToggleSubtopic}
              onOpenAddCustomCourse={() => setIsAddCustomOpen(true)}
              onSelectMilestoneDetails={(m) => setSelectedMilestone(m)}
            />
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="pt-6">
            <Dashboard
              profile={profile}
              roadmap={roadmap}
              onOpenExportModal={() => setIsExportOpen(true)}
              onLaunchNextBestAction={(m) => setSelectedMilestone(m)}
            />
          </div>
        )}

        {activeTab === 'catalog' && (
          <div className="pt-6">
            <CourseCatalogView
              onAddCourseToRoadmap={(c) => {
                handleAddCustomCourse(c);
                setActiveTab('roadmap');
              }}
            />
          </div>
        )}
      </main>

      {/* Floating Lumina Assistant Launcher Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isAssistantOpen && (
          <button
            onClick={() => setIsAssistantOpen(true)}
            className="px-5 py-3 rounded-full bg-primary text-on-primary shadow-2xl border-2 border-secondary/40 hover:scale-105 transition-all duration-200 flex items-center gap-3 ai-glow"
          >
            <div className="w-7 h-7 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-secondary" />
            </div>
            <span className="font-label-md text-xs font-bold">RouteMind Mentor</span>
          </button>
        )}
      </div>

      {/* Lumina Assistant Drawer */}
      <LuminaAssistant
        key={assistantSessionKey}
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        profile={profile}
        activeMilestone={selectedMilestone}
        onApplyRoadmapAdaptation={handleApplyRoadmapAdaptation}
        onQuizCompleted={handleQuizCompleted}
      />

      {/* Mobile Bottom Navigation Bar (Design-faithful) */}
      <nav className="md:hidden fixed bottom-0 w-full z-40 bg-surface/90 dark:bg-inverse-surface/90 backdrop-blur-lg border-t border-outline-variant/30 pb-safe px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-20">
          <button
            onClick={() => setActiveTab('landing')}
            className={`flex flex-col items-center justify-center transition-all ${
              activeTab === 'landing'
                ? 'text-secondary bg-secondary-container/30 rounded-xl px-3 py-1 scale-90 font-bold'
                : 'text-on-surface-variant hover:text-secondary'
            }`}
          >
            <Compass className="w-5 h-5 mb-1" />
            <span className="font-label-sm text-[10px]">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('roadmap')}
            className={`flex flex-col items-center justify-center transition-all ${
              activeTab === 'roadmap'
                ? 'text-secondary bg-secondary-container/30 rounded-xl px-3 py-1 scale-90 font-bold'
                : 'text-on-surface-variant hover:text-secondary'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-1" />
            <span className="font-label-sm text-[10px]">Roadmap</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center transition-all ${
              activeTab === 'dashboard'
                ? 'text-secondary bg-secondary-container/30 rounded-xl px-3 py-1 scale-90 font-bold'
                : 'text-on-surface-variant hover:text-secondary'
            }`}
          >
            <BarChart3 className="w-5 h-5 mb-1" />
            <span className="font-label-sm text-[10px]">Skills</span>
          </button>

          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="flex flex-col items-center justify-center text-on-surface-variant hover:text-secondary"
          >
            <User className="w-5 h-5 mb-1" />
            <span className="font-label-sm text-[10px]">Profile</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        activeProfile={profile}
        onSaveProfileAndGenerateRoadmap={handleSaveProfile}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        roadmap={roadmap}
        profile={profile}
      />

      <AddCustomCourseModal
        isOpen={isAddCustomOpen}
        onClose={() => setIsAddCustomOpen(false)}
        onAddCourse={handleAddCustomCourse}
      />

      {/* Milestone Detail Slide-over Modal */}
      {selectedMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/80 dark:border-white/20 relative overflow-hidden flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
              <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                {selectedMilestone.phaseName}
              </span>
              <button
                onClick={() => setSelectedMilestone(null)}
                className="p-2 rounded-full text-on-surface-variant hover:bg-surface-variant/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h2 className="font-headline-md text-lg font-bold text-primary dark:text-on-primary-fixed mb-2">
                {selectedMilestone.title}
              </h2>
              <p className="text-xs text-on-surface-variant dark:text-outline-variant mb-4">
                {selectedMilestone.description}
              </p>

              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-surface-container-low dark:bg-surface-container/30 text-xs mb-4">
                <div>
                  <span className="text-on-surface-variant block text-[11px]">Provider</span>
                  <span className="font-bold text-primary dark:text-white">
                    {selectedMilestone.course.provider}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[11px]">Duration</span>
                  <span className="font-bold text-primary dark:text-white">
                    ~{selectedMilestone.course.durationHours} hrs
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[11px]">Cost & Rating</span>
                  <span className="font-bold text-secondary">
                    {selectedMilestone.course.cost} | ⭐ {selectedMilestone.course.rating}
                  </span>
                </div>
              </div>

              {/* Skills gained */}
              <div className="mb-4">
                <span className="font-bold text-xs text-primary dark:text-white block mb-2">
                  Skills Gained:
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedMilestone.skillsGained.map((sk) => (
                    <span
                      key={sk}
                      className="px-3 py-1 rounded-full bg-secondary-container/30 text-secondary text-xs font-medium"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Explainable AI */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-xs flex flex-col gap-2">
                <span className="font-bold text-primary dark:text-secondary-container flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-secondary" /> Explainable AI (XAI) Recommendation Rationale
                </span>
                <p className="text-on-surface-variant dark:text-outline-variant">
                  {selectedMilestone.rationales.skillGapAddressed}
                </p>
                <p className="text-on-surface-variant dark:text-outline-variant">
                  {selectedMilestone.rationales.careerImpact}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-outline-variant/20">
              <a
                href={selectedMilestone.course.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary hover:underline"
              >
                <span>Direct Resource Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => {
                  if (selectedMilestone.status === 'Completed') {
                    handleToggleMilestoneStatus(selectedMilestone.id, 'Available');
                    setSelectedMilestone(null);
                  } else {
                    handleToggleMilestoneStatus(selectedMilestone.id, 'In-Progress');
                    setSelectedMilestone(null);
                  }
                }}
                className="px-6 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container"
              >
                {selectedMilestone.status === 'Completed' ? 'Mark Incomplete' : 'Start Checklist'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>}
    </div>
  );
};
