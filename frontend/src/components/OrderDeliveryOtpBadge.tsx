import { useState, useCallback, type MouseEvent } from 'react';

interface OrderDeliveryOtpBadgeProps {
  otp: string;
  compact?: boolean;
}

export default function OrderDeliveryOtpBadge({ otp, compact = false }: OrderDeliveryOtpBadgeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(otp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard errors
    }
  }, [otp]);

  if (compact) {
    return (
      <div
        className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-dashed border-green-200 bg-green-50 px-2.5 py-1.5"
        onClick={handleCopy}
      >
        <div>
          <p className="text-[7px] font-black uppercase tracking-wider text-green-700">Delivery OTP</p>
          <p className="text-sm font-black tracking-[0.2em] text-green-800">{otp}</p>
        </div>
        <span className="text-[8px] font-black uppercase tracking-wider text-green-700">
          {copied ? 'Copied' : 'Copy'}
        </span>
      </div>
    );
  }

  return (
    <div
      className="mt-2 rounded-xl border border-dashed border-green-200 bg-green-50 px-3 py-2"
      onClick={handleCopy}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[8px] font-black uppercase tracking-wider text-green-700">Your Delivery OTP</p>
          <p className="text-[9px] font-bold text-green-600">Share with delivery partner</p>
        </div>
        <span className="text-[8px] font-black uppercase tracking-wider text-green-700">
          {copied ? 'Copied!' : 'Tap to copy'}
        </span>
      </div>
      <p className="mt-1 text-xl font-black tracking-[0.25em] text-green-800">{otp}</p>
    </div>
  );
}
