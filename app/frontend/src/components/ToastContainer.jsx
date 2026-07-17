import React from 'react';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

export default function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => {
        const Icon = t.type === 'success' ? CheckCircle : t.type === 'error' ? AlertTriangle : Info;
        return (
          <div key={t.id} className={`toast ${t.type}`}>
            <Icon size={16} />
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
