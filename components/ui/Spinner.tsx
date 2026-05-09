interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-4',
};

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <span
      className={`inline-block rounded-full border-indigo-200 border-t-indigo-600 dark:border-indigo-800 dark:border-t-indigo-400 animate-spin ${sizes[size]} ${className}`}
    />
  );
}
