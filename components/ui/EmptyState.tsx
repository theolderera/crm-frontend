import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={32} className="text-indigo-400 dark:text-indigo-500" />
      </div>
      <h3 className="text-base font-semibold text-gray-800 dark:text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-slate-400 text-center max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}
