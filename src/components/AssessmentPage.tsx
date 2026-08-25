import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, ChevronRight, ClipboardCheck, RotateCcw, XCircle } from 'lucide-react';
import { Roadmap } from '../types';
import { getStudyRecords } from '../services/dbService';

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

const questionsForTopic = (topic: string): AssessmentQuestion[] => {
  const normalizedTopic = topic.toLowerCase();
  if (normalizedTopic.includes('python')) {
    return [
      { topic, prompt: 'A function receives a list and must update its contents for the caller. Which behavior makes this possible?', options: ['Mutating the list object', 'Reassigning a local variable only', 'Converting it to a string'], answer: 0 },
      { topic, prompt: 'Why is a dictionary usually preferable to scanning a list when looking up a value by unique identifier?', options: ['Average constant-time lookup', 'It always preserves numeric order', 'It prevents all duplicate values'], answer: 0 },
      { topic, prompt: 'A Python generator is useful when processing a very large file because it:', options: ['Yields items lazily without loading everything into memory', 'Automatically runs code in parallel', 'Converts every line into a database table'], answer: 0 },
    ];
  }
  if (normalizedTopic.includes('javascript') || normalizedTopic.includes('typescript')) {
    return [
      { topic, prompt: 'A React component reads a value from a closure created during an earlier render. What issue can occur in an async callback?', options: ['It can observe stale state', 'It automatically mutates props', 'It disables TypeScript'], answer: 0 },
      { topic, prompt: 'What does a TypeScript discriminated union allow a program to do safely?', options: ['Narrow a value to a specific variant using a shared literal field', 'Skip runtime validation for network data', 'Treat every object as the same shape'], answer: 0 },
      { topic, prompt: 'Why should a list-rendered React element have a stable key?', options: ['So React can match items correctly across updates', 'So the browser can encrypt the component', 'So CSS automatically becomes responsive'], answer: 0 },
    ];
  }
  if (normalizedTopic.includes('machine learning') || normalizedTopic.includes('scikit')) {
    return [
      { topic, prompt: 'A model performs well on training data but poorly on unseen examples. Which diagnosis is most likely?', options: ['Overfitting', 'Underflow', 'Data serialization'], answer: 0 },
      { topic, prompt: 'Why should a scaler be fitted only on the training split?', options: ['To prevent information from the validation or test set leaking into training', 'To guarantee every model is linear', 'To remove the need for a test set'], answer: 0 },
      { topic, prompt: 'For an imbalanced binary classifier, why can accuracy be misleading?', options: ['A majority-class model can score highly while missing the minority class', 'Accuracy only works for regression', 'Accuracy automatically changes the decision threshold'], answer: 0 },
    ];
  }
  if (normalizedTopic.includes('transformer') || normalizedTopic.includes('attention')) {
    return [
      { topic, prompt: 'In self-attention, what determines how strongly one token incorporates information from another?', options: ['The softmax-normalized query-key compatibility scores', 'The order of files on disk', 'The number of output classes'], answer: 0 },
      { topic, prompt: 'Why are positional encodings needed in a standard transformer?', options: ['Attention alone does not inherently represent token order', 'They reduce every sequence to one token', 'They replace the feed-forward network'], answer: 0 },
      { topic, prompt: 'What is the purpose of a causal attention mask during autoregressive generation?', options: ['Prevent a token from attending to future tokens', 'Force all tokens to share one embedding', 'Remove the need for tokenization'], answer: 0 },
    ];
  }
  if (normalizedTopic.includes('cloud') || normalizedTopic.includes('docker')) {
    return [
      { topic, prompt: 'A service works locally but fails in production because a library version differs. Which practice addresses this most directly?', options: ['Pin dependencies and build an immutable artifact', 'Add more UI animations', 'Store credentials in source control'], answer: 0 },
      { topic, prompt: 'What is the main operational difference between horizontal and vertical scaling?', options: ['Horizontal adds instances; vertical increases resources on an instance', 'Horizontal always means database migration', 'Vertical scaling requires no downtime in every system'], answer: 0 },
      { topic, prompt: 'Why should a container run as a non-root user when possible?', options: ['It limits the impact of a process compromise', 'It makes network latency zero', 'It removes the need for image scanning'], answer: 0 },
    ];
  }
  return [
    { topic, prompt: `Which scenario demonstrates applying ${topic} rather than only memorizing its definition?`, options: [`Selecting ${topic} to solve a concrete engineering problem`, 'Ignoring requirements and guessing', 'Removing tests before deployment'], answer: 0 },
    { topic, prompt: `A teammate is learning ${topic}. Which evidence best demonstrates understanding?`, options: ['Explaining a tradeoff and applying it in a small project', 'Repeating a term without an example', 'Copying output without checking assumptions'], answer: 0 },
  ];
};

