import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, ExternalLink, Star, Clock } from 'lucide-react';
import { Course } from '../types';
import { COURSE_CATALOG } from '../data/courseCatalog';
import { explainCourseScore, calculateSkillGaps } from '../services/recommendationEngine';
import { TARGET_ROLES } from '../data/skillTaxonomy';
import { getActiveProfile, subscribeDB } from '../services/dbService';

import { fetchCourses, getAllSkills } from '../services/catalogService';
import { useFocusTrap } from '../hooks/useFocusTrap';
interface CourseCatalogViewProps {
  onAddCourseToRoadmap: (course: Course) => void;
}

export const CourseCatalogView: React.FC<CourseCatalogViewProps> = ({ onAddCourseToRoadmap }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [selectedCost, setSelectedCost] = useState<string>('All');
  const [selectedSkill, setSelectedSkill] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(12);

  const [sortBy, setSortBy] = useState<'relevance' | 'rating_desc' | 'duration_asc' | 'newest'>('relevance');
  const [serverResults, setServerResults] = useState<{ total: number; page: number; pageSize: number; results: Course[] }>({ total: 0, page: 1, pageSize, results: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const skillOptions = getAllSkills();
  const [explainForCourse, setExplainForCourse] = useState<null | { course: Course; breakdownHtml?: string; breakdown?: any }>(null);
  const [activeProfile, setActiveProfile] = useState(() => getActiveProfile());

  const totalPages = Math.max(1, Math.ceil(serverResults.total / pageSize));
  const pagedCatalog = serverResults.results;

  useEffect(() => {
    const unsub = subscribeDB(() => setActiveProfile(getActiveProfile()));
    return unsub;
  }, []);

  const openExplanation = (course: Course) => {
    try {
      const profile = activeProfile;
      const targetRole = TARGET_ROLES.find((r) => r.id === profile.targetRoleId) || TARGET_ROLES[0];
      const gaps = calculateSkillGaps(profile, targetRole);
      const breakdown = explainCourseScore(course, profile, gaps, targetRole);
      setExplainForCourse({ course, breakdown, breakdownHtml: breakdown.explanation });
    } catch (e) {
      setExplainForCourse({ course, breakdownHtml: 'Could not compute explanation.' });
    }
  };

  const closeExplanation = () => setExplainForCourse(null);

  // apply focus trap to explanation modal
  const explainRef = React.useRef<HTMLDivElement | null>(null);
  useFocusTrap(explainRef, !!explainForCourse);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDifficulty, selectedCost, selectedSkill, sortBy]);

  // Fetch from "server" whenever filters or page change
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      setCatalogError(null);
      const skills = selectedSkill === 'All' ? [] : [selectedSkill];
      try {
        const res = await fetchCourses({
          query: searchTerm,
          skills,
          difficulty: selectedDifficulty,
          cost: selectedCost,
          sort: sortBy,
          page: currentPage,
          pageSize,
        });
        if (!cancelled) setServerResults(res);
      } catch (e) {
        console.error('Catalog fetch error', e);
        if (!cancelled) setCatalogError('Catalog could not be loaded. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [searchTerm, selectedSkill, selectedDifficulty, selectedCost, sortBy, currentPage, pageSize]);

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-outline-variant/40 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="inline-flex px-3 py-1 bg-secondary-container/40 text-secondary rounded-full text-xs font-semibold mb-3">
            Explore Curated Catalog
          </span>
          <h1 className="font-headline-lg text-headline-lg text-primary dark:text-on-primary-fixed mb-2">
            150+ High-Quality Resources & Projects
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant dark:text-outline-variant max-w-xl">
            Stanford Online, MIT OCW, deeplearning.ai, Coursera, freeCodeCamp, Kaggle datasets, and official GitHub reference implementations.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-2xl border border-outline-variant/30 flex flex-col md:flex-row items-center gap-4 justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search courses, skills, or providers..."
            className="w-full pl-10 pr-4 py-2 rounded-full border border-outline-variant/40 text-xs bg-surface-container-lowest dark:bg-inverse-surface"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <Filter className="w-3.5 h-3.5 text-secondary" />
            <span>Difficulty:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="rounded-xl border border-outline-variant/40 p-1.5 text-xs bg-surface-container-lowest dark:bg-inverse-surface"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <span>Cost:</span>
            <select
              value={selectedCost}
              onChange={(e) => setSelectedCost(e.target.value)}
              className="rounded-xl border border-outline-variant/40 p-1.5 text-xs bg-surface-container-lowest dark:bg-inverse-surface"
            >
              <option value="All">All Costs</option>
              <option value="Free">Free / Open Access</option>
              <option value="Paid">Paid</option>
              <option value="Freemium">Freemium</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            <span>Skill:</span>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="rounded-xl border border-outline-variant/40 p-1.5 text-xs bg-surface-container-lowest dark:bg-inverse-surface"
            >
              <option value="All">All Skills</option>
              {skillOptions.map((sk) => (
                <option key={sk} value={sk}>
                  {sk}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Catalog Items Grid */}
      {isLoading && <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-8 text-center text-sm text-on-surface-variant">Loading courses...</div>}
      {catalogError && !isLoading && <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center text-sm text-rose-700">{catalogError}</div>}
      {!isLoading && !catalogError && pagedCatalog.length === 0 && <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-8 text-center text-sm text-on-surface-variant">No courses match these filters.</div>}
      {!isLoading && !catalogError && pagedCatalog.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pagedCatalog.map((course) => (
          <div
            key={course.id}
            className="glass-card p-6 rounded-2xl border border-outline-variant/30 hover:border-secondary transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-secondary">{course.provider}</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-variant/40 text-[10px] font-semibold">
                  {course.cost}
                </span>
              </div>

              <h3 className="font-headline-md text-sm font-bold text-primary dark:text-on-primary-fixed mb-2">
                {course.title}
              </h3>

              <p className="text-xs text-on-surface-variant dark:text-outline-variant line-clamp-2 mb-4">
                {course.description}
              </p>

              <div className="flex flex-wrap gap-1 mb-4">
                {course.skillsCovered.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-full bg-surface-container/50 text-on-surface text-[10px]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1 font-bold text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-current" /> {course.rating}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {course.durationHours}h
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={course.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-outline-variant/30 px-2 py-1.5 text-[11px] font-semibold text-on-surface-variant hover:border-secondary hover:text-secondary"
                  title="Open Link"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open course</span>
                </a>
                <button
                  onClick={() => openExplanation(course)}
                  className="px-2 py-1 rounded-full border border-outline-variant/30 bg-surface text-xs font-medium hover:bg-surface/90 mr-2"
                  title="Why recommended?"
                >
                  Explain
                </button>

                <button
                  onClick={() => onAddCourseToRoadmap(course)}
                  className="px-3 py-1.5 rounded-full bg-secondary text-on-secondary text-xs font-semibold hover:bg-secondary/90 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Path</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-xs text-on-surface-variant">Showing {serverResults.total === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, serverResults.total)} of {serverResults.total} results</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-xl border border-outline-variant/30 text-xs"
          >
            Prev
          </button>
          <span className="text-xs">{currentPage} / {totalPages}</span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-xl border border-outline-variant/30 text-xs"
          >
            Next
          </button>
        </div>
      </div>

      {explainForCourse && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40" onClick={closeExplanation} />
          <div ref={explainRef} className="relative w-full md:w-2/3 lg:w-1/2 bg-surface rounded-2xl p-6 glass-card border border-outline-variant/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-headline-md text-lg font-bold">{explainForCourse.course.title}</h3>
                <p className="text-xs text-on-surface-variant">Provider: {explainForCourse.course.provider} • {explainForCourse.course.cost}</p>
              </div>
              <button onClick={closeExplanation} className="text-xs text-on-surface-variant">Close</button>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-semibold">XAI Breakdown</h4>
              <p className="text-xs text-on-surface-variant mt-2 whitespace-pre-wrap">{explainForCourse.breakdownHtml}</p>

              {explainForCourse.breakdown && (
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-surface-container/40">
                    <strong>Skill Gap Score</strong>
                    <div>{explainForCourse.breakdown.skillGapScore}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container/40">
                    <strong>Prereq Fit</strong>
                    <div>{explainForCourse.breakdown.prereqScore}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container/40">
                    <strong>Format Match</strong>
                    <div>{explainForCourse.breakdown.formatScore}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container/40">
                    <strong>Quality</strong>
                    <div>{explainForCourse.breakdown.qualityScore}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
