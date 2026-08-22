import { Course } from '../types';
import { COURSE_CATALOG } from '../data/courseCatalog';

export interface FetchCoursesParams {
  query?: string;
  skills?: string[];
  difficulty?: string;
  cost?: string;
  sort?: 'relevance' | 'rating_desc' | 'duration_asc' | 'newest';
  page?: number;
  pageSize?: number;
}

export const fetchCourses = async (params: FetchCoursesParams) => {
  // Simulate server-side processing & latency
  await new Promise((r) => setTimeout(r, 120));

  const {
    query = '',
    skills = [],
    difficulty = 'All',
    cost = 'All',
    sort = 'relevance',
    page = 1,
    pageSize = 12,
  } = params;

  let results: Course[] = COURSE_CATALOG.slice();

  // Full-text-ish filter
  if (query.trim()) {
    const q = query.toLowerCase();
    results = results.filter((c) =>
      c.title.toLowerCase().includes(q) ||
      c.provider.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.skillsCovered.some((s) => s.toLowerCase().includes(q))
    );
  }

  if (skills && skills.length > 0) {
    // require course to include ALL selected skills (AND semantics)
    results = results.filter((c) => skills.every((sk) => c.skillsCovered.includes(sk)));
  }

  if (difficulty && difficulty !== 'All') {
    results = results.filter((c) => c.difficulty === difficulty);
  }

  if (cost && cost !== 'All') {
    results = results.filter((c) => c.cost === cost);
  }

  // Sorting
  if (sort === 'rating_desc') {
    results = results.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'duration_asc') {
    results = results.sort((a, b) => a.durationHours - b.durationHours);
  } else if (sort === 'newest') {
    results = results; // our static catalog has no createdAt; keep order
  } else {
    // relevance: leave as-is (or simple heuristic by rating + matching skills)
    results = results.sort((a, b) => b.rating - a.rating);
  }

  const total = results.length;
  const start = (page - 1) * pageSize;
  const paged = results.slice(start, start + pageSize);

  return {
    total,
    page,
    pageSize,
    results: paged,
  };
};

export const getAllSkills = (): string[] => {
  return Array.from(new Set(COURSE_CATALOG.flatMap((c) => c.skillsCovered))).sort();
};
