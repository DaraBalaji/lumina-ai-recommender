export interface StudyRoomMember {
  userId: string;
  email: string;
  name: string;
  status: 'accepted';
}

export interface StudyRoomRequest {
  userId: string;
  email: string;
  name: string;
  invitedBy: string;
  createdAt: string;
}

export interface StudyRoomMessage {
  id: string;
  userId: string;
  name: string;
  text: string;
  createdAt: string;
}

export interface StudyRoom {
  id: string;
  name: string;
  ownerId: string;
  public: boolean;
  members: StudyRoomMember[];
  requests: StudyRoomRequest[];
  joinRequests: StudyRoomRequest[];
  messages: StudyRoomMessage[];
  createdAt: string;
}

const request = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, options);
  const result = await response.json() as { error?: string; rooms?: StudyRoom[]; room?: StudyRoom; sent?: boolean; updated?: boolean; };
  if (!response.ok) throw new Error(result.error || 'Study room request failed.');
  return result;
};

export const getStudyRooms = async (userId: string) => {
  const result = await request(`/api/study-rooms?userId=${encodeURIComponent(userId)}`);
  return result.rooms || [];
};

export const getPublicRooms = async () => {
  const result = await request('/api/study-rooms?public=true');
  return result.rooms || [];
};

export const createStudyRoom = async (userId: string, name: string) => {
  const result = await request('/api/study-rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', userId, name }) });
  return result.room as StudyRoom;
};

export const inviteToStudyRoom = async (userId: string, roomId: string, email: string) => {
  await request('/api/study-rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'invite', userId, roomId, email }) });
};

export const respondToStudyRoom = async (userId: string, roomId: string, status: 'accepted' | 'rejected') => {
  await request('/api/study-rooms', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'respond', userId, roomId, status }) });
};

export const postStudyRoomMessage = async (userId: string, roomId: string, text: string) => {
  await request('/api/study-rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'message', userId, roomId, text }) });
};

export const toggleRoomVisibility = async (userId: string, roomId: string, isPublic: boolean) => {
  await request('/api/study-rooms', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggleVisibility', userId, roomId, public: isPublic }) });
};

export const requestJoinRoom = async (userId: string, roomId: string) => {
  await request('/api/study-rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'requestJoin', userId, roomId }) });
};

export const respondToJoinRequest = async (userId: string, roomId: string, requestUserId: string, status: 'accepted' | 'rejected') => {
  await request('/api/study-rooms', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'respondJoinRequest', userId, roomId, requestUserId, status }) });
};
