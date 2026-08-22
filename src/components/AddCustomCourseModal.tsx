import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Course, SkillLevel, ResourceCost, ResourceType } from '../types';

interface AddCustomCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCourse: (course: Course) => void;
}

export const AddCustomCourseModal: React.FC<AddCustomCourseModalProps> = ({
  isOpen,
  onClose,
  onAddCourse,
}) => {
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('Custom Resource');
  const [description, setDescription] = useState('');
  const [durationHours, setDurationHours] = useState(15);
  const [difficulty, setDifficulty] = useState<SkillLevel>('Intermediate');
  const [cost, setCost] = useState<ResourceCost>('Free');
  const [type, setType] = useState<ResourceType>('Course');
  const [url, setUrl] = useState('https://github.com');
  const [skillsInput, setSkillsInput] = useState('Python, Deep Learning');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newCourse: Course = {
      id: `custom-course-${Date.now()}`,
      title: title.trim(),
      provider: provider.trim() || 'Custom',
      description: description.trim() || 'Custom user-added learning resource.',
      durationHours: Number(durationHours) || 10,
      difficulty,
      rating: 5.0,
      cost,
      type,
      url: url.trim() || 'https://google.com',
      skillsCovered: skillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      prerequisites: [],
    };

    onAddCourse(newCourse);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-md animate-in fade-in">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl border border-white/80 dark:border-white/20 relative overflow-hidden flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-container text-secondary flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md font-bold text-primary dark:text-on-primary-fixed">
                Add Custom Learning Module
              </h2>
              <p className="text-xs text-on-surface-variant">
                Inject custom courses, books, repositories, or projects into your roadmap
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="font-label-sm text-xs font-bold text-primary dark:text-on-primary-fixed block mb-1">
              Module Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Deep Learning with PyTorch Lightning"
              className="w-full rounded-xl border border-outline-variant/40 p-2.5 text-xs bg-surface-container-lowest dark:bg-inverse-surface"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-label-sm text-xs font-bold text-primary dark:text-on-primary-fixed block mb-1">
                Provider / Source
              </label>
              <input
                type="text"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g., Stanford / Coursera / GitHub"
                className="w-full rounded-xl border border-outline-variant/40 p-2.5 text-xs bg-surface-container-lowest dark:bg-inverse-surface"
              />
            </div>
            <div>
              <label className="font-label-sm text-xs font-bold text-primary dark:text-on-primary-fixed block mb-1">
                Resource Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ResourceType)}
                className="w-full rounded-xl border border-outline-variant/40 p-2.5 text-xs bg-surface-container-lowest dark:bg-inverse-surface"
              >
                <option value="Course">Online Course</option>
                <option value="Project">Hands-on Project</option>
                <option value="Certification">Certification</option>
                <option value="Book">Reference Book</option>
                <option value="Repository">GitHub Repository</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-label-sm text-xs font-bold text-primary dark:text-on-primary-fixed block mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief summary of topics and key learning takeaways..."
              className="w-full rounded-xl border border-outline-variant/40 p-2.5 text-xs bg-surface-container-lowest dark:bg-inverse-surface"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-label-sm text-xs font-bold text-primary dark:text-on-primary-fixed block mb-1">
                Duration (Hours)
              </label>
              <input
                type="number"
                min={1}
                max={150}
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full rounded-xl border border-outline-variant/40 p-2.5 text-xs bg-surface-container-lowest dark:bg-inverse-surface"
              />
            </div>

            <div>
              <label className="font-label-sm text-xs font-bold text-primary dark:text-on-primary-fixed block mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as SkillLevel)}
                className="w-full rounded-xl border border-outline-variant/40 p-2.5 text-xs bg-surface-container-lowest dark:bg-inverse-surface"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="font-label-sm text-xs font-bold text-primary dark:text-on-primary-fixed block mb-1">
                Cost
              </label>
              <select
                value={cost}
                onChange={(e) => setCost(e.target.value as ResourceCost)}
                className="w-full rounded-xl border border-outline-variant/40 p-2.5 text-xs bg-surface-container-lowest dark:bg-inverse-surface"
              >
                <option value="Free">Free</option>
                <option value="Paid">Paid</option>
                <option value="Freemium">Freemium</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-label-sm text-xs font-bold text-primary dark:text-on-primary-fixed block mb-1">
              Skills Covered (Comma-separated)
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g., Python Programming, Vector Databases & RAG"
              className="w-full rounded-xl border border-outline-variant/40 p-2.5 text-xs bg-surface-container-lowest dark:bg-inverse-surface"
            />
          </div>

          <div>
            <label className="font-label-sm text-xs font-bold text-primary dark:text-on-primary-fixed block mb-1">
              URL Link
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-outline-variant/40 p-2.5 text-xs bg-surface-container-lowest dark:bg-inverse-surface"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full border border-outline-variant text-on-surface-variant text-xs font-semibold hover:bg-surface-variant/40"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Path</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
