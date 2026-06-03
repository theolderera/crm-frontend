'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className={`
          bg-white/95 dark:bg-slate-900/95 w-full ${sizeClasses[size]} animate-modal
          border border-white/20 dark:border-slate-800/50 shadow-2xl shadow-indigo-900/10 dark:shadow-black/50
          rounded-t-[32px] sm:rounded-3xl
          max-h-[92vh] flex flex-col backdrop-blur-md
        `}
      >
        {/* Drag handle for mobile */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 bg-gray-200 dark:bg-slate-700 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 rounded-t-[32px] sm:rounded-t-3xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100/50 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 active:bg-gray-300 dark:active:bg-slate-600 transition-colors"
          >
            <X size={18} className="text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
