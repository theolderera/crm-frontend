interface LogoProps {
  size?: number;
  variant?: 'default' | 'inverted';
  className?: string;
}

export default function Logo({ size = 60, variant = 'default', className }: LogoProps) {
  const shadow = variant === 'inverted' ? 'rgba(255,255,255,0.35)' : '#93C5FD';
  const main   = variant === 'inverted' ? '#ffffff'                : '#1E40AF';

  return (
    <svg
      viewBox="0 0 110 100"
      width={size}
      height={Math.round((size * 100) / 110)}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path transform="translate(20 14)" d="M0 0 H80 V48 H16 V64 H80 V80 H0 V32 H64 V16 H0 Z" fill={shadow} />
      <path transform="translate(8 6)"  d="M0 0 H80 V48 H16 V64 H80 V80 H0 V32 H64 V16 H0 Z" fill={main}   />
    </svg>
  );
}
