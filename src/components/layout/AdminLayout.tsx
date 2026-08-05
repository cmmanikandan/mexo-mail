import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { MexoAvatar } from '../common/MexoAvatar';
import {
  Shield,
  LayoutDashboard,
  Users,
  FileCheck2,
  HardDrive,
  History,
  ArrowLeft,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, signOut } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  const navSections = [
    {
      title: 'PLATFORM OVERVIEW',
      items: [
        { label: 'System Overview', path: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
      ],
    },
    {
      title: 'DIRECTORY & USERS',
      items: [
        { label: 'Users Directory', path: '/admin/users', icon: <Users className="w-4 h-4" /> },
      ],
    },
    {
      title: 'GOVERNANCE & POLICY',
      items: [
        { label: 'Mail Policies', path: '/admin/mail-policies', icon: <FileCheck2 className="w-4 h-4" /> },
        { label: 'Storage Quotas', path: '/admin/storage', icon: <HardDrive className="w-4 h-4" /> },
        { label: 'Security & Audit Logs', path: '/admin/audit', icon: <History className="w-4 h-4" /> },
      ],
    },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans select-none overflow-hidden antialiased">
      {/* Top Admin Header */}
      <header className="h-16 border-b border-app-border bg-white dark:bg-slate-900 px-3.5 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-mexo-sm flex-shrink-0">
        {/* Left Toggle Menu & Logo Branding */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Toggle Admin Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => handleNavClick('/admin')}
            className="flex items-center space-x-2 cursor-pointer select-none"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
              MEXO <span className="bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] bg-clip-text text-transparent font-extrabold text-base ml-1">Admin</span>
            </span>
          </div>
        </div>

        {/* Right Admin Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="flex items-center space-x-2.5 p-1 rounded-full sm:rounded-2xl sm:bg-slate-100 dark:sm:bg-slate-800/60 sm:pr-3.5 border border-transparent sm:border-app-border">
            <MexoAvatar name={`${currentUser.firstName} ${currentUser.lastName}`} src={currentUser.avatarUrl} size="sm" className="w-8 h-8 text-xs shadow-xs" />
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">{currentUser.firstName} {currentUser.lastName}</p>
              <p className="text-[10px] text-[#7C3AED] dark:text-indigo-400 font-extrabold uppercase tracking-wider">System Admin</p>
            </div>
          </div>

          <button
            onClick={() => {
              signOut();
              navigate('/signin');
            }}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Main Layout Body - Fixed Sidebar & Scrollable Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Backdrop Overlay */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 top-16 bg-slate-950/60 backdrop-blur-xs z-30 md:hidden animate-in fade-in duration-150"
          />
        )}

        {/* Admin Navigation Sidebar with Light Gradient */}
        <aside
          className={`fixed md:relative top-16 md:top-0 bottom-0 left-0 w-64 border-r border-app-border bg-gradient-to-b from-[#F8FAFD] via-[#F3F7FC] to-[#EEF4FD] dark:from-[#0D1117] dark:via-[#141A23] dark:to-[#0F172A] flex flex-col justify-between p-4 flex-shrink-0 z-40 shadow-xl md:shadow-none transition-all duration-200 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'
          }`}
        >
          <div className="space-y-6 overflow-y-auto flex-1 pr-1">
            <div className="flex items-center justify-between md:hidden pb-2 border-b border-app-border">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Admin Navigation</span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {navSections.map((sec) => (
              <div key={sec.title} className="space-y-1">
                <div className="px-3 text-[10px] font-extrabold tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-2">
                  {sec.title}
                </div>
                {sec.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                        isActive
                          ? 'bg-indigo-50 text-[#7C3AED] dark:bg-indigo-950/70 dark:text-indigo-300 font-extrabold shadow-xs border-l-4 border-l-[#7C3AED]'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 font-semibold'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={isActive ? 'text-[#7C3AED] dark:text-indigo-400 font-bold' : 'text-slate-400 dark:text-slate-500'}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#7C3AED] dark:text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Bottom of Sidebar: "Back to Mail" Button */}
          <div className="pt-4 border-t border-app-border">
            <button
              onClick={() => {
                if (window.innerWidth < 768) setIsSidebarOpen(false);
                navigate('/mail/inbox');
              }}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:text-[#7C3AED] dark:hover:text-indigo-400 border border-app-border font-extrabold text-xs shadow-xs hover:border-[#7C3AED] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back to Mail</span>
            </button>
          </div>
        </aside>

        {/* Scrollable Main Content Area Only */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 bg-white dark:bg-slate-950">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
