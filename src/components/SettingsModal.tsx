import React, { useState } from 'react';
import { X, Key, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { getApiKey, saveApiKey } from '../services/dbService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState(getApiKey());
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveApiKey(apiKey.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-md animate-in fade-in">
      <div className="glass-panel w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl border border-white/80 dark:border-white/20 relative overflow-hidden flex flex-col gap-6">
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container text-secondary-container flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-headline-md text-headline-md font-bold text-primary dark:text-on-primary-fixed">
                AI Engine & API Settings
              </h2>
              <p className="text-xs text-on-surface-variant">
                Configure live Gemini API key or use instant local AI fallback
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

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-xs font-bold text-primary dark:text-on-primary-fixed flex items-center justify-between">
              <span>Google Gemini API Key</span>
              <span className="text-[10px] text-secondary font-semibold">Fixed</span>
            </label>
            <input
              type="password"
              value={apiKey}
              readOnly
              className="w-full rounded-2xl border border-outline-variant/40 p-3 text-xs bg-surface-container-lowest dark:bg-inverse-surface text-on-surface cursor-not-allowed"
            />
            <p className="text-[11px] text-on-surface-variant mt-1">
              This application uses the built-in Gemini key automatically, so the user does not need to provide one manually.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary-container/30 border border-secondary-container text-xs text-on-secondary-container flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-secondary shrink-0" />
            <div>
              <span className="font-bold block">100% Secure & Local</span>
              <span className="text-[11px]">
                Your API key is stored securely in your browser's client-side storage and is only used for direct AI inference.
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-outline-variant text-on-surface-variant text-xs font-semibold hover:bg-surface-variant/40"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container flex items-center gap-2"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-secondary-container" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
