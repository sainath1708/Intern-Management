import { avatarTone, cn, initials } from '../../utils/format';

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export default function Avatar({ name = '', size = 'md', className = '' }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold',
        sizes[size] || sizes.md,
        avatarTone(name),
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
