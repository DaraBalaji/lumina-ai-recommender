import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { MongoClient } from 'mongodb';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const luminaAiPlugin = {
    name: 'lumina-ai-chat-proxy',
    configureServer(server) {
      const mongoUri = env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
      const mongoDbName = env.MONGODB_DB_NAME || 'lumina';
      const mongoClient = new MongoClient(mongoUri);
      let mongoConnection: Promise<MongoClient> | null = null;
      const connectMongo = () => {
        if (!mongoConnection) mongoConnection = mongoClient.connect();
        return mongoConnection;
      };
      const readBody = async (req) => {
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

      server.middlewares.use('/api/db/status', async (req, res, next) => {
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

      server.middlewares.use('/api/auth', async (req, res, next) => {
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

      server.middlewares.use('/api/workspace', async (req, res, next) => {
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
          const data = { ...(payload.data || {}), apiKey: '' };
          await workspaces.updateOne({ userId }, { $set: { userId, data, updatedAt: new Date() } }, { upsert: true });
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ saved: true }));
        } catch (error) {
          res.statusCode = 503;
          res.end(JSON.stringify({ error: 'Could not save workspace to MongoDB.' }));
        }
      });

      server.middlewares.use('/api/ai/chat', async (req, res, next) => {
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
