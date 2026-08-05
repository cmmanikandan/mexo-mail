import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  Shield,
  Zap,
  HardDrive,
  Lock,
  ArrowRight,
  CheckCircle2,
  Users,
  Sparkles,
  Database,
  Mail,
  Search,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-[#7C3AED] selection:text-white flex flex-col">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-app-border px-4 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <img src="/logo.png" alt="MEXO Mail" className="w-8 h-8 object-contain" />
          <span className="text-lg font-black tracking-tight flex items-center">
            MEXO <span className="bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] bg-clip-text text-transparent ml-1 font-black">Mail</span>
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-8 text-xs font-bold text-slate-600 dark:text-slate-300">
          <a href="#features" className="hover:text-[#7C3AED] dark:hover:text-indigo-400 transition-colors">Features</a>
          <a href="#security" className="hover:text-[#7C3AED] dark:hover:text-indigo-400 transition-colors">Security</a>
          <a href="#admin" className="hover:text-[#7C3AED] dark:hover:text-indigo-400 transition-colors">Admin Console</a>
          <button onClick={() => navigate('/help')} className="hover:text-[#7C3AED] dark:hover:text-indigo-400 transition-colors">Help Center</button>
        </div>

        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/mail/inbox')}
              className="px-4 py-2 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-xs shadow-xs hover:opacity-95 transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <span>Go to Mailbox</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/signin')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Sign in
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-4 py-2 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-xs shadow-xs hover:opacity-95 transition-all cursor-pointer"
              >
                Create account
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative pt-16 pb-20 px-4 sm:px-8 text-center max-w-5xl mx-auto overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#7C3AED]/20 via-[#6366F1]/20 to-[#0878e8]/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/60 dark:border-indigo-800/40 text-xs font-extrabold text-[#7C3AED] dark:text-indigo-300 mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Intelligent Mail Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-[1.1]">
          Simple, Secure & Intelligent <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] bg-clip-text text-transparent">
            Email for Modern Teams
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
          Experience lightning-fast messaging, rich instant search, user directory governance, full offline sync, and enterprise disaster recovery.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate(isAuthenticated ? '/mail/inbox' : '/signup')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-sm shadow-mexo-md hover:opacity-95 transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <span>{isAuthenticated ? 'Open MEXO Mailbox' : 'Get Started Free'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate('/signin')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-app-border text-slate-800 dark:text-slate-100 font-extrabold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            Sign in to Existing Account
          </button>
        </div>

        {/* Feature Pill Highlights */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>100% Free Lifetime Account</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>15 GB Free Storage</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Built-in Admin Governance</span>
          </div>
        </div>
      </section>

      {/* ── Feature Cards Grid ── */}
      <section id="features" className="py-16 px-4 sm:px-8 bg-white dark:bg-slate-900 border-y border-app-border">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Designed for Productivity & Speed
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
              Built with modern Web technologies to give you a smooth, responsive desktop and mobile email experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-app-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-[#7C3AED] dark:text-indigo-300 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Realtime Messaging</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Instant delivery notifications, live cross-tab message synchronization, and automated auto-replies.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-app-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#0878e8] flex items-center justify-center font-bold">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Advanced Mail Search</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Filter emails instantly by sender, recipient, subject, label, date range, or attachment status.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-app-border space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Disaster Recovery</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                One-click database backup export (.JSON) and full state restoration for administrative peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Admin Overview Section ── */}
      <section id="admin" className="py-16 px-4 sm:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 text-xs font-extrabold border border-emerald-200/50 dark:border-emerald-800/40">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Governance Built-In</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
              Complete Control Over User Accounts & Quotas
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              Administrators get a dedicated console to manage user directories, create accounts with live availability checks, bulk import users via CSV, reset credentials, and monitor storage allocations.
            </p>

            <div className="pt-2 flex flex-col space-y-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Live Username Availability Checks</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Bulk CSV Account Importer with Template</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Individual User Quota Allocations & Password Reset</span>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => navigate('/signin')}
                className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold text-xs shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
              >
                Sign in as Admin
              </button>
            </div>
          </div>

          {/* Admin Dashboard Preview Graphic */}
          <div className="p-6 rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white shadow-mexo-lg space-y-4 border border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">MEXO Admin Panel</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Users</span>
                <p className="text-xl font-extrabold">1,240</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Storage Pool</span>
                <p className="text-xl font-extrabold text-indigo-400">500 GB</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs space-y-2">
              <div className="flex justify-between font-mono text-[11px]">
                <span className="text-slate-300">System Status</span>
                <span className="text-emerald-400 font-bold">● Operational</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-gradient-to-r from-[#7C3AED] to-[#0878e8] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto py-8 px-4 sm:px-8 bg-white dark:bg-slate-900 border-t border-app-border text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="MEXO Mail" className="w-6 h-6 object-contain" />
            <span className="font-extrabold text-slate-900 dark:text-slate-100">MEXO Mail</span>
            <span>&bull; Made to Connect.</span>
          </div>

          <div className="flex items-center space-x-6 font-semibold">
            <button onClick={() => navigate('/privacy')} className="hover:text-slate-900 dark:hover:text-slate-100">Privacy Policy</button>
            <button onClick={() => navigate('/terms')} className="hover:text-slate-900 dark:hover:text-slate-100">Terms of Service</button>
            <button onClick={() => navigate('/help')} className="hover:text-slate-900 dark:hover:text-slate-100">Help Center</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
