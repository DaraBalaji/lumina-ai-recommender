import type { VercelRequest, VercelResponse } from '@vercel/node';
import { bodyOf, getDatabase, json } from './_lib/server.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!['GET', 'PUT'].includes(request.method || '')) return json(response, 405, { error: 'Method not allowed.' });
  try {
    const payload = request.method === 'PUT' ? bodyOf(request) : {};
    const userId = String(payload.userId || request.query.userId || '').trim();
    if (!userId) return json(response, 400, { error: 'A user id is required.' });
    const workspaces = (await getDatabase()).collection('workspaces');
    if (request.method === 'GET') {
      const workspace = await workspaces.findOne({ userId });
      return json(response, 200, { data: workspace?.data || null });
    }
    await workspaces.updateOne({ userId }, { $set: { userId, data: payload.data || {}, updatedAt: new Date() } }, { upsert: true });
    return json(response, 200, { saved: true });
  } catch (error) {
    console.error('Workspace function failed:', error);
    return json(response, 503, { error: 'Workspace service is unavailable.' });
  }
}
