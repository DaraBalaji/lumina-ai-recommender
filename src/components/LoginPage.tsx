import React, { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onLogin: (name: string, email: string, password: string, mode: 'signin' | 'signup') => Promise<void>;
  onBackToHome?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBackToHome }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'signup' && !name.trim()) return;
    setError('');
    setIsSubmitting(true);
    try {
      await onLogin(name.trim(), email.trim(), password, mode);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not connect to the local database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-on-background flex items-center justify-center p-6">
      <section className="w-full max-w-md glass-panel rounded-3xl border border-outline-variant/40 p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-full bg-primary-container text-secondary-container flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-headline-lg text-2xl font-bold text-primary dark:text-on-primary-fixed">Welcome to Lumina</h1>
            <p className="text-xs text-on-surface-variant">{mode === 'signin' ? 'Sign in to your learning workspace' : 'Create your private learning workspace'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 mb-6 rounded-xl bg-surface-container-low border border-outline-variant/30">
          {(['signin', 'signup'] as const).map((nextMode) => (
            <button
              key={nextMode}
              type="button"
              onClick={() => { setMode(nextMode); setError(''); }}
              className={`rounded-lg py-2 text-xs font-semibold transition-colors ${mode === nextMode ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-primary'}`}
            >
              {nextMode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && <label className="text-xs font-semibold text-on-surface-variant">
            Name
            <input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-outline-variant/40 p-3 text-sm bg-surface-container-lowest dark:bg-inverse-surface text-on-surface" placeholder="Your name" />
          </label>}
          <label className="text-xs font-semibold text-on-surface-variant">
            Email
            <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-outline-variant/40 p-3 text-sm bg-surface-container-lowest dark:bg-inverse-surface text-on-surface" placeholder="you@example.com" />
          </label>
          <label className="text-xs font-semibold text-on-surface-variant">
            Password
            <input required type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-outline-variant/40 p-3 text-sm bg-surface-container-lowest dark:bg-inverse-surface text-on-surface" placeholder="At least 6 characters" />
          </label>
          {error && <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="mt-3 flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary hover:bg-primary-container disabled:opacity-60">
            {isSubmitting ? 'Connecting...' : mode === 'signin' ? 'Sign in' : 'Create workspace'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>
        <p className="mt-5 text-center text-[11px] text-on-surface-variant">Accounts are stored in your local MongoDB database.</p>
        {onBackToHome && <button type="button" onClick={onBackToHome} className="mt-3 w-full text-xs font-semibold text-secondary hover:underline">Back to home</button>}
      </section>
    </main>
  );
};
