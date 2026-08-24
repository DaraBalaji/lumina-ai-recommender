import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  Zap,
  Trash2,
} from 'lucide-react';
import { LearnerProfile, Milestone, ChatMessage, PracticeQuiz } from '../types';
import { sendLuminaChatMessage, generateMilestoneXAIExplanation } from '../services/aiService';
import { getChatHistory, saveChatHistory } from '../services/dbService';

interface LuminaAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  profile: LearnerProfile;
  activeMilestone?: Milestone | null;
  onApplyRoadmapAdaptation?: (action: 'compress' | 'inject_prereq' | 'reorder') => void;
  onQuizCompleted?: (correct: boolean, topic: string) => void;
}

export const LuminaAssistant: React.FC<LuminaAssistantProps> = ({
  isOpen,
  onClose,
  profile,
  activeMilestone,
  onApplyRoadmapAdaptation,
  onQuizCompleted,
}) => {
  const createWelcomeMessage = (): ChatMessage => ({
    id: `msg-welcome-${Date.now()}`,
    sender: 'assistant',
    text: `Hello ${profile.name}! 👋 I am your **RouteMind Mentor Copilot**.\n\nI am tracking your learning trajectory towards **${profile.targetRoleTitle}**.\n\nHow can I accelerate your learning today?`,
    timestamp: new Date().toISOString(),
    suggestions: [
      'Explain Transformers like I am 5',
      'Generate a practice code quiz',
      'Adapt roadmap: Too Hard',
      'What is my next best action?',
    ],
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const history = getChatHistory();
    if (history.length > 0) return history;
    return [createWelcomeMessage()];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveChatHistory(messages);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // When active milestone changes, fetch live XAI explanation and append assistant message
  useEffect(() => {
    let cancelled = false;
    const fetchExplanation = async () => {
      if (!activeMilestone) return;
      try {
        const expl = await generateMilestoneXAIExplanation(activeMilestone, profile, { id: profile.targetRoleId, title: profile.targetRoleTitle, domain: '', description: '', benchmarkScores: {}, requiredCapabilities: [], recommendedTimelineMonths: 6, icon: '' });
        if (cancelled) return;
        const assistantMsg = {
          id: `xai-${Date.now()}`,
          sender: 'assistant' as const,
          text: `Why this milestone?\n\n${expl.skillGapAddressed}\n\nPrerequisites: ${expl.prerequisiteCoverage}\n\nCareer impact: ${expl.careerImpact} (score: ${expl.careerImpactScore})`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (e) {
        console.warn('Failed to fetch milestone XAI explanation', e);
      }
    };
    fetchExplanation();
    return () => {
      cancelled = true;
    };
  }, [activeMilestone, profile]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputQuery('');
    setIsSending(true);

    try {
      const assistantReply = await sendLuminaChatMessage(
        textToSend,
        newHistory,
        profile,
        activeMilestone
      );
      setMessages((prev) => [...prev, assistantReply]);

      if (assistantReply.roadmapAdaptation && onApplyRoadmapAdaptation) {
        onApplyRoadmapAdaptation(assistantReply.roadmapAdaptation.action);
      }
    } catch (e) {
      console.error('Lumina Assistant Chat error:', e);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuizAnswer = (messageId: string, selectedIdx: number) => {
    const answeredMessage = messages.find((message) => message.id === messageId);
    const quiz = answeredMessage?.quiz;
    if (quiz && onQuizCompleted) {
      onQuizCompleted(selectedIdx === quiz.correctAnswerIndex, quiz.topic);
    }
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && msg.quiz) {
          return {
            ...msg,
            quiz: {
              ...msg.quiz,
              userSelectedIndex: selectedIdx,
            },
          };
        }
        return msg;
      })
    );
  };

  const handleClearChat = () => {
    setMessages([createWelcomeMessage()]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md h-[580px] glass-panel rounded-3xl border-2 border-secondary/30 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
      {/* Header Bar */}
      <div className="p-4 bg-primary text-on-primary flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
            <Bot className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <span className="font-headline-md text-sm font-bold text-white block">
              RouteMind Mentor Copilot
            </span>
            <span className="text-[10px] text-secondary-container flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live AI Tutor & Roadmap Adaptor
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleClearChat}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Clear chat history"
            aria-label="Clear chat history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Close mentor"
            aria-label="Close mentor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-secondary-container text-secondary flex items-center justify-center shrink-0 mt-1">
                <Sparkles className="w-4 h-4" />
              </div>
            )}

            <div className="flex flex-col gap-2 max-w-[85%]">
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-primary text-on-primary rounded-tr-none'
                    : 'bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant/30 text-on-surface rounded-tl-none shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Practice Quiz Card rendering */}
                {msg.quiz && (
                  <div className="mt-3 p-3 rounded-xl bg-surface-container-low dark:bg-surface-container/30 border border-outline-variant/40 flex flex-col gap-2 text-xs">
                    <span className="font-bold text-primary dark:text-on-primary-fixed block">
                      {msg.quiz.question}
                    </span>
                    <div className="flex flex-col gap-1.5 mt-1">
                      {msg.quiz.options.map((opt, oIdx) => {
                        const isSelected = msg.quiz?.userSelectedIndex === oIdx;
                        const isCorrect = msg.quiz?.correctAnswerIndex === oIdx;
                        const isAnswered = msg.quiz?.userSelectedIndex !== undefined;

                        return (
                          <button
                            key={oIdx}
                            onClick={() => handleQuizAnswer(msg.id, oIdx)}
                            disabled={isAnswered}
                            className={`w-full text-left p-2 rounded-lg text-[11px] font-medium border transition-all ${
                              isAnswered
                                ? isCorrect
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                                  : isSelected
                                  ? 'bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300'
                                  : 'border-outline-variant/20 opacity-60'
                                : 'border-outline-variant/40 hover:bg-surface-variant'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}. {opt}
                          </button>
                        );
                      })}
                    </div>

                    {msg.quiz.userSelectedIndex !== undefined && (
                      <div className="mt-2 pt-2 border-t border-outline-variant/20 text-[11px]">
                        <span className="font-bold text-secondary block">Explanation:</span>
                        <p className="text-on-surface-variant dark:text-outline-variant">
                          {msg.quiz.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Roadmap Adaptation Badge */}
                {msg.roadmapAdaptation && (
                  <div className="mt-3 p-2.5 rounded-xl bg-secondary-container/40 border border-secondary-container text-[11px] text-secondary font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      Adaptation Applied: {msg.roadmapAdaptation.action}
                    </span>
                  </div>
                )}
              </div>

              {/* Prompt Suggestions */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {msg.suggestions.map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSend(sug)}
                      className="px-2.5 py-1 rounded-full bg-surface-variant/50 border border-outline-variant/30 text-[10px] font-medium text-secondary hover:bg-secondary hover:text-on-secondary transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 mt-1 text-xs font-bold">
                {profile.name[0]}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-surface-container-lowest dark:bg-inverse-surface border-t border-outline-variant/30 flex items-center gap-2">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask RouteMind Mentor a question..."
          className="flex-1 rounded-full border border-outline-variant/40 px-4 py-2 text-xs bg-surface-container-low dark:bg-surface-container/20 text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputQuery.trim() || isSending}
          className="p-2 rounded-full bg-secondary text-on-secondary hover:bg-secondary/90 disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
