import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { MexoButton } from '../../components/common/MexoButton';
import { MexoAvatar } from '../../components/common/MexoAvatar';
import { MexoBadge } from '../../components/common/MexoBadge';
import { MexoInput } from '../../components/common/MexoInput';
import { useComposeStore } from '../../store/composeStore';
import { useUIStore } from '../../store/uiStore';
import { db } from '../../services/db';
import {
  Users,
  Send,
  UserPlus,
  FileText,
  Settings,
  MessageSquare,
  Shield,
  Trash2,
  Check,
} from 'lucide-react';

export const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openCompose } = useComposeStore();
  const { addToast } = useUIStore();

  const [activeTab, setActiveTab] = useState<'conversations' | 'members' | 'files' | 'settings'>('conversations');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const groups = db.getGroups();
  const group = groups.find((g) => g.id === id);

  if (!group) {
    return (
      <AppLayout>
        <div className="p-12 text-center text-slate-500">Group not found.</div>
      </AppLayout>
    );
  }

  const groupMessages = db.getMessages().filter((m) =>
    m.recipients.some((r) => r.toLowerCase() === group.address.toLowerCase())
  );

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    db.addMemberToGroup(group.id, newMemberEmail.trim(), 'member');
    addToast({ message: `Added ${newMemberEmail} to ${group.name}`, type: 'success' });
    setNewMemberEmail('');
  };

  const handleMessageGroup = () => {
    openCompose({
      to: [group.address],
      subject: `[${group.name}] `,
    });
  };

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto">
        {/* Group Header Banner */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-8">
          <div className="max-w-5xl mx-auto flex items-start justify-between">
            <div className="flex items-center space-x-5">
              <div className="w-16 h-16 rounded-2xl bg-mexo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-mexo-md">
                {group.name[0]}
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{group.name}</h1>
                  <MexoBadge variant="primary">{group.privacy}</MexoBadge>
                </div>
                <p className="text-sm font-mono font-semibold text-mexo-600 dark:text-mexo-400 mt-0.5">
                  {group.address}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">{group.description}</p>
              </div>
            </div>

            <MexoButton onClick={handleMessageGroup} leftIcon={<Send className="w-4 h-4" />}>
              Message Group
            </MexoButton>
          </div>

          {/* Group Navigation Tabs */}
          <div className="max-w-5xl mx-auto flex items-center space-x-6 mt-8 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-semibold select-none">
            <button
              onClick={() => setActiveTab('conversations')}
              className={`flex items-center space-x-2 pb-2 border-b-2 transition-colors ${
                activeTab === 'conversations'
                  ? 'border-mexo-600 text-mexo-600 dark:text-mexo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Conversations ({groupMessages.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center space-x-2 pb-2 border-b-2 transition-colors ${
                activeTab === 'members'
                  ? 'border-mexo-600 text-mexo-600 dark:text-mexo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Members ({group.members.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('files')}
              className={`flex items-center space-x-2 pb-2 border-b-2 transition-colors ${
                activeTab === 'files'
                  ? 'border-mexo-600 text-mexo-600 dark:text-mexo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Shared Files</span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-8 max-w-5xl mx-auto w-full">
          {activeTab === 'conversations' && (
            <div className="space-y-3">
              {groupMessages.length === 0 ? (
                <div className="p-12 text-center text-slate-500">No group conversations yet.</div>
              ) : (
                groupMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => navigate(`/mail/thread/${msg.threadId}`)}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-mexo-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{msg.senderName}</span>
                      <span className="text-[11px] text-slate-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{msg.subject}</p>
                    <p className="text-xs text-slate-500 truncate mt-1">{msg.snippet}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-6">
              {/* Add Member Form */}
              <form onSubmit={handleAddMember} className="flex items-center space-x-3 max-w-md">
                <MexoInput
                  placeholder="Enter MEXO address to add..."
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                />
                <MexoButton type="submit" leftIcon={<UserPlus className="w-4 h-4" />}>
                  Add
                </MexoButton>
              </form>

              {/* Members Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-mexo-sm">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {group.members.map((mem) => (
                    <div key={mem.email} className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MexoAvatar name={`${mem.firstName} ${mem.lastName}`} size="md" />
                        <div>
                          <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                            {mem.firstName} {mem.lastName}
                          </p>
                          <p className="text-xs text-mexo-600 dark:text-mexo-400 font-mono">{mem.email}</p>
                        </div>
                      </div>
                      <MexoBadge variant={mem.role === 'owner' ? 'primary' : 'outline'}>{mem.role}</MexoBadge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">No files shared yet</h4>
              <p className="text-xs text-slate-500 mt-1">
                Attachments from group conversations will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};
