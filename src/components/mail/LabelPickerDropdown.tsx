import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Tag, X } from 'lucide-react';
import { Label } from '../../types/mail';

interface LabelPickerDropdownProps {
  /** All available labels */
  labels: Label[];
  /** Label IDs already applied to this message/thread */
  appliedLabelIds: string[];
  /** Called when user clicks a label (toggle behavior) */
  onToggleLabel: (labelId: string) => void;
  /** Trigger button className override */
  triggerClassName?: string;
  /** Label for the header inside the dropdown */
  heading?: string;
}

/**
 * A fixed-position label picker dropdown that uses getBoundingClientRect()
 * to correctly anchor itself to the trigger button even inside
 * hidden/overflow/transform parents (like the hover action bar).
 */
export const LabelPickerDropdown: React.FC<LabelPickerDropdownProps> = ({
  labels,
  appliedLabelIds,
  onToggleLabel,
  triggerClassName = '',
  heading = 'Add to label',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownWidth = 212;
      // Position below the button, aligned to the right edge
      let left = rect.right - dropdownWidth;
      // Prevent going off left edge of viewport
      if (left < 8) left = 8;
      setPos({ top: rect.bottom + 6, left });
    }
    setIsOpen((v) => !v);
  };

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={handleToggle}
        className={triggerClassName}
        title="Apply Label"
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Tag className="w-3.5 h-3.5" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: 212,
              zIndex: 99999,
            }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-widest border-b border-slate-100 dark:border-slate-800 mb-1">
              {heading}
            </div>

            {/* Label list */}
            <div className="max-h-52 overflow-y-auto px-1.5">
              {labels.length === 0 ? (
                <div className="px-2 py-3 text-xs text-slate-400 text-center">
                  No labels yet — create one from the sidebar
                </div>
              ) : (
                labels.map((lbl) => {
                  const isApplied = appliedLabelIds.includes(lbl.id);
                  return (
                    <button
                      key={lbl.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLabel(lbl.id);
                      }}
                      className="w-full flex items-center px-2.5 py-2 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer select-none text-left transition-colors"
                    >
                      {/* Color dot */}
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 mr-2.5"
                        style={{ backgroundColor: lbl.color || '#0878e8' }}
                      />
                      {/* Label name */}
                      <span
                        className={`flex-1 truncate ${
                          isApplied ? 'text-[#0878e8] font-semibold' : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {lbl.name}
                      </span>
                      {/* Applied checkmark */}
                      {isApplied && (
                        <span className="text-[#0878e8] text-[11px] font-bold ml-1">✓</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
