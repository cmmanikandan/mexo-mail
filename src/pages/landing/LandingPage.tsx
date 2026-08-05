import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { MexoAvatar } from '../../components/common/MexoAvatar';
import { PWAInstallButton } from '../../components/common/PWAInstallButton';
import {
  ArrowRight,
  Shield,
  Zap,
  Lock,
  Search,
  Inbox,
  Star,
  Clock,
  Send,
  FileText,
  Paperclip,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-[#7C3AED] selection:text-white flex flex-col antialiased">
      {/* ── Top Header Bar ── */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-app-border px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div
          className="flex items-center space-x-2.5 cursor-pointer select-none"
          onClick={() => navigate('/')}
        >
          <img src="/logo.png" alt="MEXO Mail" className="w-7 h-7 object-contain" />
          <span className="text-base font-black tracking-tight flex items-center text-slate-900 dark:text-slate-100">
            MEXO <span className="bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] bg-clip-text text-transparent ml-1 font-black">Mail</span>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <PWAInstallButton className="hidden sm:flex" />
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-app-border">
                <MexoAvatar name={`${currentUser.firstName} ${currentUser.lastName}`} src={currentUser.avatarUrl} size="sm" className="w-5 h-5 text-[9px]" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{currentUser.firstName}</span>
              </div>
              <button
                onClick={() => navigate('/mail/inbox')}
                className="px-4 py-2 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-xs shadow-xs hover:opacity-95 transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <span>Open MEXO Mail</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate('/signin')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#0878e8] dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
      <section className="pt-12 pb-14 px-4 sm:px-8 text-center max-w-4xl mx-auto">
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/60 dark:border-indigo-800/40 text-xs font-extrabold text-[#7C3AED] dark:text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MEXO Mail</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            Email, made simpler.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            A fast, private and organized mailbox built to help you communicate, focus and get things done.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/mail/inbox')}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-sm shadow-mexo-md hover:opacity-95 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Open MEXO Mail</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-sm shadow-mexo-md hover:opacity-95 transition-all cursor-pointer"
                >
                  Create account
                </button>
                <button
                  onClick={() => navigate('/signin')}
                  className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-app-border text-[#0878e8] dark:text-blue-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        {/* Clean Inbox UI Mockup Preview */}
        <div className="mt-10 max-w-3xl mx-auto rounded-2xl border border-app-border bg-white dark:bg-slate-900 shadow-mexo-lg overflow-hidden text-left">
          {/* Header Bar */}
          <div className="h-11 bg-slate-100 dark:bg-slate-800/80 border-b border-app-border px-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="MEXO Mail" className="w-4 h-4 object-contain" />
              <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">MEXO Mail</span>
            </div>

            <div className="w-1/2 max-w-xs h-6 rounded-md bg-white dark:bg-slate-900 border border-app-border px-2.5 flex items-center text-[11px] text-slate-400">
              <Search className="w-3 h-3 mr-1.5 text-slate-400" />
              <span className="truncate">Search in mail...</span>
            </div>

            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#0878e8] text-white text-[9px] font-bold flex items-center justify-center">
              M
            </div>
          </div>

          {/* Mail Rows List */}
          <div className="divide-y divide-app-border text-xs">
            {[
              { sender: 'MEXO Security', sub: 'New security login detected', time: '10:42 AM', unread: true },
              { sender: 'Engineering Lead', sub: 'Quarterly roadmap updates', time: 'Yesterday', unread: false },
              { sender: 'Platform Support', sub: 'Welcome to your MEXO Mail account', time: 'Aug 1', unread: false },
            ].map((row, idx) => (
              <div
                key={idx}
                className={`px-4 py-3 flex items-center justify-between ${
                  row.unread ? 'bg-indigo-50/40 dark:bg-indigo-950/30 font-bold' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <Star className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                  <div className="truncate min-w-0">
                    <p className="text-slate-900 dark:text-slate-100 font-bold text-xs truncate">{row.sender}</p>
                    <p className="text-[11px] text-slate-500 truncate">{row.sub}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">{row.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key Features ── */}
      <section className="py-12 px-4 sm:px-8 bg-white dark:bg-slate-900 border-y border-app-border">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-app-border space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-[#0878e8] flex items-center justify-center font-bold">
              <Inbox className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Organized Inbox</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Keep important conversations easy to find with custom labels and search filters.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-app-border space-y-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-[#7C3AED] dark:text-indigo-300 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Privacy & Security</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Built with session monitoring, account recovery tools, and security audit logs.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-app-border space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Admin Controls</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Manage user directories, storage quotas, and one-click JSON database backups.
            </p>
          </div>
        </div>
      </section>

      {/* ── Ready CTA Banner ── */}
      <section className="py-12 px-4 sm:px-8 text-center max-w-3xl mx-auto space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
          Ready to get started?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          Create your MEXO account and start using MEXO Mail.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/mail/inbox')}
              className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-xs shadow-xs hover:opacity-95 cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <span>Open MEXO Mail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-xs shadow-xs hover:opacity-95 cursor-pointer"
              >
                Create account
              </button>
              <button
                onClick={() => navigate('/signin')}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs border border-app-border hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </section>

      {/* ── Dark Footer ── */}
      <footer className="mt-auto bg-[#0F172A] text-slate-300 border-t border-slate-800 py-10 px-4 sm:px-8 text-xs">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 items-start">
          {/* Brand Info */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="MEXO Mail" className="w-5 h-5 object-contain" />
              <span className="font-black text-white text-sm tracking-tight">MEXO Mail</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Email, made simpler. Fast, private and organized.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-2">
            <p className="font-bold text-white uppercase tracking-wider text-[10px] text-slate-400">Important Pages</p>
            <div className="flex flex-col space-y-2 font-medium text-slate-300">
              <button onClick={() => navigate('/help')} className="text-left hover:text-white transition-colors">Help Center</button>
              <button onClick={() => navigate('/privacy')} className="text-left hover:text-white transition-colors">Privacy Policy</button>
              <button onClick={() => navigate('/terms')} className="text-left hover:text-white transition-colors">Terms of Service</button>
            </div>
          </div>

          {/* Account & Support */}
          <div className="space-y-2">
            <p className="font-bold text-white uppercase tracking-wider text-[10px] text-slate-400">Account & Access</p>
            <div className="flex flex-col space-y-2 font-medium text-slate-300">
              <button onClick={() => navigate('/signin')} className="text-left hover:text-white transition-colors">Sign in</button>
              <button onClick={() => navigate('/signup')} className="text-left hover:text-white transition-colors">Create account</button>
              {isAuthenticated && (
                <button onClick={() => navigate('/mail/inbox')} className="text-left text-[#0878e8] font-bold hover:underline">Open Mailbox &rarr;</button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto pt-8 mt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px] gap-2">
          <p>© 2026 MEXO Mail. All rights reserved.</p>
          <p className="font-medium text-slate-400">MADE TO CONNECT.</p>
        </div>
      </footer>
    </div>
  );
};
