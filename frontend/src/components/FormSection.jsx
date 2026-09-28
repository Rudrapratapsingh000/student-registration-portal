import React from 'react';

const colorThemes = {
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  purple: 'bg-purple-50 text-purple-600',
};

export default function FormSection({
  icon: Icon,
  iconTheme = 'blue',
  title,
  subtitle,
  children,
  className = '',
}) {
  const badgeClasses = colorThemes[iconTheme] || colorThemes.blue;

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm ${className}`}>
      {(Icon || title) && (
        <div className="flex items-center gap-3 mb-5">
          {Icon && (
            <div className={`w-9 h-9 rounded-xl ${badgeClasses} flex items-center justify-center font-bold`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            {title && <h3 className="text-base font-bold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
