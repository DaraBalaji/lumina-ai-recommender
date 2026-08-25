export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  description: string;
  url: string;
  tags: string[];
  postedAt?: string;
}

interface ArbeitnowJob {
  slug?: string;
  title?: string;
  company_name?: string;
  location?: string;
  remote?: boolean;
  description?: string;
  url?: string;
  tags?: string[];
  created_at?: number;
}

interface ArbeitnowResponse {
  data?: ArbeitnowJob[];
}

export const fetchLiveJobs = async (query = ''): Promise<JobListing[]> => {
  const response = await fetch('https://www.arbeitnow.com/api/job-board-api', {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Job feed returned ${response.status}`);
  const result = await response.json() as ArbeitnowResponse;
  const normalizedQuery = query.trim().toLowerCase();
  return (result.data || [])
    .map((job, index) => ({
      id: job.slug || `live-job-${index}`,
      title: job.title || 'Untitled role',
      company: job.company_name || 'Unknown company',
      location: job.location || 'Location not listed',
      remote: Boolean(job.remote),
      description: (job.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      url: job.url || '#',
      tags: job.tags || [],
      postedAt: job.created_at ? new Date(job.created_at * 1000).toISOString() : undefined,
    }))
    .filter((job) => {
      if (!normalizedQuery) return true;
      const searchable = `${job.title} ${job.company} ${job.location} ${job.description} ${job.tags.join(' ')}`.toLowerCase();
      return searchable.includes(normalizedQuery);
    })
    .slice(0, 24);
};
