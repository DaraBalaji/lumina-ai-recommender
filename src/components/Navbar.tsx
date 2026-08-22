import React from 'react';
import {
  Sparkles,
  BookOpen,
  Compass,
  BarChart3,
  Sun,
  Moon,
  Plus,
  LogOut,
} from 'lucide-react';
import { LearnerProfile } from '../types';

interface NavbarProps {
  activeTab: 'landing' | 'roadmap' | 'dashboard' | 'catalog';
  setActiveTab: (tab: 'landing' | 'roadmap' | 'dashboard' | 'catalog') => void;
  activeProfile: LearnerProfile;
  onOpenOnboarding: () => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeProfile,
  onOpenOnboarding,
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
          onClick={() => setActiveTab('landing')}
        >
          <div className="w-10 h-10 rounded-full bg-primary-container text-secondary-container flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5 text-secondary-container" />
          </div>
          <div>
            <span className="font-headline-md text-headline-md font-bold text-primary dark:text-on-primary-fixed tracking-tight">
              Lumina
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-secondary-container/40 text-secondary font-medium">
              AI Pathing
            </span>
          </div>
        </div>

        {/* Desktop Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-container-low/60 dark:bg-surface-container/20 p-1.5 rounded-full border border-outline-variant/30">
          <button
            onClick={() => setActiveTab('landing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-md text-label-md transition-all ${
              activeTab === 'landing'
                ? 'bg-primary text-on-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant/40'
            }`}
          >
            <Compass className="w-4 h-4" />
            Home
          </button>
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
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-md text-label-md transition-all ${
              activeTab === 'dashboard'
                ? 'bg-primary text-on-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant/40'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Mastery & Skills
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
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* New Diagnostic Path Button */}
          <button
            onClick={onOpenOnboarding}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-full font-label-md text-label-md hover:bg-secondary/90 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Path
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
