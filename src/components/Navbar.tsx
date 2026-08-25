import React from 'react';
import {
  Sparkles,
  BookOpen,
  Compass,
  Sun,
  Moon,
  LogOut,
  BriefcaseBusiness,
  User,
} from 'lucide-react';
import { LearnerProfile } from '../types';

export type AppTab = 'roadmap' | 'catalog' | 'career' | 'profile';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  activeProfile: LearnerProfile;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeProfile,
  onLogout,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/85 dark:bg-inverse-surface/85 backdrop-blur-xl border-b border-outline-variant/30 transition-colors duration-300">
      <div className="flex items-center justify-between px-margin-mobile md:px-margin-desktop h-16 max-w-container-max mx-auto">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setActiveTab('roadmap')}
        >
          <div className="w-10 h-10 rounded-full bg-primary-container text-secondary-container flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5 text-secondary-container" />
          </div>
          <div>
            <span className="font-headline-md text-headline-md font-bold text-primary dark:text-on-primary-fixed tracking-tight">
              RouteMind
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-secondary-container/40 text-secondary font-medium">
              Adaptive Paths
            </span>
          </div>
        </div>

        {/* Desktop Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-container-low/60 dark:bg-surface-container/20 p-1.5 rounded-full border border-outline-variant/30">
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-md text-label-md transition-all ${
              activeTab === 'roadmap'
                ? 'bg-primary text-on-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant/40'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Learning Path
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-md text-label-md transition-all ${
              activeTab === 'catalog'
                ? 'bg-primary text-on-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant/40'
            }`}
          >
            <Compass className="w-4 h-4" />
            150+ Catalog
          </button>
          <button
            onClick={() => setActiveTab('career')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-md text-label-md transition-all ${
              activeTab === 'career'
                ? 'bg-primary text-on-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant/40'
            }`}
          >
            <BriefcaseBusiness className="w-4 h-4" />
            Career Hub
          </button>
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('profile')}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-full font-label-md text-label-md hover:bg-secondary/90 transition-all shadow-sm"
          >
            <User className="w-4 h-4" />
            Profile
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
            title="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5 text-secondary-container" />
            )}
          </button>

          <button
            onClick={onLogout}
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-variant/50 transition-colors"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
