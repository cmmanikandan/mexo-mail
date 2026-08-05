import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoBadge } from '../../components/common/MexoBadge';
import { useUIStore } from '../../store/uiStore';
import { db } from '../../services/db';
import { Users, Plus, Mail, Shield, ChevronRight } from 'lucide-react';

export const GroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const { setCreateGroupOpen } = useUIStore();
  const groups = db.getGroups();

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center">
              <Users className="w-6 h-6 mr-2.5 text-mexo-600" /> MEXO Groups
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Large-group communication without shared accounts. Distribute messages directly to individual inboxes.
            </p>
          </div>
          <MexoButton onClick={() => setCreateGroupOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Create Group
          </MexoButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((grp) => (
            <div
              key={grp.id}
              onClick={() => navigate(`/groups/${grp.id}`)}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-mexo-sm hover:shadow-mexo-md transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-mexo-100 dark:bg-mexo-950 text-mexo-600 dark:text-mexo-400 font-bold text-lg flex items-center justify-center">
                    {grp.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-mexo-600 transition-colors">
                      {grp.name}
                    </h3>
                    <p className="text-xs text-mexo-600 dark:text-mexo-400 font-mono font-medium">{grp.address}</p>
                  </div>
                </div>
                <MexoBadge variant="outline">{grp.privacy}</MexoBadge>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">{grp.description}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
                <span className="flex items-center">
                  <Users className="w-3.5 h-3.5 mr-1 text-slate-400" /> {grp.members ? grp.members.length : 1} Members
                </span>
                <span className="flex items-center text-mexo-600 group-hover:underline">
                  View Group <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};
