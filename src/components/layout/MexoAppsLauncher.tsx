import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, Mail, FileText, CheckCircle2, ExternalLink } from 'lucide-react';

export const MexoAppsLauncher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-mexo-popover p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1.5 mb-2 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              MEXO Apps
            </h4>
            <p className="text-[11px] text-slate-500">Applications available for your MEXO Account</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* MEXO Mail (Active App) */}
            <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-col items-center text-center relative select-none">
              <span className="absolute top-1.5 right-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
              </span>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#0878e8] text-white flex items-center justify-center mb-2 shadow-xs">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">MEXO Mail</span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">Active</span>
            </div>

            {/* MEXO Forms */}
            <a
              href={formsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex flex-col items-center text-center transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center">
                MEXO Forms
                <ExternalLink className="w-3 h-3 ml-1 text-slate-400" />
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">Ecosystem App</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
