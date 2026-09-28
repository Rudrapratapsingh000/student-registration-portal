import React from 'react';
import { Check, CheckCircle2 } from 'lucide-react';

export default function ImagePreview({
  imageUrl,
  onChangePhoto,
  onRemovePhoto,
  className = '',
}) {
  return (
    <div className={`w-full max-w-[170px] flex flex-col items-center ${className}`}>
      <div className="relative w-full aspect-[3/3.8] rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-md group bg-slate-100">
        <img
          src={imageUrl}
          alt="Student Profile Preview"
          className="w-full h-full object-cover object-center"
        />
        {/* Floating Success Badge */}
        <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow-md">
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      </div>
      <div className="mt-2 text-center w-full">
        <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-600 mb-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Photo Verified</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={onChangePhoto}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
          >
            Change
          </button>
          <span className="text-slate-300 text-xs">•</span>
          <button
            type="button"
            onClick={onRemovePhoto}
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline focus:outline-none"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
