import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase, json } from '../_lib/server.js';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') return json(response, 405, { error: 'Method not allowed.' });
  try {
    const database = await getDatabase();
    const userCount = await database.collection('users').countDocuments();
    return json(response, 200, { connected: true, database: database.databaseName, userCount });
  } catch (error) {
    console.error('Database status function failed:', error);
    return json(response, 503, { connected: false, error: 'MongoDB connection failed. Check MONGODB_URI and Atlas network access.' });
  }
}