import React, { useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { X, FileText, Calendar, Code, Download } from 'lucide-react';
import { Roadmap, LearnerProfile } from '../types';
import {
  exportRoadmapToMarkdown,
  exportRoadmapToJSON,
  exportRoadmapToICalendar,
  downloadFile,
} from '../services/exportService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  roadmap: Roadmap | null;
  profile: LearnerProfile;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  roadmap,
  profile,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(containerRef, !!isOpen && !!roadmap);
  if (!isOpen || !roadmap) return null;

  const handleDownloadMarkdown = () => {
    const md = exportRoadmapToMarkdown(roadmap, profile);
    downloadFile(md, `RouteMind-Roadmap-${roadmap.targetRoleId}.md`, 'text/markdown');
  };

  const handleDownloadJSON = () => {
    const json = exportRoadmapToJSON(roadmap, profile);
    downloadFile(json, `RouteMind-Roadmap-${roadmap.targetRoleId}.json`, 'application/json');
  };

  const handleDownloadICalendar = () => {
    const ics = exportRoadmapToICalendar(roadmap, profile);
    downloadFile(ics, `RouteMind-Schedule-${roadmap.targetRoleId}.ics`, 'text/calendar');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-md animate-in fade-in">
      <div ref={containerRef} className="glass-panel w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl border border-white/80 dark:border-white/20 relative overflow-hidden flex flex-col gap-6">
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary-container text-secondary flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md font-bold text-primary dark:text-on-primary-fixed">
                Export & Calendar Sync
              </h2>
              <p className="text-xs text-on-surface-variant">
                Export your personalized roadmap for offline study or calendar syncing
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

        <div className="flex flex-col gap-4">
          {/* Option 1: Markdown */}
          <div
            onClick={handleDownloadMarkdown}
            className="glass-card p-4 rounded-2xl border border-outline-variant/40 hover:border-secondary cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-variant text-primary flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-headline-md text-xs font-bold text-primary dark:text-on-primary-fixed">
                  Markdown Study Plan (.md)
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  Formatted Markdown with milestone phase checklists & XAI rationales
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-secondary group-hover:translate-y-0.5 transition-transform" />
          </div>

          {/* Option 2: iCalendar */}
          <div
            onClick={handleDownloadICalendar}
            className="glass-card p-4 rounded-2xl border border-outline-variant/40 hover:border-secondary cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container/40 text-secondary flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-headline-md text-xs font-bold text-primary dark:text-on-primary-fixed">
                  Google / Apple Calendar (.ics)
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  Sync milestone study slots directly into Google Calendar, Apple iCal, or Outlook
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-secondary group-hover:translate-y-0.5 transition-transform" />
          </div>

          {/* Option 3: JSON */}
          <div
            onClick={handleDownloadJSON}
            className="glass-card p-4 rounded-2xl border border-outline-variant/40 hover:border-secondary cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-headline-md text-xs font-bold text-primary dark:text-on-primary-fixed">
                  Full Roadmap Backup (.json)
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  Export complete data structure including learner profile & DAG milestones
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-secondary group-hover:translate-y-0.5 transition-transform" />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
