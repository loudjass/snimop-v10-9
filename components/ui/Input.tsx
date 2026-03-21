import React from 'react';

export function Input({ label, error, className, ...props }: any) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className || ''}`}>
      {label && <label className="text-sm font-bold text-slate-300 ml-1 drop-shadow-sm">{label}</label>}
      <input
        {...props}
        className="px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 focus:bg-slate-800/80 border-white/10 text-white bg-slate-900/50 backdrop-blur-sm transition-all shadow-inner font-medium placeholder:text-slate-500 w-full"
      />
      {error && <span className="text-xs text-red-400 ml-1 font-medium">{error}</span>}
    </div>
  );
}
