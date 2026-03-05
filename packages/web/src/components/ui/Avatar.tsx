import { cn } from '../../lib/cn.js';

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Generate consistent color from name
function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length] || 'bg-blue-500';
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'rounded-full object-cover flex-shrink-0',
          sizeClasses[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium text-white flex-shrink-0',
        sizeClasses[size],
        getAvatarColor(name),
        className,
      )}
      aria-label={name}
      role="img"
    >
      {initials}
    </div>
  );
}
