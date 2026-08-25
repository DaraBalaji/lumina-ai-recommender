import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { bodyOf, json } from '../_lib/server';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') return json(response, 405, { error: 'Method not allowed.' });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json(response, 500, { error: 'GEMINI_API_KEY is not configured in Vercel.' });
  try {
    const payload = bodyOf(request);
    const profile = payload.profile || {};
    const milestone = payload.activeMilestone;
    const systemPrompt = `You are RouteMind Mentor, an empathetic, world-class AI learning coach and technical tutor. Learner: ${profile.name || 'Learner'}. Target role: ${profile.targetRoleTitle || 'not specified'}. Interests: ${(profile.interests || []).join(', ') || 'not specified'}. Active milestone: ${milestone?.title || 'General'}.`;
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: `${systemPrompt}\nUser: "${String(payload.message || '').slice(0, 4000)}"\nRespond concisely in markdown with actionable guidance.` });
    return json(response, 200, { text: result.text || 'I am here to guide your learning roadmap.' });
  } catch (error) {
    console.error('AI function failed:', error);
    return json(response, 500, { error: 'AI service failed. Check the Gemini API key and model access.' });
  }
}
