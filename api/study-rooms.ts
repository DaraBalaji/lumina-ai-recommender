import type { VercelRequest, VercelResponse } from '@vercel/node';
import { bodyOf, getDatabase, idOf, json } from './_lib/server.js';

type RoomItem = { userId: string; email?: string; name?: string; status?: string; invitedBy?: string; createdAt?: Date };
type RoomDocument = { id: string; ownerId: string; public?: boolean; members: RoomItem[]; requests: RoomItem[]; joinRequests?: RoomItem[]; messages: RoomItem[] };

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!['GET', 'POST', 'PATCH'].includes(request.method || '')) return json(response, 405, { error: 'Method not allowed.' });
  try {
    const payload = ['POST', 'PATCH'].includes(request.method || '') ? bodyOf(request) : {};
    const userId = String(payload.userId || request.query.userId || '').trim();
    const database = await getDatabase();
    const rooms = database.collection<any>('studyRooms');
    const users = database.collection<any>('users');
    if (request.method === 'GET' && request.query.public === 'true') return json(response, 200, { rooms: await rooms.find({ public: true }).toArray() });
    if (!userId) return json(response, 400, { error: 'A user id is required.' });
    if (request.method === 'GET') return json(response, 200, { rooms: await rooms.find({ $or: [{ 'members.userId': userId }, { 'requests.userId': userId }] }).toArray() });
    if (request.method === 'POST' && payload.action === 'create') {
      const userObjectId = idOf(userId);
      const owner = userObjectId ? await users.findOne({ _id: userObjectId }) : null;
      const room = { id: crypto.randomUUID(), name: String(payload.name || 'Study Room').trim().slice(0, 80), ownerId: userId, public: Boolean(payload.public), members: [{ userId, email: owner?.email || '', name: owner?.name || 'Room owner', status: 'accepted' }], requests: [], joinRequests: [], messages: [], createdAt: new Date() };
      await rooms.insertOne(room);
      return json(response, 200, { room });
    }
    const roomId = String(payload.roomId || '').trim();
    const room = await rooms.findOne({ id: roomId }) as RoomDocument | null;
    if (!room) return json(response, 404, { error: 'Study room not found.' });
    if (request.method === 'POST' && payload.action === 'invite') {
      const email = String(payload.email || '').trim().toLowerCase();
      const friend = await users.findOne({ email });
      if (!friend) return json(response, 404, { error: 'No registered account uses that email.' });
      if (room.members.some((member: RoomItem) => member.userId === friend._id.toString()) || room.requests.some((item: RoomItem) => item.userId === friend._id.toString())) return json(response, 409, { error: 'That learner is already a member or has a pending request.' });
      await rooms.updateOne({ id: roomId }, { $push: { requests: { userId: friend._id.toString(), email, name: friend.name, invitedBy: userId, createdAt: new Date() } } } as any);
      return json(response, 200, { sent: true });
    }
    if (request.method === 'POST' && payload.action === 'requestJoin') {
      if (!room.public) return json(response, 403, { error: 'This study room is private.' });
      const requesterId = idOf(userId);
      const requester = requesterId ? await users.findOne({ _id: requesterId }) : null;
      if (room.members.some((member: RoomItem) => member.userId === userId) || room.joinRequests?.some((item: RoomItem) => item.userId === userId)) return json(response, 409, { error: 'You are already a member or have a pending request.' });
      await rooms.updateOne({ id: roomId }, { $push: { joinRequests: { userId, email: requester?.email || '', name: requester?.name || 'Learner', createdAt: new Date() } } } as any);
      return json(response, 200, { sent: true });
    }
    if (request.method === 'POST' && payload.action === 'message') {
      if (!room.members.some((member: RoomItem) => member.userId === userId && member.status === 'accepted')) return json(response, 403, { error: 'Only accepted members can post messages.' });
      const senderId = idOf(userId);
      const sender = senderId ? await users.findOne({ _id: senderId }) : null;
      const message = { id: crypto.randomUUID(), userId, name: sender?.name || 'Learner', text: String(payload.text || '').trim().slice(0, 500), createdAt: new Date() };
      if (!message.text) return json(response, 400, { error: 'Message cannot be empty.' });
      await rooms.updateOne({ id: roomId }, { $push: { messages: message } } as any);
      return json(response, 200, { message });
    }
    if (request.method === 'PATCH' && payload.action === 'respond') {
      const invite = room.requests.find((item: RoomItem) => item.userId === userId);
      if (!invite || !['accepted', 'rejected'].includes(payload.status)) return json(response, 400, { error: 'Invalid study room request.' });
      const updates = payload.status === 'accepted' ? { $pull: { requests: { userId } }, $push: { members: { userId, email: invite.email, name: invite.name, status: 'accepted' } } } : { $pull: { requests: { userId } } };
      await rooms.updateOne({ id: roomId }, updates as any);
      return json(response, 200, { updated: true });
    }
    if (request.method === 'PATCH' && payload.action === 'toggleVisibility') {
      if (room.ownerId !== userId) return json(response, 403, { error: 'Only the room owner can toggle visibility.' });
      await rooms.updateOne({ id: roomId }, { $set: { public: Boolean(payload.public) } });
      return json(response, 200, { updated: true });
    }
    if (request.method === 'PATCH' && payload.action === 'respondJoinRequest') {
      if (room.ownerId !== userId) return json(response, 403, { error: 'Only the room owner can approve join requests.' });
      const joinRequest = room.joinRequests?.find((item: RoomItem) => item.userId === payload.requestUserId);
      if (!joinRequest || !['accepted', 'rejected'].includes(payload.status)) return json(response, 400, { error: 'Invalid join request.' });
      const updates = payload.status === 'accepted' ? { $pull: { joinRequests: { userId: payload.requestUserId } }, $push: { members: { userId: payload.requestUserId, email: joinRequest.email, name: joinRequest.name, status: 'accepted' } } } : { $pull: { joinRequests: { userId: payload.requestUserId } } };
      await rooms.updateOne({ id: roomId }, updates as any);
      return json(response, 200, { updated: true });
    }
    return json(response, 400, { error: 'Unsupported study room action.' });
  } catch (error) {
    console.error('Study room function failed:', error);
    return json(response, 503, { error: 'Study room service is unavailable.' });
  }
}
