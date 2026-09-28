import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ValidationMessage({ type = 'error', message, className = '' }) {
  if (!message) return null;

  const isError = type === 'error';

  return (
    <div
      className={`p-3 rounded-xl text-xs flex items-start gap-2.5 transition-all ${
        isError
          ? 'bg-rose-50 border border-rose-200 text-rose-700'
          : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
      } ${className}`}
    >
      {isError ? (
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
      ) : (
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
      )}
      <div className="font-medium">{message}</div>
    </div>
  );
}
