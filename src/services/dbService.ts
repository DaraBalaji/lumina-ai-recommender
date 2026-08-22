import { LocalDBSchema, LearnerProfile, Roadmap, Course, ChatMessage, StudyRecord } from '../types';
import { INITIAL_DEFAULT_PROFILE } from '../data/sampleProfiles';

const DB_KEY = 'lumina_platform_db_v1';

type DBListener = (db: LocalDBSchema) => void;
const listeners: Set<DBListener> = new Set();

const getInitialDB = (): LocalDBSchema => {
  return {
    profiles: [INITIAL_DEFAULT_PROFILE],
    activeProfileId: INITIAL_DEFAULT_PROFILE.id,
    roadmaps: {},
    customCourses: [],
    chatHistory: {},
    notes: {},
    studyRecords: {},
    theme: 'light',
  };
};

export const loadDB = (): LocalDBSchema => {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      const initial = getInitialDB();
      saveDB(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as LocalDBSchema;
    parsed.studyRecords = parsed.studyRecords || {};
    if (!parsed.profiles || parsed.profiles.length === 0) {
      parsed.profiles = [INITIAL_DEFAULT_PROFILE];
      parsed.activeProfileId = INITIAL_DEFAULT_PROFILE.id;
    }
    parsed.profiles = parsed.profiles.map((profile) => {
      const records = parsed.studyRecords[profile.id] || [];
      if (records.length > 0) return profile;
      return {
        ...profile,
        baselineScores: Object.fromEntries(Object.keys(profile.baselineScores || {}).map((skill) => [skill, 0])),
        completedCourseIds: [],
        inProgressMilestoneIds: [],
        studyStreakDays: 0,
        weeklyVelocityHours: 0,
        totalHoursLearned: 0,
      };
    });
    return parsed;
  } catch (e) {
    console.error('Failed to load Lumina database from localStorage, initializing fresh:', e);
    const initial = getInitialDB();
    saveDB(initial);
    return initial;
  }
};

export const saveDB = (db: LocalDBSchema): void => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    notifyListeners(db);
    const userId = localStorage.getItem('lumina_account_id');
    if (userId) {
      void fetch('/api/workspace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, data: db }),
      }).catch((error) => console.warn('Workspace sync unavailable:', error));
    }
  } catch (e) {
    console.error('Failed to save Lumina database:', e);
  }
};

export const loadRemoteWorkspace = async (userId: string): Promise<LocalDBSchema | null> => {
  try {
    const response = await fetch(`/api/workspace?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) return null;
    const result = await response.json() as { data?: LocalDBSchema | null };
    if (!result.data) return null;
    localStorage.setItem(DB_KEY, JSON.stringify(result.data));
    notifyListeners(result.data);
    return result.data;
  } catch (error) {
    console.warn('Remote workspace load unavailable:', error);
    return null;
  }
};

export const subscribeDB = (listener: DBListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = (db: LocalDBSchema) => {
  listeners.forEach((listener) => {
    try {
      listener(db);
    } catch (e) {
      console.error('Error notifying DB listener:', e);
    }
  });
};

// Profile CRUD
export const getActiveProfile = (): LearnerProfile => {
  const db = loadDB();
  return db.profiles.find((p) => p.id === db.activeProfileId) || db.profiles[0] || INITIAL_DEFAULT_PROFILE;
};

export const updateActiveProfile = (updates: Partial<LearnerProfile>): LearnerProfile => {
  const db = loadDB();
  const index = db.profiles.findIndex((p) => p.id === db.activeProfileId);
  if (index >= 0) {
    db.profiles[index] = { ...db.profiles[index], ...updates, lastActiveDate: new Date().toISOString() };
  } else {
    const updated = { ...INITIAL_DEFAULT_PROFILE, ...updates, id: db.activeProfileId };
    db.profiles.push(updated);
  }
  saveDB(db);
  return getActiveProfile();
};

export const setActiveProfileId = (profileId: string): void => {
  const db = loadDB();
  if (db.profiles.some((p) => p.id === profileId)) {
    db.activeProfileId = profileId;
    saveDB(db);
  }
};

export const createNewProfile = (profile: LearnerProfile): LearnerProfile => {
  const db = loadDB();
  db.profiles.push(profile);
  db.activeProfileId = profile.id;
  saveDB(db);
  return profile;
};

// Roadmap CRUD
export const getActiveRoadmap = (): Roadmap | null => {
  const db = loadDB();
  const activeProfileId = db.activeProfileId || db.profiles[0]?.id;
  return (activeProfileId && db.roadmaps[activeProfileId]) || null;
};

export const saveActiveRoadmap = (roadmap: Roadmap): void => {
  const db = loadDB();
  const activeProfile = getActiveProfile();
  db.roadmaps[activeProfile.id] = roadmap;
  saveDB(db);
};

// Chat History CRUD
export const getChatHistory = (): ChatMessage[] => {
  const db = loadDB();
  const activeProfile = getActiveProfile();
  return db.chatHistory[activeProfile.id] || [];
};

export const saveChatHistory = (messages: ChatMessage[]): void => {
  const db = loadDB();
  const activeProfile = getActiveProfile();
  db.chatHistory[activeProfile.id] = messages;
  saveDB(db);
};

// Settings (API Key & Theme)
export const getTheme = (): 'light' | 'dark' => {
  const db = loadDB();
  return db.theme || 'light';
};

export const saveTheme = (theme: 'light' | 'dark'): void => {
  const db = loadDB();
  db.theme = theme;
  saveDB(db);
};

// Milestone Notes
export const getMilestoneNote = (milestoneId: string): string => {
  const db = loadDB();
  return db.notes[milestoneId] || '';
};

export const saveMilestoneNote = (milestoneId: string, note: string): void => {
  const db = loadDB();
  db.notes[milestoneId] = note;
  saveDB(db);
};

export const getStudyRecords = (): StudyRecord[] => {
  const db = loadDB();
  return db.studyRecords[db.activeProfileId] || [];
};

export const saveStudyRecords = (records: StudyRecord[]): void => {
  const db = loadDB();
  db.studyRecords[db.activeProfileId] = records;
  saveDB(db);
};

// Custom Added Courses
export const addCustomCourseToCatalog = (course: Course): Course[] => {
  const db = loadDB();
  db.customCourses.push(course);
  saveDB(db);
  return db.customCourses;
};

export const getCustomCourses = (): Course[] => {
  const db = loadDB();
  return db.customCourses || [];
};
