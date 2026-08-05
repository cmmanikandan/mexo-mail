import { Message, Label } from '../types/mail';

export interface SearchFilterCriteria {
  from?: string;
  to?: string;
  subject?: string;
  filename?: string;
  hasAttachment?: boolean;
  isUnread?: boolean;
  isRead?: boolean;
  isStarred?: boolean;
  isImportant?: boolean;
  label?: string;
  after?: string;
  before?: string;
  folderIn?: string;
  freeText?: string;
}

export function parseSearchQuery(query: string): SearchFilterCriteria {
  const criteria: SearchFilterCriteria = {};
  if (!query || !query.trim()) return criteria;

  const tokens = query.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const freeTextTerms: string[] = [];

  for (const token of tokens) {
    const cleanToken = token.replace(/^"(.*)"$/, '$1');

    if (cleanToken.startsWith('from:')) {
      criteria.from = cleanToken.slice(5).toLowerCase();
    } else if (cleanToken.startsWith('to:')) {
      criteria.to = cleanToken.slice(3).toLowerCase();
    } else if (cleanToken.startsWith('subject:')) {
      criteria.subject = cleanToken.slice(8).toLowerCase();
    } else if (cleanToken.startsWith('filename:')) {
      criteria.filename = cleanToken.slice(9).toLowerCase();
    } else if (cleanToken.startsWith('label:')) {
      criteria.label = cleanToken.slice(6).toLowerCase();
    } else if (cleanToken.startsWith('in:')) {
      criteria.folderIn = cleanToken.slice(3).toLowerCase();
    } else if (cleanToken === 'has:attachment') {
      criteria.hasAttachment = true;
    } else if (cleanToken === 'is:unread') {
      criteria.isUnread = true;
    } else if (cleanToken === 'is:read') {
      criteria.isRead = true;
    } else if (cleanToken === 'is:starred') {
      criteria.isStarred = true;
    } else if (cleanToken === 'is:important') {
      criteria.isImportant = true;
    } else if (cleanToken.startsWith('after:')) {
      criteria.after = cleanToken.slice(6);
    } else if (cleanToken.startsWith('before:')) {
      criteria.before = cleanToken.slice(7);
    } else {
      freeTextTerms.push(cleanToken);
    }
  }

  if (freeTextTerms.length > 0) {
    criteria.freeText = freeTextTerms.join(' ').toLowerCase();
  }

  return criteria;
}

export function filterMessagesByQuery(
  messages: Message[],
  query: string,
  labels: Label[] = []
): Message[] {
  if (!query || !query.trim()) return messages;

  const criteria = parseSearchQuery(query);

  return messages.filter((msg) => {
    const st = msg.userState;

    // 1. from:
    if (criteria.from) {
      const matchFrom =
        msg.senderEmail.toLowerCase().includes(criteria.from) ||
        msg.senderName.toLowerCase().includes(criteria.from);
      if (!matchFrom) return false;
    }

    // 2. to:
    if (criteria.to) {
      const matchTo = msg.recipients.some((r) => r.toLowerCase().includes(criteria.to!));
      if (!matchTo) return false;
    }

    // 3. subject:
    if (criteria.subject) {
      if (!msg.subject.toLowerCase().includes(criteria.subject)) return false;
    }

    // 4. has:attachment
    if (criteria.hasAttachment) {
      if (!msg.attachments || msg.attachments.length === 0) return false;
    }

    // 5. filename:
    if (criteria.filename) {
      const matchFile = msg.attachments?.some((a) =>
        a.filename.toLowerCase().includes(criteria.filename!)
      );
      if (!matchFile) return false;
    }

    // 6. is:unread / is:read
    if (criteria.isUnread && st.isRead) return false;
    if (criteria.isRead && !st.isRead) return false;

    // 7. is:starred / is:important
    if (criteria.isStarred && !st.isStarred) return false;
    if (criteria.isImportant && !st.isImportant) return false;

    // 8. label:
    if (criteria.label) {
      const targetLabel = labels.find(
        (l) => l.name.toLowerCase() === criteria.label || l.id === criteria.label
      );
      if (targetLabel) {
        if (!st.labels || !st.labels.includes(targetLabel.id)) return false;
      }
    }

    // 9. after: / before:
    if (criteria.after) {
      try {
        if (new Date(msg.createdAt) < new Date(criteria.after)) return false;
      } catch {}
    }
    if (criteria.before) {
      try {
        if (new Date(msg.createdAt) > new Date(criteria.before)) return false;
      } catch {}
    }

    // 10. in: (inbox, sent, drafts, trash)
    if (criteria.folderIn) {
      if (criteria.folderIn === 'sent' && msg.senderEmail.toLowerCase() !== st.recipientEmail.toLowerCase()) return true;
      if (criteria.folderIn === 'trash' && !st.isDeleted) return false;
      if (criteria.folderIn === 'inbox' && (st.isArchived || st.isDeleted || st.isSpam)) return false;
    }

    // 11. freeText across subject, snippet, bodyHtml, sender, recipients
    if (criteria.freeText) {
      const fullContent = `${msg.subject} ${msg.snippet} ${msg.bodyHtml || ''} ${msg.senderName} ${msg.senderEmail} ${msg.recipients.join(' ')}`.toLowerCase();
      const terms = criteria.freeText.split(' ');
      const matchAll = terms.every((t) => fullContent.includes(t));
      if (!matchAll) return false;
    }

    return true;
  });
}
