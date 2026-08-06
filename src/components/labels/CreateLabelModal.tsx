import React, { useState, useEffect } from 'react';
import { MexoModal } from '../common/MexoModal';
import { MexoInput } from '../common/MexoInput';
import { MexoButton } from '../common/MexoButton';
import { Label } from '../../types/mail';
import { db } from '../../services/db';
import { useAuthStore } from '../../store/authStore';
import { Tag, Check, AlertCircle } from 'lucide-react';

export interface CreateLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialParentId?: string;
  editingLabel?: Label | null;
  onSaveSuccess?: () => void;
}

export const PRESET_COLORS = [
  '#0878e8', // MEXO Blue
  '#10b981', // Emerald Green
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#64748b', // Slate
];

export const CreateLabelModal: React.FC<CreateLabelModalProps> = ({
  isOpen,
  onClose,
  initialParentId,
  editingLabel,
  onSaveSuccess,
}) => {
  const [name, setName] = useState('');
  const [parentLabelId, setParentLabelId] = useState<string>(initialParentId || '');
  const [color, setColor] = useState('#0878e8');
  const [error, setError] = useState('');

  const existingLabels = db.getLabels();

  useEffect(() => {
    if (editingLabel) {
      setName(editingLabel.name);
      setParentLabelId(editingLabel.parentLabelId || '');
      setColor(editingLabel.color || '#0878e8');
    } else {
      setName('');
      setParentLabelId(initialParentId || '');
      setColor('#0878e8');
    }
    setError('');
  }, [editingLabel, initialParentId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();

    if (!cleanName) {
      setError('Label name cannot be blank.');
      return;
    }
    if (cleanName.length > 50) {
      setError('Label name is too long (maximum 50 characters).');
      return;
    }

    // Check duplicate label at same parent hierarchy level
    const duplicate = existingLabels.find(
      (l) =>
        l.name.toLowerCase() === cleanName.toLowerCase() &&
        (l.parentLabelId || '') === (parentLabelId || '') &&
        l.id !== editingLabel?.id
    );

    if (duplicate) {
      setError('A label with this name already exists at this level.');
      return;
    }

    // Prevent recursive self-nesting
    if (editingLabel && parentLabelId === editingLabel.id) {
      setError('A label cannot be nested under itself.');
      return;
    }

    if (editingLabel) {
      db.updateLabel(editingLabel.id, {
        name: cleanName,
        parentLabelId: parentLabelId || undefined,
        color,
      });
    } else {
      const activeUserId = useAuthStore.getState().currentUser?.id || 'system-user';
      db.createLabel(activeUserId, cleanName, color);
    }

    onSaveSuccess?.();
    onClose();
  };

  // Filter out self and descendants for nesting select options
  const validParentLabels = existingLabels.filter(
    (l) => !editingLabel || (l.id !== editingLabel.id && l.parentLabelId !== editingLabel.id)
  );

  return (
    <MexoModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingLabel ? 'Edit Label' : 'Create New Label'}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <MexoInput
          label="Label Name"
          placeholder="e.g. Work, Projects, Receipts"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          required
          autoFocus
        />

        <div>
          <label className="block text-xs font-semibold text-app-body mb-1">
            Nest Label Under (Optional)
          </label>
          <select
            value={parentLabelId}
            onChange={(e) => setParentLabelId(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-app-border bg-white dark:bg-slate-900 text-app-heading text-xs font-medium"
          >
            <option value="">None (Top-level Label)</option>
            {validParentLabels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-app-body mb-2">Label Color</label>
          <div className="flex items-center space-x-2.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                  color === c ? 'scale-110 ring-2 ring-offset-2 ring-app-primary' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              >
                {color === c && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-3 border-t border-app-border">
          <MexoButton type="button" variant="secondary" onClick={onClose}>
            Cancel
          </MexoButton>
          <MexoButton type="submit" variant="primary">
            {editingLabel ? 'Save Label' : 'Create Label'}
          </MexoButton>
        </div>
      </form>
    </MexoModal>
  );
};
