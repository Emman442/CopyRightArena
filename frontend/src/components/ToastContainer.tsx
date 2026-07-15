import React from 'react';
import { useApp, Toast } from './AppContext';
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  const getBorderColor = (type: Toast['type']) => {
    switch (type) {
      case 'success': return 'border-l-4 border-l-[#22c55e]';
      case 'error': return 'border-l-4 border-l-[#dc2626]';
      case 'warning': return 'border-l-4 border-l-[#f59e0b]';
      case 'info':
      default:
        return 'border-l-4 border-l-[#7c3aed]';
    }
  };

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-[#22c55e]" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-[#dc2626]" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-[#7c3aed]" />;
    }
  };

  return (
    <div 
      id="toast_container"
      className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-sm w-full"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          id={`toast_${toast.id}`}
          className={`flex items-start justify-between p-4 bg-[#0f0f0f] border border-[#1e1e1e] ${getBorderColor(toast.type)}`}
          style={{ borderRadius: '0px' }}
        >
          <div className="flex space-x-3 text-left">
            <div className="mt-0.5">{getIcon(toast.type)}</div>
            <div>
              <h4 className="font-display font-bold text-white text-xs tracking-wide">
                {toast.title}
              </h4>
              <p className="font-sans text-[11px] text-[#888888] mt-1 leading-relaxed">
                {toast.description}
              </p>
            </div>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-[#444444] hover:text-white p-1 ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
