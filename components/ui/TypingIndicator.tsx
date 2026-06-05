import React from 'react';

interface TypingIndicatorProps {
  isTyping: boolean;
  name?: string;
  isAdmin?: boolean;
}

export default function TypingIndicator({ isTyping, name, isAdmin }: TypingIndicatorProps) {
  if (!isTyping) return null;

  return (
    <div className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} mb-2`}>
      <div className={`max-w-[70%] px-4 py-3 rounded-2xl flex items-center gap-1 ${
        isAdmin 
          ? 'bg-indigo-600 text-white rounded-br-none' 
          : 'bg-white dark:bg-slate-800 rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm'
      }`}>
        <div className="flex gap-1 items-center h-4">
          <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isAdmin ? 'bg-white/70' : 'bg-slate-400'}`} style={{ animationDelay: '0ms' }}></span>
          <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isAdmin ? 'bg-white/70' : 'bg-slate-400'}`} style={{ animationDelay: '150ms' }}></span>
          <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isAdmin ? 'bg-white/70' : 'bg-slate-400'}`} style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
      {name && (
        <span className="text-[10px] text-slate-400 mt-1 px-1">
          {name} навишта истодааст...
        </span>
      )}
    </div>
  );
}
