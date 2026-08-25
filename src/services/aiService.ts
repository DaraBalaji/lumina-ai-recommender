import {
  LearnerProfile,
  TargetRole,
  ChatMessage,
  PracticeQuiz,
  Milestone,
  SkillLevel,
  LearningFormat,
} from '../types';
import { TARGET_ROLES } from '../data/skillTaxonomy';
import { explainCourseScore, calculateSkillGaps } from './recommendationEngine';

type ServerOnlyAiClient = {
  models: {
    generateContent: (request: { model: string; contents: string }) => Promise<{ text?: string }>;
  };
};

const getGenAI = (): ServerOnlyAiClient | null => null;

// 1. Natural Language Goal Parser
export interface ParsedGoalResult {
  matchedRoleId: string;
  targetRoleTitle: string;
  suggestedSkillLevel: SkillLevel;
  suggestedHoursPerWeek: number;
  suggestedTimelineMonths: number;
  preferredFormat: LearningFormat;
  aiReasoning: string;
}

export const parseNaturalLanguageGoal = async (
  goalText: string,
  profile: LearnerProfile
): Promise<ParsedGoalResult> => {
  const genAI = getGenAI();

  if (genAI) {
    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Analyze this user career goal prompt: "${goalText}".
Match it to one of these available target roles:
${TARGET_ROLES.map((r) => `- ID: "${r.id}", Title: "${r.title}"`).join('\n')}

Return JSON with format:
{
  "matchedRoleId": "string",
  "targetRoleTitle": "string",
  "suggestedSkillLevel": "Beginner" | "Intermediate" | "Advanced",
  "suggestedHoursPerWeek": number,
  "suggestedTimelineMonths": number,
  "preferredFormat": "Video" | "Project-first" | "Theoretical" | "Books",
  "aiReasoning": "string"
}`,
      });

      const responseText = response.text || '';
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        matchedRoleId: parsed.matchedRoleId || 'genai-engineer',
        targetRoleTitle: parsed.targetRoleTitle || 'Generative AI Engineer',
        suggestedSkillLevel: (parsed.suggestedSkillLevel as SkillLevel) || 'Intermediate',
        suggestedHoursPerWeek: Number(parsed.suggestedHoursPerWeek) || 12,
        suggestedTimelineMonths: Number(parsed.suggestedTimelineMonths) || 6,
        preferredFormat: (parsed.preferredFormat as LearningFormat) || 'Project-first',
        aiReasoning: parsed.aiReasoning || 'Analyzed natural language goal and matched optimal career roadmap trajectory.',
      };
    } catch (e) {
      console.warn('Gemini API call failed for goal parsing, falling back to local AI reasoning:', e);
    }
  }

  // Local Heuristic Fallback
  const text = goalText.toLowerCase();
  let matched = TARGET_ROLES[0]; // Default GenAI

  if (text.includes('cloud') || text.includes('devops') || text.includes('kubernetes') || text.includes('terraform') || text.includes('aws') || text.includes('gcp')) {
    matched = TARGET_ROLES.find((r) => r.id === 'cloud-devops-lead') || matched;
  } else if (text.includes('web3') || text.includes('solidity') || text.includes('blockchain') || text.includes('crypto') || text.includes('smart contract')) {
    matched = TARGET_ROLES.find((r) => r.id === 'fullstack-web3-dev') || matched;
  } else if (text.includes('analyst') || text.includes('data science') || text.includes('pandas') || text.includes('sql') || text.includes('bi')) {
    matched = TARGET_ROLES.find((r) => r.id === 'data-analyst-to-ai') || matched;
  } else if (text.includes('rust') || text.includes('systems') || text.includes('grpc') || text.includes('tokio')) {
    matched = TARGET_ROLES.find((r) => r.id === 'systems-rust-architect') || matched;
  } else if (text.includes('security') || text.includes('cyber') || text.includes('hack') || text.includes('owasp') || text.includes('pen test')) {
    matched = TARGET_ROLES.find((r) => r.id === 'cybersecurity-specialist') || matched;
  }

  let hours = profile.hoursPerWeek || 12;
  if (text.includes('fast') || text.includes('intensive') || text.includes('bootcamp') || text.includes('20') || text.includes('30')) {
    hours = 20;
  } else if (text.includes('part-time') || text.includes('5') || text.includes('slow')) {
    hours = 6;
  }

  let timeline = 6;
  if (text.includes('3 month') || text.includes('90 day')) {
    timeline = 3;
  } else if (text.includes('1 year') || text.includes('12 month')) {
    timeline = 12;
  }

  let format: LearningFormat = 'Project-first';
  if (text.includes('video') || text.includes('lecture') || text.includes('watch')) {
    format = 'Video';
  } else if (text.includes('book') || text.includes('read')) {
    format = 'Books';
  } else if (text.includes('theory') || text.includes('math')) {
    format = 'Theoretical';
  }

  return {
    matchedRoleId: matched.id,
    targetRoleTitle: matched.title,
    suggestedSkillLevel: text.includes('beginner') || text.includes('start') ? 'Beginner' : text.includes('advanced') || text.includes('expert') ? 'Advanced' : 'Intermediate',
    suggestedHoursPerWeek: hours,
    suggestedTimelineMonths: timeline,
    preferredFormat: format,
    aiReasoning: `RouteMind Local AI analyzed "${goalText}" and identified high alignment with the ${matched.title} benchmark trajectory.`,
  };
};

// 2. Lumina Mentor Chat & Practice Quiz Generator
export const sendLuminaChatMessage = async (
  userMessageText: string,
  history: ChatMessage[],
  profile: LearnerProfile,
  activeMilestone?: Milestone | null
): Promise<ChatMessage> => {
  const textLower = userMessageText.toLowerCase();
  const wantsQuiz = textLower.includes('quiz') || textLower.includes('test me') || textLower.includes('practice');

  const createDynamicQuiz = (): ChatMessage => {
    const skill = activeMilestone?.skillsGained?.[0] || profile.interests?.[0] || 'the active learning topic';
    const courseTitle = activeMilestone?.course.title || profile.targetRoleTitle;
    const quiz: PracticeQuiz = {
      id: `quiz-${Date.now()}`,
      topic: skill,
      question: `While studying ${courseTitle}, which approach best demonstrates practical understanding of ${skill}?`,
      options: [
        `Apply ${skill} to a small, testable project and evaluate the result`,
        'Memorize the definition without implementing it',
        'Skip validation because the first output looks correct',
        'Replace the concept with an unrelated tool',
      ],
      correctAnswerIndex: 0,
      explanation: `Practical application plus validation provides evidence that you understand ${skill} beyond recalling terminology.`,
    };
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `I generated a practice question for **${skill}**, based on your current milestone **${courseTitle}**. Select the best answer below:`,
      timestamp: new Date().toISOString(),
      quiz,
      suggestions: ['Explain the answer', 'Give me a harder question', 'What should I study next?'],
    };
  };

  if (wantsQuiz) return createDynamicQuiz();

  // First, attempt server-side proxy call to /api/ai/chat (recommended for browser clients)
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    try {
      const resp = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessageText, history, profile, activeMilestone }),
      });
      if (resp.ok) {
        const json = await resp.json();
        const replyText = json.text || 'I am here to guide your learning roadmap!';
        return {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toISOString(),
          suggestions: [
            'Explain this like I am 5',
            'Generate a practice code quiz',
            'Adapt roadmap: This is too hard',
            'What is the next best action?',
          ],
        };
      } else {
        console.warn('Server AI proxy returned non-ok:', resp.status, await resp.text());
      }
    } catch (e) {
      console.warn('Server AI proxy call failed, falling back to local/genai client:', e);
    }
  }

  const genAI = getGenAI();

  if (genAI) {
    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `You are Lumina Mentor, an empathetic, world-class AI learning coach & technical tutor.
Learner Context:
- Name: ${profile.name}
- Target Role: ${profile.targetRoleTitle}
- Skill Level: ${profile.currentSkillLevel}
- Interests: ${profile.interests?.join(', ') || 'Not specified'}
- Active Milestone Focus: ${activeMilestone ? activeMilestone.title : 'General Career Roadmap'}

User Question / Request: "${userMessageText}"

Respond concisely in clean markdown with helpful analogies, actionable guidance, and encouraging tone.`,
      });

      const replyText = response.text || 'I am here to guide your learning roadmap!';

      return {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toISOString(),
        suggestions: [
          'Explain this like I am 5',
          'Generate a practice code quiz',
          'Adapt roadmap: This is too hard',
          'What is the next best action?',
        ],
      };
    } catch (e) {
      console.warn('Gemini API chat failed, using local AI tutor response:', e);
    }
  }

  // Local AI Tutor Fallback Response System

  if (textLower.includes('rag') || textLower.includes('retrieval augmented')) {
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `### What is RAG?\n\n**RAG** means **Retrieval-Augmented Generation**. It combines search with a language model:\n\n1. **Retrieve** relevant passages from a trusted document or vector database.\n2. **Augment** the user prompt with those passages as context.\n3. **Generate** an answer grounded in that retrieved context.\n\nRAG helps keep answers current, reduces hallucinations, and lets an AI assistant work with private documents without retraining the model. A typical pipeline uses document chunking, embeddings, vector search, reranking, and citation-aware generation.`,
      timestamp: new Date().toISOString(),
      suggestions: ['Test me with a RAG quiz', 'Explain vector databases', 'Show a RAG pipeline'],
    };
  }

  if (textLower.includes('like i am 5') || textLower.includes('eli5') || textLower.includes('simple analogy')) {
    const topic = activeMilestone ? activeMilestone.title : profile.targetRoleTitle;
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `### 🧠 Simple Analogy: ${topic}\n\nImagine you are running a super-busy restaurant kitchen:\n- **The Raw Ingredients** are your input data or prompt vectors.\n- **The Master Chef** is the Neural Network / Attention Mechanism choosing which ingredients matter most.\n- **The Plated Meal** is the generated response or model output!\n\nInstead of checking every single cookbook from page 1 to 500, the chef uses a **smart index (Vector DB / Attention)** to immediately grab only the top 3 relevant recipes!`,
      timestamp: new Date().toISOString(),
      suggestions: ['Test me with a quiz', 'Give a code example', 'Next milestone recommendation'],
    };
  }

  if (textLower.includes('too hard') || textLower.includes('struggling') || textLower.includes('confused')) {
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `No worries at all, ${profile.name}! Learning complex topics is iterative. I can automatically adapt your roadmap right now to inject a bridging prerequisite mini-course before **${activeMilestone ? activeMilestone.title : 'this milestone'}**.`,
      timestamp: new Date().toISOString(),
      roadmapAdaptation: {
        action: 'inject_prereq',
        reason: 'Learner requested bridging prerequisites due to difficulty feedback.',
        injectedCourseTitle: 'Bridging Foundations & Hands-On Fundamentals',
      },
      suggestions: ['Apply Roadmap Adaptation', 'Explain core prerequisites', 'Lower weekly pace'],
    };
  }

  if (textLower.includes('too easy') || textLower.includes('ahead') || textLower.includes('compress')) {
    return {
      id: `msg-${Date.now()}`,
      sender: 'assistant',
      text: `Impressive velocity! Since you already understand these concepts, I can compress your timeline by marking foundation milestones complete and unlocking advanced capstones directly.`,
      timestamp: new Date().toISOString(),
      roadmapAdaptation: {
        action: 'compress',
        reason: 'Learner demonstrated rapid mastery; compressing timeline by 2 weeks.',
      },
      suggestions: ['Apply Fast-Track Compression', 'Jump to Capstone Project', 'Explore Advanced Track'],
    };
  }

  return {
    id: `msg-${Date.now()}`,
    sender: 'assistant',
    text: `### RouteMind Mentor Insight\n\nGreat question regarding **${userMessageText}**!\n\n1. **Core Concept**: Focus on building a strong mental model before jumping into code.\n2. **Practical Tip**: Test your understanding by implementing a 20-line standalone script or notebook.\n3. **Recommended Next Step**: Complete **${activeMilestone ? activeMilestone.title : 'the active milestone'}** to solidify this capability!`,
    timestamp: new Date().toISOString(),
    suggestions: [
      'Explain like I am 5',
      'Generate a practice quiz',
      'Why was this milestone recommended?',
      'Adapt path: Too Hard',
    ],
  };
};

