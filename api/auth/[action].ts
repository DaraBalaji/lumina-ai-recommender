import type { VercelRequest, VercelResponse } from '@vercel/node';
import { bodyOf, getDatabase, hashPassword, idOf, json, validPassword } from '../_lib/server';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST' || !['signin', 'signup'].includes(String(request.query.action))) return json(response, 405, { error: 'Method not allowed.' });
  try {
    const payload = bodyOf(request);
    const action = String(request.query.action);
    const email = String(payload.email || '').trim().toLowerCase();
    const password = String(payload.password || '');
    const name = String(payload.name || '').trim();
    if (email.length > 254 || password.length < 6 || password.length > 128 || (action === 'signup' && (!name || name.length > 100))) return json(response, 400, { error: 'Provide a valid email and password of at least 6 characters.' });
    const users = (await getDatabase()).collection('users');
    const existing = await users.findOne({ email });
    if (action === 'signup') {
      if (existing) return json(response, 409, { error: 'An account with this email already exists. Sign in instead.' });
      const user = { name, email, ...hashPassword(password), createdAt: new Date() };
      const inserted = await users.insertOne(user);
      return json(response, 200, { user: { id: inserted.insertedId.toString(), name, email } });
    }
    if (!existing || !validPassword(password, String(existing.hash), String(existing.salt))) return json(response, 401, { error: 'Invalid email or password.' });
    return json(response, 200, { user: { id: existing._id.toString(), name: existing.name, email } });
  } catch (error) {
    console.error('Auth function failed:', error);
    return json(response, 503, { error: 'Authentication service is unavailable.' });
  }
}
