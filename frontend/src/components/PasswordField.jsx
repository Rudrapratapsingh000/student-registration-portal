import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff } from 'lucide-react';

export default function PasswordField({
  label,
  name,
  value,
  onChange,
  placeholder = 'Enter password',
  required = false,
  error,
  disabled = false,
  className = '',
  icon: Icon = KeyRound,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Icon className="w-4 h-4" />
        </div>
        <input
          id={name}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50/70 border ${
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
          } rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium placeholder:text-slate-400 text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
}
