export interface DeliverySlotTime {
  _id?: string;
  name: string;
  label: string;
  startTime: string;
  endTime: string;
}

export type DeliverySlotBadgeStatus = 'current' | 'next' | 'tomorrow' | 'unavailable';

export interface DeliverySlotBadgeInfo {
  status: DeliverySlotBadgeStatus;
  prefix: string;
  timeLabel: string;
  displayText: string;
  slotName?: string;
}

export const getMinutesFromTime = (time: string): number => {
  const [h, m] = (time || '').split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return (h * 60) + m;
};

const sortSlotsByStart = <T extends { startTime: string }>(slots: T[]): T[] =>
  [...slots].sort((a, b) => getMinutesFromTime(a.startTime) - getMinutesFromTime(b.startTime));

export const getSlotTimeLabel = (slot: Pick<DeliverySlotTime, 'label' | 'startTime' | 'endTime'>): string =>
  slot.label || `${slot.startTime} - ${slot.endTime}`;

/** Next bookable slot for today (end time not passed). */
export const getNextDeliverySlotBadge = (
  slots: DeliverySlotTime[],
  now: Date = new Date()
): DeliverySlotBadgeInfo | null => {
  if (!slots.length) return null;

  const sorted = sortSlotsByStart(slots);
  const nowMinutes = (now.getHours() * 60) + now.getMinutes();

  const bookableToday = sorted.filter((slot) => {
    const end = getMinutesFromTime(slot.endTime);
    return end >= 0 && nowMinutes <= end;
  });

  if (bookableToday.length > 0) {
    const current = bookableToday.find((slot) => {
      const start = getMinutesFromTime(slot.startTime);
      const end = getMinutesFromTime(slot.endTime);
      return start >= 0 && end >= 0 && nowMinutes >= start && nowMinutes <= end;
    });

    if (current) {
      const timeLabel = getSlotTimeLabel(current);
      return {
        status: 'current',
        prefix: 'Now',
        timeLabel,
        displayText: timeLabel,
        slotName: current.name,
      };
    }

    const next = bookableToday.find((slot) => {
      const start = getMinutesFromTime(slot.startTime);
      return start >= 0 && nowMinutes < start;
    }) || bookableToday[0];

    const timeLabel = getSlotTimeLabel(next);
    return {
      status: 'next',
      prefix: 'Next',
      timeLabel,
      displayText: timeLabel,
      slotName: next.name,
    };
  }

  const firstTomorrow = sorted[0];
  const timeLabel = getSlotTimeLabel(firstTomorrow);
  return {
    status: 'tomorrow',
    prefix: 'Tomorrow',
    timeLabel,
    displayText: timeLabel,
    slotName: firstTomorrow.name,
  };
};

export const isSlotExpiredForDate = (
  slot: Pick<DeliverySlotTime, 'startTime' | 'endTime'>,
  date: Date | null,
  now: Date = new Date()
): boolean => {
  const effectiveDate = date ?? now;
  const isToday =
    effectiveDate.getFullYear() === now.getFullYear() &&
    effectiveDate.getMonth() === now.getMonth() &&
    effectiveDate.getDate() === now.getDate();

  if (!isToday) return false;

  const endMinutes = getMinutesFromTime(slot.endTime);
  if (endMinutes < 0) return false;

  const nowMinutes = (now.getHours() * 60) + now.getMinutes();
  return nowMinutes > endMinutes;
};
