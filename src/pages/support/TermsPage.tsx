import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FileText, ShieldAlert, CheckCircle2, ArrowLeft } from 'lucide-react';

export const TermsPage: React.FC = () => {
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
              MEXO <span className="text-mexo-600 font-medium text-base ml-0.5">Terms of Service</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-4 text-xs font-medium text-slate-500">
          <Link to="/help" className="hover:text-slate-900 dark:hover:text-slate-100">Help</Link>
          <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-slate-100">Privacy</Link>
        </div>
      </header>

      {/* Content Container */}
      <main className="max-w-4xl mx-auto py-12 px-6 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-mexo-50 dark:bg-mexo-950 text-mexo-700 dark:text-mexo-300 text-xs font-semibold">
            <FileText className="w-4 h-4" />
            <span>Last Updated: August 2026</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            MEXO Terms of Service
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            By creating a MEXO Account or using MEXO Mail services, you agree to comply with the following Terms of Service ("Terms").
          </p>
        </div>

        <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center space-x-2.5 text-mexo-600 dark:text-mexo-400 font-bold text-base">
              <CheckCircle2 className="w-5 h-5" />
              <h2>1. Native MEXO Address Identity</h2>
            </div>
            <p>
              Your native MEXO email address format (<code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">username@mexo.com</code>) is assigned upon successful registration. System-reserved addresses (such as <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">admin@mexo.com</code> or <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">support@mexo.com</code>) are protected and restricted to system operation.
            </p>
          </section>

          {/* Section 2 */}
          <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center space-x-2.5 text-mexo-600 dark:text-mexo-400 font-bold text-base">
              <ShieldAlert className="w-5 h-5" />
              <h2>2. Acceptable Use Policy</h2>
            </div>
            <p>
              Users are strictly prohibited from using MEXO Mail for transmitting automated bulk spam, malware, phishing campaigns, or illegal content. Violation of acceptable use policies will result in immediate account suspension by System Administrators.
            </p>
          </section>

          {/* Section 3 */}
          <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">3. MEXO Groups Usage</h2>
            <p>
              MEXO Groups allow distribution to designated member lists. Group Owners and Managers are responsible for maintaining member access lists and ensuring content sent to group addresses complies with platform policy.
            </p>
          </section>

          {/* Section 4 */}
          <section className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">4. Service Modifications & SLA</h2>
            <p>
              MEXO continuously improves features and performance. We strive for 99.9% platform availability and provide notice for planned maintenance windows.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};
