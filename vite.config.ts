import { defineConfig, loadEnv } from 'vite';
import type { ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { MongoClient, ObjectId } from 'mongodb';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const luminaAiPlugin = {
    name: 'lumina-ai-chat-proxy',
    configureServer(server: ViteDevServer) {
      const mongoUri = env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
      const mongoDbName = env.MONGODB_DB_NAME || 'lumina';
      const mongoClient = new MongoClient(mongoUri);
      let mongoConnection: Promise<MongoClient> | null = null;
      const connectMongo = () => {
        if (!mongoConnection) mongoConnection = mongoClient.connect();
        return mongoConnection;
      };
      const readBody = async (req: IncomingMessage) => {
        let body = '';
        for await (const chunk of req) body += chunk;
        return body ? JSON.parse(body) : {};
      };
      const hashPassword = (password: string, salt = randomBytes(16).toString('hex')) => ({
        salt,
        hash: scryptSync(password, salt, 64).toString('hex'),
      });
      const validPassword = (password: string, hash: string, salt: string) => {
        const actual = scryptSync(password, salt, 64);
        return timingSafeEqual(actual, Buffer.from(hash, 'hex'));
      };

      server.middlewares.use('/api/db/status', async (req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void) => {
        if (req.method !== 'GET') return next();
        try {
          const client = await connectMongo();
          const database = client.db(mongoDbName);
          const collections = await database.listCollections({ name: 'users' }).toArray();
          if (collections.length === 0) await database.createCollection('users');
          const userCount = await database.collection('users').countDocuments();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ connected: true, database: mongoDbName, collection: 'users', userCount }));
        } catch (error) {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ connected: false, error: 'MongoDB is unavailable. Start the local MongoDB service and try again.' }));
        }
      });

      server.middlewares.use('/api/auth', async (req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void) => {
        if (req.method !== 'POST' || !['/signin', '/signup'].includes(req.url || '')) return next();
        try {
          const payload = await readBody(req);
          const email = String(payload.email || '').trim().toLowerCase();
          const password = String(payload.password || '');
          const name = String(payload.name || '').trim();
          if (email.length > 254 || password.length < 6 || password.length > 128 || (req.url === '/signup' && (!name || name.length > 100))) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Provide a valid email and password of at least 6 characters.' }));
            return;
          }
          const client = await connectMongo();
          const users = client.db(mongoDbName).collection('users');
          const existing = await users.findOne({ email });
          if (req.url === '/signup') {
            if (existing) {
              res.statusCode = 409;
              res.end(JSON.stringify({ error: 'An account with this email already exists. Sign in instead.' }));
              return;
            }
            const credentials = hashPassword(password);
            const user = { name: String(payload.name).trim(), email, ...credentials, createdAt: new Date() };
            const inserted = await users.insertOne(user);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ user: { id: inserted.insertedId.toString(), name: user.name, email } }));
            return;
          }
          if (!existing || !validPassword(password, existing.hash, existing.salt)) {
            res.statusCode = 401;
            res.end(JSON.stringify({ error: 'Invalid email or password.' }));
            return;
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ user: { id: existing._id.toString(), name: existing.name, email } }));
        } catch (error) {
          res.statusCode = 503;
          res.end(JSON.stringify({ error: 'Could not connect to MongoDB. Start MongoDB locally and try again.' }));
        }
      });

      server.middlewares.use('/api/workspace', async (req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void) => {
        if (!['GET', 'PUT'].includes(req.method || '')) return next();
        try {
          const requestUrl = new URL(req.url || '/', 'http://localhost');
          const payload = req.method === 'PUT' ? await readBody(req) : {};
          const userId = String(payload.userId || requestUrl.searchParams.get('userId') || '').trim();
          if (!userId) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'A user id is required.' }));
            return;
          }
          const client = await connectMongo();
          const workspaces = client.db(mongoDbName).collection('workspaces');
          if (req.method === 'GET') {
            const workspace = await workspaces.findOne({ userId });
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ data: workspace?.data || null }));
            return;
          }
          const data = payload.data || {};
          await workspaces.updateOne({ userId }, { $set: { userId, data, updatedAt: new Date() } }, { upsert: true });
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ saved: true }));
        } catch (error) {
          res.statusCode = 503;
          res.end(JSON.stringify({ error: 'Could not save workspace to MongoDB.' }));
        }
      });

      server.middlewares.use('/api/study-rooms', async (req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void) => {
        if (!['GET', 'POST', 'PATCH'].includes(req.method || '')) return next();
        try {
          const requestUrl = new URL(req.url || '/', 'http://localhost');
          const payload = ['POST', 'PATCH'].includes(req.method || '') ? await readBody(req) : {};
          const userId = String(payload.userId || requestUrl.searchParams.get('userId') || '').trim();
          if (!userId) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'A user id is required.' }));
            return;
          }
          const client = await connectMongo();
          const database = client.db(mongoDbName);
          const rooms = database.collection<any>('studyRooms');
          const users = database.collection('users');

          if (req.method === 'GET') {
            const userRooms = await rooms.find({ $or: [{ 'members.userId': userId }, { 'requests.userId': userId }] }).toArray();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ rooms: userRooms }));
            return;
          }

          if (req.method === 'POST' && payload.action === 'create') {
            const owner = await users.findOne({ _id: new ObjectId(userId) });
            const room = {
              id: randomBytes(12).toString('hex'),
              name: String(payload.name || 'Study Room').trim().slice(0, 80),
              ownerId: userId,
              members: [{ userId, email: owner?.email || '', name: owner?.name || 'Room owner', status: 'accepted' }],
              requests: [],
              messages: [],
              createdAt: new Date(),
            };
            await rooms.insertOne(room);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ room }));
            return;
          }

          const roomId = String(payload.roomId || '').trim();
          const room = await rooms.findOne({ id: roomId }) as any;
          if (!room) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Study room not found.' }));
            return;
          }

          if (req.method === 'POST' && payload.action === 'invite') {
            const email = String(payload.email || '').trim().toLowerCase();
            const friend = await users.findOne({ email });
            if (!friend) {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'No registered account uses that email.' }));
              return;
            }
            if (room.members.some((member: any) => member.userId === friend._id.toString()) || room.requests.some((request: any) => request.userId === friend._id.toString())) {
              res.statusCode = 409;
              res.end(JSON.stringify({ error: 'That learner is already a member or has a pending request.' }));
              return;
            }
            await rooms.updateOne({ id: roomId }, { $push: { requests: { userId: friend._id.toString(), email, name: friend.name, invitedBy: userId, createdAt: new Date() } } } as any);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ sent: true }));
            return;
          }

          if (req.method === 'POST' && payload.action === 'message') {
            const isMember = room.members.some((member: any) => member.userId === userId && member.status === 'accepted');
            if (!isMember) {
              res.statusCode = 403;
              res.end(JSON.stringify({ error: 'Only accepted members can post messages.' }));
              return;
            }
            const sender = await users.findOne({ _id: new ObjectId(userId) });
            const message = { id: randomBytes(10).toString('hex'), userId, name: sender?.name || 'Learner', text: String(payload.text || '').trim().slice(0, 500), createdAt: new Date() };
            if (!message.text) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Message cannot be empty.' }));
              return;
            }
            await rooms.updateOne({ id: roomId }, { $push: { messages: message } } as any);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ message }));
            return;
          }

          if (req.method === 'PATCH' && payload.action === 'respond') {
            const request = room.requests.find((item: any) => item.userId === userId);
            if (!request || !['accepted', 'rejected'].includes(payload.status)) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Invalid study room request.' }));
              return;
            }
            const updates = payload.status === 'accepted'
              ? { $pull: { requests: { userId } }, $push: { members: { userId, email: request.email, name: request.name, status: 'accepted' } } }
              : { $pull: { requests: { userId } } };
            await rooms.updateOne({ id: roomId }, updates as any);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ updated: true }));
            return;
          }

          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Unsupported study room action.' }));
        } catch (error) {
          res.statusCode = 503;
          res.end(JSON.stringify({ error: 'Study room service is unavailable. Start MongoDB locally and try again.' }));
        }
      });

      server.middlewares.use('/api/ai/chat', async (req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void) => {
        if (req.method !== 'POST') return next();

        try {
          let body = '';
          for await (const chunk of req) body += chunk;
          const payload = body ? JSON.parse(body) : {};

          const apiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
          if (!apiKey) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing server API key. Set GEMINI_API_KEY or VITE_GEMINI_API_KEY in .env.' }));
            return;
          }

          const genAI = new GoogleGenAI({ apiKey });
          const userMessage = payload.message || '';
          const profile = payload.profile || {};
          const activeMilestone = payload.activeMilestone || null;
          const systemPrompt = `You are Lumina Mentor, an empathetic, world-class AI learning coach & technical tutor. Learner: ${profile.name || 'Learner'}. Interests: ${(profile.interests || []).join(', ') || 'not specified'}. Active milestone: ${activeMilestone ? activeMilestone.title : 'General'}`;

          const response = await genAI.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: `${systemPrompt}\nUser: "${userMessage}"\nRespond concisely in markdown with helpful guidance.`,
          });

          const text = response.text || 'Sorry, no response from model.';
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ text }));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(e) }));
        }
      });
    },
  };

  return {
    plugins: [react(), luminaAiPlugin],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      open: true,
    },
  };
});
