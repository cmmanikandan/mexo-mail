import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMailStore, MailFolder } from '../../store/mailStore';
import { useComposeStore } from '../../store/composeStore';
import { Inbox, Star, Plus, Search, Menu } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const { currentFolder, setCurrentFolder } = useMailStore();
  const { openCompose } = useComposeStore();
  const { toggleMobileDrawer } = useUIStore();

  const isFolderActive = (folder: MailFolder) => {
    return path.includes(`/mail/${folder}`) || (currentFolder === folder && path.startsWith('/mail'));
  };

  const navItems = [
    {
      id: 'inbox',
      label: 'Inbox',
      icon: <Inbox className="w-[18px] h-[18px]" />,
      active: isFolderActive('inbox'),
      onClick: () => {
        setCurrentFolder('inbox');
        navigate('/mail/inbox');
      },
    },
    {
      id: 'starred',
      label: 'Starred',
      icon: <Star className="w-[18px] h-[18px]" />,
      active: isFolderActive('starred'),
      onClick: () => {
        setCurrentFolder('starred');
        navigate('/mail/starred');
      },
    },
    {
      id: 'compose',
      label: 'Compose',
      icon: <Plus className="w-5 h-5 stroke-[2.5]" />,
      isCompose: true,
      onClick: () => openCompose(),
    },
    {
      id: 'search',
      label: 'Search',
      icon: <Search className="w-[18px] h-[18px]" />,
      active: path.includes('/mail/search'),
      onClick: () => {
        setCurrentFolder('search');
        navigate('/mail/search');
      },
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: <Menu className="w-[18px] h-[18px]" />,
      active: false,
      onClick: () => toggleMobileDrawer(),
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-t border-app-border z-50 flex items-center justify-around px-2 shadow-lg select-none pb-[env(safe-area-inset-bottom,0px)]">
      {navItems.map((item) => {
        if (item.isCompose) {
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className="flex flex-col items-center justify-center -mt-5"
              aria-label="Compose new mail"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 active:scale-95 transition-transform ring-4 ring-white dark:ring-slate-900">
                {item.icon}
              </div>
              <span className="text-[10px] font-extrabold text-[#7C3AED] dark:text-indigo-400 mt-1">{item.label}</span>
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
              item.active
                ? 'text-[#7C3AED] dark:text-indigo-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
            }`}
          >
            {item.icon}
            <span className="text-[10px] mt-1">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
