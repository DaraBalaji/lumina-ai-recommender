import { MongoClient, ObjectId } from 'mongodb';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

let clientPromise: Promise<MongoClient> | undefined;

export const getDatabase = async () => {
  if (!clientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not configured.');
    clientPromise = new MongoClient(uri).connect();
  }
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB_NAME || 'lumina');
};

export const json = (response: any, status: number, body: unknown) => {
  response.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

export const bodyOf = (request: any) => request.body || {};
export const idOf = (value: unknown) => {
  const text = String(value || '');
  return ObjectId.isValid(text) ? new ObjectId(text) : null;
};

export const hashPassword = (password: string, salt = randomBytes(16).toString('hex')) => ({ salt, hash: scryptSync(password, salt, 64).toString('hex') });
export const validPassword = (password: string, hash: string, salt: string) => timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, 'hex'));
export const cleanDescription = (value: unknown) => String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
