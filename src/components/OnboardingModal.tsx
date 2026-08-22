import React, { useState, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import {
  X,
  Sparkles,
  Target,
  Brain,
  Check,
  Zap,
} from 'lucide-react';
import {
  LearnerProfile,
  SkillLevel,
  LearningFormat,
  ResourceCost,
} from '../types';
import { TARGET_ROLES } from '../data/skillTaxonomy';
import { SKILL_CATEGORIES } from '../data/skillTaxonomy';
import { parseNaturalLanguageGoal } from '../services/aiService';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: LearnerProfile;
  onSaveProfileAndGenerateRoadmap: (
    updatedProfile: Partial<LearnerProfile>,
    parsedGoal?: string
  ) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  onSaveProfileAndGenerateRoadmap,
}) => {
  const [tab, setTab] = useState<'prompt' | 'custom'>('prompt');

  // Form State
  const [goalPrompt, setGoalPrompt] = useState('');
  const [learnerName, setLearnerName] = useState(activeProfile.name || 'Your Name');
  const [selectedRoleId, setSelectedRoleId] = useState(activeProfile.targetRoleId || 'genai-engineer');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(activeProfile.currentSkillLevel || 'Beginner');
  const [hoursPerWeek, setHoursPerWeek] = useState(activeProfile.hoursPerWeek || 0);
  const [preferredFormat, setPreferredFormat] = useState<LearningFormat>(activeProfile.preferredFormat || 'Project-first');
  const [interests, setInterests] = useState<string[]>(activeProfile.interests || []);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, number>>({});
  const [budget, setBudget] = useState<ResourceCost | 'Any'>('Any');

  const [isAiParsing, setIsAiParsing] = useState(false);
  const [aiParsingReason, setAiParsingReason] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(containerRef, !!isOpen);

  if (!isOpen) return null;

  const handleAiParseGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalPrompt.trim()) return;

    setIsAiParsing(true);
    try {
      const parsed = await parseNaturalLanguageGoal(goalPrompt, activeProfile);
      setSelectedRoleId(parsed.matchedRoleId);
      setSkillLevel(parsed.suggestedSkillLevel);
      setHoursPerWeek(parsed.suggestedHoursPerWeek);
      setPreferredFormat(parsed.preferredFormat);
      setAiParsingReason(parsed.aiReasoning);

      onSaveProfileAndGenerateRoadmap({
        name: learnerName,
        targetRoleId: parsed.matchedRoleId,
        targetRoleTitle: parsed.targetRoleTitle,
        currentSkillLevel: parsed.suggestedSkillLevel,
        hoursPerWeek: parsed.suggestedHoursPerWeek,
        preferredFormat: parsed.preferredFormat,
        budget,
        targetTimelineMonths: parsed.suggestedTimelineMonths,
      });

      onClose();
    } catch (e) {
      console.error('Goal parsing error:', e);
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedRole = TARGET_ROLES.find((r) => r.id === selectedRoleId) || TARGET_ROLES[0];
    onSaveProfileAndGenerateRoadmap({
      name: learnerName,
      targetRoleId: selectedRoleId,
      targetRoleTitle: matchedRole.title,
      currentSkillLevel: skillLevel,
      hoursPerWeek,
      preferredFormat,
      budget,
      interests,
      baselineScores: buildAssessmentScores(),
      assessmentCompletedAt: new Date().toISOString(),
    });
    onClose();
  };

  const assessmentQuestions = [
    { id: 'programming', label: 'Which concept lets a program repeat a block of code?', options: ['Loop', 'Variable', 'Comment'], answer: 0, skills: ['Python Programming', 'JavaScript & TypeScript', 'Rust Language Fundamentals'] },
    { id: 'data', label: 'Which tool is commonly used to work with tabular data in Python?', options: ['Pandas', 'React', 'Docker'], answer: 0, skills: ['Applied Statistics & Hypothesis Testing', 'Scikit-Learn Machine Learning', 'Feature Engineering'] },
    { id: 'systems', label: 'What does an API primarily define?', options: ['How software components communicate', 'A color palette', 'A database password'], answer: 0, skills: ['Cloud & Deployment (LangChain/LlamaIndex)', 'Cloud Platforms (GCP/AWS)', 'Docker & Containerization'] },
    { id: 'ai', label: 'What is a model trained to do?', options: ['Learn patterns from data', 'Replace all source code', 'Only store images'], answer: 0, skills: ['PyTorch & Deep Learning', 'Transformers & Attention', 'Prompt Engineering'] },
  ];

  const buildAssessmentScores = () => {
    const scores: Record<string, number> = { ...(activeProfile.baselineScores || {}) };
    assessmentQuestions.forEach((question) => {
      const score = assessmentAnswers[question.id] === question.answer ? 45 : 0;
      question.skills.forEach((skill) => { scores[skill] = Math.max(scores[skill] || 0, score); });
    });
    return scores;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-md animate-in fade-in">
      <div ref={containerRef} className="glass-panel w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/80 dark:border-white/20 relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-secondary-container/40 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container text-secondary-container flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md font-bold text-primary dark:text-on-primary-fixed">
                Lumina Diagnostic Assessment
              </h2>
              <p className="text-xs text-on-surface-variant dark:text-outline-variant">
                Configure your personalized learning path & skill gap matrix
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex gap-2 my-6 p-1 rounded-2xl bg-surface-container-low dark:bg-surface-container/30 border border-outline-variant/30">
          <button
            onClick={() => setTab('prompt')}
            className={`flex-1 py-2.5 rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 transition-all ${
              tab === 'prompt'
                ? 'bg-primary text-on-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <Brain className="w-4 h-4" />
            Natural Goal
          </button>
          <button
            onClick={() => setTab('custom')}
            className={`flex-1 py-2.5 rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 transition-all ${
              tab === 'custom'
                ? 'bg-primary text-on-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <Target className="w-4 h-4" />
            Manual Profile
          </button>
        </div>

        {/* Tab 1: Natural Language Goal Intake */}
        {tab === 'prompt' && (
          <form onSubmit={handleAiParseGoal} className="flex flex-col gap-6 overflow-y-auto pr-1">
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-label-md text-primary dark:text-on-primary-fixed">
                Describe your career target or learning objective in natural language:
              </label>
              <textarea
                value={goalPrompt}
                onChange={(e) => setGoalPrompt(e.target.value)}
                placeholder='e.g., "I want to become an AI Research & Generative AI Engineer in 6 months with 15 hours per week. I prefer project-based learning."'
                rows={4}
                className="w-full rounded-2xl border border-outline-variant/50 p-4 text-sm bg-surface-container-lowest dark:bg-inverse-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Your Name</label>
                <input
                  type="text"
                  value={learnerName}
                  onChange={(e) => setLearnerName(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/40 p-2.5 text-sm bg-surface-container-lowest dark:bg-inverse-surface"
                />
              </div>
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Resource Cost Filter</label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value as any)}
                  className="w-full rounded-xl border border-outline-variant/40 p-2.5 text-sm bg-surface-container-lowest dark:bg-inverse-surface"
                >
                  <option value="Any">Any (Free + Paid)</option>
                  <option value="Free">Free / Open Access Only</option>
                  <option value="Paid">Paid Courses & Certifications</option>
                </select>
              </div>
            </div>

            {aiParsingReason && (
              <div className="p-3.5 rounded-xl bg-secondary-container/30 border border-secondary-container text-xs text-on-secondary-container flex items-start gap-2">
                <Zap className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                <span>{aiParsingReason}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-outline-variant text-on-surface-variant text-xs font-semibold hover:bg-surface-variant/40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAiParsing || !goalPrompt.trim()}
                className="px-6 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container disabled:opacity-50 flex items-center gap-2"
              >
                {isAiParsing ? (
                  <span>Analyzing Goal with AI...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-secondary-container" />
                    <span>Generate AI Roadmap</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Manual Custom Profile */}
        {tab === 'custom' && (
          <form onSubmit={handleCustomSubmit} className="flex flex-col gap-5 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Learner Name</label>
                <input
                  type="text"
                  value={learnerName}
                  onChange={(e) => setLearnerName(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/40 p-2.5 text-sm bg-surface-container-lowest dark:bg-inverse-surface"
                />
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Target Career Role</label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/40 p-2.5 text-sm bg-surface-container-lowest dark:bg-inverse-surface"
                >
                  {TARGET_ROLES.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.title} ({role.domain})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-2">Current Skill Level</label>
              <div className="grid grid-cols-3 gap-3">
                {(['Beginner', 'Intermediate', 'Advanced'] as SkillLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSkillLevel(level)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      skillLevel === level
                        ? 'bg-secondary text-on-secondary border-secondary shadow-sm'
                        : 'border-outline-variant/40 hover:bg-surface-variant/30 text-on-surface-variant'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-2">Topics you want to learn</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(SKILL_CATEGORIES).flat().filter((skill, index, skills) => skills.indexOf(skill) === index).map((skill) => (
                  <button key={skill} type="button" onClick={() => setInterests((current) => current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill])} className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${interests.includes(skill) ? 'border-secondary bg-secondary-container/40 text-secondary' : 'border-outline-variant/40 text-on-surface-variant'}`}>
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-2">Quick knowledge check</label>
              <div className="flex flex-col gap-2">
                {assessmentQuestions.map((question) => (
                  <div key={question.id} className="rounded-xl border border-outline-variant/30 p-3 text-xs">
                    <span className="text-on-surface-variant block mb-2">{question.label}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {question.options.map((option, answerIndex) => (
                        <button key={option} type="button" onClick={() => setAssessmentAnswers((current) => ({ ...current, [question.id]: answerIndex }))} className={`rounded-lg px-2.5 py-1 font-semibold ${assessmentAnswers[question.id] === answerIndex ? 'bg-secondary text-on-secondary' : 'bg-surface-variant/40 text-on-surface-variant'}`}>{option}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-on-surface-variant">Correct answers provide an initial evidence score. Mastery grows only through recorded learning.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">
                  Commitment ({hoursPerWeek} hrs/week)
                </label>
                <input
                  type="range"
                  min={3}
                  max={35}
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                  className="w-full accent-secondary"
                />
              </div>

              <div>
                <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">Learning Format</label>
                <select
                  value={preferredFormat}
                  onChange={(e) => setPreferredFormat(e.target.value as LearningFormat)}
                  className="w-full rounded-xl border border-outline-variant/40 p-2.5 text-sm bg-surface-container-lowest dark:bg-inverse-surface"
                >
                  <option value="Project-first">Project-First & Hands-on</option>
                  <option value="Video">Video Lectures & Structured Courses</option>
                  <option value="Theoretical">Theoretical & Mathematical Foundations</option>
                  <option value="Books">Reference Books & Documentation</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-outline-variant text-on-surface-variant text-xs font-semibold hover:bg-surface-variant/40"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Save & Synthesize Path</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
