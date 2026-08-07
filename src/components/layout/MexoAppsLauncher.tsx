import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Mail, FileText, UserCheck, CheckCircle2, ExternalLink } from 'lucide-react';

export const MexoAppsLauncher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const formsUrl = (import.meta as any).env?.VITE_MEXO_FORMS_URL || 'https://mexo-forms.vercel.app';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
        title="MEXO Apps Launcher"
        aria-label="MEXO Apps"
      >
        <LayoutGrid className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-mexo-popover p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1.5 mb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              MEXO Apps
            </h4>
            <span className="text-[10px] font-mono text-slate-400">Central Identity</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* MEXO Mail (Active App) */}
            <div className="p-2.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-col items-center text-center relative select-none">
              <span className="absolute top-1 right-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
              </span>
              {/* Equal Visual Container (48x48 mobile / 52x52 desktop) */}
              <div className="w-12 h-12 md:w-[52px] md:h-[52px] rounded-2xl bg-gradient-to-tr from-[#0878e8] to-[#6366f1] text-white flex items-center justify-center mb-1.5 shadow-md p-3">
                <Mail className="w-full h-full object-contain" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Mail</span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">Active</span>
            </div>

            {/* MEXO Forms */}
            <a
              href={formsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center text-center transition-all cursor-pointer group"
            >
              {/* Equal Visual Container (48x48 mobile / 52x52 desktop) */}
              <div className="w-12 h-12 md:w-[52px] md:h-[52px] rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mb-1.5 shadow-md p-3 group-hover:scale-105 transition-transform">
                <FileText className="w-full h-full object-contain" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center">
                Forms
                <ExternalLink className="w-3 h-3 ml-0.5 text-slate-400" />
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">Open</span>
            </a>

            {/* MEXO Account */}
            <div
              onClick={() => {
                setIsOpen(false);
                navigate('/account');
              }}
              className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center text-center transition-all cursor-pointer group"
            >
              {/* Equal Visual Container (48x48 mobile / 52x52 desktop) */}
              <div className="w-12 h-12 md:w-[52px] md:h-[52px] rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-1.5 shadow-md p-3 group-hover:scale-105 transition-transform">
                <UserCheck className="w-full h-full object-contain" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Account</span>
              <span className="text-[10px] text-slate-500 font-semibold">Identity</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
