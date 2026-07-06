import { useEffect, useState } from 'react';
import { getActiveDeliverySlots } from '../services/api/admin/adminDeliverySlotService';
import {
  DeliverySlotBadgeInfo,
  DeliverySlotTime,
  getNextDeliverySlotBadge,
} from '../utils/deliverySlotUtils';

const REFRESH_MS = 60_000;

export function useNextDeliverySlot() {
  const [badge, setBadge] = useState<DeliverySlotBadgeInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const res = await getActiveDeliverySlots();
        if (cancelled) return;

        const slots: DeliverySlotTime[] = res?.success ? res.data : [];
        setBadge(getNextDeliverySlotBadge(slots));
      } catch {
        if (!cancelled) setBadge(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    refresh();
    const interval = setInterval(refresh, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { badge, loading };
}
