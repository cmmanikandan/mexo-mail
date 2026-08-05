import React from 'react';
import { useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useComposeStore } from '../../store/composeStore';

export const MobileComposeFAB: React.FC = () => {
  const location = useLocation();
  const { openCompose, instances } = useComposeStore();

  const path = location.pathname;

  // Hide mobile floating compose FAB on:
  // - Contact pages (/contacts)
  // - Open email thread detail pages (/mail/thread/*)
  // - Account page (/account)
  // - Settings pages (/settings)
  // - When a compose window is already open
  const isExcludedPage =
    path.includes('/contacts') ||
    path.includes('/mail/thread/') ||
    path.includes('/thread/') ||
    path.includes('/account') ||
    path.includes('/settings');

  const hasActiveFullCompose = instances.some((inst) => !inst.isMinimized);

  if (isExcludedPage || hasActiveFullCompose) return null;

  return (
    <button
      type="button"
      onClick={() => openCompose()}
      className="md:hidden fixed right-4 bottom-5 z-40 flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-full bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] active:scale-95 text-white font-bold shadow-lg shadow-indigo-500/40 transition-all select-none focus:outline-none ring-2 ring-white dark:ring-slate-900 cursor-pointer"
      style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
      aria-label="Compose new mail"
    >
      <Plus className="w-4 h-4 stroke-[2.5]" />
      <span className="text-xs font-bold tracking-wide">Compose</span>
    </button>
  );
};
