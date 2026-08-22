import React from 'react';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Brain,
  CheckCircle2,
  Zap,
  Target,
  Award,
  Layers,
} from 'lucide-react';

interface HeroLandingProps {
  onStartOnboarding: () => void;
  onExploreCurriculum: () => void;
  onOpenAuth?: () => void;
}

export const HeroLanding: React.FC<HeroLandingProps> = ({
  onStartOnboarding,
  onExploreCurriculum,
  onOpenAuth,
}) => {
  return (
    <div className="flex flex-col gap-24 py-8">
      {/* Hero Banner */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-margin-mobile md:px-margin-desktop py-12 rounded-3xl">
        {/* Background Glowing Ambient Orbs */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 -right-1/4 w-[700px] h-[700px] bg-secondary-container/30 dark:bg-secondary/15 rounded-full blur-[120px]"></div>
          <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-primary-container/20 dark:bg-primary/30 rounded-full blur-[100px]"></div>
        </div>

        <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-12 gap-gutter relative z-10 items-center">
          {/* Left Content */}
          <div className="md:col-span-7 flex flex-col gap-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-surface-variant/60 dark:bg-surface-container/40 text-primary dark:text-primary-fixed rounded-full w-fit mx-auto md:mx-0 border border-outline-variant/30 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                AI-Powered Personalized Learning Path Recommender
              </span>
            </div>

            <h1 className="font-display-lg text-display-lg text-primary dark:text-on-primary-fixed leading-tight tracking-tight">
              Master Your Path to Intellectual Enlightenment
            </h1>

            <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-outline-variant max-w-2xl mx-auto md:mx-0">
              Lumina is your dedicated AI mentor, crafting highly personalized learning roadmaps, tracking skill mastery in real-time, and accelerating your professional growth with explainable recommendations.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 justify-center md:justify-start">
              <button
                onClick={onOpenAuth || onStartOnboarding}
                className="w-full sm:w-auto px-8 py-4 bg-primary text-on-primary rounded-full font-label-md text-label-md hover:scale-105 transition-all duration-200 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <span>{onOpenAuth ? 'Sign in to get started' : 'Get Started Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenAuth || onExploreCurriculum}
                className="w-full sm:w-auto px-8 py-4 bg-surface-container-lowest dark:bg-inverse-surface border-2 border-secondary text-secondary dark:text-secondary-fixed rounded-full font-label-md text-label-md hover:bg-secondary/5 transition-colors"
              >
                {onOpenAuth ? 'Create your learning account' : 'Explore 150+ Catalog'}
              </button>
            </div>
          </div>

          {/* Right Visual Bento Abstract */}
          <div className="md:col-span-5 mt-12 md:mt-0 relative">
            <div className="relative w-full aspect-square max-w-md mx-auto">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBxD_5n0JBS-N-BNScPPQNL6MSd3qAPTpnT3uO5XksFPd-undVVpsoa_hFm13VVf17D8Po-yWYgArmhKKwc6ZuQQtzbAZHX1hETpGOBWFUQBDxoPNm0rjx9fw5rJoOxHMYQOpVod7ewvgT9OjFeye0oZdEjbYMzNFIGL6jDZvHIJtUXm3IJN0PcisKTNoc12GwvNrAJwP9WEIn5CP5k82kXOhHLT7CNG4XO6V8ILbjGsbwiVR3BJOqPRA"
                alt="Lumina Hero Abstract"
                className="absolute inset-0 w-full h-full object-cover rounded-3xl shadow-2xl glass-panel ai-glow border border-white/60"
              />

              {/* Floating Glass Card 1 */}
              <div className="absolute -left-6 top-10 glass-panel rounded-2xl p-4 flex items-center gap-3 animate-bounce-slow shadow-xl border border-white/80">
                <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Skill Mastery</p>
                  <p className="font-label-md text-label-md font-bold text-primary">Start tracking</p>
                </div>
              </div>

              {/* Floating Glass Card 2 */}
              <div className="absolute -right-4 bottom-16 glass-panel rounded-2xl p-4 flex items-center gap-3 animate-pulse-slow shadow-xl border border-white/80">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
                  <Brain className="w-5 h-5 text-secondary-container" />
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">AI Insight</p>
                  <p className="font-label-md text-label-md font-bold text-primary">Path Optimized</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="px-margin-mobile md:px-margin-desktop py-16 bg-surface-container-lowest dark:bg-inverse-surface/40 rounded-3xl border border-outline-variant/30">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary dark:text-on-primary-fixed mb-4">
              How Lumina Works
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-outline-variant max-w-2xl mx-auto">
              A systematic, distraction-free approach to continuous learning and rapid competency building.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary"></div>
              <div className="w-14 h-14 rounded-2xl bg-surface-variant dark:bg-primary-container flex items-center justify-center mb-6 text-primary dark:text-secondary-container group-hover:bg-secondary group-hover:text-on-secondary transition-colors duration-300 shadow-sm">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="font-headline-md text-headline-md text-primary dark:text-on-primary-fixed mb-3">
                1. Assess
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant dark:text-outline-variant">
                Lumina evaluates your current skill baseline through an adaptive diagnostic intake wizard to pinpoint your exact starting point and missing prerequisites.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary"></div>
              <div className="w-14 h-14 rounded-2xl bg-surface-variant dark:bg-primary-container flex items-center justify-center mb-6 text-primary dark:text-secondary-container group-hover:bg-secondary group-hover:text-on-secondary transition-colors duration-300 shadow-sm">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="font-headline-md text-headline-md text-primary dark:text-on-primary-fixed mb-3">
                2. Map
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant dark:text-outline-variant">
                A multi-phase visual DAG roadmap is generated, multi-criteria scored and sequenced for your weekly pace.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary"></div>
              <div className="w-14 h-14 rounded-2xl bg-surface-variant dark:bg-primary-container flex items-center justify-center mb-6 text-primary dark:text-secondary-container group-hover:bg-secondary group-hover:text-on-secondary transition-colors duration-300 shadow-sm">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="font-headline-md text-headline-md text-primary dark:text-on-primary-fixed mb-3">
                3. Master
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant dark:text-outline-variant">
                Engage with hands-on capstone projects while Lumina Mentor tracks progress in real-time, providing practice quizzes and adaptive course corrections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section (Bento Layout) */}
      <section className="px-margin-mobile md:px-margin-desktop py-12">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary dark:text-on-primary-fixed mb-4">
              Intelligent Ecosystem Features
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-outline-variant max-w-2xl mx-auto">
              Tools built specifically for high-achieving lifelong learners and career switchers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(300px,_auto)]">
            {/* Feature 1: Personalized Roadmaps */}
            <div className="md:col-span-8 bg-surface-container-lowest dark:bg-inverse-surface/60 rounded-3xl p-8 border border-outline-variant/50 shadow-sm relative overflow-hidden flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 z-10">
                <div className="inline-flex px-3 py-1 bg-surface-variant dark:bg-primary-container text-primary dark:text-secondary-container rounded-full font-label-sm text-label-sm mb-4">
                  Core Engine
                </div>
                <h3 className="font-headline-md text-headline-md text-primary dark:text-on-primary-fixed mb-4">
                  Interactive DAG Roadmaps
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant dark:text-outline-variant mb-6">
                  Experience a visual graph curriculum that adapts to you. Our algorithm analyzes learning velocity and skill gaps to construct a fluid, unlockable sequence of modules.
                </p>
                <button
                  onClick={onExploreCurriculum}
                  className="inline-flex items-center gap-2 text-secondary font-label-md text-label-md hover:underline"
                >
                  <span>View interactive DAG visualizer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 w-full h-full min-h-[220px] relative rounded-2xl overflow-hidden border border-outline-variant/30">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6Kny1ppui8mVkprjtvPfzNfWKs7XG2GMFB6LGkGO9--VmW8oNnr7yfFlwsHOB_YpVhVrGDiVVLJyY6rKfxJkZylgG5gba6g-HBYY3W98oCaSKY4FapFZKve54LV7fuGFhBcv_ajAOj0OpGzjmxgQuVuEW98B5rE1wsbZ9WHr0BIBXNMlObhdX_d_T5ZIFracmxBmbAZ1iUWLa08Gd_tAW5W7oe_EIQ37zYB-SZB6amIzPqAV1txRmkQ"
                  alt="Roadmap Dashboard UI"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Feature 2: Real-time AI Insights */}
            <div className="md:col-span-4 bg-primary text-on-primary rounded-3xl p-8 relative overflow-hidden ai-glow">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <Zap className="w-10 h-10 mb-6 text-secondary-container" />
                  <h3 className="font-headline-md text-headline-md mb-4 text-white">
                    Real-Time AI Reasoning
                  </h3>
                  <p className="font-body-md text-body-md text-primary-fixed-dim">
                    Powered by Google's Gemini API with an instant local AI reasoning fallback for 100% deterministic reliability.
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-2 text-xs text-secondary-container bg-white/10 p-3 rounded-xl border border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-secondary-container" />
                  <span>Explainable AI (XAI) for every recommendation</span>
                </div>
              </div>
            </div>

            {/* Feature 3: Skill Mastery Tracking */}
            <div className="md:col-span-12 lg:col-span-6 glass-panel rounded-3xl p-8 border-l-4 border-l-secondary flex flex-col justify-between">
              <div>
                <h3 className="font-headline-md text-headline-md text-primary dark:text-on-primary-fixed mb-4">
                  Skill Mastery Tracking
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant dark:text-outline-variant mb-6">
                  Move beyond completion metrics. Lumina measures deep comprehension through active recall, code quizzes, and practical project deliverables.
                </p>
              </div>

              {/* Progress bars abstract */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between font-label-sm text-label-sm mb-1 text-on-surface-variant dark:text-outline-variant">
                    <span>Mastery will appear after real study records are added</span>
                    <span className="text-primary dark:text-secondary-fixed font-bold">0%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-variant/60 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-secondary to-secondary-container w-0 rounded-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-label-sm text-label-sm mb-1 text-on-surface-variant dark:text-outline-variant">
                    <span>Progress is calculated only from actual learning data</span>
                    <span className="text-primary dark:text-secondary-fixed font-bold">0%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-variant/60 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-secondary to-secondary-container w-0 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4: Distraction-Free Deep Work */}
            <div className="md:col-span-12 lg:col-span-6 bg-surface-container-lowest dark:bg-inverse-surface/60 rounded-3xl p-8 border border-outline-variant/50 shadow-sm flex items-center justify-center relative overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuALlEvlAFv6azEF52ddA5m2ZGTs_HQueUc2jz7AfUYGK6nC2WKL_by4wGW_rRCGFSZ_HZ89Ti_AlGOtXPTBezvAfiANAcx50b6Q0V4fpLhTGVhl4PrkJ-bFEokRxRPV-aw3F64SMTGXYyM0jAJD6YW13tcybFz3Y3dT1PfY_N-rEfd3ejn-g1fWQl4FHtOGNnOVjufLAX7YB1fXyNfX2d_WYA5eqSBFfzKRZdHKwMt_uWXbX-ZnA75m8w"
                alt="Deep Work Environment"
                className="absolute inset-0 w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-surface/60 dark:bg-inverse-surface/80 backdrop-blur-sm"></div>
              <div className="relative z-10 text-center max-w-sm">
                <h3 className="font-headline-md text-headline-md text-primary dark:text-on-primary-fixed mb-3">
                  Distraction-Free Environment
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant dark:text-outline-variant">
                  A systematically designed workspace utilizing whitespace to prevent cognitive overload and maintain deep focus.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-margin-mobile md:px-margin-desktop py-12">
        <div className="max-w-4xl mx-auto glass-panel border-2 border-primary-container/20 rounded-[2.5rem] p-12 text-center relative overflow-hidden ai-glow shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-container/30 rounded-full blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
          <h2 className="font-display-lg text-headline-lg-mobile md:text-display-lg text-primary dark:text-on-primary-fixed mb-6">
            Ready to Accelerate Your Mastery?
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant dark:text-outline-variant mb-10 max-w-2xl mx-auto">
            Join thousands of ambitious engineers and analysts who have transformed their learning trajectory with Lumina.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onStartOnboarding}
              className="w-full sm:w-auto px-8 py-4 bg-primary text-on-primary rounded-full font-label-md text-label-md hover:scale-105 transition-all shadow-lg"
            >
              Start Diagnostic Path
            </button>
            <button
              onClick={onExploreCurriculum}
              className="w-full sm:w-auto px-8 py-4 bg-surface-container-lowest dark:bg-inverse-surface text-primary dark:text-on-primary-fixed border border-outline-variant rounded-full font-label-md text-label-md hover:bg-surface-variant transition-colors"
            >
              Explore 150+ Catalog
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
