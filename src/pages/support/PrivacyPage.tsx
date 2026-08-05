import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, EyeOff, Server, ArrowLeft } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <Link to="/mail/inbox" className="flex items-center space-x-2.5">
            <img src="/logo.png" alt="MEXO" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg text-slate-900 dark:text-slate-100 tracking-tight">
              MEXO <span className="text-mexo-600 font-medium text-base ml-0.5">Privacy Policy</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-4 text-xs font-medium text-slate-500">
          <Link to="/help" className="hover:text-slate-900 dark:hover:text-slate-100">Help</Link>
          <Link to="/terms" className="hover:text-slate-900 dark:hover:text-slate-100">Terms</Link>
        </div>
      </header>

      {/* Content Container */}
      <main className="max-w-4xl mx-auto py-12 px-6 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Effective Date: August 2026</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            MEXO Mail Privacy Policy
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            At MEXO ("Made to Connect."), we treat privacy as a fundamental engineering pillar. This Privacy Policy details how personal information and email communications are handled across MEXO Mail.
          </p>
        </div>

        <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center space-x-2.5 text-mexo-600 dark:text-mexo-400 font-bold text-base">
              <Lock className="w-5 h-5" />
              <h2>1. Information We Collect</h2>
            </div>
            <p>
              When you create a MEXO Account, we collect your name, chosen native address (<code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">username@mexo.com</code>), hashed credentials, and optional recovery contact details. We do not sell your personal data or track your browsing activity across third-party websites.
            </p>
          </section>

          {/* Section 2 */}
          <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center space-x-2.5 text-mexo-600 dark:text-mexo-400 font-bold text-base">
              <EyeOff className="w-5 h-5" />
              <h2>2. Email Confidentiality & System Admin Isolation</h2>
            </div>
            <p>
              MEXO Mail enforces strict structural isolation. System Administrators oversee user quota management, group permissions, and audit event logs, but **cannot view private email body contents or subject lines** without explicit security authorization.
            </p>
          </section>

          {/* Section 3 */}
          <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center space-x-2.5 text-mexo-600 dark:text-mexo-400 font-bold text-base">
              <Server className="w-5 h-5" />
              <h2>3. MEXO Groups & Attachment Deduplication</h2>
            </div>
            <p>
              When sending emails to a MEXO Group (e.g. <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">groupname@mexo.com</code>), attachment files are stored once in our secure object layer. Individual group members receive private inbox pointer entries, preserving storage efficiency while protecting member privacy.
            </p>
          </section>

          {/* Section 4 */}
          <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">4. Your Data Rights</h2>
            <p>
              You have full rights to export your emails, update your recovery options, or permanently delete your MEXO Account. Deleting an account permanently purges stored inbox messages and address identity records.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};
