import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, ChevronRight, ClipboardCheck, RotateCcw, XCircle } from 'lucide-react';
import { Milestone, Roadmap } from '../types';

interface AssessmentPageProps {
  roadmap: Roadmap | null;
  onAnswer: (correct: boolean, topic: string) => void;
}

interface AssessmentQuestion {
  topic: string;
  prompt: string;
  options: string[];
  answer: number;
}

const questionForTopic = (topic: string): AssessmentQuestion => {
  const normalizedTopic = topic.toLowerCase();
  if (normalizedTopic.includes('python')) {
    return { topic, prompt: 'Which Python structure stores values as key and value pairs?', options: ['A list', 'A dictionary', 'A tuple'], answer: 1 };
  }
  if (normalizedTopic.includes('javascript') || normalizedTopic.includes('typescript')) {
    return { topic, prompt: 'What does a TypeScript interface primarily describe?', options: ['The shape of an object', 'A database query', 'A CSS animation'], answer: 0 };
  }
  if (normalizedTopic.includes('machine learning') || normalizedTopic.includes('scikit')) {
    return { topic, prompt: 'What is a model trained on during supervised learning?', options: ['Labeled examples', 'Only deployment logs', 'Random UI colors'], answer: 0 };
  }
  if (normalizedTopic.includes('transformer') || normalizedTopic.includes('attention')) {
    return { topic, prompt: 'What does self-attention help a transformer identify?', options: ['Relationships between tokens', 'The size of a hard drive', 'A webpage color'], answer: 0 };
  }
  if (normalizedTopic.includes('cloud') || normalizedTopic.includes('docker')) {
    return { topic, prompt: 'What is the main benefit of containerizing an application?', options: ['Consistent runtime environments', 'Removing all tests', 'Making passwords public'], answer: 0 };
  }
  return { topic, prompt: `Which statement best describes ${topic}?`, options: [`It is a core concept used in ${topic}`, 'It is unrelated to software development', 'It only applies to graphic design'], answer: 0 };
};

export const AssessmentPage: React.FC<AssessmentPageProps> = ({ roadmap, onAnswer }) => {
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const coveredTopics = useMemo(() => {
    const topics = roadmap?.phases
      .flatMap((phase) => phase.milestones)
      .flatMap((milestone) => milestone.subtopics.filter((subtopic) => subtopic.completed).map((subtopic) => subtopic.skill)) || [];
    return [...new Set(topics)];
  }, [roadmap]);

  const questions = useMemo(() => {
    const topics = selectedTopic === 'all' ? coveredTopics : [selectedTopic];
    return topics.slice(0, 5).map(questionForTopic);
  }, [coveredTopics, selectedTopic]);

  const currentQuestion = questions[questionIndex];
  const isFinished = questions.length > 0 && questionIndex >= questions.length;

  const resetAssessment = () => {
    setQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
  };

  const chooseAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null || !currentQuestion) return;
    const correct = answerIndex === currentQuestion.answer;
    setSelectedAnswer(answerIndex);
    if (correct) setScore((currentScore) => currentScore + 1);
    onAnswer(correct, currentQuestion.topic);
  };

  const nextQuestion = () => {
    setQuestionIndex((index) => index + 1);
    setSelectedAnswer(null);
  };

  return (
    <div className="flex flex-col gap-6 pb-12 pt-6">
      <section className="glass-panel rounded-3xl border border-outline-variant/40 p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary-container/40 px-3 py-1 text-xs font-semibold text-secondary">
              <ClipboardCheck className="h-3.5 w-3.5" /> Active recall assessment
            </span>
            <h1 className="mt-3 font-headline-lg text-2xl font-bold text-primary dark:text-on-primary-fixed">Test what you have covered</h1>
            <p className="mt-2 text-sm text-on-surface-variant dark:text-outline-variant">Answer questions drawn from completed roadmap topics. Each response contributes evidence to your mastery profile.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/70 px-4 py-3">
            <Award className="h-5 w-5 text-secondary" />
            <div><div className="text-[11px] text-on-surface-variant">Topics covered</div><div className="text-lg font-bold text-primary dark:text-on-primary-fixed">{coveredTopics.length}</div></div>
          </div>
        </div>
      </section>

      {coveredTopics.length === 0 ? (
        <section className="glass-card rounded-2xl border border-outline-variant/40 p-8 text-center">
          <ClipboardCheck className="mx-auto h-8 w-8 text-secondary" />
          <h2 className="mt-3 text-lg font-bold text-primary dark:text-on-primary-fixed">Complete a topic to unlock your exam</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Use the checklist in Learning Path, then return here for a topic-based assessment.</p>
        </section>
      ) : isFinished ? (
        <section className="glass-card rounded-2xl border border-outline-variant/40 p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-secondary">Assessment complete</p>
          <h2 className="mt-2 text-3xl font-bold text-primary dark:text-on-primary-fixed">{score}/{questions.length}</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Your quiz evidence has been added to the mastery dashboard.</p>
          <button onClick={resetAssessment} className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary-container"><RotateCcw className="h-4 w-4" /> Retake assessment</button>
        </section>
      ) : (
        <section className="glass-card rounded-2xl border border-outline-variant/40 p-6 md:p-8">
          <div className="flex items-center justify-between gap-3 text-xs text-on-surface-variant"><span>Question {questionIndex + 1} of {questions.length}</span><span className="font-semibold text-secondary">{currentQuestion.topic}</span></div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-variant"><div className="h-full bg-secondary transition-all" style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>
          <h2 className="mt-8 text-xl font-bold text-primary dark:text-on-primary-fixed">{currentQuestion.prompt}</h2>
          <div className="mt-6 grid gap-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = currentQuestion.answer === index;
              const resultStyle = selectedAnswer !== null && isCorrect ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : selectedAnswer !== null && isSelected ? 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300' : 'border-outline-variant/40 hover:border-secondary hover:bg-secondary-container/20';
              return <button key={option} onClick={() => chooseAnswer(index)} disabled={selectedAnswer !== null} className={`flex items-center justify-between rounded-xl border p-4 text-left text-sm font-medium transition-all ${resultStyle}`}><span>{option}</span>{selectedAnswer !== null && isCorrect && <CheckCircle2 className="h-4 w-4" />}{selectedAnswer !== null && isSelected && !isCorrect && <XCircle className="h-4 w-4" />}</button>;
            })}
          </div>
          {selectedAnswer !== null && <button onClick={nextQuestion} className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:bg-primary-container">{questionIndex === questions.length - 1 ? 'See results' : 'Next question'} <ChevronRight className="h-4 w-4" /></button>}
        </section>
      )}

      {coveredTopics.length > 0 && !isFinished && <div className="flex flex-wrap gap-2"><button onClick={() => { setSelectedTopic('all'); resetAssessment(); }} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${selectedTopic === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant'}`}>All covered topics</button>{coveredTopics.map((topic) => <button key={topic} onClick={() => { setSelectedTopic(topic); resetAssessment(); }} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${selectedTopic === topic ? 'bg-secondary text-on-secondary' : 'bg-surface-container-low text-on-surface-variant'}`}>{topic}</button>)}</div>}
    </div>
  );
};
