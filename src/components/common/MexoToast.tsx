import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export const MexoToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full">
      {toasts.map((toast) => {
        const type = toast.type || 'info';
        const icons = {
          info: <Info className="w-5 h-5 text-mexo-500" />,
          success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          error: <XCircle className="w-5 h-5 text-rose-500" />,
        };

        return (
          <div
            key={toast.id}
            className="flex items-center justify-between p-3.5 bg-slate-900 text-white rounded-lg shadow-mexo-lg border border-slate-800 animate-in slide-in-from-bottom-3 duration-200"
          >
            <div className="flex items-center space-x-3 pr-2">
              {icons[type]}
              <span className="text-xs font-medium text-slate-100">{toast.message}</span>
            </div>
            <div className="flex items-center space-x-2">
              {toast.actionLabel && toast.onAction && (
                <button
                  onClick={() => {
                    toast.onAction?.();
                    removeToast(toast.id);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-mexo-400 hover:text-mexo-300 underline"
                >
                  {toast.actionLabel}
                </button>
              )}
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-200 p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
