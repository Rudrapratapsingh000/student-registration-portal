import React from 'react';
import { UserPlus, ArrowRight, Loader2 } from 'lucide-react';

export default function SubmitButton({
  loading = false,
  label = 'Create Account',
  disabled = false,
  onClick,
  className = '',
}) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      onClick={onClick}
      className={`w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-base rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Processing Registration...</span>
        </>
      ) : (
        <>
          <UserPlus className="w-5 h-5" />
          <span>{label}</span>
          <ArrowRight className="w-5 h-5" />
        </>
      )}
    </button>
  );
}