export const AssessmentPage: React.FC<AssessmentPageProps> = ({ roadmap, onAnswer }) => {
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [mode, setMode] = useState<'exam' | 'revision'>('exam');

  const coveredTopics = useMemo(() => {
    const topics = roadmap?.phases
      .flatMap((phase) => phase.milestones)
      .flatMap((milestone) => milestone.subtopics.filter((subtopic) => subtopic.completed).map((subtopic) => subtopic.skill)) || [];
    return [...new Set(topics)];
  }, [roadmap]);

  const questions = useMemo(() => {
    const topics = selectedTopic === 'all' ? coveredTopics : [selectedTopic];
    return topics.flatMap(questionsForTopic);
  }, [coveredTopics, selectedTopic]);

  const currentQuestion = questions[questionIndex];
  const isFinished = questions.length > 0 && questionIndex >= questions.length;
  const studyRecords = getStudyRecords();
  const revisionTopics = coveredTopics.map((topic) => {
    const attempts = studyRecords.filter((record) => record.activityType === 'quiz' && record.skills.includes(topic));
    const incorrect = attempts.filter((record) => (record.masteryPoints || 0) === 0).length;
    const latest = attempts.reduce((date, record) => Math.max(date, new Date(record.completedAt).getTime()), 0);
    const daysSince = latest ? Math.floor((Date.now() - latest) / 86400000) : 99;
    return { topic, incorrect, daysSince, priority: incorrect * 2 + Math.min(daysSince, 7) };
  }).sort((first, second) => second.priority - first.priority);

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

      <div className="flex gap-2">
        <button onClick={() => setMode('exam')} className={`rounded-full px-4 py-2 text-xs font-semibold ${mode === 'exam' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant'}`}>Certification exam</button>
        <button onClick={() => setMode('revision')} className={`rounded-full px-4 py-2 text-xs font-semibold ${mode === 'revision' ? 'bg-secondary text-on-secondary' : 'bg-surface-container-low text-on-surface-variant'}`}>Assessment revision</button>
      </div>

      {mode === 'exam' && (coveredTopics.length === 0 ? (
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
      ))}

      {mode === 'revision' && (
        <section className="glass-card rounded-2xl border border-outline-variant/40 p-6">
          <h2 className="text-xl font-bold text-primary dark:text-on-primary-fixed">Revision from your assessment results</h2>
          <p className="mt-2 text-sm text-on-surface-variant">Topics are prioritized from incorrect answers and time since your last assessment attempt.</p>
          <div className="mt-5 grid gap-3">{revisionTopics.length ? revisionTopics.map((item) => <div key={item.topic} className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/30 p-4"><div><div className="text-sm font-semibold text-primary dark:text-on-primary-fixed">{item.topic}</div><div className="mt-1 text-xs text-on-surface-variant">{item.incorrect} incorrect attempt{item.incorrect === 1 ? '' : 's'} · {item.daysSince === 99 ? 'not assessed yet' : `${item.daysSince} day${item.daysSince === 1 ? '' : 's'} since last attempt`}</div></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.priority >= 5 ? 'bg-rose-500/10 text-rose-700' : 'bg-amber-500/10 text-amber-700'}`}>{item.priority >= 5 ? 'High priority' : 'Review soon'}</span></div>) : <p className="rounded-xl bg-surface-container-low p-4 text-sm text-on-surface-variant">Complete a roadmap topic to build your assessment revision queue.</p>}</div>
        </section>
      )}

      {coveredTopics.length > 0 && !isFinished && <div className="flex flex-wrap gap-2"><button onClick={() => { setSelectedTopic('all'); resetAssessment(); }} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${selectedTopic === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant'}`}>All covered topics</button>{coveredTopics.map((topic) => <button key={topic} onClick={() => { setSelectedTopic(topic); resetAssessment(); }} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${selectedTopic === topic ? 'bg-secondary text-on-secondary' : 'bg-surface-container-low text-on-surface-variant'}`}>{topic}</button>)}</div>}
    </div>
  );
};
