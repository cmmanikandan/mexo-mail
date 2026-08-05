import React, { useState } from 'react';
import { MexoModal } from '../common/MexoModal';
import { Calendar, Clock, Check } from 'lucide-react';

export interface ScheduleSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduleConfirm: (scheduledIsoDate: string) => void;
}

export const ScheduleSendModal: React.FC<ScheduleSendModalProps> = ({
  isOpen,
  onClose,
  onScheduleConfirm,
}) => {
  const [customDate, setCustomDate] = useState('');

  const getTomorrowMorning = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(8, 0, 0, 0);
    return d.toISOString();
  };

  const getTomorrowAfternoon = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(13, 0, 0, 0);
    return d.toISOString();
  };

  const getMondayMorning = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() + (day === 0 ? 1 : 8 - day);
    d.setDate(diff);
    d.setHours(8, 0, 0, 0);
    return d.toISOString();
  };

  const handleSelectOption = (iso: string) => {
    onScheduleConfirm(iso);
    onClose();
  };

  return (
    <MexoModal isOpen={isOpen} onClose={onClose} title="Schedule Send" maxWidth="sm">
      <div className="space-y-3">
        <p className="text-xs text-slate-500">Choose a time in the future when this message will be automatically delivered.</p>

        <div className="space-y-2 pt-1">
          <button
            onClick={() => handleSelectOption(getTomorrowMorning())}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            <div className="flex items-center space-x-2.5">
              <Clock className="w-4 h-4 text-mexo-600" />
              <span>Tomorrow morning</span>
            </div>
            <span className="text-slate-400 font-normal">8:00 AM</span>
          </button>

          <button
            onClick={() => handleSelectOption(getTomorrowAfternoon())}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            <div className="flex items-center space-x-2.5">
              <Clock className="w-4 h-4 text-mexo-600" />
              <span>Tomorrow afternoon</span>
            </div>
            <span className="text-slate-400 font-normal">1:00 PM</span>
          </button>

          <button
            onClick={() => handleSelectOption(getMondayMorning())}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left text-xs font-semibold text-slate-800 dark:text-slate-200"
          >
            <div className="flex items-center space-x-2.5">
              <Calendar className="w-4 h-4 text-mexo-600" />
              <span>Monday morning</span>
            </div>
            <span className="text-slate-400 font-normal">8:00 AM</span>
          </button>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <label className="block text-xs font-semibold text-slate-600">Pick Custom Date & Time:</label>
          <input
            type="datetime-local"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
          {customDate && (
            <button
              onClick={() => handleSelectOption(new Date(customDate).toISOString())}
              className="w-full mt-2 py-2 text-xs font-semibold text-white bg-mexo-600 hover:bg-mexo-700 rounded-lg"
            >
              Confirm Custom Schedule
            </button>
          )}
        </div>
      </div>
    </MexoModal>
  );
};
