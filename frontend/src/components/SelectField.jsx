import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function SelectField({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  required = false,
  icon: Icon,
  error,
  disabled = false,
  className = '',
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`w-full ${Icon ? 'pl-9' : 'pl-3.5'} pr-8 py-2.5 text-sm bg-slate-50/70 border ${
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500/20'
          } rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium text-slate-700 appearance-none disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
}
