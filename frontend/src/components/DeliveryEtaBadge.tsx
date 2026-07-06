import { useNextDeliverySlot } from '../hooks/useNextDeliverySlot';
import type { DeliverySlotBadgeStatus } from '../utils/deliverySlotUtils';

interface DeliveryEtaBadgeProps {
  /** compact = mobile home header; default = desktop global header */
  variant?: 'default' | 'compact';
  /** When desktop header is scrolled (brown bar) */
  isScrolled?: boolean;
  className?: string;
}

const STATUS_META: Record<
  DeliverySlotBadgeStatus,
  { label: string; accent: string; iconBg: string; pulse: string }
> = {
  current: {
    label: 'Delivering now',
    accent: 'text-[#4b7d5a]',
    iconBg: 'bg-[#4b7d5a]/15',
    pulse: 'bg-[#4b7d5a]',
  },
  next: {
    label: 'Next slot',
    accent: 'text-[#C4632A]',
    iconBg: 'bg-[#FF9933]/15',
    pulse: 'bg-[#FF9933]',
  },
  tomorrow: {
    label: 'Tomorrow',
    accent: 'text-[#8B3D28]',
    iconBg: 'bg-[#8B3D28]/10',
    pulse: 'bg-[#8B3D28]',
  },
  unavailable: {
    label: 'Slots',
    accent: 'text-neutral-500',
    iconBg: 'bg-neutral-100',
    pulse: 'bg-neutral-400',
  },
};

function ClockIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DeliveryEtaBadge({
  variant = 'default',
  isScrolled = false,
  className = '',
}: DeliveryEtaBadgeProps) {
  const { badge, loading } = useNextDeliverySlot();

  if (loading) {
    if (variant === 'compact') {
      return (
        <div
          className={`h-[34px] min-w-[88px] animate-pulse rounded-xl border border-white/15 bg-white/10 ${className}`}
          aria-hidden
        />
      );
    }
    return (
      <div
        className={`flex items-center gap-2.5 rounded-2xl border border-[#F0D5C9]/80 bg-[#FFF9F0] px-3 py-2 shadow-sm ${className}`}
        aria-hidden
      >
        <div className="h-9 w-9 animate-pulse rounded-xl bg-[#8B3D28]/10" />
        <div className="space-y-1.5">
          <div className="h-2 w-14 animate-pulse rounded bg-[#8B3D28]/10" />
          <div className="h-3 w-20 animate-pulse rounded bg-[#8B3D28]/15" />
        </div>
      </div>
    );
  }

  if (!badge) return null;

  const meta = STATUS_META[badge.status];

  if (variant === 'compact') {
    return (
      <div
        className={`flex w-full items-center justify-between gap-2 rounded-xl border border-white/20 bg-white/12 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md ${className}`}
        title={badge.slotName ? `${badge.slotName} · ${badge.timeLabel}` : badge.timeLabel}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`h-1.5 w-1.5 flex-shrink-0 animate-pulse rounded-full ${meta.pulse}`} />
          <span className="truncate text-[9px] font-black uppercase tracking-[0.12em] text-[#FFCC00]">
            {meta.label}
          </span>
        </div>
        <span className="truncate text-xs font-bold text-white flex-shrink-0">
          {badge.timeLabel}
        </span>
      </div>
    );
  }

  const labelClass = isScrolled ? 'text-[#FFCC00]' : meta.accent;
  const timeClass = isScrolled ? 'text-white' : 'text-village-umber';
  const iconWrapClass = isScrolled
    ? 'bg-white/15 border-white/20 text-[#FFCC00]'
    : `${meta.iconBg} border-[#F0D5C9]/60 text-[#8B3D28]`;
  const cardClass = isScrolled
    ? 'border-white/15 bg-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.12)] backdrop-blur-md'
    : 'border-[#F0D5C9] bg-[#FFF9F0] shadow-[0_4px_14px_rgba(139,61,40,0.08)]';

  return (
    <div
      className={`flex items-center gap-1.5 rounded-xl border px-2 py-1.5 transition-all duration-300 ${cardClass} ${className}`}
      title={badge.slotName ? `${badge.slotName} · ${badge.timeLabel}` : badge.timeLabel}
    >
      <div
        className={`relative flex h-7 w-7 xl:h-8 xl:w-8 flex-shrink-0 items-center justify-center rounded-lg border ${iconWrapClass}`}
      >
        <ClockIcon className="w-3.5 h-3.5" />
        <span
          className={`absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full border border-[#FFF9F0] ${meta.pulse} ${badge.status === 'current' ? 'animate-pulse' : ''}`}
        />
      </div>

      <div className="min-w-0 text-left hidden xl:block">
        <p className={`mb-0.5 text-[8px] font-black uppercase tracking-[0.1em] leading-none whitespace-nowrap ${labelClass}`}>
          {meta.label}
        </p>
        <p className={`text-xs font-bold leading-tight tracking-tight whitespace-nowrap ${timeClass}`}>
          {badge.timeLabel}
        </p>
      </div>
      <p className={`xl:hidden text-[10px] font-bold leading-tight whitespace-nowrap ${timeClass}`}>
        {badge.timeLabel}
      </p>
    </div>
  );
}
