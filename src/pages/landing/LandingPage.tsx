import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { MexoAvatar } from '../../components/common/MexoAvatar';
import {
  Shield,
  Zap,
  HardDrive,
  Lock,
  ArrowRight,
  CheckCircle2,
  Users,
  Search,
  Inbox,
  Star,
  Clock,
  Send,
  FileText,
  Tag,
  KeyRound,
  Monitor,
  ShieldCheck,
  UserCheck,
  Paperclip,
  Calendar,
  Sparkles,
  Menu,
  X,
  Mail,
  ChevronRight,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleOpenMail = () => {
    navigate('/mail/inbox');
  };

  const handleSignIn = () => {
    navigate('/signin');
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-[#7C3AED] selection:text-white flex flex-col antialiased">
      {/* ── 3. LANDING NAVBAR ── */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-app-border px-4 sm:px-8 h-16 sm:h-18 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div
          className="flex items-center space-x-3 cursor-pointer select-none"
          onClick={() => navigate('/')}
        >
          <img src="/logo.png" alt="MEXO Mail" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
          <span className="text-base sm:text-lg font-black tracking-tight flex items-center text-slate-900 dark:text-slate-100">
            MEXO <span className="bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] bg-clip-text text-transparent ml-1 font-black">Mail</span>
          </span>
        </div>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center space-x-8 text-xs font-bold text-slate-600 dark:text-slate-300">
          <a href="#features" className="hover:text-[#7C3AED] dark:hover:text-indigo-400 transition-colors">Features</a>
          <a href="#security" className="hover:text-[#7C3AED] dark:hover:text-indigo-400 transition-colors">Security</a>
          <a href="#productivity" className="hover:text-[#7C3AED] dark:hover:text-indigo-400 transition-colors">Productivity</a>
          <a href="#account" className="hover:text-[#7C3AED] dark:hover:text-indigo-400 transition-colors">About</a>
        </nav>

        {/* Auth CTA Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-app-border">
                <MexoAvatar name={`${currentUser.firstName} ${currentUser.lastName}`} src={currentUser.avatarUrl} size="sm" className="w-6 h-6 text-[10px]" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{currentUser.firstName}</span>
              </div>
              <button
                onClick={handleOpenMail}
                className="px-4 py-2 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-xs shadow-xs hover:opacity-95 transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <span>Open MEXO Mail</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={handleSignIn}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#0878e8] dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Sign in
              </button>
              <button
                onClick={handleSignUp}
                className="px-4 py-2 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-xs shadow-xs hover:opacity-95 transition-all cursor-pointer"
              >
                Create account
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 md:hidden hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-white dark:bg-slate-900 border-b border-app-border p-5 z-30 shadow-xl space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col space-y-3 text-sm font-bold text-slate-700 dark:text-slate-200">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-app-border">Features</a>
            <a href="#security" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-app-border">Security</a>
            <a href="#productivity" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-app-border">Productivity</a>
            <a href="#account" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-app-border">About</a>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenMail();
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-xs shadow-xs text-center flex items-center justify-center space-x-2"
              >
                <span>Open MEXO Mail</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignUp();
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-xs shadow-xs text-center"
                >
                  Create account
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignIn();
                  }}
                  className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xs text-center border border-app-border"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── 4. HERO SECTION ── */}
      <section className="relative pt-12 pb-16 px-4 sm:px-8 text-center max-w-5xl mx-auto">
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/60 dark:border-indigo-800/40 text-xs font-extrabold text-[#7C3AED] dark:text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MEXO Mail</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-[1.15]">
            Email, made simpler.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
            A fast, private and organized mailbox built to help you communicate, focus and get things done.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={handleOpenMail}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-sm shadow-mexo-md hover:opacity-95 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Open MEXO Mail</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={handleSignUp}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-sm shadow-mexo-md hover:opacity-95 transition-all cursor-pointer"
                >
                  Create your MEXO account
                </button>
                <button
                  onClick={handleSignIn}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-app-border text-[#0878e8] dark:text-blue-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>

        {/* Realistic MEXO Mail Product UI Mockup */}
        <div className="mt-12 max-w-4xl mx-auto rounded-2xl sm:rounded-3xl border border-app-border bg-white dark:bg-slate-900 shadow-mexo-lg overflow-hidden text-left">
          {/* Mockup Top Header */}
          <div className="h-12 bg-slate-100 dark:bg-slate-800/80 border-b border-app-border px-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="MEXO Mail" className="w-5 h-5 object-contain" />
              <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">MEXO Mail</span>
            </div>

            <div className="w-1/2 max-w-sm h-7 rounded-lg bg-white dark:bg-slate-900 border border-app-border px-3 flex items-center text-xs text-slate-400">
              <Search className="w-3.5 h-3.5 mr-2 text-slate-400" />
              <span className="truncate text-[11px]">Search in mail...</span>
            </div>

            <MexoAvatar name="Manikandan CM" size="xs" className="w-6 h-6 text-[9px]" />
          </div>

          {/* Mockup Sidebar + Message List Body */}
          <div className="flex h-72 sm:h-80 overflow-hidden text-xs">
            {/* Folder Sidebar */}
            <div className="w-44 sm:w-52 border-r border-app-border bg-slate-50/60 dark:bg-slate-900/60 p-3 space-y-1 hidden sm:block">
              <div className="px-3 py-2 rounded-xl bg-indigo-50 text-[#7C3AED] dark:bg-indigo-950/80 dark:text-indigo-300 font-extrabold flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Inbox className="w-4 h-4" />
                  <span>Inbox</span>
                </div>
                <span className="text-[10px] font-bold">12</span>
              </div>
              <div className="px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-medium flex items-center space-x-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span>Starred</span>
              </div>
              <div className="px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-medium flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Snoozed</span>
              </div>
              <div className="px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-medium flex items-center space-x-2">
                <Send className="w-4 h-4" />
                <span>Sent</span>
              </div>
              <div className="px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-medium flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Drafts</span>
              </div>
            </div>

            {/* Message Rows List */}
            <div className="flex-1 divide-y divide-app-border overflow-hidden bg-white dark:bg-slate-900">
              {[
                { sender: 'MEXO Security Team', sub: 'New security login detected from Chrome', time: '10:42 AM', unread: true },
                { sender: 'Engineering Lead', sub: 'Quarterly architecture review & roadmap updates', time: 'Yesterday', unread: false },
                { sender: 'Design System Team', sub: 'Updated logo gradient tokens and component guidelines', time: 'Aug 4', unread: false },
                { sender: 'Platform Support', sub: 'Welcome to your new MEXO Mail address', time: 'Aug 1', unread: false },
              ].map((row, idx) => (
                <div
                  key={idx}
                  className={`p-3 sm:px-4 sm:py-3.5 flex items-center justify-between ${
                    row.unread ? 'bg-indigo-50/30 dark:bg-indigo-950/20 font-bold' : 'text-slate-600 dark:text-slate-400 font-normal'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <Star className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                    <div className="truncate min-w-0">
                      <p className="text-slate-900 dark:text-slate-100 font-bold truncate text-xs">{row.sender}</p>
                      <p className="text-[11px] text-slate-500 truncate">{row.sub}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">{row.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. PRODUCT BENEFITS SECTION ── */}
      <section id="features" className="py-16 px-4 sm:px-8 bg-white dark:bg-slate-900 border-y border-app-border">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Everything you need for better email
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
              Powerful built-in features to keep your inbox clean, organized, and secure.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Benefit 1 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-app-border space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#0878e8] flex items-center justify-center font-bold">
                <Search className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Smart Search</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Find messages, attachments and people quickly.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-app-border space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-[#7C3AED] dark:text-indigo-300 flex items-center justify-center font-bold">
                <Inbox className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Organized Inbox</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Keep important conversations easy to find.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-app-border space-y-2">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold">
                <Tag className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Labels</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Create custom labels and organize messages your way.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-app-border space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold">
                <Users className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Contacts</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Manage the people you communicate with.
              </p>
            </div>

            {/* Benefit 5 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-app-border space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Secure Account</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Manage passwords, sessions, recovery and privacy.
              </p>
            </div>

            {/* Benefit 6 */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-app-border space-y-2">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-300 flex items-center justify-center font-bold">
                <Paperclip className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Attachments</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Send and manage documents, images and files easily.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. SEARCH SECTION ── */}
      <section className="py-16 px-4 sm:px-8 max-w-5xl mx-auto">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white shadow-mexo-lg space-y-6 border border-slate-700">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Find anything in your mailbox.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Search seamlessly across sender names, recipient addresses, email subjects, file attachments, and date ranges.
            </p>
          </div>

          {/* Visual Search Bar Example */}
          <div className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 max-w-lg flex items-center space-x-3">
            <Search className="w-4 h-4 text-[#0878e8]" />
            <input
              type="text"
              readOnly
              value="Search in mail..."
              className="bg-transparent text-xs font-medium text-slate-300 outline-none w-full cursor-default"
            />
            <span className="text-[10px] font-mono font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded-lg">⌘K</span>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-400">
            <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">Sender Name</span>
            <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">Recipient Email</span>
            <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">Subject Keywords</span>
            <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">Attachments</span>
          </div>
        </div>
      </section>

      {/* ── 7. ORGANIZATION SECTION ── */}
      <section className="py-16 px-4 sm:px-8 bg-white dark:bg-slate-900 border-y border-app-border">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Your inbox. Your organization.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto font-medium">
              Organize your mail using custom labels and system folders without making the interface complex.
            </p>
          </div>

          {/* Folder & Label Badge Showcase */}
          <div className="flex flex-wrap items-center justify-center gap-3 max-w-3xl mx-auto">
            {['Inbox', 'Starred', 'Snoozed', 'Important', 'Sent', 'Scheduled', 'Drafts'].map((folder) => (
              <span key={folder} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold border border-app-border">
                {folder}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3.5 max-w-2xl mx-auto pt-2">
            <span className="px-3.5 py-1.5 rounded-full bg-blue-50 text-[#0878e8] dark:bg-blue-950/80 dark:text-blue-300 text-xs font-extrabold border border-blue-200/50">
              ● Work
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-purple-50 text-[#7C3AED] dark:bg-purple-950/80 dark:text-purple-300 text-xs font-extrabold border border-purple-200/50">
              ● Projects
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 text-xs font-extrabold border border-emerald-200/50">
              ● Personal
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 text-xs font-extrabold border border-rose-200/50">
              ● Urgent
            </span>
          </div>
        </div>
      </section>

      {/* ── 8. MEXO ACCOUNT SECTION ── */}
      <section id="account" className="py-16 px-4 sm:px-8 max-w-5xl mx-auto">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            One account for your MEXO experience.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Manage your identity, security, recovery, and data sovereignty from one centralized place.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { title: 'Profile', desc: 'Name, photo & identity' },
            { title: 'Security', desc: 'Password & authentication' },
            { title: 'Devices & Sessions', desc: 'Active login tracking' },
            { title: 'Recovery', desc: 'Backup email options' },
            { title: 'Connected Apps', desc: 'MEXO ecosystem access' },
            { title: 'Privacy', desc: 'Data & pixel blocking' },
            { title: 'Data & Storage', desc: 'Quota & JSON backups' },
            { title: 'Audit Log', desc: 'Security event logs' },
          ].map((item) => (
            <div key={item.title} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-app-border space-y-1 shadow-mexo-sm">
              <p className="font-extrabold text-slate-900 dark:text-slate-100">{item.title}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 9. SECURITY SECTION ── */}
      <section id="security" className="py-16 px-4 sm:px-8 bg-white dark:bg-slate-900 border-y border-app-border">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Your mailbox deserves strong protection.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
              Transparent, reliable security controls designed to safeguard your account.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            {[
              { icon: <Lock className="w-4 h-4 text-[#0878e8]" />, title: 'Secure Authentication' },
              { icon: <KeyRound className="w-4 h-4 text-[#7C3AED]" />, title: 'Account Recovery' },
              { icon: <Monitor className="w-4 h-4 text-blue-500" />, title: 'Session Management' },
              { icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />, title: 'Device Monitoring' },
              { icon: <UserCheck className="w-4 h-4 text-purple-500" />, title: 'Privacy Controls' },
              { icon: <Shield className="w-4 h-4 text-rose-500" />, title: 'Blocked Senders' },
            ].map((item) => (
              <div key={item.title} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-app-border flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs flex-shrink-0">
                  {item.icon}
                </div>
                <span className="font-extrabold text-slate-900 dark:text-slate-100">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. PRODUCTIVITY SECTION ── */}
      <section id="productivity" className="py-16 px-4 sm:px-8 max-w-5xl mx-auto">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Built for everyday communication.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto font-medium">
            Essential tools for managing your daily workflow effortlessly.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold">
          {[
            'Compose', 'Reply', 'Reply All', 'Forward', 'Attachments',
            'Scheduled Mail', 'Drafts', 'Contacts', 'Labels', 'Notifications',
            'Signatures', 'Vacation Responder'
          ].map((item) => (
            <span key={item} className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-app-border text-slate-800 dark:text-slate-200 shadow-xs">
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ── 11. CTA SECTION ── */}
      <section className="py-16 px-4 sm:px-8 bg-gradient-to-tr from-slate-900 to-slate-800 text-white text-center">
        <div className="max-w-3xl mx-auto space-y-5">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to use a simpler inbox?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            Create your MEXO account and start using MEXO Mail.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={handleOpenMail}
                className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-xs shadow-xs hover:opacity-95 cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Open MEXO Mail</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={handleSignUp}
                  className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white font-extrabold text-xs shadow-xs hover:opacity-95 cursor-pointer"
                >
                  Create account
                </button>
                <button
                  onClick={handleSignIn}
                  className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-slate-800 text-slate-100 font-bold text-xs border border-slate-700 hover:bg-slate-700 cursor-pointer"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── 12. FOOTER ── */}
      <footer className="mt-auto py-10 px-4 sm:px-8 bg-white dark:bg-slate-900 border-t border-app-border text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="MEXO Mail" className="w-6 h-6 object-contain" />
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">MEXO Mail</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Simple, organized email.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">Product</p>
            <div className="flex flex-col space-y-1.5 font-medium">
              <a href="#features" className="hover:text-slate-900 dark:hover:text-slate-100">Features</a>
              <a href="#security" className="hover:text-slate-900 dark:hover:text-slate-100">Security</a>
              <button onClick={() => navigate('/privacy')} className="text-left hover:text-slate-900 dark:hover:text-slate-100">Privacy</button>
              <button onClick={() => navigate('/terms')} className="text-left hover:text-slate-900 dark:hover:text-slate-100">Terms</button>
              <button onClick={() => navigate('/help')} className="text-left hover:text-slate-900 dark:hover:text-slate-100">Help</button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">Account</p>
            <div className="flex flex-col space-y-1.5 font-medium">
              <button onClick={handleSignIn} className="text-left hover:text-slate-900 dark:hover:text-slate-100">Sign in</button>
              <button onClick={handleSignUp} className="text-left hover:text-slate-900 dark:hover:text-slate-100">Create account</button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-8 mt-8 border-t border-app-border text-center font-semibold">
          <p>© 2026 MEXO</p>
        </div>
      </footer>
    </div>
  );
};
