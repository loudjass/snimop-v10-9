import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({ children, variant = "primary", className, isLoading, ...props }: any) {
  const base = "px-4 py-3 rounded-xl font-bold text-center transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden active:scale-[0.98]";
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600 shadow-lg shadow-blue-900/30 border border-blue-400/30",
    secondary: "bg-slate-800/60 text-slate-100 hover:bg-slate-700/80 backdrop-blur-md border border-slate-600/50 shadow-md",
    outline: "bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 backdrop-blur-md",
    danger: "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-900/30 border border-red-400/30",
  };
  
  return (
    <button 
      className={`${base} ${variants[variant as keyof typeof variants] || variants.primary} ${className || ''} ${props.disabled || isLoading ? 'opacity-50 cursor-not-allowed grayscale-[30%]' : ''}`}
      {...props}
      disabled={props.disabled || isLoading}
    >
      {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
      {children}
    </button>
  );
}
