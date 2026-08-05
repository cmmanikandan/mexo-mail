import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, BookOpen, Shield, Users, Mail, ArrowLeft, HelpCircle, MessageSquare } from 'lucide-react';

export const HelpPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const articles = [
    {
      category: 'MEXO Account & Security',
      icon: <Shield className="w-5 h-5 text-mexo-600" />,
      items: [
        'How to create your unique @mexo.com address',
        'Setting up a recovery email and phone option',
        'Managing active sessions and revoking devices',
        'Password security best practices & strength rules',
      ],
    },
    {
      category: 'MEXO Groups Distribution',
      icon: <Users className="w-5 h-5 text-mexo-600" />,
      items: [
        'Understanding group distribution identity (groupname@mexo.com)',
        'How group message distribution delivers to individual inboxes',
        'Single-attachment deduplication model explained',
        'Managing group member roles: Owner, Manager, and Member',
      ],
    },
    {
      category: 'Mail & Organization',
      icon: <Mail className="w-5 h-5 text-mexo-600" />,
      items: [
        'Using advanced search operators (from:, has:attachment, subject:)',
        'Creating dynamic mail rules and automatic labels',
        'Scheduling messages for future delivery',
        'Keyboard shortcuts for faster productivity (Press ? in mail)',
      ],
    },
  ];

  const filteredArticles = articles.map((cat) => ({
    ...cat,
    items: cat.items.filter((item) => item.toLowerCase().includes(searchQuery.toLowerCase())),
  }));

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
              MEXO <span className="text-mexo-600 font-medium text-base ml-0.5">Help Center</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-4 text-xs font-medium text-slate-500">
          <Link to="/privacy" className="hover:text-slate-900 dark:hover:text-slate-100">Privacy</Link>
          <Link to="/terms" className="hover:text-slate-900 dark:hover:text-slate-100">Terms</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-12 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            How can we help you today?
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Search our knowledge base for answers regarding MEXO Mail accounts, MEXO Groups, security, and features.
          </p>

          <div className="relative max-w-xl mx-auto">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search help topics (e.g. groups, recovery, keyboard shortcuts)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-mexo-500/20 focus:border-mexo-600 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Main Knowledge Base Grid */}
      <main className="max-w-5xl mx-auto py-10 px-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredArticles.map((cat) => (
            <div
              key={cat.category}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-mexo-sm space-y-4"
            >
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-mexo-50 dark:bg-mexo-950">
                  {cat.icon}
                </div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">{cat.category}</h2>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                {cat.items.length > 0 ? (
                  cat.items.map((item, idx) => (
                    <li key={idx} className="hover:text-mexo-600 dark:hover:text-mexo-400 cursor-pointer font-medium transition-colors flex items-start space-x-2">
                      <span className="text-mexo-600">&bull;</span>
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400 italic">No matching articles found</li>
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact Support Banner */}
        <div className="p-8 rounded-2xl bg-mexo-600 text-white flex flex-col sm:flex-row items-center justify-between shadow-mexo-md">
          <div className="space-y-1 mb-4 sm:mb-0 text-center sm:text-left">
            <h3 className="font-extrabold text-lg">Still need assistance?</h3>
            <p className="text-xs text-mexo-100">Our support desk is available to assist with account and security questions.</p>
          </div>
          <button
            onClick={() => alert('Support request submitted. Support ticket generated for support@mexo.com.')}
            className="px-5 py-2.5 bg-white text-mexo-700 hover:bg-mexo-50 font-bold text-xs rounded-xl transition-colors shadow-sm"
          >
            Contact Support Desk
          </button>
        </div>
      </main>
    </div>
  );
};
