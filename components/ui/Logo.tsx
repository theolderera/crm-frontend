interface LogoProps {
  size?: number;
  variant?: 'default' | 'inverted';
  className?: string;
}

export default function Logo({ size = 36, className = '' }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Graduation Cap */}
      <path d="M4 20L24 10L44 20L24 30L4 20Z" className="fill-indigo-600 dark:fill-white stroke-indigo-600 dark:stroke-white" fillOpacity="0.15" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 24V32C12 32 17 37 24 37C31 37 36 32 36 32V24" className="stroke-indigo-600 dark:stroke-white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M44 20V30" className="stroke-indigo-600 dark:stroke-white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      
      {/* Checkmark Badge */}
      <circle cx="34" cy="34" r="12" className="fill-white dark:fill-[#0B0F19]" />
      <circle cx="34" cy="34" r="10" className="fill-emerald-500" />
      <path d="M29 34.5L32.5 38L39 30.5" className="stroke-white dark:stroke-[#0B0F19]" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