// 3. Explainable AI Rationale Generator
export const generateMilestoneXAIExplanation = async (
  milestone: Milestone,
  profile: LearnerProfile,
  targetRole: TargetRole
): Promise<{
  skillGapAddressed: string;
  prerequisiteCoverage: string;
  careerImpact: string;
  careerImpactScore: number;
}> => {
  const genAI = getGenAI();

  if (genAI) {
    try {
      const response = await genAI.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Explain why course "${milestone.course.title}" was recommended for learner ${profile.name} targeting the role "${targetRole.title}".
Skills covered: ${milestone.course.skillsCovered.join(', ')}.

Return JSON with:
{
  "skillGapAddressed": "string",
  "prerequisiteCoverage": "string",
  "careerImpact": "string",
  "careerImpactScore": number
}`,
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        skillGapAddressed: parsed.skillGapAddressed || milestone.rationales.skillGapAddressed,
        prerequisiteCoverage: parsed.prerequisiteCoverage || milestone.rationales.prerequisiteCoverage,
        careerImpact: parsed.careerImpact || milestone.rationales.careerImpact,
        careerImpactScore: Number(parsed.careerImpactScore) || milestone.rationales.careerImpactScore,
      };
    } catch (e) {
      console.warn('Gemini XAI generation fallback to local engine:', e);
    }
  }
  // Local explanation fallback using recommendation engine heuristics
  try {
    const gaps = calculateSkillGaps(profile, targetRole);
    const breakdown = explainCourseScore(milestone.course, profile, gaps, targetRole);

    return {
      skillGapAddressed: breakdown.matchedGaps.length
        ? `Targets gaps in ${breakdown.matchedGaps.map((m) => `${m.skill} (${m.gapScore})`).join(', ')}.`
        : milestone.rationales.skillGapAddressed,
      prerequisiteCoverage: breakdown.missingPrereqs.length
        ? `Learner is missing prerequisites: ${breakdown.missingPrereqs.join(', ')}.`
        : milestone.rationales.prerequisiteCoverage,
      careerImpact: breakdown.explanation || milestone.rationales.careerImpact,
      careerImpactScore: breakdown.totalScore || milestone.rationales.careerImpactScore,
    };
  } catch (e) {
    console.warn('Local XAI fallback failed:', e);
    return milestone.rationales;
  }
};
